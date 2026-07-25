<template>
  <main class="admin-page">
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p>Medieco Admin</p>
          <h1>Payment Settings</h1>
        </div>

        <button @click="$router.push('/admin')">← Dashboard</button>
      </header>

      <section class="panel">
        <div class="panel-head">
          <h2>Manual Payment Details</h2>
          <button @click="loadSettings">Refresh</button>
        </div>

        <div v-if="loading" class="empty">
          Loading settings...
        </div>

        <div v-else class="settings-form">
          <div class="form-group">
            <label>Payment Mode</label>
            <select v-model="settings.payment_mode">
              <option value="manual">Manual Payment</option>
              <option value="chip_placeholder">CHIP Placeholder</option>
            </select>
          </div>

          <div class="form-group">
            <label>Bank Name</label>
            <input v-model="settings.bank_name" placeholder="Example: Maybank" />
          </div>

          <div class="form-group">
            <label>Account Name</label>
            <input v-model="settings.account_name" placeholder="Example: Medieco Enterprise" />
          </div>

          <div class="form-group">
            <label>Account Number</label>
            <input v-model="settings.account_number" placeholder="Example: 1234567890" />
          </div>

          <div class="form-group">
            <label>DuitNow QR Image URL</label>
            <input v-model="settings.duitnow_qr_url" placeholder="/images/duitnow-qr.jpg" />
          </div>

          <div class="form-group">
            <label>WhatsApp Support Number</label>
            <input v-model="settings.whatsapp_number" placeholder="60123456789" />
          </div>

          <div class="form-group">
            <label>Payment Note</label>
            <textarea v-model="settings.payment_note" rows="4"></textarea>
          </div>

          <button class="save-btn" @click="saveSettings" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Payment Settings' }}
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { supabase } from '../lib/supabase'

const loading = ref(true)
const saving = ref(false)

const settings = reactive({
  payment_mode: 'manual',
  bank_name: '',
  account_name: '',
  account_number: '',
  duitnow_qr_url: '',
  whatsapp_number: '',
  payment_note: 'Please use your order number as payment reference.',
})

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  loading.value = true

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('setting_key', 'payment_settings')
    .single()

  if (error) {
    alert(error.message)
  } else if (data?.setting_value) {
    Object.assign(settings, data.setting_value)
  }

  loading.value = false
}

async function saveSettings() {
  saving.value = true

  const { error } = await supabase
    .from('app_settings')
    .update({
      setting_value: { ...settings },
      updated_at: new Date().toISOString(),
    })
    .eq('setting_key', 'payment_settings')

  if (error) {
    alert(error.message)
  } else {
    alert('Payment settings saved successfully')
  }

  saving.value = false
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f6f8fb;
  padding: 24px;
}

.admin-shell {
  max-width: 900px;
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

.admin-header button {
  border: none;
  background: white;
  color: #0f766e;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.panel {
  background: white;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
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

.panel-head button {
  border: none;
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
}

.empty {
  color: #64748b;
  padding: 20px 0;
}

.settings-form {
  margin-top: 18px;
  display: grid;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-weight: 900;
  font-size: 13px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
}

.save-btn {
  border: none;
  background: #7a2433;
  color: white;
  border-radius: 999px;
  padding: 15px 20px;
  font-weight: 900;
}
</style>