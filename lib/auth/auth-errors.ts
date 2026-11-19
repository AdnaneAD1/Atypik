/**
 * Traduit et assainit toutes les erreurs d'authentification et de serveur
 * pour afficher uniquement des messages clairs, professionnels et sécurisés aux utilisateurs.
 * Empêche toute fuite de code d'erreur technique (ex: auth/invalid-credential, stack trace, etc.).
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) {
    return 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }

  // Si c'est déjà un message propre formaté par nos soins
  if (typeof error === 'string') {
    if (error.startsWith('Firebase:')) {
      const match = error.match(/auth\/[a-z0-9-]+/);
      if (match) {
        return getMessageFromCode(match[0]);
      }
      return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
    }
    return error;
  }

  // Extraire le code Firebase s'il existe
  const code: string =
    error?.code ||
    (typeof error?.message === 'string' && error.message.match(/auth\/[a-z0-9-]+/)?.[0]) ||
    '';

  if (code) {
    return getMessageFromCode(code);
  }

  const rawMessage: string = error?.message || '';

  if (rawMessage.includes('Données utilisateur non trouvées') || rawMessage.includes('user-not-found')) {
    return 'Compte introuvable. Veuillez vérifier vos identifiants.';
  }

  if (rawMessage.includes('network') || rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
    return 'Impossible de joindre le serveur. Veuillez vérifier votre connexion internet.';
  }

  return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
}

function getMessageFromCode(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé ou suspendu. Veuillez contacter le support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà associée à un compte existant.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/network-request-failed':
      return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques minutes avant de réessayer.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'La fenêtre de connexion a été fermée.';
    case 'auth/popup-blocked':
      return 'La fenêtre de connexion a été bloquée par votre navigateur.';
    case 'auth/requires-recent-login':
      return 'Cette action nécessite une reconnexion récente pour des raisons de sécurité.';
    case 'auth/operation-not-allowed':
      return 'Ce mode de connexion est temporairement indisponible.';
    case 'auth/expired-action-code':
      return 'Ce lien de réinitialisation a expiré. Veuillez refaire une demande.';
    case 'auth/invalid-action-code':
      return 'Le lien de réinitialisation est invalide ou a déjà été utilisé.';
    default:
      return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
  }
}
