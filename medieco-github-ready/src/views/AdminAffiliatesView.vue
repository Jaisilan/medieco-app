<template>
  <main class="admin-page">
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p>Medieco Admin</p>
          <h1>Affiliate Management</h1>
        </div>

        <button @click="$router.push('/admin')">← Dashboard</button>
      </header>

      <section class="stats-grid">
        <div class="stat-card">
          <span>Total Affiliates</span>
          <strong>{{ affiliates.length }}</strong>
        </div>

        <div class="stat-card">
          <span>Pending Affiliates</span>
          <strong>{{ countByStatus('pending') }}</strong>
        </div>

        <div class="stat-card">
          <span>Active Affiliates</span>
          <strong>{{ countByStatus('active') }}</strong>
        </div>

        <div class="stat-card">
          <span>Pending Commission</span>
          <strong>RM{{ money(pendingCommissionTotal) }}</strong>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Affiliate Applications</h2>
          <button @click="loadAllData">Refresh</button>
        </div>

        <div class="filters">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
          <button :class="{ active: filter === 'pending' }" @click="filter = 'pending'">Pending</button>
          <button :class="{ active: filter === 'active' }" @click="filter = 'active'">Active</button>
          <button :class="{ active: filter === 'suspended' }" @click="filter = 'suspended'">Suspended</button>
          <button :class="{ active: filter === 'terminated' }" @click="filter = 'terminated'">Terminated</button>
        </div>

        <div v-if="loading" class="empty">Loading affiliates...</div>

        <div v-else-if="filteredAffiliates.length === 0" class="empty">
          No affiliates found.
        </div>

        <div
          v-for="affiliate in filteredAffiliates"
          :key="affiliate.id"
          class="affiliate-card"
        >
          <div class="top-row">
            <div>
              <h3>{{ affiliate.full_name || affiliate.profiles?.full_name || 'Affiliate' }}</h3>
              <p>{{ affiliate.email || affiliate.profiles?.email }}</p>
              <small>{{ affiliate.phone || '-' }}</small>
            </div>

            <span :class="['status', affiliate.status]">
              {{ formatStatus(affiliate.status) }}
            </span>
          </div>

          <div class="detail-grid">
            <div>
              <label>Affiliate ID</label>
              <p>{{ affiliate.referral_code || '-' }}</p>
            </div>

            <div>
            <label>Commission Rate</label>
            <div class="rate-edit">
            <input
             type="number"
             step="0.1"
             min="0"
             v-model="affiliate.commission_rate"
             />
    <button @click="updateCommissionRate(affiliate)">
      Save
    </button>
  </div>
