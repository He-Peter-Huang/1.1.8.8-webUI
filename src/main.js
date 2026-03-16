import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import en from './locales/en.json'
import zh from './locales/zh.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import './assets/main.css'

const supported = ['en', 'zh', 'fr', 'es']

function detectLocale() {
  const saved = localStorage.getItem('locale')
  if (saved && supported.includes(saved)) return saved
  const lang = navigator.language || ''
  const match = supported.find(s => lang.startsWith(s))
  return match || 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, zh, fr, es },
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
