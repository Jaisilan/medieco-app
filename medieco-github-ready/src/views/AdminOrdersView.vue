<template>
  <AdminLayout>
    <section class="orders-page">
      <div class="page-head">
        <div>
          <h1>Order Management</h1>
          <p>Prioritise payment verification, processing and delivery updates.</p>
        </div>

        <button class="refresh-btn" @click="loadOrders">
          Refresh
        </button>
      </div>

      <section class="stats-grid">
        <div class="stat-card high">
          <span>Payment Submitted</span>
          <strong>{{ stats.paymentSubmitted }}</strong>
        </div>

        <div class="stat-card">
          <span>Pending Payment</span>
          <strong>{{ stats.pendingPayment }}</strong>
        </div>

        <div class="stat-card">
          <span>Processing</span>
          <strong>{{ stats.processing }}</strong>
        </div>

        <div class="stat-card">
          <span>Total Revenue</span>
          <strong>RM{{ money(stats.totalRevenue) }}</strong>
        </div>
      </section>

      <section class="panel">
        <div class="tabs">
          <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
            All
          </button>

          <button :class="{ active: activeTab === 'payment_submitted' }" @click="activeTab = 'payment_submitted'">
            Payment Submitted
          </button>

          <button :class="{ active: activeTab === 'pending_payment' }" @click="activeTab = 'pending_payment'">
            Pending
          </button>

          <button :class="{ active: activeTab === 'processing' }" @click="activeTab = 'processing'">
            Processing
          </button>

          <button :class="{ active: activeTab === 'delivered' }" @click="activeTab = 'delivered'">
            Delivered
          </button>

          <button :class="{ active: activeTab === 'cancelled' }" @click="activeTab = 'cancelled'">
            Cancelled
          </button>
        </div>

        <div class="filters">
          <input
            v-model="search"
            placeholder="Search order, customer, phone..."
          />

          <select v-model="paymentFilter">
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div v-if="loading" class="empty">
          Loading orders...
        </div>

        <div v-else-if="filteredOrders.length === 0" class="empty">
          No orders found.
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Flags</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="order in filteredOrders" :key="order.id">
                <td>
                  <span :class="['priority', priorityClass(order)]">
                    {{ priorityLabel(order) }}
                  </span>
                </td>

                <td>
                  <strong>{{ order.order_number }}</strong>
                </td>

                <td>
                  <div class="customer-cell">
                    <strong>{{ order.customers?.full_name || 'Customer' }}</strong>
                    <small>{{ order.customers?.phone || '-' }}</small>
                  </div>
                </td>

                <td>
                  <span :class="['pill', paymentClass(order.payment_status)]">
                    {{ formatStatus(order.payment_status) }}
                  </span>
                </td>

                <td>
                  <span class="pill neutral">
                    {{ formatStatus(order.order_status) }}
                  </span>
                </td>

                <td>
                  <strong>RM{{ money(order.total_amount) }}</strong>
                </td>

                <td>{{ formatDate(order.created_at) }}</td>

                <td>
                  <div class="flag-list">
                    <span v-if="order.inventory_deducted">Stock</span>
                    <span v-if="order.affiliate_commission_created">Commission</span>
                    <span v-if="order.tracking_number">Tracking</span>
                    <span v-if="!order.inventory_deducted && !order.affiliate_commission_created && !order.tracking_number">-</span>
                  </div>
                </td>

                <td>
                  <button class="view-btn" @click="$router.push(`/admin/orders/${order.id}`)">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const loading = ref(true)
const orders = ref([])
const search = ref('')
const activeTab = ref('all')
const paymentFilter = ref('all')

onMounted(async () => {
  await loadOrders()
})

const stats = computed(() => {
  return {
    paymentSubmitted: orders.value.filter((o) => o.payment_status === 'submitted').length,
    pendingPayment: orders.value.filter((o) => o.payment_status === 'pending').length,
    processing: orders.value.filter((o) => o.order_status === 'processing').length,
    totalRevenue: orders.value
      .filter((o) => o.payment_status === 'verified')
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
  }
})

