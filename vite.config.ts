import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'OmniSim Studio',
        short_name: 'OmniSim',
        description: 'Ambiente mobile de criação de sites e jogos 2D.',
        theme_color: '#0b0e14',
        background_color: '#0b0e14',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@lezer/')) return 'syntax-engine'
          if (id.includes('/node_modules/@codemirror/view/')) return 'editor-view'
          if (id.includes('/node_modules/@codemirror/state/')) return 'editor-state'
          if (id.includes('/node_modules/@codemirror/lang-javascript/')) return 'language-javascript'
          if (id.includes('/node_modules/@codemirror/lang-html/')) return 'language-html'
          if (id.includes('/node_modules/@codemirror/lang-css/')) return 'language-css'
          if (id.includes('/node_modules/@codemirror/') || id.includes('/node_modules/@lezer/') || id.includes('/node_modules/@uiw/react-codemirror/')) return 'code-editor'
          if (id.includes('/node_modules/jszip/') || id.includes('/node_modules/pako/')) return 'zip-tools'
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'react-vendor'
        }
      }
    }
  }
})