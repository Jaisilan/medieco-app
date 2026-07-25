<template>
  <main class="mobile-shell bloom-config-page">
    <section v-if="loading" class="loading">
      Loading Bloom Care...
    </section>

    <section v-else-if="!product" class="empty">
      <button class="back-btn" @click="$router.push('/period-box')">← Back</button>
      <h1>Bloom product not found</h1>
    </section>

    <section v-else>
      <section class="hero">
        <button class="back-btn" @click="$router.push('/period-box')">← Back</button>

        <div class="image-card">
          <img :src="mainImage" :alt="product.name" />
        </div>

        <div class="hero-content">
          <span>Bloom Care</span>
          <h1 class="product-title">
  {{ product.name }}
</h1>

          <div class="description-box">

          <div
          class="formatted-description"
          :class="{ collapsed: !descriptionExpanded }"
           v-html="formattedDescription">
        </div>

         <button
          v-if="hasLongDescription"
         @click="descriptionExpanded = !descriptionExpanded">
    {{ descriptionExpanded ? 'Show Less' : 'Read More' }}
  </button>
</div>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>Customize Your Box</h2>
          <small>.</small>
        </div>

        <div
          v-for="item in boxItems"
          :key="item.id"
          class="box-item"
        >
          <div class="item-top">
            <div>
              <strong>{{ item.item_name }}</strong>
              <p v-if="item.item_description">{{ item.item_description }}</p>
            </div>

            <span v-if="item.is_required" class="required">Required</span>
          </div>

          <div
            v-if="item.variants?.length"
            class="variants"
          >
            <button
              v-for="variant in item.variants"
              :key="variant.id"
              :class="{ selected: selectedVariants[item.id] === variant.id }"
              @click="selectedVariants[item.id] = variant.id"
            >
              {{ variant.variant_name }}
            </button>
          </div>

          <div class="qty-control compact">
            <button
              @click="decreaseItemQty(item)"
              :disabled="item.quantity <= item.min_quantity"
            >
              −
            </button>

            <strong>{{ item.quantity }}</strong>

            <button
              @click="increaseItemQty(item)"
              :disabled="item.quantity >= item.max_quantity"
            >
              +
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>Choose Your Plan</h2>
          <small>.</small>
        </div>

        <button
          v-for="plan in availablePlans"
          :key="plan.type"
          :class="['plan-card', { selected: selectedPlan.type === plan.type }]"
          @click="selectPlan(plan)"
        >
          <div>
            <div class="plan-title">
              <strong>{{ plan.label }}</strong>
              <span v-if="plan.badge">{{ plan.badge }}</span>
            </div>

            <p>{{ plan.description }}</p>

            <small v-if="plan.savings > 0">
              Save RM{{ money(plan.savings) }}
            </small>
          </div>

          <div class="plan-price">
            <strong>RM{{ money(plan.price) }}</strong>
            <small v-if="plan.months > 1">/ month</small>
          </div>
        </button>
      </section>

      <section class="card summary-card">
        <h2>Order Summary</h2>

        <div
          v-for="item in selectedBoxItems"
          :key="item.id"
          class="summary-item"
        >
          <div>
            <strong>{{ item.item_name }}</strong>
            <p>
              Qty {{ item.quantity }}
              <span v-if="selectedVariantName(item)">
                · {{ selectedVariantName(item) }}
              </span>
            </p>
          </div>
        </div>

        <div class="price-lines">
          <div>
            <span>Plan</span>
            <strong>{{ selectedPlan.label }}</strong>
          </div>

          <div>
            <span>Pay Now</span>
            <strong>RM{{ money(payNow) }}</strong>
          </div>

          <div>
            <span>Market Value</span>
            <strong>RM{{ money(marketValue) }}</strong>
          </div>

          <div v-if="totalSavings > 0" class="saving">
            <span>You Save</span>
            <strong>RM{{ money(totalSavings) }}</strong>
          </div>
        </div>

        <div v-if="paymentSchedule.length" class="payment-breakdown">
          <h3>Payment Breakdown</h3>

          <div
            v-for="schedule in paymentSchedule"
            :key="schedule.id"
          >
            <span>{{ schedule.label }}</span>
            <strong>RM{{ money(schedule.monthly_amount) }}</strong>
          </div>
        </div>

        <div v-else-if="selectedPlan.months > 1" class="payment-breakdown">
          <h3>Payment Breakdown</h3>

          <div>
            <span>Monthly Payment</span>
            <strong>RM{{ money(selectedPlan.price) }}</strong>
          </div>

          <small>
            {{ selectedPlan.label }} billing for {{ selectedPlan.months }} months.
          </small>
        </div>
      </section>

      <section v-if="outOfStock" class="stock-alert">
        This Bloom Care product is currently out of stock.
      </section>

      <section class="terms-card">
        <label>
          <input type="checkbox" v-model="agreed" />
          I agree to the Bloom Care subscription terms.
        </label>
      </section>

      <section class="bottom-action">
        <button
          class="primary-btn full"
          @click="handleAddToCart"
          :disabled="outOfStock || !agreed"
        >
          {{ outOfStock ? 'Out of Stock' : 'Add to Cart' }}
        </button>
      </section>
    </section>

    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { addToCart } from '../stores/cart'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const product = ref(null)
