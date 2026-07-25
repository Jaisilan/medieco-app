<template>
  <main class="admin-page">
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p>Master Admin</p>
          <h1>Create Internal User</h1>
        </div>

        <button @click="$router.push('/admin/users')">← Users</button>
      </header>

      <section class="panel">
        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.full_name" placeholder="Staff full name" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="staff@medieco.my" />
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" placeholder="60123456789" />
          </div>

          <div class="form-group">
            <label>Temporary Password</label>
            <input v-model="form.password" type="password" placeholder="Minimum 6 characters" />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role">
              <option value="support_staff">Support Staff</option>
              <option value="order_manager">Order Manager</option>
              <option value="affiliate_manager">Affiliate Manager</option>
              <option value="product_manager">Product Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button class="save-btn" @click="createUser" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Internal User' }}
        </button>

        <p class="note">
          Customers and affiliates must register through the public app. Master Admin creates internal staff only.
        </p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const loading = ref(false)

const form = reactive({
  full_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'support_staff',
})

async function createUser() {
  if (!form.full_name || !form.email || !form.password || !form.role) {
    showToast({
      type: 'warning',
      title: 'Missing Information',
      message: 'Please complete full name, email, password and role.',
    })
    return
  }

  if (form.password.length < 6) {
    showToast({
      type: 'warning',
      title: 'Weak Password',
      message: 'Temporary password must be at least 6 characters.',
    })
    return
  }

  loading.value = true

  const { data, error } = await supabase.functions.invoke('create-internal-user', {
    body: { ...form },
  })

  if (error) {
    showToast({
      type: 'error',
      title: 'User Creation Failed',
      message: error.message,
    })
  } else if (data?.error) {
    showToast({
      type: 'error',
      title: 'User Creation Failed',
      message: data.error,
    })
  } else {
    showToast({
      type: 'success',
      title: 'Internal User Created',
      message: `${form.full_name} has been added as ${formatRole(form.role)}.`,
    })

    form.full_name = ''
    form.email = ''
    form.phone = ''
    form.password = ''
    form.role = 'support_staff'
  }

  loading.value = false
}

function formatRole(value) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
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

.form-grid {
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
select {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
}

.save-btn {
  width: 100%;
  margin-top: 22px;
  border: none;
  background: #7a2433;
  color: white;
  border-radius: 999px;
  padding: 15px 20px;
  font-weight: 900;
}

.note {
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  margin-top: 16px;
}

@media (max-width: 700px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>