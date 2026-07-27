<template>
  <main class="mobile-shell cart-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.push('/period-box')">← Continue shopping</button>
      <span class="eyebrow">Medieco checkout</span>
      <h1>Your cart</h1>
      <p>Review your Bloom Care selections before continuing to payment.</p>
    </header>

    <section v-if="cartItems.length === 0" class="empty-card">
      <div class="empty-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Add a Bloom Care plan or Marketplace product to continue.</p>
      <div class="empty-actions">
        <button class="primary-btn" @click="$router.push('/period-box')">Browse Bloom Care</button>
        <button class="secondary-btn" @click="$router.push('/marketplace')">Browse Marketplace</button>
      </div>
    </section>

    <section v-else class="cart-layout">
      <div class="cart-list">
        <article
          v-for="(item, index) in cartItems"
          :key="`${item.product_id}-${item.plan_type}-${index}`"
          class="cart-card"
        >
          <img :src="item.image_url || '/images/everyday-bloom.jpeg'" :alt="item.product_name" />

          <div class="cart-content">
            <div class="cart-top">
              <div>
                <span class="plan-pill">{{ item.plan_label || 'Bloom Care plan' }}</span>
                <h2>{{ item.product_name }}</h2>
              </div>

              <button class="remove-btn" aria-label="Remove item" @click="removeFromCart(index)">×</button>
            </div>

            <div class="price-row">
              <div>
                <small>Unit price</small>
                <span>RM{{ money(item.unit_price) }}</span>
              </div>
              <strong>RM{{ money(item.total_price) }}</strong>
            </div>

            <div class="qty-row" aria-label="Quantity control">
              <button aria-label="Decrease quantity" @click="decrease(index, item.quantity)">−</button>
              <div>
                <small>Quantity</small>
                <strong>{{ item.quantity }}</strong>
              </div>
              <button aria-label="Increase quantity" @click="increase(index, item.quantity)">+</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="summary-card">
        <span class="eyebrow">Order summary</span>
        <h2>Ready for checkout</h2>

        <div class="summary-row">
          <span>Items</span>
          <strong>{{ cartCount }}</strong>
        </div>

        <div class="summary-row">
          <span>Subtotal</span>
          <strong>RM{{ money(cartSubtotal) }}</strong>
        </div>

        <div class="summary-row delivery">
          <span>Delivery</span>
          <strong>Free delivery</strong>
        </div>

        <div class="divider"></div>

        <div class="summary-row total">
          <span>Total</span>
          <strong>RM{{ money(cartSubtotal) }}</strong>
        </div>

        <p class="summary-note">Final payment will be processed securely through CHIP once payment credentials are connected.</p>

        <button class="checkout-btn" @click="$router.push('/checkout')">Continue to checkout</button>
        <button class="clear-btn" @click="clearCart">Clear cart</button>
      </aside>
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
  padding: 24px 16px 112px;
  background:
    radial-gradient(circle at top right, rgba(255, 213, 222, 0.45), transparent 28%),
    linear-gradient(180deg, #fff8fa 0%, #f8fafc 46%, #fff8fa 100%);
}

.page-header,
.cart-layout,
.empty-card {
  width: min(100%, 1120px);
  margin-left: auto;
  margin-right: auto;
}

.page-header { margin-bottom: 22px; }
.back-btn {
  border: 0;
  background: transparent;
  color: #8b1232;
  padding: 0;
  font-weight: 900;
}

.eyebrow {
  display: block;
  margin-top: 20px;
  color: #a44b61;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 8px 0 6px;
  color: #3f1723;
  font-size: clamp(32px, 6vw, 46px);
}

.page-header p { margin: 0; color: #64748b; line-height: 1.6; }

.empty-card,
.cart-card,
.summary-card {
  background: #fff;
  border: 1px solid #f1d6dc;
  box-shadow: 0 16px 36px rgba(122, 36, 51, 0.08);
}

.empty-card {
  padding: 38px 24px;
  border-radius: 28px;
  text-align: center;
}
.empty-icon { font-size: 42px; }
.empty-card h2 { margin: 12px 0 6px; color: #3f1723; }
.empty-card p { color: #64748b; }
.empty-actions { margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }

.cart-layout { display: grid; gap: 18px; }
.cart-list { display: grid; gap: 16px; }

.cart-card {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(120px, 180px) 1fr;
  border-radius: 24px;
}

.cart-card img { width: 100%; height: 100%; min-height: 210px; object-fit: cover; background: #fff4f6; }
.cart-content { padding: 20px; display: flex; flex-direction: column; }
.cart-top { display: flex; justify-content: space-between; gap: 14px; }
.cart-top h2 { margin: 9px 0 0; color: #3f1723; font-size: 21px; }
.plan-pill {
  display: inline-flex;
  padding: 6px 9px;
  border-radius: 999px;
  background: #fff0f4;
  color: #8b1232;
  font-size: 11px;
  font-weight: 900;
}
.remove-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #fff1f2;
  color: #9f1239;
  font-size: 20px;
}

.price-row {
  margin-top: auto;
  padding-top: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: end;
}
.price-row div { display: grid; gap: 3px; }
.price-row small { color: #94a3b8; font-weight: 800; }
.price-row span { color: #64748b; }
.price-row strong { color: #7a2433; font-size: 22px; }

.qty-row {
  margin-top: 16px;
  padding: 9px;
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  gap: 10px;
  align-items: center;
  border-radius: 16px;
  background: #fff7f9;
}
.qty-row button {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 13px;
  background: #7a2433;
  color: #fff;
  font-size: 21px;
  font-weight: 900;
}
.qty-row div { display: grid; justify-items: center; }
.qty-row small { color: #94a3b8; font-size: 10px; font-weight: 800; }
.qty-row strong { color: #7a2433; font-size: 20px; }

.summary-card {
  padding: 24px;
  border-radius: 26px;
  align-self: start;
}
.summary-card .eyebrow { margin-top: 0; }
.summary-card h2 { margin: 8px 0 20px; color: #3f1723; }
.summary-row { display: flex; justify-content: space-between; gap: 14px; margin-top: 14px; }
.summary-row span { color: #64748b; }
.summary-row strong { color: #3f1723; }
.summary-row.delivery strong { color: #0f766e; }
.divider { margin: 20px 0; border-top: 1px solid #f0e1e5; }
.summary-row.total { margin-top: 0; font-size: 20px; }
.summary-row.total strong { color: #7a2433; }
.summary-note { margin: 18px 0 0; color: #64748b; font-size: 12px; line-height: 1.6; }

.checkout-btn,
.primary-btn,
.secondary-btn,
.clear-btn {
  border-radius: 14px;
  padding: 13px 16px;
  font-weight: 900;
}
.checkout-btn,
.primary-btn {
  border: 0;
  background: linear-gradient(135deg, #7a2433, #d35f72);
  color: #fff;
}
.checkout-btn { width: 100%; margin-top: 18px; }
.secondary-btn { border: 1px solid #d9a9b5; background: #fff; color: #7a2433; }
.clear-btn { width: 100%; margin-top: 10px; border: 0; background: transparent; color: #9f1239; }

@media (min-width: 900px) {
  .cart-layout { grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.75fr); }
  .summary-card { position: sticky; top: 20px; }
}

@media (max-width: 620px) {
  .cart-card { grid-template-columns: 1fr; }
  .cart-card img { height: 200px; min-height: 0; }
}
</style>
