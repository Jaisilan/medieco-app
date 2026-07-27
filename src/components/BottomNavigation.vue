<template>
  <nav class="bottom-nav" aria-label="Customer navigation">
    <button :class="{ active: isActive('/home') }" type="button" @click="go('/home')">
      <span class="nav-icon">⌂</span>
      <small>Home</small>
    </button>

    <button :class="{ active: isActive('/period-box') }" type="button" @click="go('/period-box')">
      <span class="nav-icon">✿</span>
      <small>Bloom</small>
    </button>

    <button :class="{ active: isActive('/marketplace') }" type="button" @click="go('/marketplace')">
      <span class="nav-icon">◇</span>
      <small>Shop</small>
    </button>

    <button :class="{ active: isActive('/notifications') }" type="button" @click="go('/notifications')">
      <span class="badge-wrapper">
        <span class="nav-icon">♢</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </span>
      <small>Alerts</small>
    </button>

    <button :class="{ active: isActive('/profile') || isActive('/settings') }" type="button" @click="go('/profile')">
      <span class="nav-icon">○</span>
      <small>Profile</small>
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

function isActive(path) {
  return current.value === path || current.value.startsWith(`${path}/`)
}

function go(path) {
  if (route.path !== path) router.push(path)
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

  if (!error) unreadCount.value = count || 0
}

onMounted(async () => {
  await loadUnread()
  channel = supabase
    .channel('bottom-nav-notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadUnread)
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: max(10px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(calc(100% - 24px), 620px);
  min-height: 68px;
  padding: 8px 10px;
  border: 1px solid rgba(122, 36, 51, 0.1);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  box-shadow: 0 18px 42px rgba(60, 24, 34, 0.16);
  z-index: 999;
}

button {
  min-width: 0;
  border: 0;
  border-radius: 17px;
  background: transparent;
  color: #8b7280;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 7px 4px;
  font-weight: 800;
  position: relative;
  transition: background .18s ease, color .18s ease, transform .18s ease;
}

button.active {
  color: var(--brand-deep, #7a2433);
  background: var(--brand-soft, #fff0f4);
  transform: translateY(-1px);
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
  font-family: Georgia, serif;
}

.badge-wrapper { position: relative; display: inline-flex; }
.badge {
  position: absolute;
  top: -8px;
  right: -13px;
  min-width: 18px;
  padding: 3px 5px;
  border-radius: 999px;
  background: #dc2626;
  color: white;
  font-size: 9px;
  line-height: 1;
  font-family: Inter, Arial, sans-serif;
  text-align: center;
  box-shadow: 0 0 0 2px white;
}

small { font-size: 10px; line-height: 1; }

@media (min-width: 900px) {
  .bottom-nav { width: min(calc(100% - 40px), 680px); }
}
</style>
