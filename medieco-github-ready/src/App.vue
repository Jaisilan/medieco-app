<template>
  <router-view />
  <ToastContainer />
</template>

<script setup>
import { onMounted } from 'vue'
import { supabase } from './lib/supabase'
import ToastContainer from './components/ToastContainer.vue'
import { showToast } from './stores/toast'

const CURRENT_VERSION = '1.0.5'

onMounted(async () => {
  await checkAppVersion()
})

async function checkAppVersion() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'app_version')
      .single()

    if (error || !data) return

    const latestVersion = String(data.setting_value).replaceAll('"', '')
    const savedVersion = localStorage.getItem('medieco_app_version')

    if (!savedVersion) {
      localStorage.setItem('medieco_app_version', CURRENT_VERSION)
      return
    }

    if (latestVersion !== CURRENT_VERSION || savedVersion !== latestVersion) {
      localStorage.setItem('medieco_app_version', latestVersion)

      showToast({
        type: 'info',
        title: 'New update available',
        message: 'Medieco will refresh to apply the latest version.',
      })

      setTimeout(() => {
        window.location.reload()
      }, 1400)
    }
  } catch (error) {
    console.warn('Version check failed:', error)
  }
}
</script>