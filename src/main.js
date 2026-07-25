import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadUser } from './stores/auth'
import './assets/styles/base.css'

function isUserAppRoute() {
  return !window.location.pathname.startsWith('/admin')
}

// Preserve the native-app feel on the customer app by preventing accidental
// pinch and double-tap zoom. The administration portal remains unaffected.
document.addEventListener(
  'touchmove',
  (event) => {
    if (isUserAppRoute() && event.touches.length > 1) {
      event.preventDefault()
    }
  },
  { passive: false }
)

let lastTouchEnd = 0

document.addEventListener(
  'touchend',
  (event) => {
    if (!isUserAppRoute()) return

    const now = Date.now()

    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }

    lastTouchEnd = now
  },
  { passive: false }
)

for (const gestureEvent of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(
    gestureEvent,
    (event) => {
      if (isUserAppRoute()) {
        event.preventDefault()
      }
    },
    { passive: false }
  )
}

loadUser()

createApp(App).use(router).mount('#app')
