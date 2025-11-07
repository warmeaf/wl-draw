/**
 * Application entry point.
 * Initializes Vue app with Pinia state management and mounts to DOM.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
