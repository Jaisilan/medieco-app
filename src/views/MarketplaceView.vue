<template>
  <main class="mobile-shell marketplace">
    <section class="top-hero">
      <button class="back-icon" @click="$router.push('/home')">‹</button>

      <div>
        <h1>Marketplace</h1>
        <p>Essential wellness products from Medieco.</p>
      </div>

      <button class="cart-btn" @click="$router.push('/cart')">🛒</button>
    </section>

    <section class="section-head">
      <div>
        <h2>Shop Products</h2>
        <p>Normal purchase items. No subscription.</p>
      </div>

      <button class="filter-btn" @click="showFilter = !showFilter">
        ⛃ Filter
      </button>
    </section>

    <section class="search-card">
      <span>🔍</span>
      <input v-model="search" placeholder="Search Marketplace..." />
      <button v-if="search" @click="search = ''">×</button>
    </section>

    <section v-if="showFilter" class="filter-card">
      <button :class="{ active: categoryFilter === '' }" @click="categoryFilter = ''">
        All
      </button>

      <button
        v-for="category in categories"
        :key="category.value"
        :class="{ active: categoryFilter === category.value }"
        @click="categoryFilter = category.value"
      >
        {{ category.label }}
      </button>
    </section>

    <section v-if="loading" class="loading">
      Loading marketplace...
    </section>

    <section v-else-if="filteredProducts.length === 0" class="empty-card">
      <h2>No products found</h2>
      <p>Try another search or category.</p>
    </section>

    <section v-else class="product-grid">
      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="openProduct(product.slug)"
      >
        <div class="image-wrap">
          <img :src="getProductImage(product)" :alt="product.name" />

          <span v-if="product.promotion_badge" class="promo-badge">
            {{ product.promotion_badge }}
          </span>
        </div>

        <div class="content">
          <div class="badge-row">
            <span class="badge">
              {{ product.product_badge || categoryLabel(product.marketplace_category) }}
            </span>
          </div>

          <h3>{{ product.name }}</h3>

          <p>{{ shortDescription(product.description) }}</p>

          <div class="divider"></div>

          <div class="price-row">
            <div>
              <small v-if="product.compare_at_price">
                RM{{ money(product.compare_at_price) }}
              </small>

              <strong>RM{{ money(product.price) }}</strong>
            </div>
          </div>

          <button class="view-btn" @click.stop="openProduct(product.slug)">
            View Product
          </button>
        </div>
      </article>
    </section>

    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const products = ref([])
const loading = ref(true)
const search = ref('')
const showFilter = ref(false)
const categoryFilter = ref('')

const categories = [
  { value: 'women_health', label: "Women's Health" },
  { value: 'skincare', label: 'Skincare' },
  { value: 'pain_relief', label: 'Pain Relief' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'hygiene', label: 'Personal Care' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'medical', label: 'Medical Supplies' },
]

onMounted(async () => {
  await loadProducts()
})

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase().trim()

  return products.value.filter((product) => {
    const matchesSearch =
      !q ||
      String(product.name || '').toLowerCase().includes(q) ||
      String(product.description || '').toLowerCase().includes(q) ||
      String(product.slug || '').toLowerCase().includes(q)

    const matchesCategory =
      !categoryFilter.value ||
      product.marketplace_category === categoryFilter.value

    return matchesSearch && matchesCategory
  })
})

async function loadProducts() {
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('allow_6_month', false)
    .eq('allow_12_month', false)
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Marketplace Load Failed',
      message: error.message,
    })
  } else {
    products.value = data || []
  }

  loading.value = false
}

function openProduct(slug) {
  router.push({
    path: `/product/${slug}`,
    query: { from: 'marketplace' },
  })
}

function shortDescription(text) {
  const value = String(text || 'Medieco wellness product.')
    .replace(/\s+/g, ' ')
    .trim()

  return value.length > 72 ? `${value.slice(0, 72)}...` : value
}

function categoryLabel(value) {
  const labels = {
    women_health: 'Feminine Care',
    skincare: 'Skincare',
    pain_relief: 'Pain Relief',
    supplements: 'Supplements',
    vitamins: 'Vitamins',
    hygiene: 'Personal Care',
    accessories: 'Accessories',
    wellness: 'Wellness',
    medical: 'Medical Supplies',
  }

  return labels[value] || 'Essential Care'
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function getProductImage(product) {
  return product.image_url || '/images/product-placeholder.jpg'
}
</script>

<style scoped>
.marketplace {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(31, 182, 166, 0.18), transparent 30%),
    linear-gradient(180deg, #eefaf8 0%, #ffffff 38%, #f8fafc 100%);
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
    radial-gradient(circle at 80% 35%, rgba(255, 255, 255, 0.42), transparent 22%),
    linear-gradient(135deg, #dffcf7, #ffffff);
  border-bottom-left-radius: 34px;
  border-bottom-right-radius: 34px;
}

.back-icon,
.cart-btn {
  border: none;
  background: transparent;
  color: #0f766e;
  cursor: pointer;
}

.back-icon {
  font-size: 34px;
}

.cart-btn {
  font-size: 28px;
}

.top-hero h1 {
  margin: 0;
  color: #0f766e;
  font-size: 34px;
  font-weight: 900;
}

.top-hero p {
  margin-top: 8px;
  color: #475569;
  line-height: 1.45;
}

.section-head {
  margin-top: 22px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.section-head h2 {
  margin: 0;
  color: #0f766e;
  font-size: 26px;
}

.section-head p {
  margin: 5px 0 0;
  color: #64748b;
}

.filter-btn {
  border: none;
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 900;
  box-shadow: 0 6px 20px rgba(15, 118, 110, 0.08);
}

.search-card {
  margin-top: 16px;
  background: white;
  border: 1px solid #ccfbf1;
  border-radius: 999px;
  padding: 11px 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  box-shadow: 0 10px 24px rgba(15, 118, 110, 0.06);
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
  background: #ecfdf5;
  color: #0f766e;
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
  box-shadow: 0 10px 24px rgba(15, 118, 110, 0.08);
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
  background: #0f766e;
  color: white;
}

.product-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #ccfbf1;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  height: 100%;
}

.image-wrap {
  position: relative;
  height: 150px;
  background: #ecfdf5;
  overflow: hidden;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promo-badge {
  position: absolute;
  left: 10px;
  top: 10px;
  background: #0f766e;
  color: white;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 14px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-block;
  background: #ecfdf5;
  color: #0f766e;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.content h3 {
  margin: 10px 0 0;
  color: #111827;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  height: 44px;
  overflow: hidden;
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

.price-row {
  margin-top: 2px;
}

.price-row small {
  display: block;
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 800;
  font-size: 12px;
}

.price-row strong {
  display: block;
  color: #0f766e;
  font-size: 26px;
  line-height: 1;
}

.view-btn {
  width: 100%;
  margin-top: auto;
  border: none;
  border-radius: 999px;
  padding: 12px;
  background: linear-gradient(135deg, #0f766e, #1fb6a6);
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #64748b;
}

.empty-card {
  margin-top: 20px;
  background: white;
  padding: 24px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.empty-card p {
  color: #64748b;
}

@media (max-width: 420px) {
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
}

@media (min-width: 860px) {
  .marketplace {
    width: min(430px, 100%);
    max-width: 430px;
    margin: auto;
  }
}
</style>