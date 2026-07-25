<template>
  <nav class="bottom-nav">
    <button :class="{ active: current === '/home' }" @click="go('/home')">
      <span>🏠</span>
      <small>Home</small>
    </button>

    <button :class="{ active: current === '/period-box' }" @click="go('/period-box')">
      <span>🌸</span>
      <small>Bloom</small>
    </button>

    <button :class="{ active: current === '/marketplace' }" @click="go('/marketplace')">
      <span>🛍</span>
      <small>Shop</small>
    </button>

    <button :class="{ active: current === '/notifications' }" @click="go('/notifications')">
      <div class="badge-wrapper">
        <span>🔔</span>

        <div v-if="unreadCount > 0" class="badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </div>

      <small>Alerts</small>
    </button>

    <button :class="{ active: current === '/settings' }" @click="go('/settings')">
      <span>⚙️</span>
      <small>Settings</small>
    </button>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user, loadUser } from '../stores/auth'

const router = useRouter()
const route = useRoute()

const unreadCount = ref(0)
const current = computed(() => route.path)

let channel = null

function go(path) {
  if (route.path !== path) {
    router.push(path)
  }
}

async function loadUnread() {
  await loadUser()

  if (!user.value) {
    unreadCount.value = 0
    return
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.value.id)
    .eq('is_read', false)

  if (!error) {
    unreadCount.value = count || 0
  }
}

onMounted(async () => {
  await loadUnread()

  channel = supabase
    .channel('bottom-nav-notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      async () => {
        await loadUnread()
      }
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);

  width: min(100%, 430px);
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);

  background: white;
  display: grid;
  grid-template-columns: repeat(5, 1fr);

  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.06);

  z-index: 999;
}

button {
  border: none;
  background: transparent;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3px;

  color: #64748b;
  font-weight: 800;
  position: relative;

  padding: 0;
}

button span {
  font-size: 20px;
  line-height: 1;
}

button.active {
  color: #0f766e;
}

.badge-wrapper {
  position: relative;
  display: inline-flex;
}

.badge {
  position: absolute;
  top: -8px;
  right: -12px;

  background: #ef4444;
  color: white;

  font-size: 10px;
  line-height: 1;
  padding: 3px 6px;

  border-radius: 999px;
  font-weight: 900;
  min-width: 18px;
  text-align: center;
}

small {
  font-size: 10px;
  line-height: 1;
}
</style>