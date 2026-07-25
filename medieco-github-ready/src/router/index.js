import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

import SplashView from '../views/SplashView.vue'
import LandingView from '../views/LandingView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import MarketplaceView from '../views/MarketplaceView.vue'
import PeriodBoxView from '../views/PeriodBoxView.vue'
import ProductView from '../views/ProductView.vue'
import BloomConfiguratorView from '../views/BloomConfiguratorView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import PaymentView from '../views/PaymentView.vue'
import SuccessView from '../views/SuccessView.vue'
import AffiliateView from '../views/AffiliateView.vue'
import OrderTrackingView from '../views/OrderTrackingView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import NotificationsView from '../views/NotificationsView.vue'

import AdminView from '../views/AdminView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminCreateUserView from '../views/AdminCreateUserView.vue'
import AdminPaymentSettingsView from '../views/AdminPaymentSettingsView.vue'
import AdminProductsView from '../views/AdminProductsView.vue'
import AdminProductFormView from '../views/AdminProductFormView.vue'
import AdminOrdersView from '../views/AdminOrdersView.vue'
import AdminInventoryView from '../views/AdminInventoryView.vue'
import AdminAffiliatesView from '../views/AdminAffiliatesView.vue'
import AdminOrderDetailView from '../views/AdminOrderDetailView.vue'

const adminRoles = [
  'admin',
  'master_admin',
  'order_manager',
  'affiliate_manager',
  'support_staff',
  'product_manager',
]

const routes = [
  { path: '/', name: 'splash', component: SplashView },
  { path: '/landing', name: 'landing', component: LandingView },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
  { path: '/home', name: 'home', component: HomeView },
  { path: '/marketplace', name: 'marketplace', component: MarketplaceView },
  { path: '/period-box', name: 'period-box', component: PeriodBoxView },
  { path: '/product/:slug', name: 'product', component: ProductView },
  { path: '/bloom/:slug', name: 'bloom-configurator', component: BloomConfiguratorView },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/checkout', name: 'checkout', component: CheckoutView },
  { path: '/payment/:orderId', name: 'payment', component: PaymentView },
  { path: '/success/:orderId', name: 'success', component: SuccessView },
  { path: '/affiliate', name: 'affiliate', component: AffiliateView },
  { path: '/order-tracking', name: 'order-tracking', component: OrderTrackingView },
  { path: '/profile', name: 'profile', component: ProfileView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/notifications', name: 'notifications', component: NotificationsView },
  
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAdmin: true } },
  { path: '/admin/users', name: 'admin-users', component: AdminUsersView, meta: { requiresAdmin: true } },
  { path: '/admin/users/create', name: 'admin-create-user', component: AdminCreateUserView, meta: { requiresAdmin: true } },
  { path: '/admin/payment-settings', name: 'admin-payment-settings', component: AdminPaymentSettingsView, meta: { requiresAdmin: true } },
  { path: '/admin/products', name: 'admin-products', component: AdminProductsView, meta: { requiresAdmin: true } },
  { path: '/admin/products/new', name: 'admin-product-new', component: AdminProductFormView, meta: { requiresAdmin: true } },
  { path: '/admin/products/:id', name: 'admin-product-edit', component: AdminProductFormView, meta: { requiresAdmin: true } },
  { path: '/admin/orders', name: 'admin-orders', component: AdminOrdersView, meta: { requiresAdmin: true } },
  { path: '/admin/orders/:id', name: 'admin-order-detail', component: AdminOrderDetailView, meta: { requiresAdmin: true } },
  { path: '/admin/inventory', name: 'admin-inventory', component: AdminInventoryView, meta: { requiresAdmin: true } },
  { path: '/admin/affiliates', name: 'admin-affiliates', component: AdminAffiliatesView, meta: { requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return true

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return '/landing'

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status === 'suspended') {
    await supabase.auth.signOut()
    return '/landing'
  }

  if (!adminRoles.includes(profile.role)) {
  console.warn('Access denied. Admin only.')
  return '/home'
}

  return true
})

export default router