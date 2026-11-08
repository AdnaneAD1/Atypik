/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com'
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@capacitor/core',
    '@capacitor/app',
    '@capacitor/status-bar',
    '@capacitor/splash-screen',
    '@capacitor/keyboard',
    '@capacitor/haptics',
    '@capacitor/push-notifications',
    '@capacitor-community/background-geolocation',
  ],
  // Configuration des en-têtes HTTP de sécurité et Service Workers
  async headers() {
    // Content-Security-Policy : restreint les sources autorisées pour scripts, styles, images, etc.
    // next.js requiert 'unsafe-inline' pour ses scripts de hydratation côté client.
    // 'unsafe-eval' est nécessaire pour Firebase et certains polyfills.
    const ContentSecurityPolicy = [
      "default-src 'self'",
      // Scripts : Next.js (inline), Google APIs (Firebase, OAuth)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
      // Styles : inline (Tailwind/styled), Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Polices de caractères
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images : domaines tiers autorisés + data URIs + blob
      "img-src 'self' data: blob: https://images.pexels.com https://img.freepik.com https://images.unsplash.com https://res.cloudinary.com https://*.googleusercontent.com https://*.gstatic.com",
      // Connexions réseau : Firebase, Firestore, FCM, Auth Google
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://accounts.google.com",
      // Iframes : Google OAuth popup, Firebase Auth
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
      // Médias (vidéos, audio) : Cloudinary
      "media-src 'self' blob: data: https://res.cloudinary.com",
      // Service Workers et Web Workers
      "worker-src 'self' blob:",
      // Manifeste PWA
      "manifest-src 'self'",
      // Interdit les plugins (Flash, etc.)
      "object-src 'none'",
      // Interdit les injections d'URL de base
      "base-uri 'self'",
      // Restreint les soumissions de formulaires
      "form-action 'self' https://accounts.google.com",
    ].join('; ');

    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;