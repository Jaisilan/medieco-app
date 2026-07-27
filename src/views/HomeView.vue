<template>
  <main class="mobile-shell home app-content">
    <header class="app-header">
      <button class="profile-button" type="button" @click="$router.push('/profile')">
        <img class="profile-avatar" :src="avatarImage" alt="Profile" />
        <span>
          <small>{{ greeting }}</small>
          <strong>{{ displayName }}</strong>
        </span>
      </button>

      <div class="header-actions">
        <button class="icon-button" type="button" aria-label="Notifications" @click="$router.push('/notifications')">
          <span aria-hidden="true">🔔</span>
        </button>
        <button class="icon-button" type="button" aria-label="Settings" @click="$router.push('/settings')">
          <span aria-hidden="true">⚙️</span>
        </button>
      </div>
    </header>

    <section class="hero-panel">
      <div class="hero-copy">
        <span class="eyebrow">Bloom Care is active</span>
        <h1>Care that fits your monthly rhythm.</h1>
        <p>Choose your Bloom Box, manage deliveries and keep every order in one place.</p>

        <div class="hero-actions">
          <button class="primary-btn" type="button" @click="$router.push('/period-box')">
            Explore Bloom Care
          </button>
          <button class="secondary-btn light" type="button" @click="$router.push('/order-tracking?from=home')">
            Track an order
          </button>
        </div>
      </div>

      <div class="date-card" aria-label="Current date and time">
        <small>{{ currentDay }}</small>
        <strong>{{ currentDateShort }}</strong>
        <span>{{ currentTime }}</span>
      </div>
    </section>

    <section class="quick-section section-shell">
      <div class="section-heading">
        <div>
          <span>Quick access</span>
          <h2>Your Medieco services</h2>
        </div>
      </div>

      <div class="service-grid">
        <button class="service-card bloom" type="button" @click="$router.push('/period-box')">
          <span class="service-icon">🌸</span>
          <div>
            <strong>Bloom Care</strong>
            <small>Build your monthly box</small>
          </div>
          <span class="arrow">→</span>
        </button>

        <button class="service-card" type="button" @click="$router.push('/marketplace')">
          <span class="service-icon">🛍️</span>
          <div>
            <strong>Marketplace</strong>
            <small>Browse wellness products</small>
          </div>
          <span class="arrow">→</span>
        </button>

        <button class="service-card" type="button" @click="$router.push('/order-tracking?from=home')">
          <span class="service-icon">📦</span>
          <div>
            <strong>Orders</strong>
            <small>Payments and deliveries</small>
          </div>
          <span class="arrow">→</span>
        </button>

        <button class="service-card" type="button" @click="$router.push('/affiliate?from=home')">
          <span class="service-icon">🤝</span>
          <div>
            <strong>Earn</strong>
            <small>Affiliate dashboard</small>
          </div>
          <span class="arrow">→</span>
        </button>
      </div>
    </section>

    <section class="section-shell feature-section">
      <div class="section-heading">
        <div>
          <span>Coming next</span>
          <h2>The wider Medieco ecosystem</h2>
        </div>
      </div>

      <div class="future-grid">
        <button type="button" @click="comingSoon('Book Visit')"><span>📅</span><strong>Book Visit</strong><small>Clinic appointments</small></button>
        <button type="button" @click="comingSoon('Records')"><span>📄</span><strong>Records</strong><small>Health documents</small></button>
        <button type="button" @click="comingSoon('Clinics')"><span>🏥</span><strong>Clinics</strong><small>Find care nearby</small></button>
        <button type="button" @click="comingSoon('Ask Medieco')"><span>✨</span><strong>Ask Medieco</strong><small>Guided health support</small></button>
      </div>
    </section>

    <section v-if="isAdmin" class="admin-banner section-shell">
      <div>
        <span>Administration access</span>
        <h2>Manage Medieco operations</h2>
        <p>Review orders, products, affiliates and users from the administration portal.</p>
      </div>
      <button class="secondary-btn" type="button" @click="$router.push('/admin')">Open Admin</button>
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

const adminRoles = ['admin', 'master_admin', 'order_manager', 'affiliate_manager', 'support_staff', 'product_manager']

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
  if (!value) router.replace('/landing')
})

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.user_metadata?.full_name) return user.value.user_metadata.full_name
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Welcome'
})

