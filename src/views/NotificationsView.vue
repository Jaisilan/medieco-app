<template>
  <main class="mobile-shell notifications-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/settings')">← Back</button>
      <h1>Notifications</h1>
      <p>Updates from Medieco.</p>
    </section>

    <section class="actions">
      <button @click="loadNotifications">Refresh</button>
      <button v-if="unreadCount > 0" @click="markAllRead">Mark all read</button>
    </section>

    <section v-if="loading" class="empty">
      Loading notifications...
    </section>

    <section v-else-if="notifications.length === 0" class="empty-card">
      <h2>No notifications yet</h2>
      <p>Order, payment and account updates will appear here.</p>
    </section>

    <section v-else class="list">
      <article
        v-for="item in notifications"
        :key="item.id"
        :class="['notification-card', { unread: !item.is_read }]"
        @click="markRead(item)"
      >
        <div class="icon">
          {{ iconFor(item.type) }}
        </div>

        <div>
          <div class="title-row">
            <h2>{{ item.title }}</h2>
            <span v-if="!item.is_read"></span>
          </div>

          <p>{{ item.message }}</p>
          <small>{{ formatDate(item.created_at) }}</small>
        </div>
      </article>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { user, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const loading = ref(true)
const notifications = ref([])
let channel = null

onMounted(async () => {
  await loadUser()

  if (!user.value) {
    loading.value = false
    showToast({
      type: 'warning',
      title: 'Login Required',
      message: 'Please login to view notifications.',
    })
    return
  }

  await loadNotifications()
  subscribeRealtime()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

const unreadCount = computed(() =>
  notifications.value.filter((item) => !item.is_read).length
)

async function loadNotifications() {
  loading.value = true

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Notification Load Failed',
      message: error.message,
    })
  } else {
    notifications.value = data || []
  }

  loading.value = false
}

function subscribeRealtime() {
  channel = supabase
    .channel('customer-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.value.id}`,
      },
      (payload) => {
        notifications.value.unshift(payload.new)

        showToast({
          type: 'info',
          title: payload.new.title,
          message: payload.new.message,
        })
      }
    )
    .subscribe()
}

async function markRead(item) {
  if (item.is_read) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', item.id)

  if (!error) {
    item.is_read = true
  }
}

async function markAllRead() {
  const unreadIds = notifications.value
    .filter((item) => !item.is_read)
    .map((item) => item.id)

  if (unreadIds.length === 0) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', unreadIds)

  if (error) {
    showToast({
      type: 'error',
      title: 'Update Failed',
      message: error.message,
    })
    return
  }

  notifications.value = notifications.value.map((item) => ({
    ...item,
    is_read: true,
  }))

  showToast({
    type: 'success',
    title: 'Notifications Cleared',
    message: 'All notifications marked as read.',
  })
}

function iconFor(type) {
  if (type === 'order') return '📦'
  if (type === 'payment') return '💳'
  if (type === 'affiliate') return '🤝'
  if (type === 'commission') return '💰'
  if (type === 'inventory') return '📦'
  return '🔔'
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
  padding-bottom: 90px;
}

.back-btn {
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
}

.header h1 {
  margin: 14px 0 6px;
  color: #0f172a;
}

.header p {
  color: #64748b;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.actions button {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.actions button:last-child {
  background: #7a2433;
}

.empty,
.empty-card {
  margin-top: 20px;
  background: white;
  border-radius: 24px;
  padding: 24px;
  color: #64748b;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.empty-card h2 {
  margin-top: 0;
  color: #0f172a;
}

.list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.notification-card {
  background: white;
  border-radius: 22px;
  padding: 16px;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef2f7;
}

.notification-card.unread {
  background: #ecfdf5;
  border-color: #99f6e4;
}

.icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.title-row h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
}

.title-row span {
  width: 10px;
  height: 10px;
  background: #1fb6a6;
  border-radius: 999px;
  flex-shrink: 0;
}

.notification-card p {
  margin: 6px 0;
  color: #475569;
  line-height: 1.45;
}

.notification-card small {
  color: #94a3b8;
}
</style>