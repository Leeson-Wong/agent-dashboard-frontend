<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :style="buttonStyles"
    :type="nativeType"
    :disabled="disabled || loading"
    :href="href"
    :to="to"
    :target="target"
    v-bind="$attrs"
  >
    <!-- Loading Spinner -->
    <span v-if="loading" class="button__spinner">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle
          class="spinner__path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="spinnerColor"
          stroke-width="5"
        ></circle>
      </svg>
    </span>

    <!-- Icon (Left) -->
    <span v-if="icon && iconPosition === 'left'" class="button__icon button__icon--left">
      <component :is="icon" />
    </span>

    <!-- Button Content -->
    <span v-if="$slots.default" class="button__content" :class="{ 'button__content--hidden': loading }">
      <slot />
    </span>

    <!-- Icon (Right) -->
    <span v-if="icon && iconPosition === 'right'" class="button__icon button__icon--right">
      <component :is="icon" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ButtonVariant =
  | 'default'    // Gray button
  | 'primary'    // Blue button
  | 'success'    // Green button
  | 'warning'    // Yellow button
  | 'error'      // Red button
  | 'info'       // Cyan button
  | 'ghost'      // Transparent with hover

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconPosition = 'left' | 'right'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: any
  iconPosition?: IconPosition
  disabled?: boolean
  loading?: boolean
  block?: boolean
  rounded?: boolean
  outlined?: boolean
  text?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
  href?: string // For link buttons
  to?: string | object // For router-link
  target?: string // For link target
  tag?: string // Override HTML tag
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  iconPosition: 'left',
  nativeType: 'button',
  tag: 'button'
})

// Determine tag based on props
const computedTag = computed(() => {
  if (props.tag !== 'button') return props.tag
  if (props.href) return 'a'
  if (props.to) return 'router-link'
  return 'button'
})

// Button classes
const buttonClasses = computed(() => {
  return [
    'button',
    `button--${props.variant}`,
    `button--${props.size}`,
    {
      'button--disabled': props.disabled,
      'button--loading': props.loading,
      'button--block': props.block,
      'button--rounded': props.rounded,
      'button--outlined': props.outlined,
      'button--text': props.text,
      'button--has-icon': props.icon,
      'button--icon-only': props.icon && !$slots.default
    }
  ]
})

// Button styles (custom colors)
const buttonStyles = computed(() => {
  return {}
})

// Spinner color based on variant
const spinnerColor = computed(() => {
  if (props.outlined || props.text || props.variant === 'ghost') {
    return 'currentColor'
  }
  return '#ffffff'
})
</script>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

/* Button reset */
.button::-moz-focus-inner {
  border: 0;
  padding: 0;
}

/* Sizes */
.button--xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  min-height: 1.5rem;
}

.button--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

.button--md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 2.5rem;
}

.button--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 3rem;
}

.button--xl {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 3.5rem;
}

/* Icon-only sizing */
.button--icon-only.button--xs {
  padding: 0.25rem;
  width: 1.5rem;
}

.button--icon-only.button--sm {
  padding: 0.375rem;
  width: 2rem;
}

.button--icon-only.button--md {
  padding: 0.5rem;
  width: 2.5rem;
}

.button--icon-only.button--lg {
  padding: 0.75rem;
  width: 3rem;
}

.button--icon-only.button--xl {
  padding: 1rem;
  width: 3.5rem;
}

/* Variants - Solid */
.button--default {
  background-color: #6b7280;
  color: white;
  border-color: #6b7280;
}

.button--primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.button--success {
  background-color: #22c55e;
  color: white;
  border-color: #22c55e;
}

.button--warning {
  background-color: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.button--error {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.button--info {
  background-color: #06b6d4;
  color: white;
  border-color: #06b6d4;
}

/* Hover states */
.button--default:hover:not(.button--disabled):not(.button--loading) {
  background-color: #4b5563;
  border-color: #4b5563;
}

.button--primary:hover:not(.button--disabled):not(.button--loading) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.button--success:hover:not(.button--disabled):not(.button--loading) {
  background-color: #16a34a;
  border-color: #16a34a;
}

.button--warning:hover:not(.button--disabled):not(.button--loading) {
  background-color: #d97706;
  border-color: #d97706;
}

.button--error:hover:not(.button--disabled):not(.button--loading) {
  background-color: #dc2626;
  border-color: #dc2626;
}

.button--info:hover:not(.button--disabled):not(.button--loading) {
  background-color: #0891b2;
  border-color: #0891b2;
}

/* Outlined variant */
.button--outlined {
  background-color: transparent;
}

.button--outlined.button--default {
  color: #6b7280;
  border-color: #d1d5db;
}

.button--outlined.button--primary {
  color: #3b82f6;
  border-color: #3b82f6;
}

.button--outlined.button--success {
  color: #22c55e;
  border-color: #22c55e;
}

.button--outlined.button--warning {
  color: #f59e0b;
  border-color: #f59e0b;
}

.button--outlined.button--error {
  color: #ef4444;
  border-color: #ef4444;
}

.button--outlined.button--info {
  color: #06b6d4;
  border-color: #06b6d4;
}

.button--outlined:hover:not(.button--disabled):not(.button--loading) {
  background-color: currentColor;
  background-opacity: 0.1;
}

/* Text variant */
.button--text {
  background-color: transparent;
  border-color: transparent;
}

.button--text.button--default {
  color: #6b7280;
}

.button--text.button--primary {
  color: #3b82f6;
}

.button--text.button--success {
  color: #22c55e;
}

.button--text.button--warning {
  color: #f59e0b;
}

.button--text.button--error {
  color: #ef4444;
}

.button--text.button--info {
  color: #06b6d4;
}

.button--text:hover:not(.button--disabled):not(.button--loading) {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Ghost variant */
.button--ghost {
  background-color: transparent;
  border-color: #e5e7eb;
  color: #374151;
}

.button--ghost:hover:not(.button--disabled):not(.button--loading) {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

/* Rounded variant */
.button--rounded {
  border-radius: 9999px;
}

.button:not(.button--rounded) {
  border-radius: 0.375rem;
}

/* Block variant */
.button--block {
  display: flex;
  width: 100%;
}

/* Disabled state */
.button--disabled,
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
.button--loading {
  pointer-events: none;
  position: relative;
}

/* Icon */
.button__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.button__icon--left {
  margin-right: -0.25rem;
}

.button__icon--right {
  margin-left: -0.25rem;
}

/* Content */
.button__content {
  flex: 1;
}

.button__content--hidden {
  visibility: hidden;
}

/* Loading spinner */
.button__spinner {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.spinner {
  width: 1em;
  height: 1em;
  animation: rotate 2s linear infinite;
}

.spinner__path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .button--default {
    background-color: #4b5563;
    border-color: #4b5563;
  }

  .button--default:hover:not(.button--disabled):not(.button--loading) {
    background-color: #6b7280;
    border-color: #6b7280;
  }

  .button--outlined.button--default {
    color: #9ca3af;
    border-color: #6b7280;
  }

  .button--text.button--default {
    color: #9ca3af;
  }

  .button--ghost {
    border-color: #4b5563;
    color: #d1d5db;
  }

  .button--ghost:hover:not(.button--disabled):not(.button--loading) {
    background-color: #374151;
    border-color: #6b7280;
  }

  .button--text:hover:not(.button--disabled):not(.button--loading) {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