const boxItems = ref([])
const schedules = ref([])
const descriptionExpanded = ref(false)
const agreed = ref(false)

const selectedVariants = reactive({})

const selectedPlan = reactive({
  type: 'single',
  label: 'Single Purchase',
  months: 1,
  price: 0,
  marketValue: 0,
  badge: '',
  description: 'One-time Bloom Care purchase.',
  savings: 0,
})

onMounted(async () => {
  await loadBloom()
})

const mainImage = computed(() => {
  return product.value?.image_url || '/images/product-placeholder.jpg'
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

      if (
        line.startsWith('-') ||
        /^[🫐🌿🍊🥝💜🌹🍃🍓🔥⭐✅✔•]/u.test(line)
      ) {
        return `<li>${escapeHtml(line.replace(/^[-•✔✅]\s*/, ''))}</li>`
      }

      return `<p>${escapeHtml(line)}</p>`
    })
    .join('')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
})

const selectedBoxItems = computed(() => {
  return boxItems.value.filter((item) => Number(item.quantity || 0) > 0)
})

const availablePlans = computed(() => {
  if (!product.value) return []

  const market = Number(product.value.compare_at_price || product.value.price || 0)

  const plans = [
    {
      type: 'single',
      label: 'Single Purchase',
      months: 1,
      price: Number(product.value.price || 0),
      marketValue: Number(product.value.price || 0),
      badge: '',
      description: 'Pay once. No subscription.',
      savings: 0,
    },
  ]

  if (product.value.allow_6_month && Number(product.value.six_month_price || 0) > 0) {
    const price = Number(product.value.six_month_price || 0)

    plans.push({
      type: 'six_month',
      label: '6-Month Care',
      months: 6,
      price,
      marketValue: market,
      badge: 'Popular',
      description: 'Monthly care plan for 6 months.',
      savings: Math.max(0, market - price),
    })
  }

  if (product.value.allow_12_month && Number(product.value.twelve_month_price || 0) > 0) {
    const price = Number(product.value.twelve_month_price || 0)

    plans.push({
      type: 'twelve_month',
      label: '12-Month Care',
      months: 12,
      price,
      marketValue: market,
      badge: 'Best Value',
      description: 'Best value long-term care plan.',
      savings: Math.max(0, market - price),
    })
  }

  return plans
})

const payNow = computed(() => Number(selectedPlan.price || 0))
const marketValue = computed(() => Number(selectedPlan.marketValue || selectedPlan.price || 0))
const totalSavings = computed(() => Math.max(0, marketValue.value - payNow.value))

const paymentSchedule = computed(() => {
  return schedules.value.filter((item) => item.plan_type === selectedPlan.type)
})

async function loadBloom() {
  loading.value = true

  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', route.params.slug)
      .eq('is_active', true)
      .in('display_scope', ['bloom_care', 'both'])
      .single()

    if (productError) {
      showToast({
        type: 'error',
        title: 'Bloom Product Load Failed',
        message: productError.message,
      })

      product.value = null
      return
    }

    product.value = productData

    await Promise.all([
      loadBoxItems(productData.id),
      loadPaymentSchedules(productData.id),
    ])

    selectPlan(availablePlans.value[0])
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Bloom Care Error',
      message: error.message || 'Unable to load Bloom Care product.',
    })

    product.value = null
  } finally {
    loading.value = false
  }
}

