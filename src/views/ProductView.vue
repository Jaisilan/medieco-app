<template>
  <main class="mobile-shell product-page">
    <section v-if="loading" class="loading">Loading product...</section>

    <section v-else-if="!product" class="empty">
      <button class="back-btn" @click="goBack">← Back</button>
      <h1>Product not found</h1>
    </section>

    <section v-else>
      <header class="top-bar">
        <button class="back-btn" @click="goBack">← Back</button>
        <button class="cart-btn" @click="$router.push('/cart')">🛒</button>
      </header>

      <section class="image-card">
        <img :src="mainImage" :alt="product.name" />
      </section>

      <section class="content-card">
        <div class="badge-row">
          <span class="badge">{{ product.product_badge || categoryLabel(product.marketplace_category) }}</span>
          <span v-if="product.promotion_badge" class="promo-badge">{{ product.promotion_badge }}</span>
        </div>

        <h1>{{ product.name }}</h1>

        <div class="price-row">
          <strong>RM{{ money(product.price) }}</strong>
          <small v-if="product.compare_at_price">RM{{ money(product.compare_at_price) }}</small>
        </div>

        <section class="description-card">
          <div
            class="formatted-description"
            :class="{ collapsed: !descriptionExpanded }"
            v-html="formattedDescription"
          ></div>

          <button
            v-if="hasLongDescription"
            class="read-btn"
            @click="descriptionExpanded = !descriptionExpanded"
          >
            {{ descriptionExpanded ? 'Show Less' : 'Read More' }}
          </button>
        </section>

        <section v-if="outOfStock" class="stock-alert">
          Out of stock
        </section>

        <section class="quantity-card">
          <h2>Quantity</h2>

          <div class="qty-row">
            <button @click="decreaseQty" :disabled="quantity <= 1">−</button>
            <strong>{{ quantity }}</strong>
            <button @click="increaseQty" :disabled="outOfStock">+</button>
          </div>

          <small v-if="product.track_inventory">
            Available stock: {{ product.stock_quantity || 0 }}
          </small>
        </section>

        <section class="summary-card">
          <span>Total</span>
          <strong>RM{{ money(totalPrice) }}</strong>
        </section>

        <button
          class="primary-btn full"
          @click="handleAddToCart"
          :disabled="outOfStock"
        >
          {{ outOfStock ? 'Out of Stock' : 'Add to Cart' }}
        </button>

        <button class="secondary-btn full" @click="$router.push('/cart')">
          View Cart
        </button>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { addToCart } from '../stores/cart'
import { showToast } from '../stores/toast'

const route = useRoute()
const router = useRouter()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const descriptionExpanded = ref(false)

onMounted(async () => {
  await loadProduct()
})

const mainImage = computed(() => {
  return product.value?.image_url || '/images/product-placeholder.jpg'
})

const totalPrice = computed(() => {
  return Number(product.value?.price || 0) * Number(quantity.value || 1)
})

const outOfStock = computed(() => {
  return (
    product.value?.track_inventory &&
    Number(product.value?.stock_quantity || 0) <= 0
  )
})

const hasLongDescription = computed(() => {
  return String(product.value?.description || '').length > 260
})

const formattedDescription = computed(() => {
  const raw = String(product.value?.description || 'No description available.').trim()

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.endsWith(':')) {
        return `<h3>${escapeHtml(line)}</h3>`
      }

      if (line.startsWith('-')) {
        return `<li>${escapeHtml(line.replace(/^-\s*/, ''))}</li>`
      }

      return `<p>${escapeHtml(line)}</p>`
    })
    .join('')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
})

async function loadProduct() {
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', route.params.slug)
    .eq('is_active', true)
    .single()

  if (error) {
    showToast({
      type: 'error',
      title: 'Product Load Failed',
      message: error.message,
    })
  } else {
    product.value = data
  }

  loading.value = false
}

function increaseQty() {
  if (
    product.value?.track_inventory &&
    quantity.value >= Number(product.value?.stock_quantity || 0)
  ) {
    showToast({
      type: 'warning',
      title: 'Stock Limit Reached',
      message: 'Selected quantity exceeds available stock.',
    })
    return
  }

  quantity.value += 1
}

