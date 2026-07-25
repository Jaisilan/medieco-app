import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BH_5nndX54yHVfnhXQE6pia4M08mga3XbKMWYtyeJE0v0XDW76dCKrwRkYcmzrLakOTja2dzLJtPAOqDY2n0TUw'

export async function registerPushNotifications(userId) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Push notifications are not supported on this device.')
  }

  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported on this browser.')
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const registration = await navigator.serviceWorker.register('/sw.js')

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        subscription,
        platform: navigator.userAgent,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'endpoint',
      }
    )

  if (error) throw error

  return true
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}