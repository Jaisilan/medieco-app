<template>
  <main class="admin-layout" :class="{ collapsed }">
    <aside class="sidebar">
      <div class="brand">
        <img class="brand-logo" src="/medieco-logo.png" alt="Medieco" />

        <div class="brand-text">
          <strong>Medieco</strong>
          <small>Admin Console</small>
        </div>
      </div>

      <nav>
        <button @click="$router.push('/admin')">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </button>

        <button @click="$router.push('/admin/orders')">
          <span class="nav-icon">🧾</span>
          <span class="nav-label">Orders</span>
        </button>

        <button @click="$router.push('/admin/products')">
          <span class="nav-icon">🛍</span>
          <span class="nav-label">Products</span>
        </button>

        <button @click="$router.push('/admin/inventory')">
          <span class="nav-icon">📦</span>
          <span class="nav-label">Inventory</span>
        </button>

        <button @click="$router.push('/admin/users')">
          <span class="nav-icon">👥</span>
          <span class="nav-label">Users</span>
        </button>

        <button @click="$router.push('/admin/payment-settings')">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Payments</span>
        </button>

        <button @click="$router.push('/admin/affiliates')">
          <span class="nav-icon">🤝</span>
          <span class="nav-label">Affiliates</span>
        </button>

        <button @click="$router.push('/settings')">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Settings</span>
        </button>
      </nav>
    </aside>

    <section class="main-area">
      <header class="topbar">
        <button class="menu-btn" @click="collapsed = !collapsed">
          ☰
        </button>

        <div class="top-actions">
          <button title="New Product" @click="$router.push('/admin/products/new')">
            ＋
          </button>

          <div class="search-wrap">
            <button title="Search" @click="toggleSearch">
              🔍
            </button>

            <section v-if="showSearch" class="search-panel">
              <div class="search-head">
                <strong>Search Medieco</strong>
                <button @click="closeSearch">×</button>
              </div>

              <input
                v-model="searchQuery"
                placeholder="Search orders, users, products..."
                @keyup.enter="runSearch"
              />

              <button class="search-btn" @click="runSearch" :disabled="searching">
                {{ searching ? 'Searching...' : 'Search' }}
              </button>

              <div v-if="searching" class="search-empty">
                Searching...
              </div>

              <div v-else-if="hasSearched && searchResults.length === 0" class="search-empty">
                No results found.
              </div>

              <button
                v-for="result in searchResults"
                :key="`${result.type}-${result.id}`"
                class="search-result"
                @click="openSearchResult(result)"
              >
                <span>{{ result.icon }}</span>

                <div>
                  <strong>{{ result.title }}</strong>
                  <p>{{ result.subtitle }}</p>
                  <small>{{ result.typeLabel }}</small>
                </div>
              </button>
            </section>
          </div>

          <div class="notification-wrap">
            <button
              class="notification-btn"
              title="Notifications"
              @click="toggleNotifications"
            >
              🔔
              <span v-if="unreadCount > 0" class="notification-badge">
                {{ unreadCount }}
              </span>
            </button>

            <section v-if="showNotifications" class="notification-panel">
              <div class="notification-head">
                <div>
                  <strong>Notifications</strong>
                  <small>{{ unreadCount }} unread</small>
                </div>

                <button
                  v-if="notifications.length > 0"
                  @click="markAllAsRead"
                >
                  Mark all
                </button>
              </div>

              <div v-if="notificationsLoading" class="notification-empty">
                Loading notifications...
              </div>

              <div v-else-if="notifications.length === 0" class="notification-empty">
                No notifications yet.
              </div>

              <button
                v-for="item in notifications"
                :key="item.id"
                class="notification-item"
                :class="{ unread: !item.is_read }"
                @click="openNotification(item)"
              >
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.message || '-' }}</p>
                  <small>{{ formatDateTime(item.created_at) }}</small>
                </div>

                <span v-if="!item.is_read"></span>
              </button>
            </section>
          </div>

          <button class="avatar" title="Settings" @click="$router.push('/settings')">
            <img v-if="avatarImage" :src="avatarImage" alt="Admin profile" />
            <span v-else>{{ initials }}</span>
          </button>
        </div>
      </header>

      <section class="content">
        <slot />
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { profile } from '../stores/auth'

const router = useRouter()

const collapsed = ref(false)

const showNotifications = ref(false)
const notificationsLoading = ref(false)
const notifications = ref([])

const showSearch = ref(false)
const searchQuery = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref([])

onMounted(async () => {
  await loadNotifications()
})

