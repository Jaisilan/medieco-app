<template>
  <main class="mobile-shell settings-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/home')">← Back</button>

      <h1>Settings</h1>
      <p>Manage your Medieco account, orders and app access.</p>
    </section>

    <section v-if="loading" class="card">
      Loading settings...
    </section>

    <section v-else class="card profile-card">
      <img :src="avatarImage" alt="Profile avatar" />

      <div>
        <h2>{{ displayName }}</h2>
        <p>{{ profile?.email || user?.email }}</p>
        <small>{{ formatStatus(profile?.role || 'customer') }}</small>
      </div>
    </section>

    <section class="card menu-card">
      <h3>My Account</h3>

      <button @click="$router.push('/profile')">
        <span>👤</span>
        <div>
          <strong>My Profile</strong>
          <small>Update name, phone, gender and avatar</small>
        </div>
      </button>

      <button @click="$router.push('/order-tracking')">
        <span>📦</span>
        <div>
          <strong>My Orders</strong>
          <small>View orders and delivery tracking</small>
        </div>
      </button>

      <button @click="$router.push('/affiliate')">
        <span>💰</span>
        <div>
          <strong>Affiliate Dashboard</strong>
          <small>Apply, view referral ID and commission</small>
        </div>
      </button>
    </section>

    <section v-if="isAdmin" class="card menu-card">
      <h3>Admin Access</h3>

      <button @click="$router.push('/admin')">
        <span>⚙️</span>
        <div>
          <strong>Admin Dashboard</strong>
          <small>Operations overview</small>
        </div>
      </button>

      <button @click="$router.push('/admin/users')">
        <span>👥</span>
        <div>
          <strong>User Management</strong>
          <small>Roles, access and suspensions</small>
        </div>
      </button>

      <button @click="$router.push('/admin/products')">
        <span>🛍️</span>
        <div>
          <strong>Product Management</strong>
          <small>Marketplace and Bloom Care products</small>
        </div>
      </button>

      <button @click="$router.push('/admin/orders')">
        <span>🧾</span>
        <div>
          <strong>Order Management</strong>
          <small>Payments, stock and fulfilment</small>
        </div>
      </button>

      <button @click="$router.push('/admin/affiliates')">
        <span>🤝</span>
        <div>
          <strong>Affiliate Management</strong>
          <small>Approvals, status and commissions</small>
        </div>
      </button>
    </section>

    <section class="card menu-card">
      <h3>Future Modules</h3>

      <button @click="comingSoon('Clinic Module')">
        <span>🏥</span>
        <div>
          <strong>Clinic Module</strong>
          <small>Coming in version 1.1.0</small>
        </div>
      </button>

      <button @click="comingSoon('Medical Records')">
        <span>📄</span>
        <div>
          <strong>Medical Records</strong>
          <small>Coming soon</small>
        </div>
      </button>

      <button @click="$router.push('/notifications')">
        <span>🔔</span>
        <div>
          <strong>Notifications</strong>
          <small>Order, payment and account updates will appear here.</small>
        </div>
      </button>
    </section>

    <button class="logout-btn" @click="logout">
      Logout
    </button>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, loadUser, signOut } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const loading = ref(true)

const adminRoles = [
  'admin',
  'master_admin',
  'order_manager',
  'affiliate_manager',
  'support_staff',
  'product_manager',
]

onMounted(async () => {
  await loadUser()
  loading.value = false
})

const isAdmin = computed(() =>
  adminRoles.includes(profile.value?.role)
)

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Medieco User'
})

const avatarImage = computed(() => {
  if (profile.value?.avatar_url) return profile.value.avatar_url

  const gender = String(profile.value?.gender || '').toLowerCase()

  if (gender === 'male') return '/avatars/male.png'
  if (gender === 'female') return '/avatars/female.png'

  return '/avatars/neutral.png'
})

function formatStatus(value) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function comingSoon(moduleName = 'Feature') {
  showToast({
    type: 'info',
    title: `${moduleName} Coming Soon`,
    message: 'This feature will be available in future Medieco phases.',
  })
}

async function logout() {
  await signOut()

  showToast({
    type: 'success',
    title: 'Logged Out',
    message: 'You have been signed out successfully.',
  })

  router.push('/')
}
</script>

<style scoped>
.settings-page {
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

.card {
  margin-top: 18px;
  background: white;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.profile-card {
  display: flex;
  gap: 14px;
  align-items: center;
}

.profile-card img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background: #eef2f7;
  border: 4px solid #ecfdf5;
}

.profile-card h2 {
  margin: 0;
  color: #0f172a;
}

.profile-card p {
  margin: 5px 0;
  color: #64748b;
}

.profile-card small {
  display: inline-block;
  color: #0f766e;
  background: #ecfdf5;
  border-radius: 999px;
  padding: 5px 9px;
  font-weight: 900;
  font-size: 12px;
}

.menu-card h3 {
  margin: 0 0 12px;
  color: #0f172a;
}

.menu-card button {
  width: 100%;
  border: none;
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px;
  margin-top: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
  text-align: left;
}

.menu-card button span {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: white;
  font-size: 20px;
}

.menu-card button strong {
  display: block;
  color: #0f172a;
}

.menu-card button small {
  display: block;
  margin-top: 4px;
  color: #64748b;
}

.logout-btn {
  width: 100%;
  margin-top: 18px;
  border: none;
  background: #991b1b;
  color: white;
  border-radius: 999px;
  padding: 15px;
  font-weight: 900;
}
</style>