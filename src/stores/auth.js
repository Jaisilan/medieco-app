import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const user = ref(null)
export const profile = ref(null)

export async function loadUser() {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error(error)
  }

  if (!authUser) {
    user.value = null
    profile.value = null
    return null
  }

  user.value = authUser

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError) {
    console.error(profileError)
    profile.value = null
    return authUser
  }

  if (profileData?.status === 'suspended') {
    await signOut()

    alert(
      'Your account has been suspended. Please contact Medieco support.'
    )

    window.location.replace('/landing')
    return null
  }

  profile.value = profileData

  return authUser
}

export async function signUp(
  email,
  password,
  fullName,
  phone,
  gender
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        gender,
      },
    },
  })

  if (error) throw error

  return data
}

export async function signIn(email, password) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) throw error

  await loadUser()

  return data
}

export async function signOut() {
  await supabase.auth.signOut()

  user.value = null
  profile.value = null

  sessionStorage.clear()

  localStorage.removeItem('medieco_cart')

  window.history.pushState(null, '', '/landing')

  window.location.replace('/landing')
}