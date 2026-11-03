import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      // New versions install in the background and take over on next launch — no prompts for toddlers.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'PhonoLand – Spalding Phonograms',
        short_name: 'PhonoLand',
        description: 'Playful Spalding phonogram games for preschoolers.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        background_color: '#FFF9EB',
        theme_color: '#FF6B8B',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // App shell + only the Latin font subsets the UI uses (skip Cyrillic/Hebrew/Vietnamese and .woff fallbacks)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}', '**/*-latin-*-normal-*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    include: ['tests/**/*.test.js']
  }
});
