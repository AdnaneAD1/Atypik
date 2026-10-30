import { NextRequest, NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('[PayPal API] Failed to obtain access token:', err);
    return null;
  }
}

async function cancelPayPalSubscriptionById(subscriptionId: string, reason: string) {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return;
  await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  }).catch((err) => {
    console.warn('[PayPal Cancel API] Warning:', err);
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin non configuré sur le serveur' },
        { status: 503 }
      );
    }

    const authUser = await verifyAuthToken(req);
    const body = await req.json();
    const {
      userId,
      type,
      paypalOrderId,
      paypalSubscriptionId,
      payerEmail,
      autoRenew = true,
    } = body;

    if (!userId || (type !== 'standard' && type !== 'premium')) {
      return NextResponse.json(
        { error: 'Paramètres invalides (userId et type requis)' },
        { status: 400 }
      );
    }

    if (authUser && authUser.uid !== userId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé pour cet utilisateur' },
        { status: 403 }
      );
    }

    const price = type === 'standard' ? 149 : 189;
    const now = admin.firestore.Timestamp.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const endDate = admin.firestore.Timestamp.fromMillis(now.toMillis() + thirtyDaysMs);

    const db = adminDb();
    const subRef = db.collection('subscriptions').doc(userId);
    const existingSnap = await subRef.get();
    const existingData = existingSnap.exists ? existingSnap.data() : null;

    // Si l'utilisateur passe de Standard à Premium (ou change d'abonnement),
    // annuler l'ancien abonnement récurrent PayPal pour éviter toute double facturation
    if (
      existingData?.paypalSubscriptionId &&
      existingData.paypalSubscriptionId !== paypalSubscriptionId
    ) {
      await cancelPayPalSubscriptionById(
        existingData.paypalSubscriptionId,
        'Changement de formule Atypik Driver'
      );
    }

    const subscriptionData: Record<string, any> = {
      userId,
      type,
      status: 'active',
      autoRenew: Boolean(autoRenew),
      price,
      currency: 'EUR',
      startDate: now,
      endDate,
      nextBillingDate: endDate,
      lastPaymentDate: now,
      updatedAt: now,
      createdAt: existingData?.createdAt || now,
    };

    if (paypalSubscriptionId) {
      subscriptionData.paypalSubscriptionId = paypalSubscriptionId;
    } else if (existingData?.paypalSubscriptionId) {
      subscriptionData.paypalSubscriptionId = admin.firestore.FieldValue.delete();
    }

    if (paypalOrderId) {
      subscriptionData.paypalOrderId = paypalOrderId;
    }
    if (payerEmail) {
      subscriptionData.payerEmail = payerEmail;
    }

    await subRef.set(subscriptionData, { merge: true });

    return NextResponse.json({
      success: true,
      subscription: {
        id: userId,
        userId,
        type,
        status: 'active',
        autoRenew: Boolean(autoRenew),
        price,
        currency: 'EUR',
        startDate: now.toDate().toISOString(),
        endDate: endDate.toDate().toISOString(),
        nextBillingDate: endDate.toDate().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[PayPal Subscription POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la sauvegarde de l'abonnement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin non configuré sur le serveur' },
        { status: 503 }
      );
    }

    const authUser = await verifyAuthToken(req);
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    if (authUser && authUser.uid !== userId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé pour cet utilisateur' },
        { status: 403 }
      );
    }

    const db = adminDb();
    const subRef = db.collection('subscriptions').doc(userId);
    const snap = await subRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 });
    }

    const subData = snap.data() || {};

    // Si un abonnement récurrent PayPal existe et qu'on a les clés API, l'annuler chez PayPal
    if (subData.paypalSubscriptionId) {
      await cancelPayPalSubscriptionById(
        subData.paypalSubscriptionId,
        "Annulation du renouvellement automatique par l'utilisateur"
      );
    }

    const now = admin.firestore.Timestamp.now();
    // On désactive le renouvellement automatique mais on garde l'accès actif jusqu'à endDate
    const endDateMillis = subData.endDate?.toMillis?.() || 0;
    const isStillValid = endDateMillis > now.toMillis();

    await subRef.update({
      autoRenew: false,
      status: isStillValid ? 'active' : 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: isStillValid
        ? "Le renouvellement automatique a été désactivé. Votre abonnement reste actif jusqu'à la fin de la période en cours."
        : 'Votre abonnement a été annulé.',
    });
  } catch (error: any) {
    console.error('[PayPal Subscription DELETE] Error:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}

