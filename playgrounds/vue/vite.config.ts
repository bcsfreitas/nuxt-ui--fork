import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'green',
          neutral: 'slate'
        }
      },
      autoImport: {
        dirs: ['../nuxt/app/composables'],
        imports: ['vue']
      },
      components: {
        dirs: ['../nuxt/app/components'],
        // Client-only components (the code panel, the copy overlay) need Nuxt and its server routes
        globsExclude: ['../nuxt/app/components/**/*.client.vue']
      }
    })
  ]
})
