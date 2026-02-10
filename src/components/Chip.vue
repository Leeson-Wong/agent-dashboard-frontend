<template>
  <span :class="chipClasses" :style="chipStyles">
    <!-- Icon (left) -->
    <component
      v-if="icon && !iconRight"
      :is="icon"
      class="chip__icon chip__icon--left"
    />

    <!-- Avatar -->
    <span v-if="avatar" class="chip__avatar chip__avatar--left">
      <img v-if="typeof avatar === 'string'" :src="avatar" :alt="label" />
      <component v-else :is="avatar" />
    </span>

    <!-- Label / Slot -->
    <span class="chip__label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Trailing icon -->
    <component
      v-if="iconRight"
      :is="icon"
      class="chip__icon chip__icon--right"
    />

    <!-- Close button -->
    <button
      v-if="closable"
      type="button"
      class="chip__close"
      :aria-label="closeAriaLabel"
      @click="handleClose"
    >
      <component :is="closeIcon" class="chip__close-icon" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export type ChipSize = 'xs' | 'sm' | 'md' | 'lg'
export type ChipVariant = 'default' | 'solid' | 'outline' | 'soft'
export type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

interface Props {
  label?: string
  size?: ChipSize
  variant?: ChipVariant
  color?: ChipColor
  icon?: any
  iconRight?: boolean
  avatar?: string | any
  closable?: boolean
  closeIcon?: any
  closeAriaLabel?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  color: 'default',
  closeAriaLabel: 'Remove',
  disabled: false
})

const emit = defineEmits<{
  'close': []
}>()

// Default close icon
const defaultCloseIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    h('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  ])
})

const closeIcon = computed(() => props.closeIcon || defaultCloseIcon)

// Chip classes
const chipClasses = computed(() => {
  return [
    'chip',
    `chip--${props.size}`,
    `chip--${props.variant}`,
    props.variant !== 'default' ? `chip--${props.color}` : '',
    {
      'chip--closable': props.closable,
      'chip--disabled': props.disabled,
      'chip--has-icon': props.icon,
      'chip--has-avatar': props.avatar
    }
  ]
})

// Chip styles
const chipStyles = computed(() => {
  const styles: Record<string, string> = {}

  return styles
})

// Handle close
const handleClose = (event: Event): void => {
  event.stopPropagation()
  if (!props.disabled) {
    emit('close')
  }
}
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* Sizes */
.chip--xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  gap: 0.25rem;
}

.chip--sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.chip--md {
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  gap: 0.375rem;
}

.chip--lg {
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  gap: 0.5rem;
}

/* Variant: Default */
.chip--default {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.chip--default:hover {
  background-color: #e5e7eb;
}

/* Variant: Solid */
.chip--solid.chip--primary {
  background-color: #3b82f6;
  color: #ffffff;
  border: 1px solid #3b82f6;
}

.chip--solid.chip--success {
  background-color: #22c55e;
  color: #ffffff;
  border: 1px solid #22c55e;
}

.chip--solid.chip--warning {
  background-color: #f59e0b;
  color: #ffffff;
  border: 1px solid #f59e0b;
}

.chip--solid.chip--error {
  background-color: #ef4444;
  color: #ffffff;
  border: 1px solid #ef4444;
}

.chip--solid.chip--info {
  background-color: #06b6d4;
  color: #ffffff;
  border: 1px solid #06b6d4;
}

/* Variant: Outline */
.chip--outline.chip--primary {
  background-color: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.chip--outline.chip--success {
  background-color: transparent;
  color: #22c55e;
  border: 1px solid #22c55e;
}

.chip--outline.chip--warning {
  background-color: transparent;
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

.chip--outline.chip--error {
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.chip--outline.chip--info {
  background-color: transparent;
  color: #06b6d4;
  border: 1px solid #06b6d4;
}

.chip--outline:hover {
  opacity: 0.8;
}

/* Variant: Soft */
.chip--soft.chip--primary {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.chip--soft.chip--success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.chip--soft.chip--warning {
  background-color: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}

.chip--soft.chip--error {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.chip--soft.chip--info {
  background-color: #cffafe;
  color: #0e7490;
  border: 1px solid #a5f3fc;
}

/* Icon */
.chip__icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

.chip__icon--left {
  margin-left: -0.125rem;
}

.chip__icon--right {
  margin-right: -0.125rem;
}

/* Avatar */
.chip__avatar {
  width: 1.25em;
  height: 1.25em;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip__avatar--left {
  margin-left: -0.125rem;
}

.chip__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Label */
.chip__label {
  display: inline-flex;
  align-items: center;
}

/* Close button */
.chip__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  margin-right: -0.25rem;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.chip__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.chip__close:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.chip__close-icon {
  width: 0.875em;
  height: 0.875em;
}

/* Disabled */
.chip--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.chip--disabled .chip__close {
  cursor: not-allowed;
}

/* Closable spacing */
.chip--closable .chip__label {
  padding-right: 0.125rem;
}

/* Avatar sizes */
.chip--xs .chip__avatar {
  width: 1em;
  height: 1em;
}

.chip--sm .chip__avatar {
  width: 1.125em;
  height: 1.125em;
}

.chip--md .chip__avatar {
  width: 1.25em;
  height: 1.25em;
}

.chip--lg .chip__avatar {
  width: 1.5em;
  height: 1.5em;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .chip--default {
    background-color: #374151;
    color: #e5e7eb;
    border-color: #4b5563;
  }

  .chip--default:hover {
    background-color: #4b5563;
  }

  .chip__close:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
