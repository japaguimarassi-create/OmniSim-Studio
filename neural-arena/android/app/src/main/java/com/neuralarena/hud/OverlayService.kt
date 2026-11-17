package com.neuralarena.hud

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

class OverlayService : Service() {
    private lateinit var windowManager: WindowManager
    private var floatingView: View? = null
    private var expanded = false
    private var downX = 0f
    private var downY = 0f
    private var initialX = 0
    private var initialY = 0
    private lateinit var params: WindowManager.LayoutParams

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(714, buildNotification())
        showBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    private fun showBubble() {
        if (floatingView != null) windowManager.removeView(floatingView)
        expanded = false
        val bubble = TextView(this).apply {
            text = "NA"
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(Color.rgb(235, 250, 255))
            setBackgroundColor(Color.rgb(22, 120, 145))
            elevation = 12f
            setOnClickListener { showPanel() }
            setOnTouchListener { view, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        downX = event.rawX
                        downY = event.rawY
                        initialX = params.x
                        initialY = params.y
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - downX).toInt()
                        params.y = initialY + (event.rawY - downY).toInt()
                        windowManager.updateViewLayout(view, params)
                        true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (kotlin.math.abs(event.rawX - downX) < 8 && kotlin.math.abs(event.rawY - downY) < 8) view.performClick()
                        true
                    }
                    else -> false
                }
            }
        }
        params = WindowManager.LayoutParams(
            dp(58), dp(58),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = dp(12)
            y = dp(180)
        }
        floatingView = bubble
        windowManager.addView(bubble, params)
    }

    private fun showPanel() {
        if (expanded) return
        floatingView?.let { windowManager.removeView(it) }
        expanded = true
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(8, 13, 24))
            elevation = 18f
        }
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(10), dp(7), dp(7), dp(7))
            setBackgroundColor(Color.rgb(15, 29, 47))
        }
        val title = TextView(this).apply {
            text = "NEURAL ARENA HUD"
            textSize = 11f
            setTextColor(Color.rgb(72, 217, 232))
        }
        val minimize = Button(this).apply {
            text = "−"
            setOnClickListener { showBubble() }
        }
        val close = Button(this).apply {
            text = "×"
            setOnClickListener { stopSelf() }
        }
        bar.addView(title, LinearLayout.LayoutParams(0, dp(42), 1f))
        bar.addView(minimize, LinearLayout.LayoutParams(dp(46), dp(42)))
        bar.addView(close, LinearLayout.LayoutParams(dp(46), dp(42)))
        val web = WebView(this).apply {
            setBackgroundColor(Color.rgb(8, 13, 24))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            loadUrl(BuildConfig.SITE_URL + "?hud=1")
        }
        root.addView(bar, LinearLayout.LayoutParams(-1, dp(56)))
        root.addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        params = WindowManager.LayoutParams(
            minOf(resources.displayMetrics.widthPixels - dp(16), dp(430)),
            minOf(resources.displayMetrics.heightPixels - dp(80), dp(620)),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.OPAQUE
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = dp(58)
        }
        floatingView = root
        windowManager.addView(root, params)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("neural_arena_hud", "Neural Arena HUD", NotificationManager.IMPORTANCE_LOW)
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val open = PendingIntent.getActivity(this, 1, Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, "neural_arena_hud")
                .setContentTitle("Neural Arena HUD ativo")
                .setContentText("Toque na bolha NA para abrir o painel flutuante.")
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setContentIntent(open)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Neural Arena HUD ativo")
                .setContentText("Toque na bolha NA para abrir o painel flutuante.")
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setContentIntent(open)
                .setOngoing(true)
                .build()
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    override fun onDestroy() {
        floatingView?.let { runCatching { windowManager.removeView(it) } }
        floatingView = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
