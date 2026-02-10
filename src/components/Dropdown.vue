<template>
  <div ref="containerRef" class="dropdown" :class="dropdownClasses" v-bind="$attrs">
    <!-- Trigger -->
    <component
      :is="triggerTag"
      ref="triggerRef"
      class="dropdown__trigger"
      :class="triggerClasses"
      tabindex="0"
      @click="handleTriggerClick"
      @keydown="handleTriggerKeydown"
    >
      <slot name="trigger">
        <Button
          :variant="buttonVariant"
          :size="size"
          :disabled="disabled"
          :icon="icon"
          :icon-right="isOpen && arrowIcon ? ChevronUpIcon : ChevronDownIcon"
        >
          {{ label }}
        </Button>
      </slot>
    </component>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="menuRef"
          class="dropdown__menu"
          :class="menuClasses"
          :style="menuStyles"
          role="menu"
          @click="handleMenuClick"
        >
          <!-- Arrow -->
          <div v-if="showArrow" :class="arrowClasses" :style="arrowStyles"></div>

          <!-- Menu Header -->
          <div v-if="$slots.header" class="dropdown__header">
            <slot name="header" />
          </div>

          <!-- Menu Items -->
          <div class="dropdown__items" role="presentation">
            <slot />
          </div>

          <!-- Menu Footer -->
          <div v-if="$slots.footer" class="dropdown__footer">
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Button from './Button.vue'

export type DropdownSize = 'sm' | 'md' | 'lg'
export type DropdownPlacement = 'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end'
export type DropdownTrigger = 'click' | 'hover'
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link'

interface Props {
  label?: string
  size?: DropdownSize
  placement?: DropdownPlacement
  trigger?: DropdownTrigger
  disabled?: boolean
  icon?: any
  arrowIcon?: boolean
  showArrow?: boolean
  buttonVariant?: ButtonVariant
  closeOnClick?: boolean
  closeOnOutsideClick?: boolean
  offset?: number
  minWidth?: number
  maxWidth?: number
  triggerTag?: string
  teleport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  placement: 'bottom',
  trigger: 'click',
  disabled: false,
  arrowIcon: true,
  showArrow: false,
  buttonVariant: 'outline',
  closeOnClick: true,
  closeOnOutsideClick: true,
  offset: 4,
  minWidth: 150,
  triggerTag: 'div'
})

const emit = defineEmits<{
  'open': []
  'close': []
  'toggle': [isOpen: boolean]
}>()

// Icons
const ChevronDownIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polyline', { points: '6 9 12 15 18 9' })])
})

const ChevronUpIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polyline', { points: '18 15 12 9 6 15' })])
})

// Refs
const containerRef = ref<HTMLElement>()
const triggerRef = ref<HTMLElement>()
const menuRef = ref<HTMLElement>()

// State
const isOpen = ref(false)
const position = ref({ top: '0px', left: '0px' })
const arrowPosition = ref({ top: '0px', left: '0px' })

// Computed classes
const dropdownClasses = computed(() => [
  'dropdown',
  `dropdown--${props.size}`,
  {
    'dropdown--open': isOpen.value,
    'dropdown--disabled': props.disabled
  }
])

const triggerClasses = computed(() => [
  'dropdown__trigger',
  {
    'dropdown__trigger--active': isOpen.value
  }
])

const menuClasses = computed(() => [
  'dropdown__menu',
  `dropdown__menu--${props.placement}`,
  `dropdown__menu--${props.size}`
])

const menuStyles = computed(() => ({
  top: position.value.top,
  left: position.value.left,
  minWidth: `${props.minWidth}px`,
  maxWidth: props.maxWidth ? `${props.maxWidth}px` : undefined
}))

const arrowClasses = computed(() => [
  'dropdown__arrow',
  `dropdown__arrow--${props.placement}`
])

const arrowStyles = computed(() => ({
  top: arrowPosition.value.top,
  left: arrowPosition.value.left
}))

