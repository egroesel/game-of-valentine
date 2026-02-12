export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],

  googleFonts: {
    families: {
      'Playfair Display': [400, 700],
      'Inter': [400, 500, 600, 700],
    },
    display: 'swap',
  },

  runtimeConfig: {
    public: {
      n8nWebhookUrl: '',
    },
  },

  app: {
    head: {
      title: 'For You',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
          },
        },
      },
    },
  },
})
