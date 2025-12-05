// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/tailwindcss',
  ],

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-04-03',

  /**
   * TypeScript-Konfiguration
   * Strenge Typisierung für bessere Code-Qualität
   */
  typescript: {
    strict: true,
    typeCheck: true,
  },

  /**
   * Nitro Server-Konfiguration
   * WebSocket-Unterstützung für Echtzeit-Kommunikation
   */
  nitro: {
    experimental: {
      websocket: true,
    },
  },

  /**
   * Tailwind CSS Konfiguration
   */
  tailwindcss: {
    cssPath: ['~/assets/css/main.css', { injectPosition: 'first' }],
    configPath: 'tailwind.config.ts',
  },
})
