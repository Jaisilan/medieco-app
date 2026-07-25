<template>
  <AdminLayout>
    <section class="inventory-page">
      <div class="page-head">
        <div>
          <h1>Inventory Management</h1>
          <p>Track product stock, cost value and inventory movement.</p>
        </div>

        <button class="refresh-btn" @click="loadInventory">
          Refresh
        </button>
      </div>

      <section class="stats-grid">
        <div class="stat-card">
          <span>Total Items</span>
          <strong>{{ inventoryStats.totalItems }}</strong>
        </div>

        <div class="stat-card">
          <span>Inventory Value</span>
          <strong>RM{{ money(inventoryStats.totalValue) }}</strong>
        </div>

        <div class="stat-card warning">
          <span>Low Stock</span>
          <strong>{{ inventoryStats.lowStock }}</strong>
        </div>

        <div class="stat-card danger">
          <span>Out of Stock</span>
          <strong>{{ inventoryStats.outOfStock }}</strong>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Product Stock</h2>

          <div class="filters">
            <input v-model="search" placeholder="Search product, SKU..." />

            <select v-model="stockFilter">
              <option value="all">All Stock</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="empty">
          Loading inventory...
        </div>

        <div v-else-if="filteredItems.length === 0" class="empty">
          No inventory items found.
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Low Alert</th>
                <th>Cost</th>
                <th>Value</th>
                <th>Status</th>
                <th>Adjustment</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td>
                  <div class="product-cell">
                    <strong>{{ item.item_name }}</strong>
                    <small>{{ item.category || 'Uncategorised' }}</small>
                  </div>
                </td>

                <td>{{ item.sku || '-' }}</td>

                <td>
                  <strong>{{ item.current_stock }}</strong>
                </td>

                <td>{{ item.low_stock_alert }}</td>

                <td>RM{{ money(item.cost_price) }}</td>

                <td>RM{{ money(itemValue(item)) }}</td>

                <td>
                  <span :class="stockClass(item)">
                    {{ stockLabel(item) }}
                  </span>
                </td>

                <td>
                  <div class="adjust-row">
                    <input
                      type="number"
                      v-model="adjustments[item.id]"
                      placeholder="+10 / -5"
                    />

                    <button @click="adjustStock(item)">
                      Apply
                    </button>
                  </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { supabase } from '../lib/supabase'
