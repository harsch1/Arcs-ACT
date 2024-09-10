import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import svgLoader from 'vite-svg-loader'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { imagetools } from 'vite-imagetools'

const __dirname = path.resolve()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, 'src/i18n/locales/**')]
    }),
    imagetools(),
    vueDevTools()
  ],
  base: process.env.NODE_ENV === 'production' ? '/Arcs-CAT/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()]
    }
  }
})
