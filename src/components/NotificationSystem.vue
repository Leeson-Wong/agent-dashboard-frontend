<template>
  <div class="notification-system">
    <!-- Notification Container -->
    <Teleport to="body">
      <TransitionGroup name="notification" tag="div" :class="containerClasses">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="notificationClasses(notification)"
          :style="notificationStyles(notification)"
          role="alert"
          :aria-live="notification.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- Icon -->
          <div class="notification__icon">
            <component :is="getIcon(notification.type)" />
          </div>

          <!-- Content -->
          <div class="notification__content">
            <div v-if="notification.title" class="notification__title">
              {{ notification.title }}
            </div>
            <div class="notification__message">
              {{ notification.message }}
            </div>
          </div>

          <!-- Actions -->
          <div v-if="notification.actions?.length" class="notification__actions">
            <Button
              v-for="action in notification.actions"
              :key="action.label"
              :variant="action.primary ? 'solid' : 'outline'"
              :color="action.color || getActionColor(notification.type)"
              size="sm"
              @click="handleAction(notification, action)"
            >
              {{ action.label }}
            </Button>
          </div>

          <!-- Close Button -->
          <button
            v-if="notification.closable !== false"
            class="notification__close"
            @click="close(notification.id)"
            aria-label="Close notification"
          >
            <CloseIcon />
          </button>

          <!-- Progress Bar (for auto-dismiss) -->
          <div
            v-if="notification.duration && notification.showProgress"
            class="notification__progress"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import type { Notification, NotificationType, NotificationPosition } from '../composables/useNotification'

interface Props {
  notifications: Notification[]
  position?: NotificationPosition
  maxVisible?: number
  closeOnClick?: boolean
  soundEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-right',
  maxVisible: 5,
  closeOnClick: false,
  soundEnabled: false
})

const emit = defineEmits<{
  'close': [id: string | number]
  'click': [notification: Notification]
}>()

// Icons
const InfoIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2'
  }, [h('circle', { cx: '12', cy: '12', r: '10' }), h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }), h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })])
})

const SuccessIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2'
  }, [h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }), h('polyline', { points: '22 4 12 14.01 9 11.01' })])
})

const WarningIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2'
  }, [h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }), h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }), h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })])
})

const ErrorIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2'
  }, [h('circle', { cx: '12', cy: '12', r: '10' }), h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }), h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })])
})

const CloseIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }), h('line', { x1: '6', y1: '6', x2: '18', y2: '18' })])
})

// Get icon for type
const getIcon = (type: NotificationType) => {
  const icons = {
    info: InfoIcon,
    success: SuccessIcon,
    warning: WarningIcon,
    error: ErrorIcon
  }
  return icons[type]
}

// Get action color
const getActionColor = (type: NotificationType) => {
  const colors = {
    info: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'error'
  }
  return colors[type]
}

// Container classes
const containerClasses = computed(() => [
  'notification-container',
  `notification-container--${props.position}`
])

// Notification classes
const notificationClasses = (notification: Notification) => {
  return [
    'notification',
    `notification--${notification.type}`,
    {
      'notification--clickable': notification.onClick
    }
  ]
}

// Notification styles
const notificationStyles = (notification: Notification) => {
  return {}
}

// Close notification
const close = (id: string | number) => {
  emit('close', id)
}

// Handle action click
const handleAction = async (notification: Notification, action: NotificationAction) => {
  if (action.handler) {
    await action.handler()
  }
  if (action.primary || notification.closable !== false) {
    close(notification.id)
  }
}

// Handle notification click
const handleClick = (notification: Notification) => {
  if (notification.onClick) {
    notification.onClick()
    if (props.closeOnClick) {
      close(notification.id)
    }
  }
  emit('click', notification)
}

// Play sound
const playSound = (type: NotificationType) => {
  if (!props.soundEnabled) return

  const sounds = {
    info: '/sounds/notification.mp3',
    success: '/sounds/success.mp3',
    warning: '/sounds/warning.mp3',
    error: '/sounds/error.mp3'
  }

  const audio = new Audio(sounds[type])
  audio.volume = 0.3
  audio.play().catch(() => {
    // Ignore autoplay errors
  })
}

// Watch for new notifications
onMounted(() => {
  // Could add sound watching logic here
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  width: 100%;
  pointer-events: none;
}

/* Positions */
.notification-container--top-left {
  top: 1rem;
  left: 1rem;
}

.notification-container--top-right {
  top: 1rem;
  right: 1rem;
}

.notification-container--top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.notification-container--bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.notification-container--bottom-right {
  bottom: 1rem;
  right: 1rem;
}

.notification-container--bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

/* Notification */
.notification {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  overflow: hidden;
}

.notification--clickable {
  cursor: pointer;
}

.notification--clickable:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08);
}

/* Icon */
.notification__icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
}

.notification--info .notification__icon {
  color: #3b82f6;
}

.notification--success .notification__icon {
  color: #22c55e;
}

.notification--warning .notification__icon {
  color: #f59e0b;
}

.notification--error .notification__icon {
  color: #ef4444;
}

/* Content */
.notification__content {
  flex: 1;
  min-width: 0;
}

.notification__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.notification__message {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Actions */
.notification__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

/* Close Button */
.notification__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.notification__close:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

/* Progress Bar */
.notification__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: currentColor;
  animation: notification-progress linear forwards;
}

.notification--info .notification__progress {
  color: #3b82f6;
}

.notification--success .notification__progress {
  color: #22c55e;
}

.notification--warning .notification__progress {
  color: #f59e0b;
}

.notification--error .notification__progress {
  color: #ef4444;
}

@keyframes notification-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Transition */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-container--top-center .notification-enter-from,
.notification-container--bottom-center .notification-enter-from {
  transform: translateY(-1rem) scale(0.95);
}

.notification-container--top-left .notification-leave-to,
.notification-container--bottom-left .notification-leave-to {
  transform: translateX(-100%);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .notification {
    background-color: #1f2937;
  }

  .notification__title {
    color: #f9fafb;
  }

  .notification__message {
    color: #d1d5db;
  }

  .notification__close:hover {
    background-color: #374151;
    color: #e5e7eb;
  }
}
</style>
