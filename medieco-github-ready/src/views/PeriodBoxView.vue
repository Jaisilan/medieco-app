<template>
  <main class="mobile-shell bloom-page">
    <section class="top-hero">
      <button class="back-icon" @click="$router.push('/home')">‹</button>

      <div>
        <h1>Bloom Care</h1>
        <p>Curated monthly care boxes for comfort, confidence and convenience.</p>
      </div>

      <button class="cart-btn" @click="$router.push('/cart')">
        🛒
        <span v-if="cartCount > 0">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </button>
    </section>

    <section class="section-head">
      <div>
        <h2>Our Boxes</h2>
        <p>Premium care, delivered monthly.</p>
      </div>

      <button class="filter-btn" @click="showFilter = !showFilter">
        ⛃ Filter
      </button>
    </section>

    <section class="search-card">
      <span>🔍</span>
      <input v-model="search" placeholder="Search Bloom Care..." />
      <button v-if="search" @click="search = ''">×</button>
    </section>

    <section v-if="showFilter" class="filter-card">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
      <button :class="{ active: filter === 'subscription' }" @click="filter = 'subscription'">Subscription</button>
      <button :class="{ active: filter === 'single' }" @click="filter = 'single'">Single</button>
      <button :class="{ active: filter === 'wishlist' }" @click="filter = 'wishlist'">Wishlist</button>
    </section>

    <section v-if="loading" class="loading">
      Loading Bloom Care products...
    </section>

    <section v-else-if="filteredProducts.length === 0" class="empty-card">
      <h2>No Bloom Care products found</h2>
      <p>Try another search or filter.</p>
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

          <span class="floating-badge">
            {{ productBadge(product, index) }}
          </span>

          <button class="wish-btn" @click.stop="toggleWish(product.id)">
            {{ wishlist.includes(product.id) ? '♥' : '♡' }}
          </button>
        </div>

        <div class="content">
          <h3>{{ product.name }}</h3>

          <span v-if="hasSubscription(product)" class="sub-pill">
            Monthly Subscription
          </span>

          <p>{{ shortDescription(product.description) }}</p>

          <div class="divider"></div>

          <small class="from">From</small>

          <div class="price-row">
            <strong>RM{{ money(bestPrice(product)) }}</strong>
            <span v-if="hasSubscription(product)">/month</span>
          </div>

          <div class="benefits">
            <span>🚚 Free Delivery</span>
            <span>🎁 Cancel Anytime</span>
          </div>

          <button class="view-btn" @click.stop="openProduct(product.slug)">
            View Plans
          </button>
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
const showFilter = ref(false)
const filter = ref('all')
const search = ref('')
const wishlist = ref(loadWishlist())

onMounted(async () => {
  await loadProducts()
})

