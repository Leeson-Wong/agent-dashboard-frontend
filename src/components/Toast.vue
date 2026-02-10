<template>
  <Transition :name="transitionName">
    <div
      v-if="visible"
      :class="['toast', `toast-${type}`, { 'toast-clickable': clickable, 'toast-paused': isPaused }]"
      @mouseenter="pause"
      @mouseleave="resume"
    >
      <div class="toast-icon">{{ icon }}</div>
      <div class="toast-content">
        <div v-if="title" class="toast-title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
      </div>
      <button v-if="closable" class="toast-close" @click="close">×</button>
      <div v-if="showProgress" class="toast-progress">
        <div class="toast-progress-bar" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Props {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
  closable?: boolean
  clickable?: boolean
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000,
  closable: true,
  clickable: false,
})

const visible = ref(false)
const progressWidth = ref(100)
const isPaused = ref(false)
const showProgress = computed(() => props.duration > 0)
const transitionName = computed(() => `toast-${props.type}`)

const icon = computed(() => {
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ⓘ',
    warning: '⚠',
  }
  return icons[props.type]
})

let timer: ReturnType<typeof setTimeout> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null
let remainingTime = props.duration
let lastUpdateTime = Date.now()

const close = (): void => {
  visible.value = false
  if (timer) clearTimeout(timer)
  if (progressTimer) clearInterval(progressTimer)
  props.onClose?.()
}

const pause = (): void => {
  if (!isPaused.value && remainingTime > 0) {
    isPaused.value = true
    // Save remaining time
    remainingTime = remainingTime - (Date.now() - lastUpdateTime)

    // Clear timers but don't close
    if (timer) clearTimeout(timer)
    if (progressTimer) clearInterval(progressTimer)
  }
}

const resume = (): void => {
  if (isPaused.value && remainingTime > 0) {
    isPaused.value = false
    lastUpdateTime = Date.now()

    // Restart with remaining time
    timer = setTimeout(() => {
      close()
    }, remainingTime)

    startProgress(remainingTime)
  }
}

const startProgress = (duration?: number): void => {
  const actualDuration = duration || props.duration
  if (actualDuration <= 0) return

  const interval = 50 // Update every 50ms
  const steps = actualDuration / interval
  const decrement = 100 / steps

  progressTimer = setInterval(() => {
    progressWidth.value -= decrement
    if (progressWidth.value <= 0) {
      close()
    }
  }, interval)
}

onMounted(() => {
  // Small delay to ensure transition works
  setTimeout(() => {
    visible.value = true
  }, 10)

  if (props.duration > 0) {
    lastUpdateTime = Date.now()
    timer = setTimeout(() => {
      close()
    }, props.duration)

    startProgress()
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<style scoped>
.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.toast:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.toast-paused {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border-radius: 50%;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.toast-close:hover {
  color: #f1f5f9;
}

.toast-clickable {
  cursor: pointer;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.toast-progress-bar {
  height: 100%;
  background: currentColor;
  transition: width 0.05s linear;
}

/* Toast Types */
.toast-success {
  border-left: 4px solid #22c55e;
}

.toast-success .toast-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.toast-success .toast-progress-bar {
  background: #22c55e;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toast-error .toast-progress-bar {
  background: #ef4444;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-info .toast-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.toast-info .toast-progress-bar {
  background: #3b82f6;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.toast-warning .toast-progress-bar {
  background: #f59e0b;
}

/* Transitions */
.toast-success-enter-active,
.toast-success-leave-active,
.toast-error-enter-active,
.toast-error-leave-active,
.toast-info-enter-active,
.toast-info-leave-active,
.toast-warning-enter-active,
.toast-warning-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-success-enter-from,
.toast-error-enter-from,
.toast-info-enter-from,
.toast-warning-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-success-leave-to,
.toast-error-leave-to,
.toast-info-leave-to,
.toast-warning-leave-to {
  opacity: 0;
  transform: translateX(20%) scale(0.95);
}
</style>
