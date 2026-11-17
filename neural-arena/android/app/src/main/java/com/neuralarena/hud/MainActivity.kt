package com.neuralarena.hud

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val requestCode = 714

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(8, 13, 24)
        window.navigationBarColor = Color.rgb(8, 13, 24)
        render()
    }

    private fun render() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(28, 36, 28, 36)
            setBackgroundColor(Color.rgb(8, 13, 24))
        }
        val title = TextView(this).apply {
            text = "NEURAL ARENA"
            textSize = 25f
            setTextColor(Color.rgb(72, 217, 232))
            gravity = Gravity.CENTER
        }
        val description = TextView(this).apply {
            text = "HUD flutuante para abrir o laboratório sobre jogos locais.\n\nAtive a permissão de sobreposição para mostrar o painel por cima de outros aplicativos."
            textSize = 14f
            setTextColor(Color.rgb(174, 190, 211))
            gravity = Gravity.CENTER
            setPadding(0, 18, 0, 24)
        }
        val start = Button(this).apply {
            text = "ATIVAR HUD FLUTUANTE"
            setOnClickListener { enableOverlay() }
        }
        val open = Button(this).apply {
            text = "ABRIR LABORATÓRIO"
            setOnClickListener { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(BuildConfig.SITE_URL))) }
        }
        val stop = Button(this).apply {
            text = "DESATIVAR HUD"
            setOnClickListener { stopService(Intent(this@MainActivity, OverlayService::class.java)) }
        }
        root.addView(title, LinearLayout.LayoutParams(-1, -2))
        root.addView(description, LinearLayout.LayoutParams(-1, -2))
        root.addView(start, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 12 })
        root.addView(open, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 12 })
        root.addView(stop, LinearLayout.LayoutParams(-1, -2))
        setContentView(root)
    }

    private fun enableOverlay() {
        if (Settings.canDrawOverlays(this)) {
            startService(Intent(this, OverlayService::class.java))
            finish()
        } else {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            startActivityForResult(intent, requestCode)
        }
    }

    @Deprecated("Deprecated in Android API; retained for compatibility with the overlay permission screen")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == this.requestCode && Settings.canDrawOverlays(this)) {
            startService(Intent(this, OverlayService::class.java))
            finish()
        }
    }
}