const filteredOrders = computed(() => {
  const keyword = search.value.toLowerCase().trim()

  return orders.value.filter((order) => {
    const matchesSearch =
      !keyword ||
      String(order.order_number || '').toLowerCase().includes(keyword) ||
      String(order.customers?.full_name || '').toLowerCase().includes(keyword) ||
      String(order.customers?.phone || '').toLowerCase().includes(keyword) ||
      String(order.customers?.email || '').toLowerCase().includes(keyword)

    const matchesTab =
      activeTab.value === 'all' || order.order_status === activeTab.value

    const matchesPayment =
      paymentFilter.value === 'all' || order.payment_status === paymentFilter.value

    return matchesSearch && matchesTab && matchesPayment
  })
})

async function loadOrders() {
  loading.value = true

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      payment_status,
      order_status,
      inventory_deducted,
      affiliate_commission_created,
      tracking_number,
      created_at,
      customers (
        full_name,
        phone,
        email
      )
    `)
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

function priorityLabel(order) {
  if (order.payment_status === 'submitted') return 'High'
  if (order.order_status === 'processing') return 'Medium'
  if (order.payment_status === 'pending') return 'Normal'
  if (order.order_status === 'delivered') return 'Done'
  if (order.order_status === 'cancelled') return 'Closed'
  return 'Normal'
}

function priorityClass(order) {
  if (order.payment_status === 'submitted') return 'high'
  if (order.order_status === 'processing') return 'medium'
  if (order.order_status === 'delivered') return 'done'
  if (order.order_status === 'cancelled') return 'closed'
  return 'normal'
}

function paymentClass(value) {
  if (value === 'verified') return 'success'
  if (value === 'submitted') return 'warning'
  if (value === 'rejected') return 'danger'
  return 'neutral'
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
.orders-page {
  display: grid;
  gap: 22px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.page-head h1 {
  margin: 0;
  color: #111827;
}

.page-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.refresh-btn {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 900;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.stat-card.high strong {
  color: #991b1b;
}

.stat-card span {
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 28px;
}

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 18px;
}

.tabs {
  display: flex;
  gap: 18px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.tabs button {
  border: none;
  background: transparent;
  padding: 12px 0;
  font-weight: 900;
  color: #64748b;
  white-space: nowrap;
}

.tabs .active {
  color: #2563eb;
  border-bottom: 3px solid #2563eb;
}

.filters {
  margin-top: 18px;
  display: flex;
  gap: 12px;
}

.filters input,
.filters select {
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 11px;
}

.filters input {
  min-width: 280px;
}

.empty {
  padding: 24px 0;
  color: #64748b;
}

.table-wrap {
  margin-top: 20px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

th {
  background: #f8fafc;
  text-align: left;
  padding: 14px;
  font-size: 13px;
  color: #334155;
}

td {
  padding: 14px;
  border-bottom: 1px solid #eef2f7;
  color: #334155;
}

.customer-cell strong {
  display: block;
  color: #0f172a;
}

.customer-cell small {
  color: #64748b;
}

.priority,
.pill,
.flag-list span {
  display: inline-block;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
}

.priority.high {
  background: #fee2e2;
  color: #991b1b;
}

.priority.medium {
  background: #fef3c7;
  color: #92400e;
}

.priority.normal,
.pill.neutral {
  background: #eef6ff;
  color: #1f7ea6;
}

.priority.done,
.pill.success {
  background: #dcfce7;
  color: #166534;
}

.priority.closed,
.pill.danger {
  background: #e5e7eb;
  color: #374151;
}

.pill.warning {
  background: #fef3c7;
  color: #92400e;
}

.flag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.flag-list span {
  background: #f1f5f9;
  color: #475569;
}

.view-btn {
  border: none;
  background: #7a2433;
  color: white;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .page-head,
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .filters,
  .filters input,
  .filters select,
  .refresh-btn {
    width: 100%;
  }
}
</style>