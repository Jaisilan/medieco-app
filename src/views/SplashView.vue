<template>
  <main class="splash-screen">
    <video
      class="splash-video"
      autoplay
      muted
      playsinline
      @ended="goNext"
    >
      <source src="/medieco-splash.webm" type="video/webm" />
      <source src="/medieco-splash.mp4" type="video/mp4" />
    </video>
  </main>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { loadUser, user } from '../stores/auth'

const router = useRouter()

let timer = null
let hasNavigated = false

onMounted(() => {
  timer = setTimeout(() => {
    goNext()
  }, 3200)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
})

async function goNext() {
  if (hasNavigated) return

  hasNavigated = true

  await loadUser()

  if (user.value) {
    router.replace('/home')
  } else {
    router.replace('/landing')
  }
}
</script>

<style scoped>
.splash-screen {
  min-height: 100vh;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.splash-video {
  width: min(88vw, 620px);
  height: auto;
}
</style>