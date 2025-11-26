/**
 * Application entry point
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { initializePlugins } from './plugins'
import './style.css'
import App from './App.vue'

async function bootstrap() {
  await initializePlugins()

  const pinia = createPinia()
  const app = createApp(App)

  app.use(pinia)

  const { initializePluginsAfterPinia } = await import('./plugins')
  await initializePluginsAfterPinia()

  app.mount('#app')
}

bootstrap()
