import { NextRequest, NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase/admin';

/**
 * Webhook PayPal pour gérer le renouvellement automatique mensuel des abonnements,
 * les activations, les suspensions et les résiliations.
 * URL à configurer dans PayPal Developer Dashboard : https://app.atypik-driver.com/api/paypal/webhook
 */
export async function POST(req: NextRequest) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin non configuré' },
        { status: 503 }
      );
    }

    const event = await req.json();
    const eventType: string = event?.event_type || '';
    const resource = event?.resource || {};

    const db = adminDb();
    const now = admin.firestore.Timestamp.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // 1. Trouver l'abonnement correspondant via custom_id (userId) ou paypalSubscriptionId
    const customUserId: string | undefined =
      resource?.custom_id || resource?.custom || undefined;
    const subscriptionId: string | undefined =
      resource?.billing_agreement_id || resource?.id || undefined;

    let subDocRef: FirebaseFirestore.DocumentReference | null = null;
    let currentData: FirebaseFirestore.DocumentData | null = null;

    if (customUserId) {
      const snap = await db.collection('subscriptions').doc(customUserId).get();
      if (snap.exists) {
        subDocRef = snap.ref;
        currentData = snap.data() || null;
      }
    }

    if (!subDocRef && subscriptionId) {
      const q = await db
        .collection('subscriptions')
        .where('paypalSubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();
      if (!q.empty) {
        subDocRef = q.docs[0].ref;
        currentData = q.docs[0].data();
      }
    }

    if (!subDocRef) {
      return NextResponse.json({
        received: true,
        note: 'Aucun abonnement correspondant trouvé pour cet événement',
      });
    }

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
        const rawNextBilling = resource?.billing_info?.next_billing_time;
        const parsedNext = rawNextBilling ? new Date(rawNextBilling) : null;
        const nextBillingTime =
          parsedNext && !isNaN(parsedNext.getTime())
            ? admin.firestore.Timestamp.fromDate(parsedNext)
            : admin.firestore.Timestamp.fromMillis(now.toMillis() + thirtyDaysMs);

        await subDocRef.update({
          status: 'active',
          autoRenew: true,
          endDate: nextBillingTime,
          nextBillingDate: nextBillingTime,
          updatedAt: now,
        });
        break;
      }

      case 'PAYMENT.SALE.COMPLETED':
      case 'BILLING.SUBSCRIPTION.SALE.COMPLETED': {
        // Renouvellement automatique mensuel prélevé avec succès par PayPal
        const baseMillis = Math.max(
          now.toMillis(),
          currentData?.endDate?.toMillis?.() || now.toMillis()
        );
        const newEndDate = admin.firestore.Timestamp.fromMillis(baseMillis + thirtyDaysMs);

        await subDocRef.update({
          status: 'active',
          autoRenew: true,
          lastPaymentDate: now,
          lastSaleId: resource?.id || null,
          endDate: newEndDate,
          nextBillingDate: newEndDate,
          updatedAt: now,
        });
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // L'utilisateur a annulé le renouvellement automatique sur PayPal
        const endDateMillis = currentData?.endDate?.toMillis?.() || 0;
        const stillValid = endDateMillis > now.toMillis();
        await subDocRef.update({
          autoRenew: false,
          status: stillValid ? 'active' : 'cancelled',
          cancelledAt: now,
          updatedAt: now,
        });
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        await subDocRef.update({
          autoRenew: false,
          status: 'expired',
          updatedAt: now,
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}

