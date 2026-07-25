<template>
  <main class="entry-page">
    <div class="entry-shell">
        <img class="logo" src="/medieco-logo.png" alt="Medieco" />
      <h1>Welcome to Medieco</h1>

      <section class="entry-card">
        <div class="tabs">
          <button :class="{ active: mode === 'login' }" @click="mode = 'login'">
            Login
          </button>

          <button :class="{ active: mode === 'register' }" @click="mode = 'register'">
            Register
          </button>
        </div>

        <div v-if="mode === 'register'" class="form-group">
          <label>Full Name</label>
          <input v-model="fullName" type="text" placeholder="Enter full name" />
        </div>

        <div v-if="mode === 'register'" class="form-group">
          <label>Phone Number</label>
          <input v-model="phone" type="text" placeholder="60123456789" />
        </div>

        <div v-if="mode === 'register'" class="form-group">
          <label>Gender</label>
          <select v-model="gender">
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Minimum 6 characters" />
        </div>

        <button class="primary-btn full" @click="submitAuth" :disabled="loading">
          {{ loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account' }}
        </button>

        <button v-if="mode === 'login'"class="skip-btn"@click="sendResetPassword">
        Forgot Password?
        </button>

        <button class="skip-btn" @click="$router.push('/home')">
          Skip & Explore App
        </button>
      </section>

      <button class="affiliate-btn" @click="$router.push('/affiliate?from=landing')">
        Earn with Medieco
      </button>

      <p class="note">
        Register to purchase Bloom Care products and track your orders.
      </p>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '../stores/auth'
import { showToast } from '../stores/toast'
import { supabase } from '../lib/supabase'

const router = useRouter()

const mode = ref('login')
const fullName = ref('')
const phone = ref('')
const gender = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

async function submitAuth() {
  if (!email.value || !password.value) {
    showToast({
      type: 'warning',
      title: 'Missing Details',
      message: 'Please enter email and password.',
    })
    return
  }

  if (password.value.length < 6) {
    showToast({
      type: 'warning',
      title: 'Weak Password',
      message: 'Password must be at least 6 characters.',
    })
    return
  }

  if (mode.value === 'register' && (!fullName.value || !phone.value || !gender.value)) {
    showToast({
      type: 'warning',
      title: 'Missing Registration Details',
      message: 'Please enter full name, phone number and gender.',
    })
    return
  }

  loading.value = true

  try {
    if (mode.value === 'login') {
      await signIn(email.value.trim(), password.value)

      showToast({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back to Medieco.',
      })

      router.replace('/home')
    } else {
      await signUp(
        email.value.trim(),
        password.value,
        fullName.value.trim(),
        phone.value.trim(),
        gender.value
      )

      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Please check your email if confirmation is required, then login.',
      })

      mode.value = 'login'
      fullName.value = ''
      phone.value = ''
      gender.value = ''
      email.value = ''
      password.value = ''
    }
  } catch (error) {
    showToast({
      type: 'error',
      title: mode.value === 'login' ? 'Login Failed' : 'Registration Failed',
      message: error.message,
    })
  }

  loading.value = false
}

async function sendResetPassword() {
  if (!email.value) {
    showToast({
      type: 'warning',
      title: 'Email Required',
      message: 'Please enter your email first.',
    })
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
   redirectTo: 'https://medieco.my/reset-password',
  })

  if (error) {
    showToast({
      type: 'error',
      title: 'Reset Failed',
      message: error.message,
    })
    return
  }

  showToast({
    type: 'success',
    title: 'Reset Link Sent',
    message: 'Please check your email to reset your password.',
  })
}
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.14), transparent 34%),
    linear-gradient(135deg, #ffffffe8, #fdfdfd);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.entry-shell {
  width: 100%;
  max-width: 430px;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 34px;
  color: rgb(15, 1, 1);
}

.entry-card {
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
  text-align: left;
  margin-top: 18px;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 5px;
  margin-bottom: 18px;
}

.tabs button {
  border: none;
  background: transparent;
  padding: 10px;
  border-radius: 999px;
  font-weight: 900;
  color: #64748b;
}

.tabs button.active {
  background: white;
  color: #0f766e;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.form-group {
  margin-top: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 13px;
  color: #334155;
}

.logo {
  width: 4000px;
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto -30px;
  object-fit: contain;
}
input,
select {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 14px;
  border-radius: 16px;
}

.full {
  width: 100%;
  margin-top: 18px;
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

.affiliate-btn {
  width: 100%;
  margin-top: 16px;
  border: none;
  background: #7a2433;
  color: white;
  padding: 15px;
  border-radius: 999px;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(122, 36, 51, 0.25);
}

.note {
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 18px;
}
</style>