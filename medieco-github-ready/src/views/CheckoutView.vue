<template>
  <main class="page checkout-page">
    <div class="container">
      <button class="back-btn" @click="$router.push('/cart')">← Back to Cart</button>

      <section v-if="cartItems.length === 0" class="loading">
        Your cart is empty.
        <br />
        <button class="primary-btn" @click="$router.push('/period-box')">
          Browse Bloom Care
        </button>
      </section>

      <div v-else class="checkout-grid">
        <section class="checkout-form">
          <p class="eyebrow">CHECKOUT</p>
          <h1>Complete Your Order</h1>

          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.full_name" type="text" />
          </div>

          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="form.phone" type="text" />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input v-model="form.email" type="email" />
          </div>

          <div class="form-group">
            <label>Address Line 1</label>
            <input v-model="form.address_line_1" type="text" />
          </div>

          <div class="form-group">
            <label>Address Line 2</label>
            <input v-model="form.address_line_2" type="text" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Postcode</label>
              <input v-model="form.postcode" type="text" />
            </div>

            <div class="form-group">
              <label>City</label>
              <input v-model="form.city" type="text" />
            </div>
          </div>

          <div class="form-group">
            <label>State</label>
            <input v-model="form.state" type="text" />
          </div>

          <div class="form-group">
            <label>Referral Code</label>
            <input v-model="form.referral_code" type="text" placeholder="Optional" />
          </div>

          <button class="primary-btn submit-btn" @click="submitOrder" :disabled="submitting">
            {{ submitting ? 'Creating order...' : 'Continue to Payment' }}
          </button>
        </section>

        <aside class="checkout-summary">
          <h2>Order Summary</h2>

          <div class="cart-items">
            <div
              v-for="item in cartItems"
              :key="`${item.product_id}-${item.plan_type}`"
              class="cart-item"
            >
              <img
                :src="item.image_url || '/images/product-placeholder.jpg'"
                :alt="item.product_name"
              />

              <div>
                <strong>{{ item.product_name }}</strong>
                <p>{{ item.plan_label }} × {{ item.quantity }}</p>
                <small>RM{{ money(item.unit_price) }} each</small>
              </div>

              <span>RM{{ money(item.total_price) }}</span>
            </div>
          </div>

          <div class="summary-card">
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
          </div>

          <ul class="features">
            <li>✔ Manual payment verification for Phase 1</li>
            <li>✔ Multiple products supported</li>
            <li>✔ Bloom Care plan tracking</li>
            <li>✔ CHIP-ready order structure</li>
          </ul>
        </aside>
      </div>
    </div>
    <BottomNavigation />
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user, profile, loadUser } from '../stores/auth'
import { cartItems, cartCount, cartSubtotal, clearCart } from '../stores/cart'
import { showToast } from '../stores/toast'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()
const route = useRoute()

const submitting = ref(false)

const form = reactive({
  full_name: '',
  phone: '',
  email: '',
  address_line_1: '',
  address_line_2: '',
  postcode: '',
  city: '',
  state: '',
  referral_code: '',
})

onMounted(async () => {
  await loadUser()
  prefillUser()
  captureReferralCode()
})

function prefillUser() {
  if (profile.value) {
    form.full_name = profile.value.full_name || ''
    form.phone = profile.value.phone || ''
    form.email = profile.value.email || ''
  }

  if (user.value?.email && !form.email) {
    form.email = user.value.email
  }
}

