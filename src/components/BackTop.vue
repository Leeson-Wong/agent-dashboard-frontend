<template>
  <Transition name="back-top">
    <div
      v-if="visible"
      :class="backTopClasses"
      @click="scrollToTop"
    >
      <slot>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

export type BackTopPosition = 'right' | 'left'
export type BackTopSize = 'sm' | 'md' | 'lg'
export type BackTopVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  visibilityHeight?: number
  target?: string | (() => HTMLElement)
  duration?: number
  position?: BackTopPosition
  size?: BackTopSize
  variant?: BackTopVariant
  right?: number | string
  bottom?: number | string
  easing?: string
}

const props = withDefaults(defineProps<Props>(), {
  visibilityHeight: 400,
  duration: 450,
  position: 'right',
  size: 'md',
  variant: 'default',
  right: 40,
  bottom: 40,
  easing: 'ease-in-out'
})

const emit = defineEmits<{
  click: []
}>()

// State
const visible = ref(false)
const scrollTop = ref(0)

// BackTop classes
const backTopClasses = computed(() => [
  'back-top',
  `back-top--${props.position}`,
  `back-top--${props.size}`,
  `back-top--${props.variant}`
])

// Style
const style = computed(() => {
  const styles: Record<string, string> = {}

  if (props.position === 'right') {
    styles.right = typeof props.right === 'number' ? `${props.right}px` : props.right
  } else {
    styles.left = typeof props.right === 'number' ? `${props.right}px` : props.right
  }

  styles.bottom = typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom

  return styles
})

// Get scroll container
const getContainer = (): HTMLElement | Window => {
  if (!props.target) return window

  if (typeof props.target === 'string') {
    const el = document.querySelector(props.target) as HTMLElement
    return el || window
  }

  if (typeof props.target === 'function') {
    const el = props.target()
    return el || window
  }

  return window
}

// Handle scroll
const handleScroll = () => {
  const container = getContainer()

  let currentScroll = 0

  if (container === window) {
    currentScroll = window.pageYOffset || document.documentElement.scrollTop
  } else {
    currentScroll = (container as HTMLElement).scrollTop
  }

  scrollTop.value = currentScroll
  visible.value = currentScroll >= props.visibilityHeight
}

// Scroll to top
const scrollToTop = () => {
  emit('click')

  const container = getContainer()
  const startTime = performance.now()
  const startScroll = scrollTop.value

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)

    // Easing function
    const ease = getEasingProgress(progress)
    const currentScroll = startScroll * (1 - ease)

    if (container === window) {
      window.scrollTo(0, currentScroll)
    } else {
      (container as HTMLElement).scrollTop = currentScroll
    }

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    } else {
      if (container === window) {
        window.scrollTo(0, 0)
      } else {
        (container as HTMLElement).scrollTop = 0
      }
    }
  }

  requestAnimationFrame(animateScroll)
}

// Easing function
const getEasingProgress = (progress: number): number => {
  switch (props.easing) {
    case 'linear':
      return progress
    case 'ease-in':
      return progress * progress
    case 'ease-out':
      return progress * (2 - progress)
    case 'ease-in-out':
    default:
      return progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress
  }
}

// Lifecycle
onMounted(() => {
  const container = getContainer()
  container.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  const container = getContainer()
  container.removeEventListener('scroll', handleScroll)
})

// Expose methods
defineExpose({
  scrollToTop
})
</script>

<style scoped>
.back-top {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  color: #6b7280;
}

.back-top:hover {
  background-color: #f9fafb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #111827;
}

.back-top:active {
  transform: scale(0.95);
}

/* Sizes */
.back-top--sm {
  width: 2rem;
  height: 2rem;
}

.back-top--sm svg {
  width: 0.875rem;
  height: 0.875rem;
}

.back-top--md {
  width: 2.5rem;
  height: 2.5rem;
}

.back-top--md svg {
  width: 1rem;
  height: 1rem;
}

.back-top--lg {
  width: 3rem;
  height: 3rem;
}

.back-top--lg svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Variants */
.back-top--default {
  background-color: #ffffff;
  border-color: #e5e7eb;
}

.back-top--primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.back-top--primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.back-top--success {
  background-color: #22c55e;
  border-color: #22c55e;
  color: #ffffff;
}

.back-top--success:hover {
  background-color: #16a34a;
  border-color: #16a34a;
}

.back-top--warning {
  background-color: #f59e0b;
  border-color: #f59e0b;
  color: #ffffff;
}

.back-top--warning:hover {
  background-color: #d97706;
  border-color: #d97706;
}

.back-top--error {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

.back-top--error:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

/* SVG */
.back-top svg {
  display: block;
}

/* Transition */
.back-top-enter-active,
.back-top-leave-active {
  transition: all 0.3s ease;
}

.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .back-top--default {
    background-color: #1f2937;
    border-color: #374151;
  }

  .back-top--default:hover {
    background-color: #374151;
    color: #f9fafb;
  }
}
</style>
