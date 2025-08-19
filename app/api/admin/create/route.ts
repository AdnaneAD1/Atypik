import { NextRequest, NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase/admin';

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
  let pwd = '';
  const array = new Uint32Array(length);
  const cryptoObj = globalThis.crypto || (require('crypto').webcrypto as Crypto);
  cryptoObj.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    pwd += chars[array[i] % chars.length];
  }
  return pwd;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await admin.auth().verifyIdToken(token).catch(() => null);
    if (!decoded?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check caller role in Firestore
    const db = adminDb();
    const callerSnap = await db.collection('users').doc(decoded.uid).get();
    const callerData = callerSnap.exists ? callerSnap.data() : null;
    if (callerData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const email: string | undefined = body?.email;
    const displayName: string | undefined = body?.displayName;
    if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

    // Generate strong password
    const password = generatePassword(14);

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password, displayName });

    // Create Firestore profile with role=admin
    await db.collection('users').doc(userRecord.uid).set(
      {
        email,
        displayName: displayName || null,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ uid: userRecord.uid, email, password });
  } catch (e: any) {
    console.error('Create admin error:', e);
    const message = e?.message || 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
