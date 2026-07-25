<template>
  <section class="toast-container">
    <article
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', toast.type]"
    >
      <div>
        <strong>{{ toast.title }}</strong>
        <p v-if="toast.message">{{ toast.message }}</p>
      </div>

      <button @click="removeToast(toast.id)">×</button>
    </article>
  </section>
</template>

<script setup>
import { toasts, removeToast } from '../stores/toast'
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 9999;
  display: grid;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
}

.toast {
  background: white;
  border-radius: 18px;
  padding: 14px 14px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-left: 6px solid #0f766e;
}

.toast.success {
  border-left-color: #0f766e;
}

.toast.error {
  border-left-color: #991b1b;
}

.toast.warning {
  border-left-color: #f59e0b;
}

.toast.info {
  border-left-color: #2563eb;
}

.toast strong {
  color: #0f172a;
}

.toast p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.toast button {
  border: none;
  background: transparent;
  font-size: 20px;
  color: #64748b;
}

@media (max-width: 600px) {
  .toast-container {
    top: auto;
    right: 16px;
    bottom: 16px;
  }
}
</style>