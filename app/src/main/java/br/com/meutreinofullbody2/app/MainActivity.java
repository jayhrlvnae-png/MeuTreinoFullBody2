package br.com.meutreinofullbody2.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

public final class MainActivity extends Activity {
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(8, 16, 25));
        getWindow().setNavigationBarColor(Color.rgb(8, 16, 25));
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) ||
                    !"appassets.androidplatform.net".equals(uri.getHost())) return null;
                String path = uri.getPath();
                if (path == null || !path.startsWith("/assets/")) return null;
                String asset = path.substring("/assets/".length());
                if (asset.contains("..") || asset.startsWith("/")) return null;
                try {
                    String mime = asset.endsWith(".html") ? "text/html" :
                        asset.endsWith(".js") ? "text/javascript" :
                        asset.endsWith(".css") ? "text/css" :
                        asset.endsWith(".svg") ? "image/svg+xml" : "text/plain";
                    return new WebResourceResponse(mime, "UTF-8", getAssets().open(asset));
                } catch (IOException error) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                        Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                }
            }
        });
        setContentView(webView);
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
