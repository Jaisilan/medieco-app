import { ref, computed } from 'vue'

const CART_KEY = 'medieco_cart'

export const cartItems = ref(loadCart())

export const cartCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
})

export const cartSubtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
})

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cartItems.value))
}

export function addToCart(item) {
  const existingIndex = cartItems.value.findIndex((cartItem) => {
    return (
      cartItem.product_id === item.product_id &&
      cartItem.plan_type === item.plan_type
    )
  })

  if (existingIndex >= 0) {
    const existing = cartItems.value[existingIndex]
    existing.quantity = Number(existing.quantity || 0) + Number(item.quantity || 1)
    existing.total_price = Number(existing.unit_price || 0) * Number(existing.quantity || 1)
  } else {
    cartItems.value.push({
      ...item,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      total_price: Number(item.unit_price || 0) * Number(item.quantity || 1),
    })
  }

  saveCart()
}

export function updateCartQuantity(index, quantity) {
  const safeQuantity = Math.max(1, Number(quantity || 1))

  cartItems.value[index].quantity = safeQuantity
  cartItems.value[index].total_price =
    Number(cartItems.value[index].unit_price || 0) * safeQuantity

  saveCart()
}

export function removeFromCart(index) {
  cartItems.value.splice(index, 1)
  saveCart()
}

export function clearCart() {
  cartItems.value = []
  saveCart()
}