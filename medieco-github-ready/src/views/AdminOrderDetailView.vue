<template>
  <AdminLayout>
    <section class="order-detail-page">
      <div class="page-head">
        <div>
          <button class="back-btn" @click="$router.push('/admin/orders')">
            ← Back to Orders
          </button>

          <h1>Order Detail</h1>
          <p v-if="order">{{ order.order_number }}</p>
        </div>

        <button class="refresh-btn" @click="loadOrder">
          Refresh
        </button>
      </div>

      <section v-if="loading" class="panel empty">
        Loading order...
      </section>

      <section v-else-if="!order" class="panel empty">
        Order not found.
      </section>

      <section v-else class="detail-grid">
        <div class="main-column">
          <section class="panel">
            <div class="order-top">
              <div>
                <span class="eyebrow">Order</span>
                <h2>{{ order.order_number }}</h2>
                <p>{{ formatDate(order.created_at) }}</p>
              </div>

              <div class="amount">
                <span>Total</span>
                <strong>RM{{ money(order.total_amount) }}</strong>
              </div>
            </div>

            <div class="status-grid">
              <div>
                <label>Payment Status</label>
                <select v-model="form.payment_status">
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label>Order Status</label>
                <select v-model="form.order_status">
                  <option value="pending_payment">Pending Payment</option>
                  <option value="payment_submitted">Payment Submitted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div class="quick-actions">
              <button @click="approvePayment" :disabled="saving || order.payment_status === 'verified'">
                Approve Payment
              </button>

              <button @click="markProcessing" :disabled="saving">
                Mark Processing
              </button>

              <button @click="markDelivered" :disabled="saving">
                Mark Delivered
              </button>
            </div>
          </section>

          <section class="panel">
            <h2>Items</h2>

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

          <section class="panel">
            <h2>Delivery</h2>

            <div class="form-grid">
              <div>
                <label>Courier Name</label>
                <input v-model="form.courier_name" placeholder="J&T / PosLaju / NinjaVan" />
              </div>

              <div>
                <label>Tracking Number</label>
                <input v-model="form.tracking_number" placeholder="Tracking number" />
              </div>

              <div class="full">
                <label>Tracking URL</label>
                <input v-model="form.tracking_url" placeholder="https://..." />
              </div>
            </div>

            <a
              v-if="form.tracking_url"
              class="track-btn"
              :href="form.tracking_url"
              target="_blank"
            >
              Open Tracking
            </a>
          </section>
        </div>

        <aside class="side-column">
          <section class="panel">
            <h2>Customer</h2>

            <div class="info-list">
              <div>
                <span>Name</span>
                <strong>{{ order.customers?.full_name || '-' }}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{{ order.customers?.phone || '-' }}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{{ order.customers?.email || '-' }}</strong>
              </div>
            </div>
          </section>

          <section class="panel">
            <h2>Address</h2>

            <p class="address">
              <strong>{{ order.customers?.full_name || '-' }}</strong><br />
              {{ order.customers?.phone || '-' }}<br />
              {{ order.customers?.address_line_1 || '' }}<br />
              <span v-if="order.customers?.address_line_2">
                {{ order.customers.address_line_2 }}<br />
              </span>
              {{ order.customers?.postcode || '' }} {{ order.customers?.city || '' }}<br />
              {{ order.customers?.state || '' }}
            </p>
          </section>

          <section class="panel">
            <h2>Summary</h2>

            <div class="summary-row">
              <span>Subtotal</span>
              <strong>RM{{ money(order.subtotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>Delivery</span>
              <strong>RM{{ money(order.delivery_fee) }}</strong>
            </div>

            <div class="summary-row">
              <span>Discount</span>
              <strong>RM{{ money(order.discount) }}</strong>
            </div>

            <div class="summary-row total">
              <span>Total</span>
              <strong>RM{{ money(order.total_amount) }}</strong>
            </div>
          </section>

          <section class="panel">
            <h2>System Flags</h2>

            <div class="flag-list">
              <span :class="{ active: order.inventory_deducted }">
                Stock {{ order.inventory_deducted ? 'Deducted' : 'Not Deducted' }}
              </span>

              <span :class="{ active: order.affiliate_commission_created }">
                Commission {{ order.affiliate_commission_created ? 'Created' : 'Not Created' }}
              </span>
            </div>
          </section>

          <button class="save-btn" @click="saveOrder" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Order' }}
          </button>
        </aside>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const order = ref(null)

const form = reactive({
  payment_status: '',
  order_status: '',
  courier_name: '',
  tracking_number: '',
  tracking_url: '',
})

onMounted(async () => {
  await loadOrder()
})

async function loadOrder() {
  loading.value = true

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
      id,
      user_id,
      full_name,
      phone,
      email,
      address_line_1,
      address_line_2,
      postcode,
      city,
      state
      ),
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price,
        subscription_plan,
        subscription_months
      )
    `)
    .eq('id', route.params.id)
    .single()

  if (error) {
    showToast({
      type: 'error',
      title: 'Order Load Failed',
      message: error.message,
    })

    order.value = null
  } else {
    order.value = data
    syncForm()
  }

  loading.value = false
}

function syncForm() {
  form.payment_status = order.value?.payment_status || 'pending'
  form.order_status = order.value?.order_status || 'pending_payment'
  form.courier_name = order.value?.courier_name || ''
  form.tracking_number = order.value?.tracking_number || ''
  form.tracking_url = order.value?.tracking_url || ''
}

async function approvePayment() {
  form.payment_status = 'verified'
  form.order_status = 'confirmed'
  await saveOrder()
}

async function markProcessing() {
  form.order_status = 'processing'
  await saveOrder()
}

async function markDelivered() {
  form.order_status = 'delivered'
  await saveOrder()
}

async function saveOrder() {
  if (!order.value) return

  saving.value = true

  const updates = {
    payment_status: form.payment_status,
    order_status: form.order_status,
    courier_name: form.courier_name,
    tracking_number: form.tracking_number,
    tracking_url: form.tracking_url,
    updated_at: new Date().toISOString(),
  }

  if (form.order_status === 'delivered' && !order.value.delivered_at) {
    updates.delivered_at = new Date().toISOString()
  }

  if (form.payment_status === 'verified') {
    if (!order.value.inventory_deducted) {
      const deducted = await deductInventory(order.value)
      if (!deducted) {
        saving.value = false
        return
      }

      updates.inventory_deducted = true
    }

    if (order.value.affiliate_id && !order.value.affiliate_commission_created) {
      const commissionCreated = await createAffiliateCommission(order.value)

      if (!commissionCreated) {
        saving.value = false
        return
      }

      updates.affiliate_commission_created = true
    }
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', order.value.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Order Update Failed',
      message: error.message,
    })

    saving.value = false
    return
  }

  await createAdminNotification({
    type: 'order',
    title: 'Order Updated',
    message: `${order.value.order_number} updated to ${formatStatus(form.order_status)}.`,
    related_id: order.value.id,
  })

  await createCustomerNotification(order.value)

  showToast({
    type: 'success',
    title: 'Order Updated',
    message: `${order.value.order_number} has been saved.`,
  })

  await loadOrder()
  saving.value = false
}

async function deductInventory(orderData) {
  for (const item of orderData.order_items || []) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock_quantity, track_inventory')
      .eq('id', item.product_id)
      .single()

    if (productError) {
      showToast({
        type: 'error',
        title: 'Product Load Failed',
        message: productError.message,
      })
      return false
    }

    if (!product?.track_inventory) continue

    const currentStock = Number(product.stock_quantity || 0)
    const deductQty = Number(item.quantity || 0)
    const newStock = currentStock - deductQty

    if (newStock < 0) {
      showToast({
        type: 'warning',
        title: 'Insufficient Stock',
        message: `${product.name}: current ${currentStock}, required ${deductQty}.`,
      })
      return false
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.product_id)

    if (updateError) {
      showToast({
        type: 'error',
        title: 'Stock Deduction Failed',
        message: updateError.message,
      })
      return false
    }

    await createAdminNotification({
      type: 'inventory',
      title: newStock <= 0 ? 'Product Out of Stock' : 'Inventory Deducted',
      message: `${product.name}: ${currentStock} → ${newStock}`,
      related_id: item.product_id,
    })
  }

  return true
}

async function createAffiliateCommission(orderData) {
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status, commission_rate, total_sales, total_commission')
    .eq('id', orderData.affiliate_id)
    .single()

  if (affiliateError) {
    showToast({
      type: 'error',
      title: 'Affiliate Load Failed',
      message: affiliateError.message,
    })
    return false
  }

  if (!affiliate || affiliate.status !== 'active') {
    showToast({
      type: 'warning',
      title: 'Affiliate Inactive',
      message: 'Commission was not created because affiliate is inactive.',
    })
    return true
  }

  const orderAmount = Number(orderData.total_amount || 0)
  const commissionRate = Number(orderData.commission_rate || affiliate.commission_rate || 3)
  const commissionAmount = Number(
    orderData.commission_amount || orderAmount * (commissionRate / 100)
  )

  const { error: commissionError } = await supabase
    .from('affiliate_commissions')
    .insert([
      {
        affiliate_id: affiliate.id,
        customer_id: orderData.customer_id,
        order_id: orderData.id,
        order_amount: orderAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
      },
    ])

  if (commissionError) {
    showToast({
      type: 'error',
      title: 'Commission Creation Failed',
      message: commissionError.message,
    })
    return false
  }

  const { error: updateAffiliateError } = await supabase
    .from('affiliates')
    .update({
      total_sales: Number(affiliate.total_sales || 0) + orderAmount,
      total_commission: Number(affiliate.total_commission || 0) + commissionAmount,
    })
    .eq('id', affiliate.id)

  if (updateAffiliateError) {
    showToast({
      type: 'error',
      title: 'Affiliate Update Failed',
      message: updateAffiliateError.message,
    })
    return false
  }

  await createAdminNotification({
    type: 'commission',
    title: 'Affiliate Commission Created',
    message: `RM${money(commissionAmount)} commission created for ${orderData.order_number}.`,
    related_id: orderData.id,
  })

  return true
}

async function createAdminNotification({ type, title, message, related_id }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: null,
        type,
        title,
        message,
        is_read: false,
      },
    ])
    .select()

  console.log('Admin notification:', data, error)

  if (error) {
    showToast({
      type: 'error',
      title: 'Admin Notification Failed',
      message: error.message,
    })
  }
}

async function createCustomerNotification(orderData) {
  const customerUserId = orderData.customers?.user_id

  if (!customerUserId) {
    showToast({
      type: 'warning',
      title: 'Customer Missing',
      message: 'Customer user ID is missing. Notification was not sent.',
    })
    return
  }

  let title = 'Order Updated'
  let message = `${orderData.order_number} has been updated.`

  if (form.payment_status === 'verified') {
    title = 'Payment Verified'
    message = `Payment for ${orderData.order_number} has been verified.`
  }

  if (form.order_status === 'processing') {
    title = 'Order Processing'
    message = `${orderData.order_number} is now being prepared.`
  }

  if (form.tracking_number) {
    title = 'Order Shipped'
    message = `Tracking Number: ${form.tracking_number}`
  }

  if (form.order_status === 'delivered') {
    title = 'Order Delivered'
    message = `${orderData.order_number} has been delivered.`
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: customerUserId,
        title,
        message,
        type: 'order',
        is_read: false,
      },
    ])
    .select()

  console.log('Customer notification:', data, error)

  if (error) {
    showToast({
      type: 'error',
      title: 'Customer Notification Failed',
      message: error.message,
    })
  }
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
</script>

<style scoped>
.order-detail-page {
  display: grid;
  gap: 22px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.back-btn {
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
  padding: 0;
}

.page-head h1 {
  margin: 12px 0 4px;
  color: #111827;
}

.page-head p {
  margin: 0;
  color: #64748b;
}

.refresh-btn,
.save-btn,
.quick-actions button,
.track-btn {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 900;
}

.panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.empty {
  color: #64748b;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 18px;
}

.main-column,
.side-column {
  display: grid;
  gap: 18px;
}

.order-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.order-top h2 {
  margin: 6px 0;
  color: #0f172a;
}

.order-top p {
  margin: 0;
  color: #94a3b8;
}

.amount {
  text-align: right;
}

.amount span {
  color: #64748b;
  font-weight: 900;
}

.amount strong {
  display: block;
  margin-top: 8px;
  color: #7a2433;
  font-size: 28px;
}

.status-grid,
.form-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.full {
  grid-column: 1 / -1;
}

label {
  display: block;
  margin-bottom: 6px;
  color: #334155;
  font-weight: 900;
  font-size: 13px;
}

input,
select {
  width: 100%;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
}

.quick-actions {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-actions button:first-child {
  background: #7a2433;
}

.quick-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #eef2f7;
  padding: 12px 0;
}

.item-row p {
  margin: 5px 0;
  color: #64748b;
}

.item-row small {
  color: #94a3b8;
}

.track-btn {
  display: block;
  text-align: center;
  margin-top: 14px;
}

.info-list {
  display: grid;
  gap: 12px;
}

.info-list span,
.summary-row span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.info-list strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
}

.address {
  color: #334155;
  line-height: 1.7;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #eef2f7;
}

.summary-row.total {
  color: #7a2433;
  font-size: 18px;
}

.flag-list {
  display: grid;
  gap: 10px;
}

.flag-list span {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 12px;
  font-weight: 900;
}

.flag-list span.active {
  background: #dcfce7;
  color: #166534;
}

.save-btn {
  width: 100%;
  background: #7a2433;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .page-head,
  .order-top,
  .item-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .amount {
    text-align: left;
  }

  .refresh-btn,
  .quick-actions button {
    width: 100%;
  }
}
</style>