function decreaseQty() {
  if (quantity.value > 1) {
    quantity.value -= 1
  }
}

function handleAddToCart() {
  if (outOfStock.value) {
    showToast({
      type: 'warning',
      title: 'Out of Stock',
      message: 'This product is currently unavailable.',
    })
    return
  }

  addToCart({
    product_id: product.value.id,
    product_slug: product.value.slug,
    product_name: product.value.name,
    image_url: product.value.image_url || '',
    display_scope: 'marketplace',
    plan_type: 'standard',
    plan_label: 'Normal Purchase',
    subscription_months: 0,
    quantity: quantity.value,
    unit_price: Number(product.value.price || 0),
  })

  showToast({
    type: 'success',
    title: 'Added to Cart',
    message: `${product.value.name} has been added to your cart.`,
  })
}

function goBack() {
  router.push('/marketplace')
}

function money(value) {
  return Number(value || 0).toFixed(2)
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
</script>

<style scoped>
.product-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(31, 182, 166, 0.14), transparent 30%),
    linear-gradient(180deg, #eefaf8 0%, #ffffff 42%, #f8fafc 100%);
  padding-bottom: 36px;
}

.loading,
.empty {
  padding: 24px;
  color: #64748b;
}

.top-bar {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn,
.cart-btn {
  border: none;
  background: transparent;
  color: #0f766e;
  font-weight: 900;
}

.cart-btn {
  font-size: 24px;
}

.image-card {
  margin: 0 18px;
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 46px rgba(15, 118, 110, 0.12);
}

.image-card img {
  width: 100%;
  height: 300px;
  object-fit: contain;
}

.content-card {
  padding: 20px 18px 36px;
}

.badge-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge,
.promo-badge {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.badge {
  background: #ecfdf5;
  color: #0f766e;
}

.promo-badge {
  background: #fff1f2;
  color: #9f1239;
}

h1 {
  margin: 14px 0 10px;
  color: #0f172a;
  font-size: 31px;
  line-height: 1.1;
}

.price-row {
  display: flex;
  align-items: end;
  gap: 12px;
  margin-bottom: 18px;
}

.price-row strong {
  color: #0f766e;
  font-size: 38px;
  line-height: 1;
}

.price-row small {
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 900;
  font-size: 18px;
}

.description-card,
.quantity-card,
.summary-card {
  margin-top: 18px;
  background: white;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.formatted-description {
  color: #475569;
  line-height: 1.65;
  max-height: none;
  overflow: hidden;
}

.formatted-description.collapsed {
  max-height: 230px;
}

.formatted-description :deep(h3) {
  margin: 18px 0 8px;
  color: #0f172a;
  font-size: 17px;
}

.formatted-description :deep(p) {
  margin: 0 0 12px;
}

.formatted-description :deep(ul) {
  padding-left: 18px;
  margin: 8px 0 12px;
}

.formatted-description :deep(li) {
  margin-bottom: 8px;
}

.read-btn {
  margin-top: 10px;
  border: none;
  background: transparent;
  color: #0f766e;
  font-weight: 900;
  padding: 0;
}

.stock-alert {
  margin-top: 14px;
  background: #fee2e2;
  color: #991b1b;
  padding: 12px;
  border-radius: 16px;
  font-weight: 900;
  text-align: center;
}

.quantity-card h2 {
  margin: 0 0 14px;
  color: #0f172a;
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ecfdf5;
  border-radius: 999px;
  padding: 10px;
}

.qty-row button {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  background: #0f766e;
  color: white;
  font-size: 24px;
  font-weight: 900;
}

.qty-row button:disabled {
  opacity: 0.5;
}

.qty-row strong {
  font-size: 24px;
  color: #0f766e;
}

.quantity-card small {
  display: block;
  margin-top: 10px;
  color: #64748b;
}

.summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-card span {
  color: #64748b;
  font-weight: 900;
}

.summary-card strong {
  color: #0f766e;
  font-size: 30px;
}

.full {
  width: 100%;
  margin-top: 18px;
}

@media (min-width: 860px) {
  .product-page {
    width: min(430px, 100%);
    max-width: 430px;
    margin: auto;
  }
}
</style>