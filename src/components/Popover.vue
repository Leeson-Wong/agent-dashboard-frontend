<template>
  <div ref="triggerRef" class="popover-wrapper">
    <!-- Trigger Slot -->
    <div
      ref="triggerRef"
      class="popover-trigger"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focusin="handleFocus"
      @focusout="handleBlur"
    >
      <slot name="trigger">
        <Button>{{ triggerText }}</Button>
      </slot>
    </div>

    <!-- Teleport Container -->
    <Teleport to="body">
      <Transition
        :name="transitionName"
        @before-enter="handleBeforeEnter"
        @after-leave="handleAfterLeave"
      >
        <div
          v-if="isOpen"
          ref="popoverRef"
          class="popover"
          :class="popoverClasses"
          :style="popoverStyle"
          @click.stop
        >
          <!-- Arrow -->
          <div v-if="showArrow" class="popover__arrow" :style="arrowStyle"></div>

          <!-- Content -->
          <div class="popover__content">
            <div v-if="title" class="popover__title">
              {{ title }}
            </div>
            <div class="popover__body">
              <slot>{{ content }}</slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'auto'

export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual'

export type PopoverSize = 'sm' | 'md' | 'lg'

interface Props {
  title?: string
  content?: string
  placement?: PopoverPlacement
  trigger?: PopoverTrigger
  size?: PopoverSize
  disabled?: boolean
  offset?: number
  showArrow?: boolean
  width?: number | string
  maxWidth?: number | string
  delay?: number
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
  triggerText?: string
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom',
  trigger: 'click',
  size: 'md',
  disabled: false,
  offset: 8,
  showArrow: true,
  delay: 100,
  closeOnClickOutside: true,
  closeOnEscape: true,
  persistent: false,
  triggerText: 'Trigger',
  modelValue: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open': []
  'close': []
  'before-enter': []
  'after-leave': []
}>()

// Refs
const triggerRef = ref<HTMLElement>()
const popoverRef = ref<HTMLElement>()

// State
const isOpen = ref(props.modelValue ?? false)
const hoverTimer = ref<number | null>(null)
const actualPlacement = ref(props.placement)

// Classes
const popoverClasses = computed(() => [
  'popover',
  `popover--${props.size}`,
  `popover--${actualPlacement.value}`
])

// Style
const popoverStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.maxWidth) {
    style.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  }
  return style
})

// Arrow style
const arrowStyle = computed(() => {
  return {}
})

// Transition name
const transitionName = computed(() => {
  return 'popover'
})

// Toggle popover
const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// Open popover
const open = () => {
  if (props.disabled) return
  isOpen.value = true
}

// Close popover
const close = () => {
  isOpen.value = false
}

// Handle click
const handleClick = () => {
  if (props.trigger === 'click') {
    toggle()
  }
}

// Handle mouse enter
const handleMouseEnter = () => {
  if (props.trigger === 'hover') {
    if (hoverTimer.value) {
      clearTimeout(hoverTimer.value)
    }
    hoverTimer.value = window.setTimeout(() => {
      open()
    }, props.delay)
  }
}

// Handle mouse leave
const handleMouseLeave = () => {
  if (props.trigger === 'hover' && !props.persistent) {
    if (hoverTimer.value) {
      clearTimeout(hoverTimer.value)
    }
    hoverTimer.value = window.setTimeout(() => {
      close()
    }, props.delay)
  }
}

// Handle focus
const handleFocus = () => {
  if (props.trigger === 'focus') {
    open()
  }
}

// Handle blur
const handleBlur = (event: FocusEvent) => {
  if (props.trigger === 'focus' && !props.persistent) {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (!popoverRef.value?.contains(relatedTarget)) {
      close()
    }
  }
}

