<template>
  <main class="entry-page">
    <section class="entry-card">
      <h1>Reset Password</h1>
      <p>Create a new password for your Medieco account.</p>

      <div class="form-group">
        <label>New Password</label>
        <input v-model="password" type="password" placeholder="Enter new password" />
      </div>

      <div class="form-group">
        <label>Confirm Password</label>
        <input v-model="confirmPassword" type="password" placeholder="Confirm new password" />
      </div>

      <button class="primary-btn full" @click="updatePassword" :disabled="loading">
        {{ loading ? 'Updating...' : 'Update Password' }}
      </button>

      <button class="skip-btn" @click="$router.push('/landing')">
        Back to Login
      </button>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function updatePassword() {
  if (!password.value || !confirmPassword.value) {
    showToast({
      type: 'warning',
      title: 'Missing Password',
      message: 'Please enter and confirm your new password.',
    })
    return
  }

  if (password.value.length < 6) {
    showToast({
      type: 'warning',
      title: 'Password Too Short',
      message: 'Password must be at least 6 characters.',
    })
    return
  }

  if (password.value !== confirmPassword.value) {
    showToast({
      type: 'warning',
      title: 'Password Mismatch',
      message: 'Both passwords must match.',
    })
    return
  }

  loading.value = true

  const { error } = await supabase.auth.updateUser({
    password: password.value,
  })

  loading.value = false

  if (error) {
    showToast({
      type: 'error',
      title: 'Password Update Failed',
      message: error.message,
    })
    return
  }

  showToast({
    type: 'success',
    title: 'Password Updated',
    message: 'You can now login with your new password.',
  })

  router.replace('/landing')
}
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  background: #eefaf8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.entry-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
}

h1 {
  margin: 0;
  color: #0f766e;
}

p {
  color: #64748b;
}

.form-group {
  margin-top: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 900;
  color: #334155;
}

input {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 14px;
  border-radius: 16px;
}

.full {
  width: 100%;
  margin-top: 20px;
}

.skip-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
  padding: 10px;
}
</style>