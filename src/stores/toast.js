import { ref } from 'vue'

export const toasts = ref([])

export function showToast({
  type = 'success',
  title = '',
  message = '',
  duration = 3500,
}) {
  const id = Date.now() + Math.random()

  toasts.value.push({
    id,
    type,
    title,
    message,
  })

  setTimeout(() => {
    removeToast(id)
  }, duration)
}

export function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}