const greeting = computed(() => {
  const hour = now.value.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const currentDay = computed(() => now.value.toLocaleDateString('en-MY', { weekday: 'long' }))
const currentDateShort = computed(() => now.value.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' }))
const currentTime = computed(() => now.value.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true }))

const avatarImage = computed(() => {
  if (profile.value?.avatar_url) return profile.value.avatar_url
  if (user.value?.user_metadata?.avatar_url) return user.value.user_metadata.avatar_url

  const gender = String(profile.value?.gender || user.value?.user_metadata?.gender || '').toLowerCase()
  if (gender === 'male') return '/avatars/male.png'
  if (gender === 'female') return '/avatars/female.png'
  return '/avatars/neutra.png'
})

const isAdmin = computed(() => adminRoles.includes(profile.value?.role))

function comingSoon(moduleName = 'Feature') {
  showToast({
    type: 'info',
    title: `${moduleName} Coming Soon`,
    message: 'This feature will be available in a future Medieco phase.',
  })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding-bottom: 104px;
  background:
    radial-gradient(circle at 10% 5%, rgba(250, 213, 222, 0.52), transparent 28%),
    linear-gradient(180deg, #fffafd 0%, #fff7fa 46%, #f8fafc 100%);
}

.app-header {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.profile-button {
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0;
  text-align: left;
}

.profile-button span { min-width: 0; }
.profile-button small { display: block; color: var(--text-muted); font-weight: 700; }
.profile-button strong { display: block; color: var(--text); font-size: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
}

.header-actions { display: flex; gap: 8px; }
.icon-button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(122, 36, 51, 0.1);
  border-radius: 14px;
  background: rgba(255,255,255,.88);
  box-shadow: var(--shadow-sm);
}

.hero-panel {
  position: relative;
  width: min(1180px, calc(100% - 32px));
  margin: 4px auto 22px;
  border-radius: clamp(26px, 4vw, 38px);
  padding: clamp(24px, 5vw, 52px);
  background:
    linear-gradient(120deg, rgba(122, 36, 51, 0.97), rgba(214, 106, 118, 0.92)),
    url('/images/everyday-bloom.jpeg') center/cover;
  color: white;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 28px;
  align-items: end;
  box-shadow: 0 26px 60px rgba(122, 36, 51, 0.2);
  overflow: hidden;
}

.hero-copy { max-width: 720px; }
.eyebrow { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
.hero-copy h1 { margin: 16px 0 10px; max-width: 660px; font-size: clamp(34px, 6vw, 64px); line-height: .98; letter-spacing: -.045em; }
.hero-copy p { margin: 0; max-width: 590px; color: rgba(255,255,255,.84); font-size: clamp(15px, 2vw, 18px); line-height: 1.65; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.primary-btn { background: white; color: var(--brand-deep); }
.secondary-btn.light { border-color: rgba(255,255,255,.36); color: white; background: rgba(255,255,255,.08); }

.date-card {
  min-width: 126px;
  padding: 18px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 24px;
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(14px);
  text-align: right;
}
.date-card small, .date-card span { display: block; color: rgba(255,255,255,.75); }
.date-card strong { display: block; margin: 6px 0; font-size: 26px; }

.section-shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto 28px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 14px; }
.section-heading span, .admin-banner span { color: var(--brand); font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
.section-heading h2, .admin-banner h2 { margin: 5px 0 0; font-size: clamp(22px, 3vw, 30px); color: var(--text); }

.service-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.service-card {
  min-height: 164px;
  border: 1px solid rgba(122,36,51,.08);
  border-radius: 26px;
  background: rgba(255,255,255,.92);
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 14px;
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: transform .2s ease, box-shadow .2s ease;
}
.service-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.service-card.bloom { background: linear-gradient(145deg, #fff, #fff0f4); }
.service-icon { width: 46px; height: 46px; border-radius: 16px; display: grid; place-items: center; background: var(--brand-soft); font-size: 22px; }
.service-card strong { display: block; margin: 4px 0 6px; color: var(--text); font-size: 17px; }
.service-card small { color: var(--text-muted); line-height: 1.45; }
.arrow { color: var(--brand); font-size: 20px; }

.future-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.future-grid button { border: 1px solid var(--border); border-radius: 22px; background: rgba(255,255,255,.72); padding: 18px; text-align: left; min-height: 132px; }
.future-grid button > span { font-size: 24px; }
.future-grid strong { display: block; margin: 14px 0 5px; color: var(--text); }
.future-grid small { color: var(--text-muted); }

.admin-banner { padding: 24px; border-radius: 28px; background: white; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 20px; box-shadow: var(--shadow-sm); }
.admin-banner p { margin: 8px 0 0; color: var(--text-muted); }

@media (max-width: 900px) {
  .service-grid, .future-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .app-header, .hero-panel, .section-shell { width: min(100% - 24px, 1180px); }
  .app-header { padding: 14px 0 10px; }
  .profile-avatar { width: 44px; height: 44px; border-radius: 14px; }
  .profile-button strong { font-size: 16px; }
  .icon-button { width: 40px; height: 40px; }

  .hero-panel {
    display: block;
    min-height: 0;
    margin-bottom: 18px;
    padding: 20px;
    padding-top: 64px;
    border-radius: 28px;
  }

  .hero-copy { max-width: none; }
  .eyebrow { padding: 6px 9px; font-size: 10px; }
  .hero-copy h1 {
    max-width: 88%;
    margin: 12px 0 8px;
    font-size: clamp(29px, 9vw, 36px);
    line-height: 1.02;
  }
  .hero-copy p {
    max-width: 94%;
    font-size: 14px;
    line-height: 1.45;
  }
  .hero-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }
  .hero-actions button {
    min-height: 46px;
    padding: 11px 12px;
    font-size: 14px;
  }

  .date-card {
    position: absolute;
    top: 16px;
    right: 16px;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 14px;
    text-align: right;
  }
  .date-card small { display: none; }
  .date-card strong { margin: 0; font-size: 14px; line-height: 1.1; }
  .date-card span { margin-top: 3px; font-size: 10px; }

  .section-shell { margin-bottom: 22px; }
  .section-heading { margin-bottom: 10px; }
  .section-heading h2 { font-size: 23px; }
  .service-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .service-card { min-height: 136px; display: block; padding: 15px; border-radius: 22px; }
  .service-icon { width: 40px; height: 40px; font-size: 20px; }
  .service-card strong { font-size: 16px; }
  .service-card .arrow { float: right; }
  .future-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .admin-banner { align-items: stretch; flex-direction: column; }
}
</style>