async function loadBoxItems(productId) {
  const { data, error } = await supabase
    .from('bloom_box_items')
    .select(`
      *,
      products:item_product_id (
        id,
        name,
        description,
        image_url
      ),
      variants:bloom_item_variants (
        id,
        variant_name,
        variant_description,
        is_default,
        display_order,
        is_active
      )
    `)
    .eq('box_product_id', productId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    showToast({
      type: 'error',
      title: 'Bloom Items Load Failed',
      message: error.message,
    })
    boxItems.value = []
    return
  }

  if (!data || data.length === 0) {
    boxItems.value = [
      {
        id: product.value.id,
        item_name: product.value.name,
        item_description: '',
        quantity: 1,
        default_quantity: 1,
        min_quantity: 1,
        max_quantity: 10,
        is_required: true,
        variants: [],
      },
    ]
    return
  }

  boxItems.value = data.map((item) => {
    const activeVariants = (item.variants || [])
      .filter((variant) => variant.is_active)
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))

    const defaultVariant =
      activeVariants.find((variant) => variant.is_default) ||
      activeVariants[0]

    if (defaultVariant) {
      selectedVariants[item.id] = defaultVariant.id
    }

    return {
      ...item,
      quantity: Number(item.default_quantity || 0),
      variants: activeVariants,
    }
  })
}

async function loadPaymentSchedules(productId) {
  const { data, error } = await supabase
    .from('bloom_payment_schedules')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    showToast({
      type: 'error',
      title: 'Payment Schedule Load Failed',
      message: error.message,
    })
    schedules.value = []
    return
  }

  schedules.value = data || []
}

function selectPlan(plan) {
  if (!plan) return

  selectedPlan.type = plan.type
  selectedPlan.label = plan.label
  selectedPlan.months = plan.months
  selectedPlan.price = plan.price
  selectedPlan.marketValue = plan.marketValue
  selectedPlan.badge = plan.badge
  selectedPlan.description = plan.description
  selectedPlan.savings = plan.savings || 0
}

function increaseItemQty(item) {
  if (item.quantity >= Number(item.max_quantity || 10)) return
  item.quantity += 1
}

function decreaseItemQty(item) {
  if (item.quantity <= Number(item.min_quantity || 0)) return
  item.quantity -= 1
}

function selectedVariantName(item) {
  const id = selectedVariants[item.id]
  const variant = item.variants?.find((entry) => entry.id === id)
  return variant?.variant_name || ''
}

function handleAddToCart() {
  if (outOfStock.value) {
    showToast({
      type: 'warning',
      title: 'Out of Stock',
      message: 'This Bloom Care product is currently unavailable.',
    })
    return
  }

  if (!agreed.value) {
    showToast({
      type: 'warning',
      title: 'Terms Required',
      message: 'Please agree to the Bloom Care terms before continuing.',
    })
    return
  }

  addToCart({
    product_id: product.value.id,
    product_slug: product.value.slug,
    product_name: product.value.name,
    image_url: product.value.image_url || '',
    display_scope: product.value.display_scope,
    plan_type: selectedPlan.type,
    plan_label: selectedPlan.label,
    subscription_months: selectedPlan.months,
    quantity: 1,
    unit_price: selectedPlan.price,
    bloom_items: selectedBoxItems.value.map((item) => ({
      id: item.id,
      name: item.item_name,
      quantity: item.quantity,
      variant: selectedVariantName(item),
    })),
  })

  showToast({
    type: 'success',
    title: 'Added to Cart',
    message: `${product.value.name} has been added to your cart.`,
  })

  router.push('/cart')
}
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
function money(value) {
  return Number(value || 0).toFixed(2)
}
</script>

<style scoped>
.bloom-config-page {
  min-height: 100vh;
  background: #fff7f9;
  padding-bottom: 120px;
}

.loading,
.empty {
  padding: 24px;
  color: #64748b;
}

.hero {
  background: white;
  border-bottom-left-radius: 34px;
  border-bottom-right-radius: 34px;
  overflow: hidden;
  box-shadow: 0 14px 36px rgba(122, 36, 51, 0.12);
}

.back-btn {
  margin: 18px;
  border: none;
  background: #fff1f2;
  color: #7a2433;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.image-card {
  margin: 0 18px;
  background: #fff7f9;
  border-radius: 28px;
  padding: 26px;
  display: grid;
  place-items: center;
}

