<template>
  <main class="mobile-shell home">
    <section class="hero">
      <div class="hero-left">
        <img class="profile-avatar" :src="avatarImage" alt="Profile avatar" />

        <div>
          <p>{{ greeting }}</p>
          <h1>{{ displayName }}</h1>
        </div>
      </div>

      <div class="brand clock-box">
  <span class="day">{{ currentDay }}</span>
  <span class="date">{{ currentDate }}</span>
  <strong class="time">{{ currentTime }}</strong>
</div>
    </section>

    <section class="status-card">
      <span>Phase 1 Active</span>
      <h2>Bloom Care & Marketplace</h2>
      <p>
        Bloom Care and Marketplace are active now. Clinic, records and AI modules
        will expand in later phases.
      </p>
    </section>

    <section class="feature-grid">
      <button class="feature active pink" @click="$router.push('/period-box')">
        <span>🌸</span>
        <strong>Bloom Care</strong>
        <small>Active</small>
      </button>

      <button class="feature active" @click="$router.push('/marketplace')">
        <span>🛍️</span>
        <strong>Marketplace</strong>
        <small>Products</small>
      </button>

      <button class="feature active blue" @click="$router.push('/order-tracking?from=settings')">
        <span>📦</span>
        <strong>Orders</strong>
        <small>Track</small>
      </button>

      <button class="feature active dark" @click="$router.push('/affiliate?from=home')">
        <span>💰</span>
        <strong>Earn</strong>
        <small>Affiliate</small>
      </button>

      <button class="feature" @click="comingSoon('Book Visit')">
        <span>📅</span>
        <strong>Book Visit</strong>
        <small>Coming soon</small>
      </button>

      <button class="feature" @click="comingSoon('Records')">
        <span>📄</span>
        <strong>Records</strong>
        <small>Coming soon</small>
      </button>

      <button class="feature" @click="comingSoon('Clinics')">
        <span>🏥</span>
        <strong>Clinics</strong>
        <small>Coming soon</small>
      </button>

      <button class="feature" @click="comingSoon('Ask Medieco')">
        <span>🤖</span>
        <strong>Ask Medieco</strong>
        <small>Coming soon</small>
      </button>
      
      <button v-if="isAdmin" class="feature active admin" @click="$router.push('/admin')">
        <span>⚙️</span>
        <strong>Admin</strong>
        <small>Dashboard</small>
      </button>

    </section>

    <section class="promo-card" @click="$router.push('/period-box')">
      <div>
        <span>Monthly Care</span>
        <h2>Everyday Bloom Box</h2>
        <p>Start from RM29/month</p>
      </div>
      <strong>View →</strong>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const now = ref(new Date())
let clockTimer = null

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

  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

watch(user, (value) => {
  if (!value) {
    router.replace('/landing')
  }
})

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.user_metadata?.full_name) return user.value.user_metadata.full_name
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Welcome'
})

const currentDay = computed(() =>
  now.value.toLocaleDateString('en-MY', {
    weekday: 'long',
  })
)

const currentDate = computed(() =>
  now.value.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
)

const currentTime = computed(() =>
  now.value.toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
)

const avatarImage = computed(() => {
  if (profile.value?.avatar_url) return profile.value.avatar_url
  if (user.value?.user_metadata?.avatar_url) return user.value.user_metadata.avatar_url

  const gender = String(profile.value?.gender || user.value?.user_metadata?.gender || '').toLowerCase()

  if (gender === 'male') return '/avatars/male.png'
  if (gender === 'female') return '/avatars/female.png'

  return '/avatars/neutral.png'
})

const isAdmin = computed(() =>
  adminRoles.includes(profile.value?.role)
)

function comingSoon(moduleName = 'Feature') {
  showToast({
    type: 'info',
    title: `${moduleName} Coming Soon`,
    message: 'This feature will be available in future Medieco phases.',
  })
}
</script>

<style scoped>
.home {
  background: #f6f8fb;
  padding-bottom: 24px;
}

.hero {
  background: linear-gradient(135deg, #1fb6a6, #2687e9);
  color: white;
  padding: 28px 20px 70px;
  border-bottom-left-radius: 34px;
  border-bottom-right-radius: 34px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.profile-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 3px solid rgba(255, 255, 255, 0.75);
  object-fit: cover;
  flex-shrink: 0;
}

.hero p {
  margin: 0;
  opacity: 0.85;
}

.hero h1 {
  margin: 4px 0 0;
  font-size: 28px;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.brand {
  border: none;
  background: rgba(255, 255, 255, 0.22);
  color: white;
  border-radius: 999px;
  padding: 9px 13px;
  font-weight: 900;
  flex-shrink: 0;
}

.status-card {
  background: white;
  border-radius: 26px;
  padding: 18px;
  margin: -48px 16px 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.status-card span {
  display: inline-block;
  background: #d1fae5;
  color: #0f766e;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status-card h2 {
  margin: 12px 0 8px;
  color: #0f172a;
}

.status-card p {
  color: #64748b;
  font-size: 14px;
}

.feature-grid {
  padding: 0 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.feature {
  border: none;
  border-radius: 22px;
  padding: 16px;
  min-height: 116px;
  background: white;
  text-align: left;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.feature span {
  font-size: 24px;
}

.feature strong {
  display: block;
  margin-top: 12px;
}

.feature small {
  color: #94a3b8;
}

.feature.active {
  background: #ecfdf5;
}

.feature.active small {
  color: #0f766e;
  font-weight: 900;
}

.feature.pink {
  background: #fff1f2;
}

.feature.blue {
  background: #eef6ff;
}

.feature.dark {
  background: #fdf2f8;
}

.feature.admin {
  background: #f8fafc;
}

.promo-card {
  margin: 16px;
  background: linear-gradient(135deg, #7a2433, #e8796b);
  color: white;
  border-radius: 26px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand{
  display:flex;
  flex-direction:column;
  gap:2px;
}

.clock-box {
  text-align: right;
}

.clock-box strong {
  display: block;
  font-size: 16px; /* change this for time size */
  font-weight: 900;
}

.clock-box span {
  display: block;
  font-size: 11px; /* change this for date size */
  opacity: 0.85;
}
</style>