</div>

            <div>
              <label>Total Sales</label>
              <p>RM{{ money(affiliate.total_sales) }}</p>
            </div>

            <div>
              <label>Total Commission</label>
              <p>RM{{ money(affiliate.total_commission) }}</p>
            </div>

            <div>
              <label>Bank Name</label>
              <p>{{ affiliate.bank_name || '-' }}</p>
            </div>

            <div>
              <label>Bank Account</label>
              <p>{{ affiliate.bank_account_number || '-' }}</p>
            </div>

            <div class="full-row">
              <label>Account Holder</label>
              <p>{{ affiliate.bank_account_holder || '-' }}</p>
            </div>

            <div class="full-row">
              <label>Referral Link</label>
              <p>{{ affiliate.referral_link || '-' }}</p>
            </div>
          </div>

          <div class="actions">
            <button
              v-if="affiliate.status === 'pending'"
              class="approve-btn"
              @click="updateAffiliateStatus(affiliate, 'active')"
            >
              Approve
            </button>

            <button
              v-if="affiliate.status === 'active'"
              class="suspend-btn"
              @click="updateAffiliateStatus(affiliate, 'suspended')"
            >
              Suspend
            </button>

            <button
              v-if="affiliate.status === 'suspended'"
              class="approve-btn"
              @click="updateAffiliateStatus(affiliate, 'active')"
            >
              Reactivate
            </button>

            <button
              v-if="affiliate.status !== 'terminated'"
              class="terminate-btn"
              @click="updateAffiliateStatus(affiliate, 'terminated')"
            >
              Terminate
            </button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Affiliate Commissions</h2>
          <button @click="loadCommissions">Refresh</button>
        </div>

        <div class="filters">
          <button :class="{ active: commissionFilter === 'all' }" @click="commissionFilter = 'all'">All</button>
          <button :class="{ active: commissionFilter === 'pending' }" @click="commissionFilter = 'pending'">Pending</button>
          <button :class="{ active: commissionFilter === 'approved' }" @click="commissionFilter = 'approved'">Approved</button>
          <button :class="{ active: commissionFilter === 'paid' }" @click="commissionFilter = 'paid'">Paid</button>
          <button :class="{ active: commissionFilter === 'cancelled' }" @click="commissionFilter = 'cancelled'">Cancelled</button>
        </div>

        <div v-if="commissionsLoading" class="empty">
          Loading commissions...
        </div>

        <div v-else-if="filteredCommissions.length === 0" class="empty">
          No commissions found.
        </div>

        <div
          v-for="item in filteredCommissions"
          :key="item.id"
          class="commission-card"
        >
          <div class="top-row">
            <div>
              <h3>{{ item.affiliates?.full_name || 'Affiliate' }}</h3>
              <p>Affiliate ID: {{ item.affiliates?.referral_code || '-' }}</p>
              <small>{{ formatDate(item.created_at) }}</small>
            </div>

            <span :class="['status', item.status]">
              {{ formatStatus(item.status) }}
            </span>
          </div>

          <div class="detail-grid">
            <div>
              <label>Order Amount</label>
              <p>RM{{ money(item.order_amount) }}</p>
            </div>

            <div>
              <label>Commission</label>
              <p>RM{{ money(item.commission_amount) }}</p>
            </div>

            <div>
              <label>Rate</label>
              <p>{{ money(item.commission_rate) }}%</p>
            </div>

            <div>
              <label>Customer ID</label>
              <p>{{ item.customer_id || '-' }}</p>
            </div>

            <div class="full-row">
              <label>Order ID</label>
              <p>{{ item.order_id || '-' }}</p>
            </div>
          </div>

          <div class="actions">
            <button
              v-if="item.status === 'pending'"
              class="approve-btn"
              @click="updateCommissionStatus(item, 'approved')"
            >
              Approve Commission
            </button>

            <button
              v-if="item.status === 'approved'"
              class="paid-btn"
              @click="updateCommissionStatus(item, 'paid')"
            >
              Mark Paid
            </button>

            <button
              v-if="item.status !== 'paid' && item.status !== 'cancelled'"
              class="terminate-btn"
              @click="updateCommissionStatus(item, 'cancelled')"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { user, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'

const loading = ref(true)
const commissionsLoading = ref(true)

const affiliates = ref([])
const commissions = ref([])

const filter = ref('all')
const commissionFilter = ref('all')

onMounted(async () => {
  await loadUser()
  await loadAllData()
})

async function loadAllData() {
  await Promise.all([
    loadAffiliates(),
    loadCommissions(),
  ])
}

async function loadAffiliates() {
  loading.value = true

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
    alert(error.message)
  } else {
    affiliates.value = data || []
  }

  loading.value = false
}

