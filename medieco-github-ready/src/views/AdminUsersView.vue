<template>
  <main class="admin-page">
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p>Medieco Admin</p>
          <h1>User Management</h1>
        </div>

        <button @click="$router.push('/admin')">← Dashboard</button>
      </header>

      <section class="top-actions">
        <button class="create-btn" @click="$router.push('/admin/users/create')">
          + Create Internal User
        </button>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Registered Users</h2>
          <button @click="loadUsers">Refresh</button>
        </div>

        <div class="filters">
          <input
            v-model="search"
            placeholder="Search name, email or phone..."
          />

          <select v-model="statusFilter">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div v-if="loading" class="empty">
          Loading users...
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty">
          No users found.
        </div>

        <div v-for="item in filteredUsers" :key="item.id" class="user-card">
          <div>
            <strong>{{ item.full_name || 'No name' }}</strong>
            <p>{{ item.email }}</p>
            <small>{{ item.phone || 'No phone' }}</small>

            <span :class="['status-pill', item.status || 'active']">
              {{ formatStatus(item.status || 'active') }}
            </span>
          </div>

          <div class="role-box">
            <select v-model="item.role" @change="updateRole(item)">
              <option value="customer">Customer</option>
              <option value="affiliate">Affiliate</option>
              <option value="support_staff">Support Staff</option>
              <option value="order_manager">Order Manager</option>
              <option value="affiliate_manager">Affiliate Manager</option>
              <option value="product_manager">Product Manager</option>
              <option value="admin">Admin</option>
              <option
                value="master_admin"
                :disabled="!canBeMasterAdmin(item)"
              >
                Master Admin
              </option>
            </select>

            <button
              v-if="(item.status || 'active') === 'active'"
              class="suspend-btn"
              @click="updateStatus(item, 'suspended')"
            >
              Suspend
            </button>

            <button
              v-else
              class="reactivate-btn"
              @click="updateStatus(item, 'active')"
            >
              Reactivate
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const loading = ref(true)
const users = ref([])
const search = ref('')
const statusFilter = ref('all')

const masterAdminEmails = [
  'jaisilan86@gmail.com',
  'jaisilan@desirepro.xyz',
]

onMounted(async () => {
  await loadUsers()
})

const filteredUsers = computed(() => {
  const keyword = search.value.toLowerCase().trim()

  return users.value.filter((item) => {
    const matchesSearch =
      !keyword ||
      String(item.full_name || '').toLowerCase().includes(keyword) ||
      String(item.email || '').toLowerCase().includes(keyword) ||
      String(item.phone || '').toLowerCase().includes(keyword)

    const matchesStatus =
      statusFilter.value === 'all' ||
      (item.status || 'active') === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

async function loadUsers() {
  loading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Users Load Failed',
      message: error.message,
    })
  } else {
    users.value = data || []
  }

  loading.value = false
}

function canBeMasterAdmin(item) {
  return masterAdminEmails.includes(String(item.email || '').toLowerCase())
}

async function updateRole(item) {
  if (item.role === 'master_admin' && !canBeMasterAdmin(item)) {
    showToast({
      type: 'warning',
      title: 'Not Allowed',
      message: 'Only authorised Medieco owners can be Master Admin.',
    })

    await loadUsers()
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: item.role })
    .eq('id', item.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Role Update Failed',
      message: error.message,
    })

    await loadUsers()
    return
  }

  showToast({
    type: 'success',
    title: 'Role Updated',
    message: 'User role updated successfully.',
  })
}

async function updateStatus(item, status) {
  if (item.role === 'master_admin' && status === 'suspended') {
    showToast({
      type: 'warning',
      title: 'Action Blocked',
      message: 'Master Admin cannot be suspended from this panel.',
    })
    return
  }

  const ok = confirm(`Change user status to ${status}?`)
  if (!ok) return

  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', item.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Status Update Failed',
      message: error.message,
    })
    return
  }

  showToast({
    type: 'success',
    title: 'User Status Updated',
    message: `User status changed to ${formatStatus(status)}.`,
  })

  await loadUsers()
}

function formatStatus(value) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f6f8fb;
  padding: 24px;
}

.admin-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-header {
  background: linear-gradient(135deg, #0f766e, #1f7ea6);
  color: white;
  border-radius: 28px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.admin-header p {
  margin: 0;
  opacity: 0.85;
}

.admin-header h1 {
  margin: 6px 0 0;
}

.admin-header button,
.panel-head button {
  border: none;
  background: white;
  color: #0f766e;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.top-actions {
  margin-top: 18px;
}

.create-btn {
  border: none;
  background: #7a2433;
  color: white;
  border-radius: 999px;
  padding: 14px 20px;
  font-weight: 900;
}

.panel {
  background: white;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  margin-top: 18px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px;
}

.filters input,
.filters select,
.role-box select {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  font-weight: 800;
}

.empty {
  color: #64748b;
  padding: 20px 0;
}

.user-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #eef2f7;
}

.user-card p {
  margin: 5px 0;
  color: #64748b;
}

.user-card small {
  color: #94a3b8;
}

.status-pill {
  display: inline-block;
  margin-top: 8px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.status-pill.suspended {
  background: #fee2e2;
  color: #991b1b;
}

.role-box {
  display: grid;
  gap: 10px;
  min-width: 240px;
}

.suspend-btn,
.reactivate-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  color: white;
}

.suspend-btn {
  background: #991b1b;
}

.reactivate-btn {
  background: #0f766e;
}

@media (max-width: 700px) {
  .admin-header,
  .user-card,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .role-box,
  .role-box select,
  .create-btn,
  .admin-header button,
  .panel-head button {
    width: 100%;
  }
}
</style>