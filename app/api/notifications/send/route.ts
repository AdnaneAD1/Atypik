import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, adminDb, adminMessaging } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/admin-auth';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs'; // Ensure Node runtime (firebase-admin not supported on Edge)
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().url().optional(),
  clickAction: z.string().url().optional(),
  // data must be string:string for FCM
  data: z.record(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    // 0. Protection anti-spam push / rate limiting (max 60 requêtes/min par IP)
    const rateLimit = checkRateLimit(req, { maxRequests: 60, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    // 1. Authentification obligatoire : bloque les notifications forgées et le spam
    const authUser = await verifyAuthToken(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non autorisé : jeton Firebase Auth valide requis.' }, { status: 401 });
    }

    // Validate admin init
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'firebase-admin not initialized. Check FIREBASE_* env vars.' }, { status: 500 });
    }

    const json = await req.json();
    const { userId, title, body, data, icon, clickAction } = BodySchema.parse(json);

    const db = adminDb();
    const messaging = adminMessaging();

    // 1) Get user's FCM token
    const settingsRef = db.doc(`notificationSettings/${userId}`);
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) {
      return NextResponse.json({ success: true, delivered: false, message: 'Notification skipped: notificationSettings not found for user' }, { status: 200 });
    }
    const fcmToken = settingsSnap.get('fcmToken') as string | null;
    if (!fcmToken) {
      return NextResponse.json({ success: true, delivered: false, message: 'Notification skipped: User has no FCM token' }, { status: 200 });
    }

    // 2) Send push via FCM
    const sanitizedData: Record<string, string> = {
      title: String(title),
      body: String(body),
    };

    if (data) {
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== null) {
          sanitizedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
      }
    }

    if (clickAction) {
      sanitizedData.clickAction = clickAction;
      sanitizedData.url = clickAction;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      webpush: {
        notification: { icon },
        fcmOptions: clickAction ? { link: clickAction } : undefined,
      },
      data: sanitizedData,
    };

    const responseId = await messaging.send(message);

    // 3) Persist notification item for UI (unread)
    const userItems = db.collection('notifications').doc(userId).collection('items');
    await userItems.add({
      title,
      message: body,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      type: 'general',
      data: data || {},
    });

    return NextResponse.json({ ok: true, messageId: responseId });
  } catch (err: any) {
    console.error('[POST]/api/notifications/send error', err);
    const status = err?.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status });
  }
}
