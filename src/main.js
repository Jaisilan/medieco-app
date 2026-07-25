import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadUser } from './stores/auth'
import './assets/styles/base.css'

loadUser()

createApp(App).use(router).mount('#app')
