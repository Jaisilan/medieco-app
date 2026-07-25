import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadUser } from './stores/auth'
import './assets/styles/base.css'

// Prevent pinch zoom
document.addEventListener(
  'touchmove',
  (event) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  },
  { passive: false }
)

// Prevent double-tap zoom
let lastTouchEnd = 0

document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now()

    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }

    lastTouchEnd = now
  },
  { passive: false }
)

// Extra iOS Safari gesture prevention
document.addEventListener(
  'gesturestart',
  (event) => {
    event.preventDefault()
  },
  { passive: false }
)

document.addEventListener(
  'gesturechange',
  (event) => {
    event.preventDefault()
  },
  { passive: false }
)

document.addEventListener(
  'gestureend',
  (event) => {
    event.preventDefault()
  },
  { passive: false }
)

loadUser()

createApp(App).use(router).mount('#app')