<template>
  <main class="mobile-shell tracking-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/home')">← Back</button>
      <h1>Order Tracking</h1>
      <p>Track your Bloom Care and Marketplace orders.</p>
    </section>

    <section v-if="loading" class="empty">
      Loading your orders...
    </section>

    <section v-else-if="orders.length === 0" class="empty-card">
      <h2>No orders yet</h2>
      <p>Your orders will appear here after checkout.</p>

      <button class="primary-btn full" @click="$router.push('/period-box')">
        Browse Bloom Care
      </button>

      <button class="secondary-btn full" @click="$router.push('/marketplace')">
        Browse Marketplace
      </button>
    </section>

    <section v-else class="orders-list">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-head">
          <div>
            <span>Order</span>
            <h2>{{ order.order_number }}</h2>
          </div>

          <strong>RM{{ money(order.total_amount) }}</strong>
        </div>

        <div class="status-grid">
          <div>
            <label>Payment</label>
            <p>{{ formatStatus(order.payment_status) }}</p>
          </div>

          <div>
            <label>Order</label>
            <p>{{ formatStatus(order.order_status) }}</p>
          </div>
        </div>

        <div class="timeline">
          <div :class="['step', isStepActive(order, 'pending_payment') && 'active']">
            <span></span>
            <p>Pending</p>
          </div>

          <div :class="['step', isStepActive(order, 'confirmed') && 'active']">
            <span></span>
            <p>Confirmed</p>
          </div>

          <div :class="['step', isStepActive(order, 'processing') && 'active']">
            <span></span>
            <p>Processing</p>
          </div>

          <div :class="['step', isStepActive(order, 'delivered') && 'active']">
            <span></span>
            <p>Delivered</p>
          </div>
        </div>

        <section class="items-card">
          <h3>Items</h3>

          <div
            v-for="item in order.order_items"
            :key="item.id"
            class="item-row"
          >
            <div>
              <strong>{{ item.product_name }}</strong>
              <p>
                Qty: {{ item.quantity }}
                · Unit: RM{{ money(item.unit_price) }}
                · Plan: {{ formatStatus(item.subscription_plan || 'single') }}
              </p>

              <small v-if="item.subscription_months > 1">
                {{ item.subscription_months }} months subscription
              </small>
            </div>

            <strong>RM{{ money(item.total_price) }}</strong>
          </div>
        </section>

        <section class="summary-card">
          <div class="summary-row">
            <span>Subtotal</span>
            <strong>RM{{ money(order.subtotal) }}</strong>
          </div>

          <div class="summary-row">
            <span>Delivery</span>
            <strong>RM{{ money(order.delivery_fee) }}</strong>
          </div>

          <div class="summary-row total">
            <span>Total</span>
            <strong>RM{{ money(order.total_amount) }}</strong>
          </div>
        </section>

        <section v-if="order.tracking_number || order.courier_name" class="tracking-card">
          <h3>Delivery Tracking</h3>

          <div class="track-row">
            <span>Courier</span>
            <strong>{{ order.courier_name || '-' }}</strong>
          </div>

          <div class="track-row">
            <span>Tracking No.</span>
            <strong>{{ order.tracking_number || '-' }}</strong>
          </div>

          <a
            v-if="order.tracking_url"
            class="track-btn"
            :href="order.tracking_url"
            target="_blank"
          >
            Open Courier Tracking
          </a>
        </section>

        <small class="date">
          Ordered on {{ formatDate(order.created_at) }}
        </small>
      </article>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { user, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const loading = ref(true)
const orders = ref([])

onMounted(async () => {
  await loadUser()

  if (!user.value) {
    loading.value = false

    showToast({
      type: 'warning',
      title: 'Login Required',
      message: 'Please login to view your orders.',
    })

    return
  }

  await loadOrders()
})

async function loadOrders() {
  loading.value = true

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers!inner (
        id,
        user_id,
        full_name
      ),
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price,
        subscription_plan,
        subscription_months
      )
    `)
    .eq('customers.user_id', user.value.id)
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Orders Load Failed',
      message: error.message,
    })
  } else {
    orders.value = data || []
  }

  loading.value = false
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(value) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isStepActive(order, step) {
  const flow = [
    'pending_payment',
    'payment_submitted',
    'confirmed',
    'processing',
    'delivered',
  ]

  const currentIndex = flow.indexOf(order.order_status)
  const stepIndex = flow.indexOf(step)

  return currentIndex >= stepIndex
}
</script>

<style scoped>
.tracking-page {
  background: #f8fafc;
  min-height: 100vh;
  padding: 20px;
}

.header h1 {
  margin: 14px 0 6px;
  color: #0f172a;
}

.header p {
  color: #64748b;
}

.back-btn {
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: #64748b;
}

.empty-card,
.order-card {
  background: white;
  border-radius: 26px;
  padding: 18px;
  margin-top: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.empty-card p {
  color: #64748b;
}

.empty-card button + button {
  margin-top: 12px;
}

.orders-list {
  display: grid;
  gap: 18px;
}

.order-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.order-head span {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.order-head h2 {
  margin: 5px 0 0;
  font-size: 18px;
  color: #0f172a;
}

.order-head strong {
  color: #7a2433;
  font-size: 22px;
}

.status-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.status-grid div {
  background: #f8fafc;
  border-radius: 18px;
  padding: 13px;
}

label {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.status-grid p {
  margin: 6px 0 0;
  color: #0f172a;
  font-weight: 900;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 18px;
}

.step {
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 900;
}

.step span {
  display: block;
  width: 16px;
  height: 16px;
  margin: 0 auto 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.step.active {
  color: #0f766e;
}

.step.active span {
  background: #1fb6a6;
}

.items-card,
.tracking-card,
.summary-card {
  margin-top: 16px;
  background: #f8fafc;
  border-radius: 20px;
  padding: 14px;
}

.items-card h3,
.tracking-card h3 {
  margin: 0 0 10px;
}

.item-row,
.track-row,
.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  padding: 10px 0;
}

.item-row p {
  margin: 5px 0;
  color: #64748b;
}

.item-row small,
.item-row span,
.track-row span,
.summary-row span {
  color: #64748b;
}

.summary-row.total {
  color: #7a2433;
  font-size: 18px;
}

.track-btn {
  display: block;
  margin-top: 12px;
  text-align: center;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 13px;
  font-weight: 900;
}

.date {
  display: block;
  margin-top: 14px;
  color: #94a3b8;
}

.full {
  width: 100%;
}

@media (max-width: 520px) {
  .order-head,
  .item-row,
  .track-row,
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>