const initials = computed(() => {
  const name = profile.value?.full_name || profile.value?.email || 'Admin'

  return String(name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const avatarImage = computed(() => {
  return profile.value?.avatar_url || ''
})

const unreadCount = computed(() => {
  return notifications.value.filter((item) => !item.is_read).length
})

function toggleSearch() {
  showSearch.value = !showSearch.value
  showNotifications.value = false
}

function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}

async function runSearch() {
  const keyword = searchQuery.value.trim()

  if (!keyword) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  searching.value = true
  hasSearched.value = true

  try {
    const [ordersRes, productsRes, usersRes, affiliatesRes, inventoryRes] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, total_amount, payment_status')
          .ilike('order_number', `%${keyword}%`)
          .limit(5),

        supabase
          .from('products')
          .select('id, name, sku, slug')
          .or(`name.ilike.%${keyword}%,sku.ilike.%${keyword}%,slug.ilike.%${keyword}%`)
          .limit(5),

        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role')
          .or(`full_name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%`)
          .limit(5),

        supabase
          .from('affiliates')
          .select('id, full_name, email, phone, referral_code, status')
          .or(`full_name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%,referral_code.ilike.%${keyword}%`)
          .limit(5),

        supabase
          .from('inventory_items')
          .select('id, item_name, sku, current_stock')
          .or(`item_name.ilike.%${keyword}%,sku.ilike.%${keyword}%`)
          .limit(5),
      ])

    const results = []

    if (!ordersRes.error) {
      results.push(
        ...(ordersRes.data || []).map((item) => ({
          id: item.id,
          type: 'order',
          typeLabel: 'Order',
          icon: '🧾',
          title: item.order_number,
          subtitle: `RM${money(item.total_amount)} · ${formatStatus(item.payment_status)}`,
          path: '/admin/orders',
        }))
      )
    }

    if (!productsRes.error) {
      results.push(
        ...(productsRes.data || []).map((item) => ({
          id: item.id,
          type: 'product',
          typeLabel: 'Product',
          icon: '🛍',
          title: item.name,
          subtitle: item.sku || item.slug || 'Product',
          path: `/admin/products/${item.id}`,
        }))
      )
    }

    if (!usersRes.error) {
      results.push(
        ...(usersRes.data || []).map((item) => ({
          id: item.id,
          type: 'user',
          typeLabel: 'User',
          icon: '👥',
          title: item.full_name || item.email,
          subtitle: `${item.email || '-'} · ${formatStatus(item.role)}`,
          path: '/admin/users',
        }))
      )
    }

    if (!affiliatesRes.error) {
      results.push(
        ...(affiliatesRes.data || []).map((item) => ({
          id: item.id,
          type: 'affiliate',
          typeLabel: 'Affiliate',
          icon: '🤝',
          title: item.full_name || item.referral_code,
          subtitle: `${item.referral_code || '-'} · ${formatStatus(item.status)}`,
          path: '/admin/affiliates',
        }))
      )
    }

    if (!inventoryRes.error) {
      results.push(
        ...(inventoryRes.data || []).map((item) => ({
          id: item.id,
          type: 'inventory',
          typeLabel: 'Inventory',
          icon: '📦',
          title: item.item_name,
          subtitle: `${item.sku || 'No SKU'} · Stock: ${item.current_stock}`,
          path: '/admin/inventory',
        }))
      )
    }

    searchResults.value = results
  } catch (error) {
    alert(error.message || 'Search failed.')
  }

  searching.value = false
}

function openSearchResult(result) {
  showSearch.value = false
  router.push(result.path)
}

async function loadNotifications() {
  notificationsLoading.value = true

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error(error)
  } else {
    notifications.value = data || []
  }

  notificationsLoading.value = false
}

async function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  showSearch.value = false

  if (showNotifications.value) {
    await loadNotifications()
  }
}

async function markAllAsRead() {
  const unreadIds = notifications.value
    .filter((item) => !item.is_read)
    .map((item) => item.id)

  if (unreadIds.length === 0) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', unreadIds)

  if (error) {
    alert(error.message)
    return
  }

  await loadNotifications()
}

async function openNotification(item) {
  if (!item.is_read) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', item.id)
  }

  showNotifications.value = false

  if (item.type === 'order' || item.type === 'payment') {
    router.push('/admin/orders')
    return
  }

  if (item.type === 'affiliate' || item.type === 'commission') {
    router.push('/admin/affiliates')
    return
  }

  if (item.type === 'inventory') {
    router.push('/admin/inventory')
    return
  }

  if (item.type === 'user') {
    router.push('/admin/users')
    return
  }

  await loadNotifications()
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatStatus(value) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(31, 182, 166, 0.12), transparent 34%),
    radial-gradient(circle at bottom left, rgba(38, 135, 233, 0.10), transparent 34%),
    #eef2f7;
  display: flex;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #0f172a, #111827 55%, #06161c);
  color: white;
  transition: width 0.25s ease;
  overflow: hidden;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 16px 0 40px rgba(15, 23, 42, 0.22);
}