.image-card img {
  width: 100%;
  height: 260px;
  object-fit: contain;
}

.hero-content {
  padding: 18px;
}

.hero-content span {
  display: inline-block;
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 900;
}

.hero-content h1 {
  margin: 12px 0 10px;
  color: #7a2433;
  font-size: 30px;
}

.description-box {
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px;
}

.formatted-description {
  color: #475569;
  line-height: 1.65;
  max-height: none;
  overflow: hidden;
}

.formatted-description.collapsed {
  max-height: 180px;
}

.formatted-description :deep(h3) {
  margin: 16px 0 8px;
  color: #0f172a;
  font-size: 16px;
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

.description-box button {
  margin-top: 10px;
  border: none;
  background: transparent;
  color: #7a2433;
  font-weight: 900;
}

.card {
  margin: 18px;
  background: white;
  border-radius: 26px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.section-head h2,
.summary-card h2 {
  margin: 0;
  color: #0f172a;
}

.section-head small {
  color: #94a3b8;
  text-align: right;
}

.box-item {
  border: 1px solid #ffe4e6;
  border-radius: 22px;
  padding: 14px;
  margin-top: 12px;
  background: #fff7f9;
}

.item-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.item-top strong {
  color: #0f172a;
}

.item-top p {
  margin: 5px 0 0;
  color: #64748b;
  line-height: 1.45;
  font-size: 13px;
}

.required {
  background: #dcfce7;
  color: #166534;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 900;
  height: fit-content;
}

.variants {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.variants button {
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 999px;
  padding: 8px 11px;
  font-weight: 900;
  color: #64748b;
}

.variants button.selected {
  border-color: #7a2433;
  background: #ffe4e6;
  color: #9f1239;
}

.qty-control {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  gap: 12px;
  align-items: center;
  background: white;
  border-radius: 999px;
  padding: 10px;
}

.qty-control.compact {
  margin-top: 14px;
}

.qty-control button {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  background: #7a2433;
  color: white;
  font-size: 24px;
  font-weight: 900;
}

.qty-control button:disabled {
  opacity: 0.45;
}

.qty-control strong {
  text-align: center;
  color: #7a2433;
  font-size: 26px;
}

.plan-card {
  width: 100%;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 20px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
}

.plan-card.selected {
  border-color: #7a2433;
  background: #fff1f2;
  box-shadow: 0 10px 22px rgba(122, 36, 51, 0.12);
}

.plan-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-title strong {
  color: #0f172a;
}

.plan-title span {
  background: #dcfce7;
  color: #166534;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 900;
}

.plan-card p {
  margin: 6px 0;
  color: #64748b;
}

.plan-card small {
  color: #0f766e;
  font-weight: 900;
}

.plan-price {
  text-align: right;
  flex-shrink: 0;
}

.plan-price strong {
  display: block;
  color: #7a2433;
  font-size: 24px;
}

.plan-price small {
  color: #64748b;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px;
  margin-top: 10px;
}

.summary-item p {
  margin: 5px 0 0;
  color: #64748b;
}

.price-lines {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.price-lines div,
.payment-breakdown div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.price-lines span,
.payment-breakdown span {
  color: #64748b;
}

.price-lines strong {
  color: #7a2433;
}

.price-lines .saving strong {
  color: #0f766e;
}

.payment-breakdown {
  margin-top: 16px;
  background: #ecfdf5;
  border-radius: 18px;
  padding: 14px;
}

.payment-breakdown h3 {
  margin: 0 0 10px;
  color: #0f172a;
}

.terms-card {
  margin: 18px;
  background: white;
  border-radius: 20px;
  padding: 14px;
  color: #475569;
  font-weight: 800;
}

.terms-card label {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.stock-alert {
  margin: 18px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 18px;
  padding: 14px;
  text-align: center;
  font-weight: 900;
}

.bottom-action {
  position: sticky;
  bottom: 74px;
  background: rgba(255, 247, 249, 0.92);
  backdrop-filter: blur(12px);
  padding: 14px 18px;
}

.full {
  width: 100%;
}

.product-title{
    font-size:30px;
    font-weight:800;
    line-height:1.15;
    color:#7a2433;
    margin-bottom:18px;
}
</style>