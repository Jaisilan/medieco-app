<template>
  <main class="mobile-shell cart-page">
    <section class="header">
      <button class="back-btn" @click="$router.push('/home')">← Back</button>

      <h1>Your Cart</h1>
      <p>Review your items before checkout.</p>
    </section>

    <section v-if="cartItems.length === 0" class="empty-card">
      <h2>Your cart is empty</h2>
      <p>Add Bloom Care or Marketplace products to continue.</p>

      <button class="primary-btn full" @click="$router.push('/period-box')">
        Browse Bloom Care
      </button>

      <button class="secondary-btn full" @click="$router.push('/marketplace')">
        Browse Marketplace
      </button>
    </section>

    <section v-else class="cart-list">
      <article
        v-for="(item, index) in cartItems"
        :key="`${item.product_id}-${item.plan_type}`"
        class="cart-card"
      >
        <img :src="item.image_url || '/images/product-placeholder.jpg'" :alt="item.product_name" />

        <div class="cart-content">
          <div class="cart-top">
            <div>
              <h2>{{ item.product_name }}</h2>
              <p>{{ item.plan_label }}</p>
            </div>

            <button class="remove-btn" @click="removeFromCart(index)">
              ✕
            </button>
          </div>

          <div class="price-row">
            <span>RM{{ money(item.unit_price) }} each</span>
            <strong>RM{{ money(item.total_price) }}</strong>
          </div>

          <div class="qty-row">
            <button @click="decrease(index, item.quantity)">−</button>
            <strong>{{ item.quantity }}</strong>
            <button @click="increase(index, item.quantity)">+</button>
          </div>
        </div>
      </article>

      <section class="summary-card">
        <div class="summary-row">
          <span>Items</span>
          <strong>{{ cartCount }}</strong>
        </div>

        <div class="summary-row">
          <span>Subtotal</span>
          <strong>RM{{ money(cartSubtotal) }}</strong>
        </div>

        <div class="summary-row">
          <span>Delivery</span>
          <strong>FREE</strong>
        </div>

        <hr />

        <div class="summary-row total">
          <span>Total</span>
          <strong>RM{{ money(cartSubtotal) }}</strong>
        </div>

        <button class="primary-btn full" @click="$router.push('/checkout')">
          Continue to Checkout
        </button>

        <button class="clear-btn" @click="clearCart">
          Clear Cart
        </button>
      </section>
    </section>
    <BottomNavigation />
  </main>
</template>

<script setup>
import {
  cartItems,
  cartCount,
  cartSubtotal,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from '../stores/cart'
import BottomNavigation from '../components/BottomNavigation.vue'

function money(value) {
  return Number(value || 0).toFixed(2)
}

function increase(index, currentQty) {
  updateCartQuantity(index, Number(currentQty || 1) + 1)
}

function decrease(index, currentQty) {
  if (Number(currentQty || 1) <= 1) return
  updateCartQuantity(index, Number(currentQty || 1) - 1)
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
  padding-bottom: 90px;
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

.header p,
.empty-card p {
  color: #64748b;
}

.empty-card,
.cart-card,
.summary-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.empty-card {
  margin-top: 24px;
  padding: 22px;
  display: grid;
  gap: 12px;
}

.cart-list {
  margin-top: 22px;
  display: grid;
  gap: 16px;
}

.cart-card {
  overflow: hidden;
}

.cart-card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.cart-content {
  padding: 16px;
}

.cart-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cart-top h2 {
  margin: 0;
  color: #0f172a;
}

.cart-top p {
  margin: 6px 0 0;
  color: #64748b;
}

.remove-btn {
  border: none;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 999px;
  width: 34px;
  height: 34px;
  font-weight: 900;
}

.price-row,
.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.price-row span,
.summary-row span {
  color: #64748b;
}

.price-row strong,
.summary-row strong {
  color: #7a2433;
}

.qty-row {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff7f9;
  border-radius: 999px;
  padding: 10px;
}

.qty-row button {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #7a2433;
  color: white;
  font-size: 22px;
  font-weight: 900;
}

.qty-row strong {
  font-size: 22px;
  color: #7a2433;
}

.summary-card {
  padding: 18px;
}

.summary-row.total {
  font-size: 20px;
}

.full {
  width: 100%;
  margin-top: 16px;
}

.clear-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #991b1b;
  font-weight: 900;
}
</style>