import { user, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'

const loading = ref(true)
const items = ref([])
const search = ref('')
const stockFilter = ref('all')
const adjustments = reactive({})

onMounted(async () => {
  await loadUser()
  await loadInventory()
})

const inventoryStats = computed(() => {
  const totalItems = items.value.length

  const totalValue = items.value.reduce((sum, item) => {
    return sum + itemValue(item)
  }, 0)

  const lowStock = items.value.filter((item) => {
    const stock = Number(item.current_stock || 0)
    const alert = Number(item.low_stock_alert || 0)
    return stock > 0 && stock <= alert
  }).length

  const outOfStock = items.value.filter((item) => {
    return Number(item.current_stock || 0) <= 0
  }).length

  return {
    totalItems,
    totalValue,
    lowStock,
    outOfStock,
  }
})

const filteredItems = computed(() => {
  const keyword = search.value.toLowerCase().trim()

  return items.value.filter((item) => {
    const matchesSearch =
      !keyword ||
      String(item.item_name || '').toLowerCase().includes(keyword) ||
      String(item.sku || '').toLowerCase().includes(keyword)

    const stock = Number(item.current_stock || 0)
    const alert = Number(item.low_stock_alert || 0)

    let matchesStock = true

    if (stockFilter.value === 'healthy') {
      matchesStock = stock > alert
    }

    if (stockFilter.value === 'low') {
      matchesStock = stock > 0 && stock <= alert
    }

    if (stockFilter.value === 'out') {
      matchesStock = stock <= 0
    }

    return matchesSearch && matchesStock
  })
})

async function loadInventory() {
  loading.value = true

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('item_name', { ascending: true })

  if (error) {
    showToast({
      type: 'error',
      title: 'Inventory Load Failed',
      message: error.message,
    })
  } else {
    items.value = data || []
  }

  loading.value = false
}

function itemValue(item) {
  return Number(item.current_stock || 0) * Number(item.cost_price || 0)
}

function stockLabel(item) {
  const stock = Number(item.current_stock || 0)
  const alert = Number(item.low_stock_alert || 0)

  if (stock <= 0) return 'Out of Stock'
  if (stock <= alert) return 'Low Stock'
  return 'Healthy'
}

function stockClass(item) {
  const stock = Number(item.current_stock || 0)
  const alert = Number(item.low_stock_alert || 0)

  if (stock <= 0) return 'status out'
  if (stock <= alert) return 'status low'
  return 'status good'
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

async function adjustStock(item) {
  const quantity = Number(adjustments[item.id] || 0)

  if (!quantity) {
    showToast({
      type: 'warning',
      title: 'Adjustment Required',
      message: 'Enter a positive number for stock in or negative number for stock out.',
    })
    return
  }

  const previousStock = Number(item.current_stock || 0)
  const newStock = previousStock + quantity

  if (newStock < 0) {
    showToast({
      type: 'warning',
      title: 'Invalid Stock',
      message: 'Stock cannot go below zero.',
    })
    return
  }

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id)

  if (updateError) {
    showToast({
      type: 'error',
      title: 'Stock Update Failed',
      message: updateError.message,
    })
    return
  }

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert([
      {
        inventory_item_id: item.id,
        movement_type: quantity > 0 ? 'stock_in' : 'stock_out',
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reference_type: 'manual',
        notes: 'Manual stock adjustment from admin inventory page',
        created_by: user.value?.id || null,
      },
    ])

  if (movementError) {
    showToast({
      type: 'error',
      title: 'Movement Log Failed',
      message: movementError.message,
    })
    return
  }

  await createAdminNotification(item, quantity, previousStock, newStock)

  adjustments[item.id] = ''

  showToast({
    type: 'success',
    title: 'Stock Updated',
    message: `${item.item_name} stock changed from ${previousStock} to ${newStock}.`,
  })

  await loadInventory()
}

async function createAdminNotification(item, quantity, previousStock, newStock) {
  let title = quantity > 0 ? 'Stock Added' : 'Stock Reduced'
  let message = `${item.item_name}: ${previousStock} → ${newStock}`

  if (newStock <= 0) {
    title = 'Inventory Out of Stock'
    message = `${item.item_name} is now out of stock.`
  } else if (newStock <= Number(item.low_stock_alert || 0)) {
    title = 'Inventory Low Stock'
    message = `${item.item_name} stock is low. Remaining: ${newStock}`
  }

  await supabase
    .from('notifications')
    .insert([
      {
        type: 'inventory',
        title,
        message,
        related_id: item.id,
        is_read: false,
      },
    ])
}
</script>

<style scoped>
.inventory-page {
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

.stat-card span {
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  color: #0f172a;
}

.stat-card.warning strong {
  color: #92400e;
}

.stat-card.danger strong {
  color: #991b1b;
}

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 18px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.panel-head h2 {
  margin: 0;
  color: #0f172a;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters input,
.filters select {
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 11px;
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
  min-width: 1050px;
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

.product-cell strong {
  display: block;
  color: #0f172a;
}

.product-cell small {
  color: #64748b;
}

.status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status.good {
  background: #dcfce7;
  color: #166534;
}

.status.low {
  background: #fef3c7;
  color: #92400e;
}

.status.out {
  background: #fee2e2;
  color: #991b1b;
}

.adjust-row {
  display: grid;
  grid-template-columns: 110px 80px;
  gap: 8px;
}

.adjust-row input {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 10px;
}

.adjust-row button {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 10px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .page-head,
  .panel-head {
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

  .filters {
    flex-direction: column;
  }
}
</style>