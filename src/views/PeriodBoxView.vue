<template>
  <main class="mobile-shell bloom-page">
    <header class="page-header">
      <button class="icon-btn" aria-label="Back to home" @click="$router.push('/home')">‹</button>

      <div class="header-copy">
        <span class="eyebrow">Medieco Bloom Care</span>
        <h1>Choose your care plan</h1>
        <p>Curated monthly essentials with free delivery and clear subscription terms.</p>
      </div>

      <button class="cart-btn" aria-label="Open cart" @click="$router.push('/cart')">
        <span aria-hidden="true">🛒</span>
        <b v-if="cartCount > 0">{{ cartCount > 99 ? '99+' : cartCount }}</b>
      </button>
    </header>

    <section class="intro-card">
      <div>
        <span class="status-pill">Bloom Care active</span>
        <h2>Comfort planned around you</h2>
        <p>Compare available plans, choose your box, and manage the subscription from one place.</p>
      </div>

      <div class="intro-points">
        <span>✓ Free delivery</span>
        <span>✓ Flexible box selection</span>
        <span>✓ Secure checkout</span>
      </div>
    </section>

    <section class="toolbar">
      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input v-model="search" type="search" placeholder="Search Bloom Care plans" />
        <button v-if="search" type="button" aria-label="Clear search" @click="search = ''">×</button>
      </label>

      <div class="filters" aria-label="Product filters">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">All plans</button>
        <button :class="{ active: filter === 'subscription' }" @click="filter = 'subscription'">Subscriptions</button>
        <button :class="{ active: filter === 'wishlist' }" @click="filter = 'wishlist'">Saved</button>
      </div>
    </section>

    <section v-if="loading" class="state-card">
      <strong>Loading Bloom Care plans</strong>
      <p>Please wait while we prepare the available options.</p>
    </section>

    <section v-else-if="filteredProducts.length === 0" class="state-card">
      <strong>No matching plans</strong>
      <p>Try another search term or filter.</p>
    </section>

    <section v-else class="product-grid">
      <article
        v-for="(product, index) in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="openProduct(product.slug)"
      >
        <div class="image-wrap">
          <img :src="getProductImage(product)" :alt="product.name" />
          <span class="floating-badge">{{ productBadge(product, index) }}</span>
          <button class="wish-btn" aria-label="Save product" @click.stop="toggleWish(product.id)">
            {{ wishlist.includes(product.id) ? '♥' : '♡' }}
          </button>
        </div>

        <div class="product-copy">
          <div class="product-heading">
            <div>
              <span v-if="hasSubscription(product)" class="sub-pill">Subscription plan</span>
              <h2>{{ product.name }}</h2>
            </div>
            <span class="arrow">↗</span>
          </div>

          <p>{{ shortDescription(product.description) }}</p>

          <div class="price-block">
            <small>Starting from</small>
            <div>
              <strong>RM{{ money(bestPrice(product)) }}</strong>
              <span v-if="hasSubscription(product)">per month</span>
            </div>
          </div>

          <div class="benefits">
            <span>🚚 Free delivery</span>
            <span>📦 Monthly fulfilment</span>
          </div>

          <button class="view-btn" @click.stop="openProduct(product.slug)">View plan details</button>
        </div>
      </article>
    </section>

    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'
import { cartCount } from '../stores/cart'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()
const products = ref([])
const loading = ref(true)
const filter = ref('all')
const search = ref('')
const wishlist = ref(loadWishlist())

onMounted(loadProducts)

watch(
  wishlist,
  () => localStorage.setItem('medieco_bloom_wishlist', JSON.stringify(wishlist.value)),
  { deep: true }
)

const filteredProducts = computed(() => {
  const query = search.value.toLowerCase().trim()

  return products.value.filter((product) => {
    const matchesSearch =
      !query ||
      String(product.name || '').toLowerCase().includes(query) ||
      String(product.description || '').toLowerCase().includes(query)

    const matchesFilter =
      filter.value === 'all' ||
      (filter.value === 'subscription' && hasSubscription(product)) ||
      (filter.value === 'wishlist' && wishlist.value.includes(product.id))

    return matchesSearch && matchesFilter
  })
})

async function loadProducts() {
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .in('display_scope', ['bloom_care', 'both'])
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Bloom Care Load Failed',
      message: error.message,
    })
  } else {
    products.value = data || []
  }

  loading.value = false
}

function openProduct(slug) {
  router.push(`/bloom/${slug}`)
}

function hasSubscription(product) {
  return Boolean(product.is_subscription || product.allow_6_month || product.allow_12_month)
}

function bestPrice(product) {
  const prices = [
    Number(product.price || 0),
    Number(product.six_month_price || 0),
    Number(product.twelve_month_price || 0),
  ].filter((price) => price > 0)

  return prices.length ? Math.min(...prices) : 0
}

function productBadge(product, index) {
  if (product.product_badge) return product.product_badge
  if (product.allow_12_month) return index === 0 ? 'Best seller' : 'Best value'
  if (product.allow_6_month) return 'Popular'
  return 'Bloom Care'
}

