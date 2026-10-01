package com.atypik.driver;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private ImageView splashOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Initialiser le SplashScreen officiel Android 12+ avant super.onCreate
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // 2. Débogage WebView actif pour audit
        WebView.setWebContentsDebuggingEnabled(true);

        // 3. Afficher le vrai SplashScreen natif garanti avec le logo Atypik officiel
        setupNativeSplashOverlay();
    }

    private void setupNativeSplashOverlay() {
        splashOverlay = new ImageView(this);
        splashOverlay.setImageResource(R.drawable.splash);
        splashOverlay.setBackgroundColor(0xFFFFFFFF);
        splashOverlay.setScaleType(ImageView.ScaleType.FIT_CENTER);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );

        ViewGroup root = findViewById(android.R.id.content);
        if (root != null) {
            root.addView(splashOverlay, params);

            // Maintenir le SplashScreen 2.5 secondes puis fondu de sortie
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (splashOverlay != null) {
                    ObjectAnimator fadeOut = ObjectAnimator.ofFloat(splashOverlay, "alpha", 1f, 0f);
                    fadeOut.setDuration(400);
                    fadeOut.addListener(new AnimatorListenerAdapter() {
                        @Override
                        public void onAnimationEnd(Animator animation) {
                            if (root != null && splashOverlay != null) {
                                root.removeView(splashOverlay);
                                splashOverlay = null;
                            }
                        }
                    });
                    fadeOut.start();
                }
            }, 2500);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {
            WebSettings settings = bridge.getWebView().getSettings();

            // Requis impérativement pour Next.js (localStorage/sessionStorage) et Firebase Auth (IndexedDB)
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);

            String userAgent = settings.getUserAgentString();
            if (userAgent != null) {
                // Supprimer '; wv' et 'Version/X.X' pour que Google OAuth accepte le flux WebView sans bloquer
                String sanitized = userAgent.replace("; wv", "").replaceAll("Version/\\d+\\.\\d+\\s?", "");
                settings.setUserAgentString(sanitized);
            }
        }
    }
}
