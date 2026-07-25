<template>
  <main class="mobile-shell payment-page">
    <section v-if="loading" class="loading">
      Loading payment...
    </section>

    <section v-else-if="!order" class="loading">
      Order not found.
    </section>

    <section v-else class="content">
      <button class="back-btn" @click="$router.push('/home')">← Home</button>

      <div class="header-card">
        <span>{{ paymentModeLabel }}</span>
        <h1>Complete Your Payment</h1>
        <p>Order: {{ order.order_number }}</p>
      </div>

      <section class="amount-card">
        <span>Total Amount</span>
        <strong>RM{{ money(order.total_amount) }}</strong>
      </section>

      <section v-if="settings.payment_mode === 'manual'" class="bank-card">
        <h2>Manual Payment Details</h2>

        <div class="bank-row">
          <span>Bank Name</span>
          <strong>{{ settings.bank_name || 'Not set' }}</strong>
        </div>

        <div class="bank-row">
          <span>Account Name</span>
          <strong>{{ settings.account_name || 'Not set' }}</strong>
        </div>

        <div class="bank-row">
          <span>Account No.</span>
          <strong>{{ settings.account_number || 'Not set' }}</strong>
        </div>

        <div class="bank-row">
          <span>Reference</span>
          <strong>{{ order.order_number }}</strong>
        </div>

        <img
          v-if="settings.duitnow_qr_url"
          class="qr-image"
          :src="settings.duitnow_qr_url"
          alt="DuitNow QR"
        />

        <p class="note">
          {{ settings.payment_note || 'Please use your order number as payment reference.' }}
        </p>
      </section>

      <section v-else class="bank-card">
        <h2>CHIP Payment</h2>

        <p class="note">
          CHIP payment gateway is being prepared. Once enabled, this button will
          redirect customers to CHIP hosted checkout for FPX, card or DuitNow QR payment.
        </p>

        <button class="primary-btn full" @click="chipComingSoon">
          Continue with CHIP
        </button>
      </section>

      <section v-if="settings.payment_mode === 'manual'" class="upload-card">
        <h2>Upload Payment Receipt</h2>

        <input type="file" accept="image/*,.pdf" @change="handleFile" />

        <p v-if="selectedFile" class="file-name">
          Selected: {{ selectedFile.name }}
        </p>

        <button class="primary-btn full" @click="submitPayment" :disabled="submitting">
          {{ submitting ? 'Submitting...' : 'Submit Payment Proof' }}
        </button>

        <a
          v-if="whatsappLink"
          class="whatsapp-btn"
          :href="whatsappLink"
          target="_blank"
        >
          WhatsApp Support
        </a>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { showToast } from '../stores/toast'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)

const order = ref(null)
const selectedFile = ref(null)

const settings = reactive({
  payment_mode: 'manual',
  bank_name: '',
  account_name: '',
  account_number: '',
  duitnow_qr_url: '',
  whatsapp_number: '',
  payment_note:
    'Please use your order number as payment reference.',
})

onMounted(async () => {
  await Promise.all([
    loadOrder(),
    loadPaymentSettings()
  ])

  loading.value = false
})

async function loadOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', route.params.orderId)
    .single()

  if (error) {

    showToast({
      type:'error',
      title:'Order Not Found',
      message:error.message
    })

    return
  }

  order.value = data
}

async function loadPaymentSettings() {

  const { data,error } =
    await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key','payment_settings')
      .single()

  if(!error && data?.setting_value){

    Object.assign(settings,data.setting_value)

  }

}

const paymentModeLabel = computed(() => {

  if(settings.payment_mode==='manual')
    return 'Manual Payment'

  if(settings.payment_mode==='chip_live')
    return 'CHIP Payment'

  return 'CHIP Coming Soon'

})

const whatsappLink = computed(()=>{

  if(!settings.whatsapp_number || !order.value)
    return ''

  const message =
    `Hi Medieco, I need help with order ${order.value.order_number}`

  return `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`

})

function handleFile(event){

  selectedFile.value = event.target.files[0]

}

function money(value){

  return Number(value || 0).toFixed(2)

}

function chipComingSoon(){

  showToast({
    type:'info',
    title:'CHIP Payment',
    message:'CHIP gateway will be enabled once production API keys are connected.'
  })

}

async function submitPayment(){

  if(!selectedFile.value){

    showToast({
      type:'warning',
      title:'Receipt Required',
      message:'Please upload your payment receipt.'
    })

    return
  }

  submitting.value=true

  try{

    const fileExt =
      selectedFile.value.name.split('.').pop()

    const filePath =
      `${order.value.id}/${Date.now()}.${fileExt}`

    const { error:uploadError } =
      await supabase.storage
        .from('payment-receipts')
        .upload(filePath,selectedFile.value)

    if(uploadError) throw uploadError

    const { data } =
      supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath)

    const receiptUrl =
      data.publicUrl

    const { error:paymentError } =
      await supabase
        .from('payments')
        .insert([{

          order_id:order.value.id,
          amount:order.value.total_amount,
          payment_method:'manual_transfer',
          payment_reference:order.value.order_number,
          receipt_url:receiptUrl,
          status:'submitted',
          gateway:'manual',
          gateway_status:'receipt_uploaded'

        }])

    if(paymentError) throw paymentError

    const { error:updateError } =
      await supabase
        .from('orders')
        .update({

          payment_status:'submitted',
          order_status:'payment_submitted'

        })
        .eq('id',order.value.id)

    if(updateError) throw updateError

    showToast({

      type:'success',
      title:'Payment Submitted',
      message:'Your payment proof has been submitted successfully.'

    })

    /*
      NEXT VERSION
      Send Push Notification
      to customer + admins here
    */

    setTimeout(()=>{

      router.push(`/success/${order.value.id}`)

    },800)

  }
  catch(error){

    showToast({

      type:'error',
      title:'Submission Failed',
      message:error.message || 'Unable to submit payment.'

    })

  }

  submitting.value=false

}
</script>

<style scoped>
.payment-page {
  background: #f8fafc;
  min-height: 100vh;
}

.content {
  padding: 20px;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.back-btn {
  border: none;
  background: transparent;
  color: #1f7ea6;
  font-weight: 900;
  margin-bottom: 14px;
}

.header-card {
  background: linear-gradient(135deg, #1fb6a6, #2687e9);
  color: white;
  border-radius: 28px;
  padding: 22px;
}

.header-card span {
  background: rgba(255, 255, 255, 0.22);
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.header-card h1 {
  margin: 18px 0 8px;
}

.header-card p {
  margin: 0;
  opacity: 0.9;
}

.amount-card,
.bank-card,
.upload-card {
  background: white;
  border-radius: 24px;
  padding: 18px;
  margin-top: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.amount-card span {
  color: #64748b;
}

.amount-card strong {
  display: block;
  color: #7a2433;
  font-size: 42px;
  margin-top: 8px;
}

.bank-card h2,
.upload-card h2 {
  margin-top: 0;
  color: #0f172a;
}

.bank-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #eef2f7;
  padding: 12px 0;
}

.bank-row span {
  color: #64748b;
}

.bank-row strong {
  text-align: right;
}

.qr-image {
  width: 220px;
  max-width: 100%;
  margin: 18px auto;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
}

.note {
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

input {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
}

.file-name {
  color: #0f766e;
  font-weight: 800;
}

.full {
  width: 100%;
  margin-top: 16px;
}

.whatsapp-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  text-align: center;
  background: #25d366;
  color: white;
  padding: 14px 18px;
  border-radius: 999px;
  font-weight: 900;
}
</style>