function shortDescription(text) {
  const value = String(text || 'A thoughtfully curated Bloom Care plan.')
    .replace(/\s+/g, ' ')
    .trim()

  return value.length > 105 ? `${value.slice(0, 105)}…` : value
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function getProductImage(product) {
  return product.image_url || product.pack_image_url || '/images/everyday-bloom.jpeg'
}

function toggleWish(id) {
  wishlist.value = wishlist.value.includes(id)
    ? wishlist.value.filter((item) => item !== id)
    : [...wishlist.value, id]
}

function loadWishlist() {
  try {
    return JSON.parse(localStorage.getItem('medieco_bloom_wishlist') || '[]')
  } catch {
    return []
  }
}
</script>

<style scoped>
.bloom-page {
  min-height: 100vh;
  padding: 0 16px 112px;
  background:
    radial-gradient(circle at top right, rgba(255, 210, 221, 0.55), transparent 27%),
    linear-gradient(180deg, #fff8fa 0%, #fff 38%, #fff8fa 100%);
}

.page-header {
  margin: 0 -16px;
  padding: 28px max(20px, calc((100vw - 1120px) / 2)) 42px;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 14px;
  align-items: start;
  background: linear-gradient(135deg, #7a2433, #c74e67 62%, #e8796b);
  color: #fff;
  border-radius: 0 0 34px 34px;
}

.icon-btn,
.cart-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-radius: 14px;
  display: grid;
  place-items: center;
}

.icon-btn { font-size: 32px; }
.cart-btn { position: relative; font-size: 21px; }
.cart-btn b {
  position: absolute;
  right: -6px;
  top: -6px;
  min-width: 20px;
  padding: 3px 6px;
  border-radius: 999px;
  background: #fff;
  color: #7a2433;
  font-size: 10px;
}

.header-copy { max-width: 720px; }
.eyebrow {
  display: block;
  margin-bottom: 7px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.78;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(30px, 6vw, 48px);
  line-height: 1.05;
}

.page-header p {
  margin: 10px 0 0;
  max-width: 620px;
  line-height: 1.6;
  opacity: 0.88;
}

.intro-card,
.toolbar,
.state-card,
.product-grid {
  width: min(100%, 1120px);
  margin-left: auto;
  margin-right: auto;
}

.intro-card {
  margin-top: -18px;
  padding: 22px;
  display: grid;
  gap: 18px;
  background: #fff;
  border: 1px solid #f7d9e0;
  border-radius: 26px;
  box-shadow: 0 18px 40px rgba(122, 36, 51, 0.1);
}

.status-pill,
.sub-pill {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff0f4;
  color: #8b1232;
  font-size: 11px;
  font-weight: 900;
}

.intro-card h2 { margin: 12px 0 6px; color: #501827; }
.intro-card p { margin: 0; color: #64748b; line-height: 1.6; }
.intro-points { display: flex; flex-wrap: wrap; gap: 8px; }
.intro-points span {
  padding: 8px 11px;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.toolbar { margin-top: 20px; display: grid; gap: 12px; }
.search-box {
  min-height: 52px;
  padding: 0 15px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #f1d6dc;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(122, 36, 51, 0.06);
}

.search-box input,
.search-box button { border: 0; background: transparent; }
.search-box input { min-width: 0; outline: 0; color: #1f2937; font-weight: 700; }
.search-box button { color: #8b1232; font-size: 20px; }

.filters { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.filters button {
  border: 1px solid #f1d6dc;
  background: #fff;
  color: #64748b;
  padding: 10px 14px;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 900;
}
.filters button.active { background: #7a2433; color: #fff; border-color: #7a2433; }

.state-card {
  margin-top: 18px;
  padding: 28px;
  text-align: center;
  border: 1px dashed #e8c5ce;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.8);
}
.state-card p { margin-bottom: 0; color: #64748b; }

.product-grid {
  margin-top: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
}

.product-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #f4dce2;
  border-radius: 26px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  cursor: pointer;
}

.image-wrap { position: relative; aspect-ratio: 1.45 / 1; background: #fff4f6; overflow: hidden; }
.image-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.25s ease; }
.product-card:hover .image-wrap img { transform: scale(1.025); }

.floating-badge,
.wish-btn { position: absolute; top: 12px; }
.floating-badge {
  left: 12px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(80, 24, 39, 0.9);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
}
.wish-btn {
  right: 12px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #a42a48;
  font-size: 20px;
}

.product-copy { padding: 20px; display: flex; flex-direction: column; flex: 1; }
.product-heading { display: flex; justify-content: space-between; gap: 14px; }
.product-heading h2 { margin: 8px 0 0; color: #3f1723; font-size: 21px; }
.arrow { color: #9f3750; font-size: 20px; }
.product-copy > p { color: #64748b; line-height: 1.6; }

.price-block { margin-top: auto; padding-top: 14px; border-top: 1px solid #f3e4e8; }
.price-block small { color: #94a3b8; font-weight: 800; }
.price-block div { margin-top: 3px; display: flex; align-items: baseline; gap: 7px; }
.price-block strong { color: #7a2433; font-size: 25px; }
.price-block span { color: #64748b; font-size: 12px; }

.benefits { margin: 14px 0; display: flex; flex-wrap: wrap; gap: 8px; }
.benefits span {
  padding: 7px 9px;
  border-radius: 10px;
  background: #fff5f7;
  color: #6b3040;
  font-size: 11px;
  font-weight: 800;
}

.view-btn {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 13px 16px;
  background: linear-gradient(135deg, #7a2433, #d35f72);
  color: #fff;
  font-weight: 900;
}

@media (min-width: 760px) {
  .intro-card { grid-template-columns: 1.25fr 0.75fr; align-items: center; }
  .toolbar { grid-template-columns: minmax(280px, 1fr) auto; align-items: center; }
  .filters { justify-content: flex-end; }
}

@media (max-width: 520px) {
  .page-header { grid-template-columns: 40px minmax(0, 1fr) 40px; padding-left: 16px; padding-right: 16px; }
  .icon-btn, .cart-btn { width: 40px; height: 40px; }
  .intro-card { padding: 18px; }
}
</style>
