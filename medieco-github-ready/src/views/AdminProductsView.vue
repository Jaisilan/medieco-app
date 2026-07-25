<template>
  <AdminLayout>
    <section class="products-page">
      <div class="page-head">
        <div>
          <h1>Products & Services</h1>
          <p>Manage Marketplace, Bloom Care and subscription products.</p>
        </div>

        <div class="head-actions">
          <label class="csv-btn" :class="{ disabled: importing }">
            {{ importing ? 'Importing...' : 'CSV Upload' }}
            <input
              type="file"
              accept=".csv"
              @change="handleCsvUpload"
              hidden
              :disabled="importing"
            />
          </label>

          <button class="new-btn" @click="$router.push('/admin/products/new')">
            + New Product
          </button>
        </div>
      </div>

      <section class="stats-grid">
        <div class="stat-card">
          <span>Total Products</span>
          <strong>{{ productStats.total }}</strong>
        </div>

        <div class="stat-card">
          <span>Marketplace</span>
          <strong>{{ productStats.marketplace }}</strong>
        </div>

        <div class="stat-card">
          <span>Bloom Care</span>
          <strong>{{ productStats.bloomCare }}</strong>
        </div>

        <div class="stat-card danger">
          <span>Low / Out Stock</span>
          <strong>{{ productStats.lowStock }}</strong>
        </div>
      </section>

      <section class="panel">
        <div class="tabs">
          <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">All</button>
          <button :class="{ active: activeTab === 'marketplace' }" @click="activeTab = 'marketplace'">Marketplace</button>
          <button :class="{ active: activeTab === 'bloom_care' }" @click="activeTab = 'bloom_care'">Bloom Care</button>
          <button :class="{ active: activeTab === 'both' }" @click="activeTab = 'both'">Both</button>
        </div>

        <div class="filters">
          <div>
            <label>Search</label>
            <input v-model="search" placeholder="Search name, SKU or slug..." />
          </div>

          <div>
            <label>Category</label>
            <select v-model="categoryFilter">
              <option value="">All</option>
              <option value="women_health">Women's Health</option>
              <option value="personal_care">Personal Care</option>
              <option value="supplements">Supplements</option>
              <option value="skincare">Skincare</option>
              <option value="wellness">Wellness</option>
              <option value="promotions">Promotions</option>
            </select>
          </div>

          <div>
             <label>Status</label>
             <select v-model="statusFilter">
             <option value="all">All Products</option>
             <option value="active">Active</option>
             <option value="inactive">Inactive</option>
             </select>
             </div>

          <button class="search-btn" @click="loadProducts">🔍</button>
        </div>

        <div v-if="loading" class="empty">Loading products...</div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Scope</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Sale Price</th>
                <th>Purchase</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="product in filteredProducts" :key="product.id">
                <td>
                  <div class="product-cell">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.name"
                    />
                    <div v-else class="no-image">📦</div>

                    <div>
                      <strong>{{ product.name }}</strong>
                      <small>{{ product.slug }}</small>
                    </div>
                  </div>
                </td>

                <td>{{ product.sku || '-' }}</td>
                <td>{{ scopeLabel(product.display_scope) }}</td>
                <td>{{ categoryLabel(product.marketplace_category) }}</td>

                <td>
                  <span :class="stockClass(product)">
                    {{ product.stock_quantity ?? 0 }}
                  </span>
                </td>

                <td>RM{{ money(product.price) }}</td>
                <td>RM{{ money(product.purchase_price) }}</td>

                <td>
                  <span :class="marginClass(product)">
                    {{ calculateMargin(product) }}%
                  </span>
                </td>

                <td>
                  <span :class="product.is_active ? 'status active' : 'status inactive'">
                    {{ product.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>

                <td>{{ formatDate(product.created_at) }}</td>

                <td>
                  <div class="action-group">
                    <button class="view-btn" @click="$router.push(`/admin/products/${product.id}`)">
                      View
                    </button>

                    <button
                      :class="product.is_active ? 'disable-btn' : 'enable-btn'"
                      @click="toggleProductStatus(product)"
                    >
                      {{ product.is_active ? 'Disable' : 'Enable' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredProducts.length === 0" class="empty">
            No products found.
          </div>
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
const importing = ref(false)

const products = ref([])
const activeTab = ref('all')
const search = ref('')
const categoryFilter = ref('')
const statusFilter = ref('all')

onMounted(async () => {
  await loadProducts()
})

const productStats = computed(() => {
  const all = products.value

  return {
    total: all.length,
    marketplace: all.filter((p) => p.display_scope === 'marketplace').length,
    bloomCare: all.filter((p) => p.display_scope === 'bloom_care').length,
    lowStock: all.filter((p) => Number(p.stock_quantity || 0) <= 5).length,
  }
})

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const q = search.value.toLowerCase().trim()

    const matchesSearch =
      !q ||
      product.name?.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q) ||
      product.slug?.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && product.is_active) ||
      (statusFilter.value === 'inactive' && !product.is_active)

    const matchesTab =
      activeTab.value === 'all' || product.display_scope === activeTab.value

    const matchesCategory =
      !categoryFilter.value || product.marketplace_category === categoryFilter.value

    return matchesSearch && matchesTab && matchesCategory && matchesStatus
  })
})

async function loadProducts() {
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Products Load Failed',
      message: error.message,
    })
  } else {
    products.value = data || []
  }

  loading.value = false
}

async function toggleProductStatus(product) {
  const newStatus = !product.is_active

  const { error } = await supabase
    .from('products')
    .update({
      is_active: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', product.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Update Failed',
      message: error.message,
    })
    return
  }

  showToast({
    type: 'success',
    title: newStatus ? 'Product Enabled' : 'Product Disabled',
    message: `${product.name} has been updated.`,
  })

  await createAdminNotification({
    type: 'product',
    title: newStatus ? 'Product enabled' : 'Product disabled',
    message: product.name,
    related_id: product.id,
  })

  await loadProducts()
}