.collapsed .sidebar {
  width: 82px;
}

.brand {
  height: 92px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px;
  flex-shrink: 0;
}

.brand-text {
  display: grid;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.18s ease;
}

.brand-text strong {
  font-size: 18px;
  letter-spacing: 0.02em;
}

.brand-text small {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}

.collapsed .brand-text {
  opacity: 0;
  pointer-events: none;
}

nav {
  display: grid;
  gap: 8px;
  padding: 14px 12px;
}

nav button {
  width: 100%;
  height: 50px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  border-radius: 16px;
  text-align: left;
  font-weight: 900;
  display: flex;
  gap: 14px;
  align-items: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

nav button:hover {
  background: rgba(31, 182, 166, 0.14);
  color: white;
  transform: translateX(2px);
}

.nav-icon {
  width: 58px;
  min-width: 58px;
  display: grid;
  place-items: center;
  font-size: 22px;
}

.nav-label {
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.18s ease;
}

.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
}

.main-area {
  margin-left: 260px;
  flex: 1;
  transition: margin-left 0.25s ease;
}

.collapsed .main-area {
  margin-left: 82px;
}

.topbar {
  height: 76px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 26px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.menu-btn,
.top-actions button {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
}

.menu-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 900;
}

.menu-btn:hover {
  background: #ecfdf5;
  color: #0f766e;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.top-actions > button:not(.avatar),
.search-wrap > button,
.notification-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #f8fafc;
  display: grid;
  place-items: center;
}

.top-actions > button:not(.avatar):hover,
.search-wrap > button:hover,
.notification-btn:hover {
  background: #eef6ff;
}

.search-wrap,
.notification-wrap {
  position: relative;
}

.search-panel,
.notification-panel {
  position: absolute;
  right: 0;
  top: 54px;
  width: 380px;
  max-height: 520px;
  overflow: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  padding: 14px;
  z-index: 60;
}

.search-head,
.notification-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 10px;
}

.search-head strong,
.notification-head strong {
  display: block;
  color: #0f172a;
}

.search-head button {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 999px;
  width: 30px;
  height: 30px;
  font-size: 18px;
}

.search-panel input {
  width: 100%;
  margin-top: 12px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  padding: 12px;
  background: #f8fafc;
}

.search-btn {
  width: 100%;
  margin-top: 10px;
  border: none;
  border-radius: 999px;
  padding: 11px;
  background: #0f766e;
  color: white;
  font-weight: 900;
}

.search-empty,
.notification-empty {
  padding: 18px 4px;
  color: #64748b;
  font-size: 14px;
}

.search-result {
  width: 100%;
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  margin-top: 10px;
  display: flex;
  gap: 12px;
  text-align: left;
}

.search-result span {
  font-size: 20px;
}

.search-result strong {
  color: #0f172a;
  font-size: 14px;
}

.search-result p {
  margin: 4px 0;
  color: #64748b;
  font-size: 13px;
}

.search-result small {
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
}

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 19px;
  height: 19px;
  border-radius: 999px;
  background: #dc2626;
  color: white;
  font-size: 11px;
  font-weight: 900;
  display: grid;
  place-items: center;
  padding: 0 5px;
}

.notification-head small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.notification-head button {
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 900;
}

.notification-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  margin-top: 10px;
  text-align: left;
  font-size: 14px;
}

.notification-item.unread {
  background: #ecfdf5;
}

.notification-item strong {
  color: #0f172a;
  font-size: 14px;
}

.notification-item p {
  margin: 4px 0;
  color: #64748b;
  font-size: 13px;
}

.notification-item small {
  color: #94a3b8;
  font-size: 12px;
}

.notification-item > span {
  width: 9px;
  height: 9px;
  background: #1fb6a6;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 5px;
}

.avatar {
  background: linear-gradient(135deg, #1fb6a6, #2687e9) !important;
  color: white;
  border-radius: 999px;
  width: 48px;
  height: 48px;
  padding: 0 !important;
  font-size: 14px !important;
  font-weight: 900;
  box-shadow: 0 10px 24px rgba(31, 182, 166, 0.26);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar span {
  display: grid;
  place-items: center;
}

.content {
  padding: 26px;
}

@media (max-width: 860px) {
  .sidebar {
    width: 82px;
  }

  .brand-text,
  .nav-label {
    opacity: 0;
    pointer-events: none;
  }

  .main-area {
    margin-left: 82px;
  }

  .collapsed .sidebar {
    width: 82px;
  }

  .collapsed .main-area {
    margin-left: 82px;
  }

  .content {
    padding: 18px;
  }

  .search-panel,
  .notification-panel {
    width: calc(100vw - 130px);
    right: -58px;
  }
}
</style>