import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const nativeHaptics = {
  /**
   * Retour haptique léger lors d'un tap sur un bouton ou onglet
   */
  light: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {}
    }
  },

  /**
   * Retour haptique moyen pour confirmation d'action
   */
  medium: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {}
    }
  },

  /**
   * Retour haptique de succès (ex: trajet validé, document envoyé)
   */
  success: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch {}
    }
  },

  /**
   * Retour haptique d'erreur
   */
  error: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch {}
    }
  },

  /**
   * Sélection d'élément (roue de choix, sélecteur)
   */
  selection: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionStart();
      } catch {}
    }
  },
};
