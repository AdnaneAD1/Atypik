import { auth } from '@/firebase/ClientApp';

/**
 * Wrapper de fetch côté client qui injecte automatiquement le token Firebase ID
 * de l'utilisateur connecté dans l'en-tête Authorization: Bearer <token>.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Authorization')) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      } catch (err) {
        console.warn('[authFetch] Impossible de récupérer le token Firebase Auth:', err);
      }
    }
  }

  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
