<template>
  <main class="mobile-shell affiliate-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/home')">← Back</button>

      <span>Medieco Affiliate</span>
      <h1>Earn with Medieco</h1>
      <p>
        Apply as a Medieco affiliate. Once approved, you will receive your
        unique Affiliate ID and referral link.
      </p>
    </section>

    <section v-if="loading" class="card">
      Loading affiliate profile...
    </section>

    <section v-else-if="affiliate" class="card">
      <div class="status-row">
        <div>
          <small>Status</small>
          <h2>{{ formatStatus(affiliate.status) }}</h2>
        </div>

        <span :class="['status', affiliate.status]">
          {{ formatStatus(affiliate.status) }}
        </span>
      </div>

      <div v-if="affiliate.status === 'pending'" class="note">
        Your affiliate application is pending admin approval.
      </div>

      <div v-else-if="affiliate.status === 'active'" class="affiliate-box">
        <label>Affiliate ID</label>
        <div class="copy-row">
          <strong>{{ affiliate.referral_code }}</strong>
          <button @click="copyText(affiliate.referral_code)">Copy</button>
        </div>

        <label>Referral Link</label>
        <div class="copy-row">
          <strong>{{ referralLink }}</strong>
          <button @click="copyText(referralLink)">Copy</button>
        </div>

        <div class="stats-grid">
          <div>
            <span>Total Sales</span>
            <strong>RM{{ money(affiliate.total_sales) }}</strong>
          </div>

          <div>
            <span>Total Commission</span>
            <strong>RM{{ money(affiliate.total_commission) }}</strong>
          </div>

          <div>
            <span>Pending</span>
            <strong>RM{{ money(pendingCommission) }}</strong>
          </div>

          <div>
            <span>Approved</span>
            <strong>RM{{ money(approvedCommission) }}</strong>
          </div>

          <div>
            <span>Paid</span>
            <strong>RM{{ money(paidCommission) }}</strong>
          </div>

          <div>
            <span>Commission Rate</span>
            <strong>{{ money(affiliate.commission_rate) }}%</strong>
          </div>
        </div>
      </div>

      <div v-else class="note danger">
        Your affiliate account is currently {{ formatStatus(affiliate.status) }}.
      </div>
    </section>

    <section
      v-if="affiliate?.status === 'active'"
      class="card"
    >
      <div class="section-head">
        <h2>Commission History</h2>
        <button @click="loadCommissions">Refresh</button>
      </div>

      <div v-if="commissionsLoading" class="empty">
        Loading commissions...
      </div>

      <div v-else-if="commissions.length === 0" class="empty">
        No commissions yet.
      </div>

      <div
        v-for="commission in commissions"
        :key="commission.id"
        class="commission-card"
      >
        <div>
          <strong>RM{{ money(commission.commission_amount) }}</strong>
          <p>Order Amount: RM{{ money(commission.order_amount) }}</p>
          <small>{{ formatDate(commission.created_at) }}</small>
        </div>

        <span :class="['status', commission.status]">
          {{ formatStatus(commission.status) }}
        </span>
      </div>
    </section>

    <section v-else-if="!affiliate" class="card">
      <h2>Affiliate Application</h2>

      <div class="form-group">
        <label>Full Name</label>
        <input v-model="form.full_name" />
      </div>

      <div class="form-group">
        <label>Phone</label>
        <input v-model="form.phone" />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" />
      </div>

      <div class="form-group">
        <label>Bank Name</label>
        <input v-model="form.bank_name" placeholder="Maybank / CIMB / Public Bank" />
      </div>

      <div class="form-group">
        <label>Bank Account Number</label>
        <input v-model="form.bank_account_number" />
      </div>

      <div class="form-group">
        <label>Account Holder Name</label>
        <input v-model="form.bank_account_holder" />
      </div>

      <button class="primary-btn full" @click="applyAffiliate" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Apply as Affiliate' }}
      </button>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { user, profile, loadUser } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const loading = ref(true)
const submitting = ref(false)
const commissionsLoading = ref(false)

const affiliate = ref(null)
const commissions = ref([])

const form = reactive({
  full_name: '',
  phone: '',
  email: '',
  bank_name: '',
  bank_account_number: '',
  bank_account_holder: '',
})

const referralLink = computed(() => {
  if (!affiliate.value?.referral_code) return ''
  return `https://medieco.my?ref=${affiliate.value.referral_code}`
})

const pendingCommission = computed(() =>
  sumCommissionByStatus('pending')
)

const approvedCommission = computed(() =>
  sumCommissionByStatus('approved')
)

const paidCommission = computed(() =>
  sumCommissionByStatus('paid')
)

onMounted(async () => {
  await loadUser()

  if (!user.value) {
    loading.value = false
    showToast({
      type: 'warning',
      title: 'Login Required',
      message: 'Please login to access the affiliate page.',
    })
    return
  }

  prefillForm()
  await loadAffiliate()
})