async function handleCsvUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importing.value = true

  try {
    const text = await file.text()
    const rows = text.split('\n').filter(Boolean)

    if (rows.length < 2) {
      showToast({
        type: 'warning',
        title: 'CSV Empty',
        message: 'The uploaded CSV does not contain product rows.',
      })
      importing.value = false
      event.target.value = ''
      return
    }

    const headers = rows[0].split(',').map((h) => h.trim())

    const payload = rows.slice(1).map((row) => {
      const values = row.split(',').map((v) => v.trim())
      const item = {}

      headers.forEach((header, index) => {
        item[header] = values[index] || ''
      })

      return {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        display_scope: item.display_scope || 'marketplace',
        marketplace_category: item.marketplace_category || null,
        description: item.description || '',
        price: Number(item.price || 0),
        compare_at_price: Number(item.compare_at_price || 0),
        purchase_price: Number(item.purchase_price || 0),
        stock_quantity: Number(item.stock_quantity || 0),
        image_url: item.image_url || '',
        is_active: item.is_active !== 'false',
      }
    })

    const validPayload = payload.filter((item) => item.name && item.slug)

    if (validPayload.length === 0) {
      showToast({
        type: 'warning',
        title: 'Invalid CSV',
        message: 'CSV must include at least product name and slug.',
      })
      importing.value = false
      event.target.value = ''
      return
    }

    const { error } = await supabase
      .from('products')
      .upsert(validPayload, { onConflict: 'slug' })

    if (error) throw error

    showToast({
      type: 'success',
      title: 'CSV Imported',
      message: `${validPayload.length} products imported successfully.`,
    })

    await createAdminNotification({
      type: 'product',
      title: 'CSV products imported',
      message: `${validPayload.length} products were imported.`,
      related_id: null,
    })

    await loadProducts()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'CSV Import Failed',
      message: error.message || 'Unable to import products.',
    })
  }

  importing.value = false
  event.target.value = ''
}

async function createAdminNotification({ type, title, message, related_id }) {
  await supabase
    .from('notifications')
    .insert([
      {
        type,
        title,
        message,
        related_id,
        is_read: false,
      },
    ])
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function scopeLabel(value) {
  if (value === 'bloom_care') return 'Bloom Care'
  if (value === 'both') return 'Both'
  return 'Marketplace'
}

function categoryLabel(value) {
  const labels = {
    women_health: "Women's Health",
    personal_care: 'Personal Care',
    supplements: 'Supplements',
    skincare: 'Skincare',
    wellness: 'Wellness',
    promotions: 'Promotions',
  }

  return labels[value] || '-'
}

function calculateMargin(product) {
  const price = Number(product.price || 0)
  const purchase = Number(product.purchase_price || 0)

  if (!price || !purchase) return 0

  return (((price - purchase) / price) * 100).toFixed(1)
}

function stockClass(product) {
  const stock = Number(product.stock_quantity || 0)

  if (stock <= 0) return 'stock out'
  if (stock <= 5) return 'stock low'

  return 'stock healthy'
}

function marginClass(product) {
  const margin = Number(calculateMargin(product))

  if (margin <= 0) return 'margin bad'
  if (margin < 20) return 'margin warning'

  return 'margin good'
}
</script>

<style scoped>
.products-page {
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

.head-actions {
  display: flex;
  gap: 10px;
}

.new-btn,
.csv-btn {
  border: none;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  padding: 12px 18px;
  font-weight: 900;
  cursor: pointer;
}

.csv-btn {
  background: #0f766e;
}

.csv-btn.disabled {
  opacity: 0.65;
  pointer-events: none;
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

.stat-card.danger strong {
  color: #991b1b;
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
}

.tabs button {
  border: none;
  background: transparent;
  padding: 12px 0;
  font-weight: 900;
  color: #64748b;
}

.tabs .active {
  color: #2563eb;
  border-bottom: 3px solid #2563eb;
}

.filters {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: wrap;
}

.filters label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 900;
}

.filters input,
.filters select {
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 11px;
  min-width: 180px;
}

.toggle {
  background: #f1f5f9;
  border-radius: 999px;
  padding: 12px 14px;
  display: flex !important;
  gap: 8px;
  align-items: center;
  margin-bottom: 0 !important;
}

.search-btn {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 999px;
  width: 42px;
  height: 42px;
}

.table-wrap {
  margin-top: 22px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1250px;
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

.product-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.product-cell img,
.no-image {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  background: #e5e7eb;
}

.no-image {
  display: grid;
  place-items: center;
}

.product-cell strong {
  display: block;
}

.product-cell small {
  color: #64748b;
}

.status,
.stock,
.margin {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status.active,
.stock.healthy,
.margin.good {
  background: #dcfce7;
  color: #166534;
}

.stock.low,
.margin.warning {
  background: #fef3c7;
  color: #92400e;
}

.status.inactive,
.stock.out,
.margin.bad {
  background: #fee2e2;
  color: #991b1b;
}

.action-group {
  display: flex;
  gap: 8px;
}

.view-btn,
.disable-btn,
.enable-btn {
  border: 1px solid #dbe2ea;
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 900;
}

.disable-btn {
  color: #991b1b;
}

.enable-btn {
  color: #0f766e;
}

.empty {
  padding: 24px 0;
  color: #64748b;
}

@media (max-width: 760px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .head-actions,
  .new-btn,
  .csv-btn {
    width: 100%;
  }

  .new-btn,
  .csv-btn {
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>