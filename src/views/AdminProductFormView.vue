<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import AdminLayout from '../components/AdminLayout.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const uploading = ref(false)
const imageFile = ref(null)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  slug: '',
  sku: '',
  barcode: '',
  description: '',
  price: 0,
  compare_at_price: 0,
  purchase_price: 0,
  stock_quantity: 0,
  image_url: '',
  display_scope: 'marketplace',
  marketplace_category: '',
  product_badge: '',
  promotion_badge: '',
  track_inventory: false,
  allow_6_month: false,
  allow_12_month: false,
  six_month_price: 0,
  twelve_month_price: 0,
  is_active: true,
  remarks: '',
})

onMounted(async () => {
  if (isEdit.value) {
    await loadProduct()
  }
})

async function loadProduct() {
  loading.value = true

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    alert(error.message)
  } else if (data) {
    Object.assign(form, data)
    updateBadge()
  }

  loading.value = false
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function updateBadge() {
  const badges = {
    skincare: 'Skincare',
    women_health: 'Feminine Care',
    pain_relief: 'Pain Relief',
    supplements: 'Supplements',
    vitamins: 'Vitamins',
    hygiene: 'Personal Care',
    accessories: 'Accessories',
    wellness: 'Wellness',
    medical: 'Medical Supplies',
  }

  form.product_badge = badges[form.marketplace_category] || 'Essential Care'
}

function handleImageSelect(event) {
  imageFile.value = event.target.files?.[0] || null
}

