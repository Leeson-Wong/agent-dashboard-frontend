<template>
  <div class="toast-container">
    <div class="toast-list">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :id="toast.id"
        :type="toast.type"
        :message="toast.message"
        :title="toast.title"
        :duration="toast.duration"
        :closable="toast.closable"
        :clickable="toast.clickable"
        :on-close="() => removeToast(toast.id)"
        @click="toast.onClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Toast, { type ToastType } from './Toast.vue'
import type { ToastItem } from '../types/toast'

interface Props {
  toasts: ToastItem[]
}

interface Emits {
  (e: 'remove', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const removeToast = (id: string): void => {
  emit('remove', id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

/* Responsive */
@media (max-width: 640px) {
  .toast-container {
    top: 16px;
    right: 16px;
    left: 16px;
  }
}
</style>
