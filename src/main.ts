import './assets/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import en from './locales/en.yml'

import App from './App.vue'
import router from './router'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en
  }
})

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(createPinia())

app.mount('#app')