async function uploadProductImage() {
  if (!imageFile.value) return form.image_url

  uploading.value = true

  const file = imageFile.value
  const fileExt = file.name.split('.').pop()
  const safeSlug = form.slug || slugify(form.name) || 'product'
  const filePath = `products/${safeSlug}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Product image upload error:', uploadError)
    uploading.value = false
    throw uploadError
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  uploading.value = false

  return data.publicUrl
}

async function saveProduct() {
  if (!form.name) {
    alert('Please enter product name.')
    return
  }

  loading.value = true

  try {
    if (!form.slug) {
      form.slug = slugify(form.name)
    }

    updateBadge()

    const uploadedImageUrl = await uploadProductImage()

    const payload = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      barcode: form.barcode,
      description: form.description,
      price: Number(form.price || 0),
      compare_at_price: Number(form.compare_at_price || 0),
      purchase_price: Number(form.purchase_price || 0),
      stock_quantity: Number(form.stock_quantity || 0),
      image_url: uploadedImageUrl,
      display_scope: form.display_scope,
      marketplace_category: form.marketplace_category || null,
      product_badge: form.product_badge || 'Essential Care',
      promotion_badge: form.promotion_badge || null,
      track_inventory: Boolean(form.track_inventory),
      allow_6_month: Boolean(form.allow_6_month),
      allow_12_month: Boolean(form.allow_12_month),
      six_month_price: Number(form.six_month_price || 0),
      twelve_month_price: Number(form.twelve_month_price || 0),
      is_active: Boolean(form.is_active),
      remarks: form.remarks,
      updated_at: new Date().toISOString(),
    }

    let result

    if (isEdit.value) {
      result = await supabase
        .from('products')
        .update(payload)
        .eq('id', route.params.id)
    } else {
      result = await supabase
        .from('products')
        .insert([payload])
    }

    if (result.error) {
      alert(result.error.message)
    } else {
      alert('Product saved successfully.')
      router.push('/admin/products')
    }
  } catch (error) {
    alert(error.message || 'Unable to save product.')
  }

  loading.value = false
}
</script>

<template>
  <AdminLayout>
    <div class="form-page">
      <div class="page-head">
        <div>
          <h1>{{ isEdit ? 'Edit Product' : 'New Product' }}</h1>
          <p>Manage Marketplace and Bloom Care products.</p>
        </div>

        <button class="back-btn" @click="$router.push('/admin/products')">
          Back
        </button>
      </div>

      <div class="card">
        <h2>Basic Information</h2>

        <div class="grid-two">
          <div class="form-group">
            <label>Product Name</label>
            <input v-model="form.name" placeholder="Product Name" />
          </div>

          <div class="form-group">
            <label>Slug</label>
            <input v-model="form.slug" placeholder="auto-generated-if-empty" />
          </div>

          <div class="form-group">
            <label>SKU</label>
            <input v-model="form.sku" placeholder="SKU" />
          </div>

          <div class="form-group">
            <label>Barcode</label>
            <input v-model="form.barcode" placeholder="Barcode" />
          </div>
        </div>

        <div class="form-group">
          <label>Product Image</label>

          <div class="image-upload">
            <img
              v-if="form.image_url"
              :src="form.image_url"
              alt="Product image"
            />

            <div v-else class="image-placeholder">
              No image uploaded
            </div>

            <input type="file" accept="image/*" @change="handleImageSelect" />
          </div>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" placeholder="Description" />
        </div>
      </div>

      <div class="card">
        <h2>Visibility & Categorization</h2>

        <div class="grid-two">
          <div class="form-group">
            <label>Display Scope</label>

            <select v-model="form.display_scope">
              <option value="marketplace">Marketplace</option>
              <option value="bloom_care">Bloom Care</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div class="form-group">
            <label>Marketplace Category</label>

            <select v-model="form.marketplace_category" @change="updateBadge">
              <option value="">Select Category</option>
              <option value="skincare">Skincare</option>
              <option value="women_health">Women's Health</option>
              <option value="pain_relief">Pain Relief</option>
              <option value="supplements">Supplements</option>
              <option value="vitamins">Vitamins</option>
              <option value="hygiene">Personal Care</option>
              <option value="accessories">Accessories</option>
              <option value="wellness">Wellness</option>
              <option value="medical">Medical Supplies</option>
            </select>
          </div>

          <div class="form-group">
            <label>Product Badge</label>
            <input v-model="form.product_badge" readonly />
          </div>

          <div class="form-group">
            <label>Promotion Badge</label>

            <select v-model="form.promotion_badge">
              <option value="">None</option>
              <option value="Best Seller">Best Seller</option>
              <option value="New Arrival">New Arrival</option>
              <option value="Limited Edition">Limited Edition</option>
              <option value="Editor's Pick">Editor's Pick</option>
              <option value="Staff Favourite">Staff Favourite</option>
              <option value="Trending">Trending</option>
              <option value="Most Popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Pricing</h2>

        <div class="grid-three">
          <div class="form-group">
            <label>Sale Price</label>
            <input type="number" v-model="form.price" />
          </div>

          <div class="form-group">
            <label>Compare Price</label>
            <input type="number" v-model="form.compare_at_price" />
          </div>

          <div class="form-group">
            <label>Purchase Price</label>
            <input type="number" v-model="form.purchase_price" />
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Inventory</h2>

        <label class="check-row">
          <input type="checkbox" v-model="form.track_inventory" />
          Track Inventory
        </label>

        <div class="form-group">
          <label>Stock Quantity</label>
          <input type="number" v-model="form.stock_quantity" />
        </div>
      </div>

      <div class="card">
        <h2>Subscription Settings</h2>

        <label class="check-row">
          <input type="checkbox" v-model="form.allow_6_month" />
          Enable 6 Month Plan
        </label>

        <div class="form-group">
          <label>6 Month Package Price</label>
          <input type="number" v-model="form.six_month_price" />
        </div>

        <label class="check-row">
          <input type="checkbox" v-model="form.allow_12_month" />
          Enable 12 Month Plan
        </label>

        <div class="form-group">
          <label>12 Month Package Price</label>
          <input type="number" v-model="form.twelve_month_price" />
        </div>
      </div>

      <div class="card">
        <h2>Other Information</h2>

        <label class="check-row">
          <input type="checkbox" v-model="form.is_active" />
          Active Product
        </label>

        <div class="form-group">
          <label>Remarks</label>
          <textarea v-model="form.remarks" rows="4" placeholder="Internal notes" />
        </div>
      </div>

      <button class="save-btn" @click="saveProduct" :disabled="loading || uploading">
        {{ loading || uploading ? 'Saving...' : 'Save Product' }}
      </button>
    </div>
  </AdminLayout>
</template>

<style scoped>
.form-page {
  display: grid;
  gap: 20px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-head h1 {
  margin: 0;
}

.page-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: grid;
  gap: 14px;
}

.card h2 {
  margin: 0;
}

.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.grid-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-weight: 900;
  font-size: 13px;
}

input,
textarea,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
}

input[readonly] {
  background: #f8fafc;
  color: #64748b;
  font-weight: 900;
}

.image-upload {
  display: grid;
  gap: 12px;
}

.image-upload img,
.image-placeholder {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
}

.image-placeholder {
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 13px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
}

.check-row input {
  width: auto;
}

.save-btn {
  border: none;
  background: #2563eb;
  color: white;
  padding: 14px;
  border-radius: 8px;
  font-weight: 900;
}

.back-btn {
  border: none;
  background: #f1f5f9;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .page-head,
  .grid-two,
  .grid-three {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .back-btn,
  .save-btn {
    width: 100%;
  }
}
</style>