watch(
  wishlist,
  () => {
    localStorage.setItem('medieco_bloom_wishlist', JSON.stringify(wishlist.value))
  },
  { deep: true }
)

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase().trim()

  return products.value.filter((product) => {
    const hasSub = hasSubscription(product)

    const matchesSearch =
      !q ||
      String(product.name || '').toLowerCase().includes(q) ||
      String(product.description || '').toLowerCase().includes(q) ||
      String(product.slug || '').toLowerCase().includes(q)

    const matchesFilter =
      filter.value === 'all' ||
      (filter.value === 'subscription' && hasSub) ||
      (filter.value === 'single' && !hasSub) ||
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
  router.push({
    path: `/bloom/${slug}`,
  })
}

function hasSubscription(product) {
  return Boolean(product.allow_12_month || product.allow_6_month)
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
  if (product.allow_12_month) return index === 0 ? 'Best Seller' : 'Best Value'
  if (product.allow_6_month) return 'Popular'
  if (String(product.marketplace_category || '').includes('skin')) return 'Skincare'
  return 'Top Pick'
}

function shortDescription(text) {
  const value = String(text || 'Premium Bloom Care product.')
    .replace(/\s+/g, ' ')
    .trim()

  return value.length > 72 ? `${value.slice(0, 72)}...` : value
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function getProductImage(product) {
  return product.image_url || '/images/product-placeholder.jpg'
}

function toggleWish(id) {
  if (wishlist.value.includes(id)) {
    wishlist.value = wishlist.value.filter((item) => item !== id)
  } else {
    wishlist.value.push(id)
  }
}

function loadWishlist() {
  try {
    const saved = localStorage.getItem('medieco_bloom_wishlist')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}
</script>

<style scoped>
.bloom-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255,199,213,.45), transparent 30%),
    linear-gradient(180deg,#fff7f9 0%,#ffffff 36%,#fff7f9 100%);
  padding: 0 16px 110px;
}

.top-hero {
  margin: 0 -16px;
  padding: 26px 22px 34px;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  gap: 12px;
  align-items: start;
  background:
    radial-gradient(circle at 80% 35%,rgba(255,255,255,.35),transparent 22%),
    linear-gradient(135deg,#fff1f5,#ffffff);
  border-bottom-left-radius: 34px;
  border-bottom-right-radius: 34px;
}

.back-icon,
.cart-btn {
  border: none;
  background: none;
  color: #8b1232;
  cursor: pointer;
}

.back-icon {
  font-size: 34px;
}

.cart-btn {
  position: relative;
  font-size: 28px;
}

.cart-btn span {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #ff4f88;
  color: white;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 900;
}

.top-hero h1 {
  margin: 0;
  color: #8b1232;
  font-size: 34px;
  font-weight: 900;
}

.top-hero p {
  margin-top: 8px;
  color: #475569;
  line-height: 1.45;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22px;
}

.section-head h2 {
  margin: 0;
  color: #8b1232;
  font-size: 26px;
}

.section-head p {
  margin-top: 5px;
  color: #64748b;
}

.filter-btn {
  border: none;
  background: #fff1f2;
  color: #8b1232;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 800;
  box-shadow: 0 6px 20px rgba(122,36,51,.08);
}

.search-card {
  margin-top: 16px;
  background: white;
  border: 1px solid #ffe4e6;
  border-radius: 999px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  box-shadow: 0 10px 24px rgba(122,36,51,.06);
}

.search-card input {
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-weight: 800;
}

.search-card button {
  border: none;
  background: #fff1f2;
  color: #8b1232;
  border-radius: 999px;
  width: 24px;
  height: 24px;
  font-weight: 900;
}

.filter-card {
  margin-top: 14px;
  background: white;
  border-radius: 22px;
  padding: 10px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  box-shadow: 0 10px 24px rgba(122, 36, 51, 0.08);
}

.filter-card button {
  border: none;
  background: #f8fafc;
  color: #64748b;
  border-radius: 999px;
  padding: 9px 12px;
  font-weight: 900;
  white-space: nowrap;
}

.filter-card button.active {
  background: #8b1232;
  color: white;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 14px;
  margin-top: 18px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #ffe4e6;
  box-shadow: 0 12px 30px rgba(15,23,42,.08);
  cursor: pointer;
  height: 100%;
}

.image-wrap {
  position: relative;
  height: 150px;
  background: #fff7f8;
  overflow: hidden;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-badge {
  position: absolute;
  left: 10px;
  top: 10px;
  background: #8b1232;
  color: white;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.wish-btn {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: white;
  color: #8b1232;
  font-size: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 14px;
}

.content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  height: 44px;
  overflow: hidden;
}

.sub-pill {
  align-self: flex-start;
  margin-top: 10px;
  background: #dff7ef;
  color: #0f766e;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.content p {
  margin-top: 10px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
  height: 38px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.divider {
  margin: 12px 0;
  height: 1px;
  background: #eef2f7;
}

.from {
  display: block;
  font-size: 12px;
  font-weight: 800;
}

.price-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.price-row strong {
  color: #8b1232;
  font-size: 30px;
  line-height: 1;
}

.price-row span {
  font-size: 12px;
  font-weight: 800;
}

.benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.benefits span {
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 10px;
  font-weight: 800;
}

.view-btn{
    margin-top:auto;
    width:90%;
    height:35px;

    border:none;
    border-radius:999px;

    background:linear-gradient(90deg,#8b1232,#d6336c);

    color:white;
    font-size:15px;
    font-weight:700;

    transition:.25s;
}

.view-btn:hover{
    transform:translateY(-2px);
    box-shadow:0 10px 20px rgba(139,18,50,.25);
}

.loading {
  padding: 60px 0;
  text-align: center;
}

.empty-card {
  margin-top: 20px;
  background: white;
  padding: 24px;
  border-radius: 24px;
  text-align: center;
}

.empty-card p {
  color: #64748b;
}

@media (max-width:420px) {
  .product-grid {
    gap: 10px;
  }

  .image-wrap {
    height: 140px;
  }

  .content {
    padding: 12px;
  }

  .content h3 {
    font-size: 16px;
    height: 40px;
  }

  .price-row strong {
    font-size: 22px;
  }

  .benefits span {
    font-size: 9px;
  }
}

@media (min-width:860px) {
  .bloom-page {
    width: min(430px,100%);
    max-width: 430px;
    margin: auto;
  }
}
</style>