// Calculate position
const calculatePosition = () => {
  if (!triggerRef.value || !popoverRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const popoverRect = popoverRef.value.getBoundingClientRect()
  const scrollX = window.pageXOffset
  const scrollY = window.pageYOffset

  let top = 0
  let left = 0
  let placement = props.placement

  // Auto placement
  if (placement === 'auto') {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceTop = triggerRect.top
    const spaceBottom = viewportHeight - triggerRect.bottom
    const spaceLeft = triggerRect.left
    const spaceRight = viewportWidth - triggerRect.right

    if (spaceTop >= spaceBottom && spaceTop >= spaceLeft && spaceTop >= spaceRight) {
      placement = 'top'
    } else if (spaceBottom >= spaceTop && spaceBottom >= spaceLeft && spaceBottom >= spaceRight) {
      placement = 'bottom'
    } else if (spaceLeft >= spaceTop && spaceLeft >= spaceBottom && spaceLeft >= spaceRight) {
      placement = 'left'
    } else {
      placement = 'right'
    }
  }

  actualPlacement.value = placement

  // Calculate based on placement
  switch (placement) {
    case 'top':
      top = triggerRect.top + scrollY - popoverRect.height - props.offset
      left = triggerRect.left + scrollX + (triggerRect.width - popoverRect.width) / 2
      break
    case 'top-start':
      top = triggerRect.top + scrollY - popoverRect.height - props.offset
      left = triggerRect.left + scrollX
      break
    case 'top-end':
      top = triggerRect.top + scrollY - popoverRect.height - props.offset
      left = triggerRect.right + scrollX - popoverRect.width
      break
    case 'bottom':
      top = triggerRect.bottom + scrollY + props.offset
      left = triggerRect.left + scrollX + (triggerRect.width - popoverRect.width) / 2
      break
    case 'bottom-start':
      top = triggerRect.bottom + scrollY + props.offset
      left = triggerRect.left + scrollX
      break
    case 'bottom-end':
      top = triggerRect.bottom + scrollY + props.offset
      left = triggerRect.right + scrollX - popoverRect.width
      break
    case 'left':
      top = triggerRect.top + scrollY + (triggerRect.height - popoverRect.height) / 2
      left = triggerRect.left + scrollX - popoverRect.width - props.offset
      break
    case 'left-start':
      top = triggerRect.top + scrollY
      left = triggerRect.left + scrollX - popoverRect.width - props.offset
      break
    case 'left-end':
      top = triggerRect.bottom + scrollY - popoverRect.height
      left = triggerRect.left + scrollX - popoverRect.width - props.offset
      break
    case 'right':
      top = triggerRect.top + scrollY + (triggerRect.height - popoverRect.height) / 2
      left = triggerRect.right + scrollX + props.offset
      break
    case 'right-start':
      top = triggerRect.top + scrollY
      left = triggerRect.right + scrollX + props.offset
      break
    case 'right-end':
      top = triggerRect.bottom + scrollY - popoverRect.height
      left = triggerRect.right + scrollX + props.offset
      break
  }

  // Keep within viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (left < 0) left = 8
  if (left + popoverRect.width > viewportWidth) left = viewportWidth - popoverRect.width - 8
  if (top < 0) top = 8
  if (top + popoverRect.height > viewportHeight) top = viewportHeight - popoverRect.height - 8

  popoverRef.value.style.top = `${top}px`
  popoverRef.value.style.left = `${left}px`
}

// Handle before enter
const handleBeforeEnter = () => {
  emit('before-enter')
  nextTick(() => {
    calculatePosition()
  })
}

// Handle after leave
const handleAfterLeave = () => {
  emit('after-leave')
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    props.closeOnClickOutside &&
    isOpen.value &&
    !triggerRef.value?.contains(event.target as Node) &&
    !popoverRef.value?.contains(event.target as Node)
  ) {
    close()
  }
}

// Handle escape key
const handleEscape = (event: KeyboardEvent) => {
  if (props.closeOnEscape && event.key === 'Escape' && isOpen.value) {
    close()
  }
}

// Handle scroll
const handleScroll = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

// Watch for open state changes
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
  if (newValue) {
    emit('open')
  } else {
    emit('close')
  }
})

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    isOpen.value = newValue
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
  }
})

// Expose methods
defineExpose({
  open,
  close,
  toggle
})
</script>

<style scoped>
.popover-wrapper {
  display: inline-block;
}

.popover-trigger {
  display: inline-block;
}

.popover {
  position: fixed;
  z-index: 1000;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.popover--sm {
  padding: 0.5rem;
}

.popover--md {
  padding: 0.75rem;
}

.popover--lg {
  padding: 1rem;
}

/* Arrow */
.popover__arrow {
  position: absolute;
  width: 0.75rem;
  height: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  transform: rotate(45deg);
}

.popover--top .popover__arrow {
  bottom: -0.375rem;
  left: calc(50% - 0.375rem);
  border-top: none;
  border-left: none;
}

.popover--top-start .popover__arrow {
  bottom: -0.375rem;
  left: 0.75rem;
  border-top: none;
  border-left: none;
}

.popover--top-end .popover__arrow {
  bottom: -0.375rem;
  right: 0.75rem;
  border-top: none;
  border-left: none;
}

.popover--bottom .popover__arrow {
  top: -0.375rem;
  left: calc(50% - 0.375rem);
  border-bottom: none;
  border-right: none;
}

.popover--bottom-start .popover__arrow {
  top: -0.375rem;
  left: 0.75rem;
  border-bottom: none;
  border-right: none;
}

.popover--bottom-end .popover__arrow {
  top: -0.375rem;
  right: 0.75rem;
  border-bottom: none;
  border-right: none;
}

.popover--left .popover__arrow {
  right: -0.375rem;
  top: calc(50% - 0.375rem);
  border-bottom: none;
  border-left: none;
}

.popover--left-start .popover__arrow {
  right: -0.375rem;
  top: 0.75rem;
  border-bottom: none;
  border-left: none;
}

.popover--left-end .popover__arrow {
  right: -0.375rem;
  bottom: 0.75rem;
  border-bottom: none;
  border-left: none;
}

.popover--right .popover__arrow {
  left: -0.375rem;
  top: calc(50% - 0.375rem);
  border-top: none;
  border-right: none;
}

.popover--right-start .popover__arrow {
  left: -0.375rem;
  top: 0.75rem;
  border-top: none;
  border-right: none;
}

.popover--right-end .popover__arrow {
  left: -0.375rem;
  bottom: 0.75rem;
  border-top: none;
  border-right: none;
}

/* Content */
.popover__content {
  position: relative;
  z-index: 1;
}

.popover__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.popover--sm .popover__title {
  font-size: 0.875rem;
}

.popover--lg .popover__title {
  font-size: 1rem;
}

.popover__body {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.popover--sm .popover__body {
  font-size: 0.8125rem;
}

.popover--lg .popover__body {
  font-size: 0.9375rem;
}

/* Transition */
.popover-enter-active,
.popover-leave-active {
  transition: all 0.2s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .popover {
    background-color: #1f2937;
    border-color: #374151;
  }

  .popover__arrow {
    background-color: #1f2937;
    border-color: #374151;
  }

  .popover__title {
    color: #f9fafb;
  }

  .popover__body {
    color: #d1d5db;
  }
}
</style>
