<template>
  <AdminLayout>
    <section v-if="loading" class="loading">
      Loading admin...
    </section>

    <section v-else-if="!isAdmin" class="blocked">
      <h1>Access denied</h1>
      <p>This area is only for Medieco admin.</p>
      <button @click="$router.push('/home')">Back to App</button>
    </section>

    <section v-else class="dashboard">
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Medieco operations overview</p>
        </div>

        <button class="refresh-btn" @click="loadAdminData">
          Refresh
        </button>
      </div>

      <section class="stats-row">
        <div class="stat-card cyan">
          <div class="icon">🧾</div>
          <div>
            <span>Total Orders</span>
            <strong>{{ stats.totalOrders }}</strong>
          </div>
        </div>

        <div class="stat-card blue">
          <div class="icon">⏳</div>
          <div>
            <span>Pending Payments</span>
            <strong>{{ stats.pendingPayments }}</strong>
          </div>
        </div>

        <div class="stat-card royal">
          <div class="icon">💰</div>
          <div>
            <span>Total Sales</span>
            <strong>RM{{ money(stats.totalSales) }}</strong>
          </div>
        </div>

        <div class="stat-card darkblue">
          <div class="icon">🤝</div>
          <div>
            <span>Affiliates</span>
            <strong>{{ stats.totalAffiliates }}</strong>
          </div>
        </div>
      </section>

      <section class="grid-two">
        <div class="panel">
          <div class="panel-head">
            <h2>Recent Orders</h2>
            <button @click="$router.push('/admin/orders')">View All</button>
          </div>

          <div v-if="recentOrders.length === 0" class="empty">
            No orders yet.
          </div>

          <div v-for="order in recentOrders" :key="order.id" class="list-row">
            <div>
              <strong>{{ order.order_number }}</strong>
              <p>{{ order.customers?.full_name || 'Customer' }}</p>
              <small>{{ formatDate(order.created_at) }}</small>
            </div>

            <div class="right">
              <strong>RM{{ money(order.total_amount) }}</strong>
              <span>{{ formatStatus(order.payment_status) }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Inventory Summary</h2>
            <button @click="$router.push('/admin/inventory')">Inventory</button>
          </div>

          <div class="inventory-summary">
            <div>
              <span>Total Items</span>
              <strong>{{ inventoryStats.totalItems }}</strong>
            </div>

            <div>
              <span>Healthy Stock</span>
              <strong>{{ inventoryStats.healthyStock }}</strong>
            </div>

            <div>
              <span>Low Stock</span>
              <strong>{{ inventoryStats.lowStock }}</strong>
            </div>

            <div>
              <span>Out of Stock</span>
              <strong>{{ inventoryStats.outOfStock }}</strong>
            </div>
          </div>

          <div v-if="lowStockItems.length === 0" class="empty">
            No low stock items.
          </div>

          <div v-for="item in lowStockItems" :key="item.id" class="list-row">
            <div>
              <strong>{{ item.item_name }}</strong>
              <p>{{ item.sku || 'No SKU' }}</p>
            </div>

            <div class="right">
              <strong>{{ item.current_stock }}</strong>
              <span class="danger">
                {{ Number(item.current_stock || 0) <= 0 ? 'Out' : 'Low' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="grid-two">
        <div class="panel">
          <div class="panel-head">
            <h2>Affiliate Overview</h2>
            <button @click="$router.push('/admin/affiliates')">View All</button>
          </div>

          <div v-if="affiliates.length === 0" class="empty">
            No affiliates yet.
          </div>

          <div v-for="affiliate in affiliates" :key="affiliate.id" class="list-row">
            <div>
              <strong>{{ affiliate.referral_code }}</strong>
              <p>{{ affiliate.profiles?.full_name || 'Affiliate' }}</p>
            </div>

            <div class="right">
              <strong>RM{{ money(affiliate.total_commission) }}</strong>
              <span>{{ formatStatus(affiliate.status) }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Quick Actions</h2>
          </div>

          <div class="actions-grid">
            <button @click="$router.push('/admin/orders')">🧾 Orders</button>
            <button @click="$router.push('/admin/products')">🛍 Products</button>
            <button @click="$router.push('/admin/inventory')">📦 Inventory</button>
            <button @click="$router.push('/admin/users')">👥 Users</button>
            <button @click="$router.push('/admin/payment-settings')">💳 Payments</button>
            <button @click="$router.push('/admin/affiliates')">🤝 Affiliates</button>
          </div>
        </div>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { supabase } from '../lib/supabase'
import { profile, loadUser } from '../stores/auth'

const loading = ref(true)

const allOrders = ref([])
const recentOrders = ref([])
const affiliates = ref([])
const inventoryItems = ref([])
const lowStockItems = ref([])

const stats = reactive({
  totalOrders: 0,
  pendingPayments: 0,
  totalSales: 0,
  totalAffiliates: 0,
})

const inventoryStats = reactive({
  totalItems: 0,
  healthyStock: 0,
  lowStock: 0,
  outOfStock: 0,
})

const adminRoles = [
  'admin',
  'master_admin',
  'order_manager',
  'affiliate_manager',
  'support_staff',
  'product_manager',
]

const isAdmin = computed(() =>
  adminRoles.includes(profile.value?.role)
)

onMounted(async () => {
  await loadUser()

  if (isAdmin.value) {
    await loadAdminData()
  }

  loading.value = false
})

async function loadAdminData() {
  await Promise.all([
    loadOrders(),
    loadAffiliates(),
    loadInventoryItems(),
  ])

  calculateStats()
  calculateInventoryStats()
}

async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        full_name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  allOrders.value = data || []
  recentOrders.value = (data || []).slice(0, 10)
}

async function loadAffiliates() {
  const { data, error } = await supabase
    .from('affiliates')
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  affiliates.value = (data || []).slice(0, 10)
  stats.totalAffiliates = data?.length || 0
}

async function loadInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      item_name,
      sku,
      current_stock,
      low_stock_alert,
      is_active
    `)
    .eq('is_active', true)
    .order('current_stock', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  inventoryItems.value = data || []

  lowStockItems.value = (data || [])
    .filter((item) => {
      const stock = Number(item.current_stock || 0)
      const alertLevel = Number(item.low_stock_alert || 0)

      return stock <= alertLevel
    })
    .slice(0, 6)
}

function calculateStats() {
  stats.totalOrders = allOrders.value.length

  stats.pendingPayments = allOrders.value.filter((order) => {
    return order.payment_status !== 'verified'
  }).length

  stats.totalSales = allOrders.value
    .filter((order) => order.payment_status === 'verified')
    .reduce((sum, order) => {
      return sum + Number(order.total_amount || 0)
    }, 0)
}

function calculateInventoryStats() {
  inventoryStats.totalItems = inventoryItems.value.length

  inventoryStats.outOfStock = inventoryItems.value.filter((item) => {
    return Number(item.current_stock || 0) <= 0
  }).length

  inventoryStats.lowStock = inventoryItems.value.filter((item) => {
    const stock = Number(item.current_stock || 0)
    const alertLevel = Number(item.low_stock_alert || 0)

    return stock > 0 && stock <= alertLevel
  }).length

  inventoryStats.healthyStock =
    inventoryStats.totalItems -
    inventoryStats.lowStock -
    inventoryStats.outOfStock
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
.dashboard {
  display: grid;
  gap: 22px;
}

.loading,
.blocked {
  max-width: 720px;
  margin: 80px auto;
  background: white;
  padding: 28px;
  border-radius: 24px;
}

.blocked button,
.refresh-btn,
.panel-head button {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 11px 16px;
  font-weight: 900;
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
  font-size: 30px;
}

.page-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  min-height: 110px;
  color: white;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 84px 1fr;
  overflow: hidden;
}

.stat-card .icon {
  display: grid;
  place-items: center;
  font-size: 32px;
  background: rgba(0, 0, 0, 0.12);
}

.stat-card div:last-child {
  padding: 20px;
}

.stat-card span {
  display: block;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 26px;
}

.cyan {
  background: #0ea5e9;
}

.blue {
  background: #0284c7;
}

.royal {
  background: #2563eb;
}

.darkblue {
  background: #1d4ed8;
}

.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  min-height: 260px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 14px;
}

.panel-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
}

.empty {
  padding: 20px 0;
  color: #64748b;
}

.inventory-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 16px 0;
}

.inventory-summary div {
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px;
}

.inventory-summary span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.inventory-summary strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 20px;
}

.list-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid #eef2f7;
}

.list-row strong {
  color: #0f172a;
}

.list-row p {
  margin: 5px 0;
  color: #64748b;
}

.list-row small {
  color: #94a3b8;
}

.right {
  text-align: right;
}

.right span {
  display: inline-block;
  margin-top: 6px;
  background: #eef6ff;
  color: #1f7ea6;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.right .danger {
  background: #fee2e2;
  color: #991b1b;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.actions-grid button {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  font-weight: 900;
  color: #334155;
}

.actions-grid button:hover {
  background: #eef6ff;
  color: #1f7ea6;
}

@media (max-width: 1100px) {
  .stats-row,
  .grid-two {
    grid-template-columns: 1fr 1fr;
  }

  .inventory-summary {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .page-head,
  .panel-head,
  .list-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-row,
  .grid-two,
  .actions-grid,
  .inventory-summary {
    grid-template-columns: 1fr;
  }

  .right {
    text-align: left;
  }

  .refresh-btn,
  .panel-head button {
    width: 100%;
  }
}
</style>