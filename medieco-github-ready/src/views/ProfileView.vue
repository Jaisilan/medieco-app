<template>
  <main class="mobile-shell profile-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/settings')">← Back</button>
      <h1>Profile</h1>
      <p>Manage your Medieco account details.</p>
    </section>

    <section v-if="loading" class="card">
      Loading profile...
    </section>

    <section v-else class="card">
      <div class="avatar-box">
        <img :src="avatarImage" alt="Profile avatar" />
        <h2>{{ form.full_name || 'Medieco User' }}</h2>
        <p>{{ form.email }}</p>
      </div>

      <section class="avatar-actions">
        <label class="upload-btn">
          Upload Photo
          <input type="file" accept="image/*" @change="uploadAvatar" />
        </label>

        <button class="default-btn" @click="removeAvatar" :disabled="saving">
          Use Default Avatar
        </button>
      </section>

      <div class="form-group">
        <label>Full Name</label>
        <input v-model="form.full_name" />
      </div>

      <div class="form-group">
        <label>Phone</label>
        <input v-model="form.phone" />
      </div>

      <div class="form-group">
        <label>Gender</label>
        <select v-model="form.gender">
          <option value="">Select gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" disabled />
      </div>

      <button class="primary-btn full" @click="saveProfile" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Profile' }}
      </button>

      <button class="logout-btn" @click="logout">
        Logout
      </button>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user, profile, loadUser, signOut } from '../stores/auth'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const uploadedAvatarUrl = ref('')

const form = reactive({
  full_name: '',
  phone: '',
  gender: '',
  email: '',
})

onMounted(async () => {
  await loadProfile()
})

async function loadProfile() {
  loading.value = true

  await loadUser()

  if (!user.value) {
    router.push('/landing')
    return
  }

  form.full_name = profile.value?.full_name || ''
  form.phone = profile.value?.phone || ''
  form.gender = profile.value?.gender || ''
  form.email = profile.value?.email || user.value?.email || ''
  uploadedAvatarUrl.value = profile.value?.avatar_url || ''

  loading.value = false
}

const avatarImage = computed(() => {
  if (uploadedAvatarUrl.value) return uploadedAvatarUrl.value

  const gender = String(form.gender || '').toLowerCase()

  if (gender === 'male') return '/avatars/male.png'
  if (gender === 'female') return '/avatars/female.png'

  return '/avatars/neutral.png'
})

async function uploadAvatar(event) {
  const file = event.target.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast({
      type: 'warning',
      title: 'Invalid File',
      message: 'Please upload an image file.',
    })
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast({
      type: 'warning',
      title: 'Image Too Large',
      message: 'Image must be below 2MB.',
    })
    return
  }

  saving.value = true

  try {
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.value.id}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(filePath)

    const publicUrl = data.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    uploadedAvatarUrl.value = publicUrl
    await loadUser()

    showToast({
      type: 'success',
      title: 'Photo Updated',
      message: 'Your profile photo has been updated.',
    })
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Upload Failed',
      message: error.message || 'Unable to upload profile photo.',
    })
  }

  saving.value = false
}

async function removeAvatar() {
  const ok = confirm('Use default avatar based on gender?')
  if (!ok) return

  saving.value = true

  const { error } = await supabase
    .from('profiles')
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.value.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Update Failed',
      message: error.message,
    })
  } else {
    uploadedAvatarUrl.value = ''
    await loadUser()

    showToast({
      type: 'success',
      title: 'Default Avatar Restored',
      message: 'Your profile is now using the default avatar.',
    })
  }

  saving.value = false
}

async function saveProfile() {
  if (!form.full_name || !form.phone || !form.gender) {
    showToast({
      type: 'warning',
      title: 'Missing Information',
      message: 'Please complete full name, phone and gender.',
    })
    return
  }

  saving.value = true

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: form.full_name,
      phone: form.phone,
      gender: form.gender,
      avatar_url: uploadedAvatarUrl.value || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.value.id)

  if (error) {
    showToast({
      type: 'error',
      title: 'Profile Update Failed',
      message: error.message,
    })
  } else {
    await loadUser()

    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile has been saved.',
    })
  }

  saving.value = false
}

async function logout() {
  await signOut()
  router.push('/')
}
</script>

<style scoped>
.profile-page {
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

.header h1 {
  margin: 14px 0 6px;
  color: #0f172a;
}

.header p {
  color: #64748b;
}

.card {
  margin-top: 20px;
  background: white;
  border-radius: 26px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.avatar-box {
  text-align: center;
  margin-bottom: 18px;
}

.avatar-box img {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  object-fit: cover;
  background: #eef2f7;
  border: 4px solid #ecfdf5;
}

.avatar-box h2 {
  margin: 12px 0 4px;
  color: #0f172a;
}

.avatar-box p {
  margin: 0;
  color: #64748b;
}

.avatar-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.upload-btn,
.default-btn {
  border: none;
  border-radius: 999px;
  padding: 12px;
  font-weight: 900;
  text-align: center;
}

.upload-btn {
  background: #0f766e;
  color: white;
  cursor: pointer;
}

.upload-btn input {
  display: none;
}

.default-btn {
  background: #f1f5f9;
  color: #334155;
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

input,
select {
  width: 100%;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  border-radius: 16px;
  padding: 14px;
}

input:disabled {
  color: #94a3b8;
}

.full {
  width: 100%;
  margin-top: 20px;
}

.logout-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  background: #991b1b;
  color: white;
  border-radius: 999px;
  padding: 14px;
  font-weight: 900;
}

@media (max-width: 430px) {
  .avatar-actions {
    grid-template-columns: 1fr;
  }
}
</style>