// Calculate position
const calculatePosition = () => {
  if (!triggerRef.value || !menuRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const menu = menuRef.value.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset

  let top = 0
  let left = 0
  let arrowTop = 0
  let arrowLeft = 0

  if (props.placement.startsWith('bottom')) {
    top = trigger.bottom + scrollY + props.offset
    left = trigger.left + scrollX + (trigger.width - menu.width) / 2

    if (props.placement === 'bottom-start') {
      left = trigger.left + scrollX
    } else if (props.placement === 'bottom-end') {
      left = trigger.right + scrollX - menu.width
    }

    arrowTop = '-0.375rem'
    arrowLeft = props.placement === 'bottom-start' ? '0.75rem' : props.placement === 'bottom-end' ? 'auto' : '50%'
  } else if (props.placement.startsWith('top')) {
    top = trigger.top + scrollY - menu.height - props.offset
    left = trigger.left + scrollX + (trigger.width - menu.width) / 2

    if (props.placement === 'top-start') {
      left = trigger.left + scrollX
    } else if (props.placement === 'top-end') {
      left = trigger.right + scrollX - menu.width
    }

    arrowTop = '100%'
    arrowLeft = props.placement === 'top-start' ? '0.75rem' : props.placement === 'top-end' ? 'auto' : '50%'
  } else if (props.placement.startsWith('right')) {
    top = trigger.top + scrollY + (trigger.height - menu.height) / 2
    left = trigger.right + scrollX + props.offset

    if (props.placement === 'right-start') {
      top = trigger.top + scrollY
    } else if (props.placement === 'right-end') {
      top = trigger.bottom + scrollY - menu.height
    }

    arrowTop = props.placement === 'right-start' ? '0.75rem' : props.placement === 'right-end' ? 'auto' : '50%'
    arrowLeft = '-0.375rem'
  } else if (props.placement.startsWith('left')) {
    top = trigger.top + scrollY + (trigger.height - menu.height) / 2
    left = trigger.left + scrollX - menu.width - props.offset

    if (props.placement === 'left-start') {
      top = trigger.top + scrollY
    } else if (props.placement === 'left-end') {
      top = trigger.bottom + scrollY - menu.height
    }

    arrowTop = props.placement === 'left-start' ? '0.75rem' : props.placement === 'left-end' ? 'auto' : '50%'
    arrowLeft = '100%'
  }

  position.value = { top: `${top}px`, left: `${left}px` }
  arrowPosition.value = { top: `${arrowTop}`, left: `${arrowLeft}` }
}

// Open dropdown
const open = () => {
  if (props.disabled) return
  isOpen.value = true
  nextTick(calculatePosition)
  emit('open')
  emit('toggle', true)
}

// Close dropdown
const close = () => {
  isOpen.value = false
  emit('close')
  emit('toggle', false)
}

// Toggle dropdown
const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// Handle trigger click
const handleTriggerClick = () => {
  if (props.trigger === 'click') {
    toggle()
  }
}

// Handle trigger keydown
const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  } else if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

// Handle menu click
const handleMenuClick = () => {
  if (props.closeOnClick) {
    close()
  }
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    props.closeOnOutsideClick &&
    isOpen.value &&
    containerRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    menuRef.value &&
    !menuRef.value.contains(event.target as Node)
  ) {
    close()
  }
}

// Handle scroll
const handleScroll = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

// Handle resize
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

// Handle hover
const handleMouseEnter = () => {
  if (props.trigger === 'hover') {
    open()
  }
}

const handleMouseLeave = () => {
  if (props.trigger === 'hover') {
    close()
  }
}

// Watch for placement changes
watch(() => props.placement, () => {
  if (isOpen.value) {
    calculatePosition()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)

  if (props.trigger === 'hover' && containerRef.value) {
    containerRef.value.addEventListener('mouseenter', handleMouseEnter)
    containerRef.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)

  if (containerRef.value) {
    containerRef.value.removeEventListener('mouseenter', handleMouseEnter)
    containerRef.value.removeEventListener('mouseleave', handleMouseLeave)
  }
})
</script>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown--disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* Trigger */
.dropdown__trigger {
  cursor: pointer;
}

.dropdown__trigger--active {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Menu */
.dropdown__menu {
  position: fixed;
  z-index: 9999;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.25rem;
  min-width: 150px;
}

/* Sizes */
.dropdown__menu--sm {
  padding: 0.125rem;
}

.dropdown__menu--md {
  padding: 0.25rem;
}

.dropdown__menu--lg {
  padding: 0.375rem;
}

/* Arrow */
.dropdown__arrow {
  position: absolute;
  width: 0.75rem;
  height: 0.75rem;
  background-color: inherit;
  border: inherit;
  transform: rotate(45deg);
  z-index: -1;
}

.dropdown__arrow--bottom {
  top: -0.375rem;
  border-right: none;
  border-bottom: none;
}

.dropdown__arrow--top {
  bottom: -0.375rem;
  border-left: none;
  border-top: none;
}

.dropdown__arrow--right {
  left: -0.375rem;
  border-left: none;
  border-bottom: none;
}

.dropdown__arrow--left {
  right: -0.375rem;
  border-right: none;
  border-top: none;
}

/* Centered arrows */
.dropdown__arrow--bottom:not(.dropdown__arrow--bottom-start):not(.dropdown__arrow--bottom-end),
.dropdown__arrow--top:not(.dropdown__arrow--top-start):not(.dropdown__arrow--top-end) {
  left: 50% !important;
  transform: translateX(-50%) rotate(45deg);
}

.dropdown__arrow--right:not(.dropdown__arrow--right-start):not(.dropdown__arrow--right-end),
.dropdown__arrow--left:not(.dropdown__arrow--left-start):not(.dropdown__arrow--left-end) {
  top: 50% !important;
  transform: translateY(-50%) rotate(45deg);
}

/* Header */
.dropdown__header {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

/* Items */
.dropdown__items {
  max-height: 300px;
  overflow-y: auto;
}

/* Footer */
.dropdown__footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .dropdown__menu {
    background-color: #1f2937;
    border-color: #374151;
  }

  .dropdown__header {
    border-color: #374151;
    color: #9ca3af;
  }

  .dropdown__footer {
    border-color: #374151;
    color: #6b7280;
  }
}
</style>