function prefillForm() {
  form.full_name = profile.value?.full_name || ''
  form.phone = profile.value?.phone || ''
  form.email = profile.value?.email || user.value?.email || ''
  form.bank_account_holder = profile.value?.full_name || ''
}

async function loadAffiliate() {
  loading.value = true

  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.value.id)
    .maybeSingle()

  if (error) {
    showToast({
      type: 'error',
      title: 'Affiliate Load Failed',
      message: error.message,
    })
  } else {
    affiliate.value = data

    if (data?.status === 'active') {
      await loadCommissions()
    }
  }

  loading.value = false
}

async function loadCommissions() {
  if (!affiliate.value?.id) return

  commissionsLoading.value = true

  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', affiliate.value.id)
    .order('created_at', { ascending: false })

  if (error) {
    showToast({
      type: 'error',
      title: 'Commission Load Failed',
      message: error.message,
    })
  } else {
    commissions.value = data || []
  }

  commissionsLoading.value = false
}

function sumCommissionByStatus(status) {
  return commissions.value
    .filter((item) => item.status === status)
    .reduce((sum, item) => sum + Number(item.commission_amount || 0), 0)
}

function generateReferralCode() {
  const base = String(form.full_name || 'MED')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)

  const random = Math.floor(1000 + Math.random() * 9000)

  return `${base}${random}`
}

async function applyAffiliate() {
  if (!user.value) {
    showToast({
      type: 'warning',
      title: 'Login Required',
      message: 'Please login first.',
    })
    return
  }

  if (!form.full_name || !form.phone || !form.email) {
    showToast({
      type: 'warning',
      title: 'Missing Information',
      message: 'Please complete full name, phone and email.',
    })
    return
  }

  submitting.value = true

  const referralCode = generateReferralCode()
  const link = `https://medieco.my?ref=${referralCode}`

  const { error } = await supabase
    .from('affiliates')
    .insert([
      {
        user_id: user.value.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number,
        bank_account_holder: form.bank_account_holder,
        referral_code: referralCode,
        referral_link: link,
        status: 'pending',
        commission_rate: 3,
        total_sales: 0,
        total_commission: 0,
      },
    ])

  if (error) {
    showToast({
      type: 'error',
      title: 'Application Failed',
      message: error.message,
    })
  } else {
    showToast({
      type: 'success',
      title: 'Application Submitted',
      message: 'Your affiliate application has been submitted for admin approval.',
    })

    await loadAffiliate()
  }

  submitting.value = false
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)

    showToast({
      type: 'success',
      title: 'Copied',
      message: 'Copied to clipboard.',
    })
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Copy Failed',
      message: 'Unable to copy text.',
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
.affiliate-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
}

.back-btn {
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
}

.header span {
  display: inline-block;
  margin-top: 16px;
  background: #ecfdf5;
  color: #0f766e;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.header h1 {
  margin: 14px 0 8px;
  color: #0f172a;
}

.header p {
  color: #64748b;
  line-height: 1.5;
}

.card {
  margin-top: 20px;
  background: white;
  border-radius: 26px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.card h2 {
  margin-top: 0;
  color: #0f172a;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.section-head h2 {
  margin: 0;
}

.section-head button {
  border: none;
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 9px 12px;
  font-weight: 900;
}

.form-group {
  margin-top: 14px;
}

label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-weight: 900;
  font-size: 13px;
}

input {
  width: 100%;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.status-row small {
  color: #64748b;
  font-weight: 900;
}

.status-row h2 {
  margin: 6px 0 0;
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
.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.note {
  margin-top: 16px;
  background: #f8fafc;
  color: #64748b;
  border-radius: 18px;
  padding: 14px;
  line-height: 1.5;
}

.note.danger {
  background: #fee2e2;
  color: #991b1b;
}

.affiliate-box {
  margin-top: 18px;
  display: grid;
  gap: 14px;
}

.copy-row {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.copy-row strong {
  overflow-wrap: anywhere;
  color: #0f172a;
}

.copy-row button {
  border: none;
  background: #0f766e;
  color: white;
  border-radius: 999px;
  padding: 9px 12px;
  font-weight: 900;
}

.stats-grid {
  display: grid;
  gap: 12px;
}

.stats-grid div {
  background: #fff7f9;
  border-radius: 16px;
  padding: 14px;
}

.stats-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.stats-grid strong {
  display: block;
  margin-top: 6px;
  color: #7a2433;
  font-size: 22px;
}

.commission-card {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.commission-card strong {
  color: #7a2433;
}

.commission-card p {
  margin: 5px 0;
  color: #64748b;
}

.commission-card small {
  color: #94a3b8;
}

.empty {
  padding: 18px 0;
  color: #64748b;
}

.full {
  width: 100%;
  margin-top: 20px;
}

@media (max-width: 430px) {
  .status-row,
  .section-head,
  .commission-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>