function captureReferralCode() {
  const refCode = route.query.ref || localStorage.getItem('medieco_ref')

  if (refCode) {
    form.referral_code = refCode
    localStorage.setItem('medieco_ref', refCode)
  }
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function generateOrderNumber() {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replaceAll('-', '')
  const random = Math.floor(100000 + Math.random() * 900000)
  return `MDE-${ymd}-${random}`
}

function getSubscriptionDates(months) {
  const start = new Date()
  const end = new Date()

  end.setMonth(end.getMonth() + Number(months || 1))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function getMainSubscriptionInfo() {
  const subscriptionItem = cartItems.value.find(
    item => Number(item.subscription_months || 1) > 1
  )

  if (!subscriptionItem) {
    return {
      subscription_plan: 'single',
      subscription_months: 1,
      subscription_start_date: null,
      subscription_end_date: null,
    }
  }

  const dates = getSubscriptionDates(subscriptionItem.subscription_months)

  return {
    subscription_plan: subscriptionItem.plan_type,
    subscription_months: subscriptionItem.subscription_months,
    subscription_start_date: dates.startDate,
    subscription_end_date: dates.endDate,
  }
}

async function submitOrder() {

  if (!user.value) {

    showToast({
      type:'warning',
      title:'Login Required',
      message:'Please login before making a purchase.'
    })

    router.push('/')
    return
  }

  if (cartItems.value.length === 0) {

    showToast({
      type:'warning',
      title:'Cart Empty',
      message:'Please add products before checkout.'
    })

    router.push('/cart')
    return
  }

  if (
    !form.full_name ||
    !form.phone ||
    !form.address_line_1 ||
    !form.city ||
    !form.state
  ) {

    showToast({
      type:'warning',
      title:'Incomplete Address',
      message:'Please complete your delivery information.'
    })

    return
  }

  submitting.value = true

  try {

    let affiliateId = null
    let referralCodeUsed = ''
    let commissionRate = 3
    let commissionAmount = 0

    if (form.referral_code) {

      const cleanCode = form.referral_code.trim()

      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id, referral_code, status, commission_rate')
        .eq('referral_code', cleanCode)
        .maybeSingle()

      if (affiliateError) throw affiliateError

      if (!affiliate) {

        showToast({
          type:'error',
          title:'Invalid Referral Code',
          message:'The referral code entered does not exist.'
        })

        submitting.value = false
        return
      }

      if (affiliate.status !== 'active') {

        showToast({
          type:'warning',
          title:'Referral Inactive',
          message:'This affiliate referral code is currently inactive.'
        })

        submitting.value = false
        return
      }

      affiliateId = affiliate.id
      referralCodeUsed = affiliate.referral_code
      commissionRate = Number(affiliate.commission_rate || 3)
      commissionAmount =
        Number(cartSubtotal.value || 0) *
        (commissionRate / 100)
    }

    const { data: customer, error: customerError } =
      await supabase
        .from('customers')
        .insert([{
          user_id: user.value.id,
          affiliate_id: affiliateId,
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          address_line_1: form.address_line_1,
          address_line_2: form.address_line_2,
          postcode: form.postcode,
          city: form.city,
          state: form.state,
          referral_code_used: form.referral_code,
        }])
        .select()
        .single()

    if (customerError) throw customerError

    const subscriptionInfo = getMainSubscriptionInfo()

    const { data: order, error: orderError } =
      await supabase
        .from('orders')
        .insert([{
          order_number: generateOrderNumber(),
          customer_id: customer.id,
          affiliate_id: affiliateId,
          subtotal: cartSubtotal.value,
          discount:0,
          delivery_fee:0,
          total_amount:cartSubtotal.value,
          order_status:'pending_payment',
          payment_status:'pending',
          referral_code_used: referralCodeUsed,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          ...subscriptionInfo
        }])
        .select()
        .single()

    if (orderError) throw orderError

    const orderItemsPayload = cartItems.value.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity:Number(item.quantity||1),
      unit_price:Number(item.unit_price||0),
      total_price:Number(item.total_price||0),
      subscription_plan:item.plan_type,
      subscription_months:Number(item.subscription_months||1)
    }))

    const { error:itemError } =
      await supabase
        .from('order_items')
        .insert(orderItemsPayload)

    if (itemError) throw itemError

    clearCart()

    showToast({
      type:'success',
      title:'Order Created',
      message:'Continue with payment to complete your purchase.'
    })

    router.push(`/payment/${order.id}`)

  }
  catch(error){

    showToast({
      type:'error',
      title:'Checkout Failed',
      message:error.message || 'Unable to create order.'
    })

  }

  submitting.value = false
}
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  padding: 32px 0;
  background: #fff7f9;
}

.back-btn {
  margin-bottom: 18px;
  border: none;
  background: transparent;
  font-weight: 900;
  color: #1f7ea6;
}

.loading {
  background: white;
  border-radius: 24px;
  padding: 30px;
  color: #64748b;
  text-align: center;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 32px;
}

.checkout-form,
.checkout-summary {
  background: white;
  border-radius: 32px;
  padding: 28px;
  box-shadow: 0 20px 50px rgba(122, 36, 51, 0.08);
}

.eyebrow {
  color: #e8796b;
  font-weight: 900;
  letter-spacing: 0.06em;
}

h1,
h2 {
  color: #7a2433;
}

.form-group {
  margin-top: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 900;
  color: #334155;
}

input {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.submit-btn {
  width: 100%;
  margin-top: 24px;
}

.cart-items {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.cart-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 12px;
}

.cart-item img {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
}

.cart-item p {
  margin: 4px 0;
  color: #64748b;
}

.cart-item small {
  color: #94a3b8;
}

.cart-item span {
  color: #7a2433;
  font-weight: 900;
}

.summary-card {
  background: #fff7f9;
  border-radius: 24px;
  padding: 20px;
  margin-top: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}

.summary-row.total {
  color: #7a2433;
  font-size: 20px;
}

.features {
  list-style: none;
  padding: 0;
  margin-top: 24px;
}

.features li {
  margin-bottom: 10px;
  color: #374151;
}

@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .checkout-summary {
    order: -1;
  }

  .cart-item {
    grid-template-columns: 54px 1fr;
  }

  .cart-item span {
    grid-column: 2;
  }
}
</style>