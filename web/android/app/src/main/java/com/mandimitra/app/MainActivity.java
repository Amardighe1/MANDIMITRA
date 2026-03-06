package com.mandimitra.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure status bar is NOT overlapping the WebView content
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // White status bar with dark icons
            window.setStatusBarColor(0xFFFFFFFF);
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            );
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // White navigation bar with dark icons
            window.setNavigationBarColor(0xFFFFFFFF);
            window.getDecorView().setSystemUiVisibility(
                window.getDecorView().getSystemUiVisibility()
                | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            );
        }
    }
}