async function loadCommissions() {
  commissionsLoading.value = true

  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select(`
      *,
      affiliates (
        full_name,
        referral_code
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    alert(error.message)
  } else {
    commissions.value = data || []
  }

  commissionsLoading.value = false
}

const filteredAffiliates = computed(() => {
  if (filter.value === 'all') return affiliates.value
  return affiliates.value.filter((item) => item.status === filter.value)
})

const filteredCommissions = computed(() => {
  if (commissionFilter.value === 'all') return commissions.value
  return commissions.value.filter((item) => item.status === commissionFilter.value)
})

const pendingCommissionTotal = computed(() => {
  return commissions.value
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0)
})

function countByStatus(status) {
  return affiliates.value.filter((item) => item.status === status).length
}

async function updateAffiliateStatus(affiliate, status) {
  const confirmText = `Change affiliate status to ${status}?`
  if (!confirm(confirmText)) return

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'active') {
    updates.approved_at = new Date().toISOString()
    updates.approved_by = user.value?.id || null
  }

  if (status === 'suspended') {
    updates.suspended_at = new Date().toISOString()
  }

  if (status === 'terminated') {
    updates.terminated_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('id', affiliate.id)

  if (error) {
    alert(error.message)
  } else {
    alert('Affiliate updated.')
    await loadAffiliates()
  }
}

async function updateCommissionStatus(item, status) {
  const confirmText = `Change commission status to ${status}?`
  if (!confirm(confirmText)) return

  const updates = {
    status,
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }

  if (status === 'paid') {
    updates.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('affiliate_commissions')
    .update(updates)
    .eq('id', item.id)

  if (error) {
    alert(error.message)
  } else {
    alert('Commission updated.')
    await loadCommissions()
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

async function updateCommissionRate(affiliate) {
  const rate = Number(affiliate.commission_rate || 0)

  if (rate < 0) {
    showToast({
      type: 'warning',
      title: 'Invalid Rate',
      message: 'Commission rate cannot be below 0%.',
    })
    return
  }

  const { error } = await supabase
    .from('affiliates')
    .update({
      commission_rate: rate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Commission Update Failed',
      message: error.message,
    })
    return
  }

  showToast({
    type: 'success',
    title: 'Commission Updated',
    message: `${affiliate.full_name || 'Affiliate'} commission is now ${money(rate)}%.`,
  })

  await loadAffiliates()
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f6f8fb;
  padding: 24px;
}

.admin-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-header {
  background: linear-gradient(135deg, #0f766e, #1f7ea6);
  color: white;
  border-radius: 28px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.admin-header p {
  margin: 0;
  opacity: 0.85;
}

.admin-header h1 {
  margin: 6px 0 0;
}

.admin-header button,
.panel-head button {
  border: none;
  background: white;
  color: #0f766e;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.stat-card,
.panel {
  background: white;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.stat-card span {
  color: #64748b;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  color: #0f172a;
}

.panel {
  margin-top: 18px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-head h2 {
  margin: 0;
}

.filters {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filters button {
  border: none;
  background: #f1f5f9;
  color: #334155;
  border-radius: 999px;
  padding: 9px 13px;
  font-weight: 900;
}

.filters .active {
  background: #0f766e;
  color: white;
}

.empty {
  color: #64748b;
  padding: 20px 0;
}

.affiliate-card,
.commission-card {
  margin-top: 18px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 18px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.top-row h3 {
  margin: 0;
  color: #0f172a;
}

.top-row p {
  margin: 6px 0;
  color: #64748b;
}

.top-row small {
  color: #94a3b8;
}

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.active,
.status.approved,
.status.paid {
  background: #dcfce7;
  color: #166534;
}

.status.suspended,
.status.terminated,
.status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.detail-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.full-row {
  grid-column: 1 / -1;
}

label {
  display: block;
  margin-bottom: 6px;
  color: #334155;
  font-weight: 900;
  font-size: 13px;
}

.detail-grid p {
  margin: 0;
  background: white;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  padding: 13px;
  color: #64748b;
  overflow-wrap: anywhere;
}

.actions {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.actions button {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 900;
  color: white;
}

.approve-btn {
  background: #0f766e;
}

.suspend-btn {
  background: #f59e0b;
}

.paid-btn {
  background: #2563eb;
}

.terminate-btn {
  background: #991b1b;
}

@media (max-width: 760px) {
  .admin-header,
  .panel-head,
  .top-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .admin-header button,
  .panel-head button,
  .actions button {
    width: 100%;
  }
}

.rate-edit {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.rate-edit input {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  padding: 12px;
  font-weight: 900;
}

.rate-edit button {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 14px;
  padding: 0 14px;
  font-weight: 900;
}
</style>