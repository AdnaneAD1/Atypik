// Chargeur mutualisé du script Google Maps JS.
// Une seule promesse partagée : appels concurrents dédupliqués,
// échec rejetté pour permettre une dégradation gracieuse côté UI.

let mapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.google?.maps) {
    return Promise.resolve();
  }
  if (mapsPromise) {
    return mapsPromise;
  }

  mapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;

    const onLoad = () => resolve();
    const onError = () => {
      mapsPromise = null;
      reject(new Error('google-maps-load-failed'));
    };

    if (existing) {
      if (window.google?.maps) {
        resolve();
        return;
      }
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return mapsPromise;
}
