<template>
  <span
    :class="badgeClasses"
    :style="badgeStyles"
    :aria-label="ariaLabel"
  >
    <slot>{{ text }}</slot>

    <!-- Dot variant indicator -->
    <span v-if="variant === 'dot'" :class="dotClasses" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type BadgeVariant =
  | 'default'    // Gray badge
  | 'primary'    // Blue badge
  | 'success'    // Green badge
  | 'warning'    // Yellow badge
  | 'error'      // Red badge
  | 'info'       // Light blue badge
  | 'dot'        // Dot indicator

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  text?: string
  variant?: BadgeVariant
  size?: BadgeSize
  rounded?: boolean
  outlined?: boolean
  pulse?: boolean
  color?: string // Custom color
  backgroundColor?: string // Custom background color
  max?: number // Maximum count to display (for count badges)
  count?: number // Count to display
  showZero?: boolean // Show zero count
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  rounded: false,
  outlined: false,
  pulse: false,
  showZero: false
})

// Display text (support count badges with max)
const displayText = computed(() => {
  if (props.count !== undefined) {
    if (!props.showZero && props.count === 0) {
      return ''
    }
    return props.max && props.count > props.max ? `${props.max}+` : props.count.toString()
  }
  return props.text
})

// Badge classes
const badgeClasses = computed(() => {
  return [
    'badge',
    `badge--${props.variant}`,
    `badge--${props.size}`,
    {
      'badge--rounded': props.rounded,
      'badge--outlined': props.outlined,
      'badge--pulse': props.pulse,
      'badge--empty': !displayText.value
    }
  ]
})

// Badge styles (custom colors)
const badgeStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.color) {
    styles.color = props.color
  }

  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor
  }

  return styles
})

// Dot classes
const dotClasses = computed(() => {
  return [
    'badge__dot',
    `badge__dot--${props.variant}`
  ]
})

// Aria label
const ariaLabel = computed(() => {
  if (displayText.value) {
    return displayText.value
  }
  return `${props.variant} indicator`
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.badge--empty {
  padding: 0;
  min-width: auto;
}

/* Variants */
.badge--default {
  background-color: #6b7280;
  color: white;
}

.badge--primary {
  background-color: #3b82f6;
  color: white;
}

.badge--success {
  background-color: #22c55e;
  color: white;
}

.badge--warning {
  background-color: #f59e0b;
  color: white;
}

.badge--error {
  background-color: #ef4444;
  color: white;
}

.badge--info {
  background-color: #06b6d4;
  color: white;
}

.badge--dot {
  background-color: transparent;
  color: inherit;
  padding: 0;
  position: relative;
}

/* Outlined variant */
.badge--outlined.badge--default {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #6b7280;
}

.badge--outlined.badge--primary {
  background-color: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.badge--outlined.badge--success {
  background-color: transparent;
  color: #22c55e;
  border: 1px solid #22c55e;
}

.badge--outlined.badge--warning {
  background-color: transparent;
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

.badge--outlined.badge--error {
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.badge--outlined.badge--info {
  background-color: transparent;
  color: #06b6d4;
  border: 1px solid #06b6d4;
}

/* Sizes */
.badge--xs {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  min-width: 1.25rem;
  height: 1rem;
}

.badge--sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  min-width: 1.5rem;
  height: 1.25rem;
}

.badge--md {
  font-size: 0.875rem;
  padding: 0.375rem 0.625rem;
  min-width: 2rem;
  height: 1.5rem;
}

.badge--lg {
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  min-width: 2.5rem;
  height: 1.75rem;
}

/* Rounded variant */
.badge--rounded {
  border-radius: 9999px;
}

.badge--dot {
  border-radius: 9999px;
}

/* Pulse animation */
.badge--pulse {
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* Dot indicator */
.badge__dot {
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  margin-left: 0.375em;
}

.badge__dot--default {
  background-color: #6b7280;
}

.badge__dot--primary {
  background-color: #3b82f6;
}

.badge__dot--success {
  background-color: #22c55e;
}

.badge__dot--warning {
  background-color: #f59e0b;
}

.badge__dot--error {
  background-color: #ef4444;
}

.badge__dot--info {
  background-color: #06b6d4;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .badge--default {
    background-color: #4b5563;
  }

  .badge--outlined.badge--default {
    color: #9ca3af;
    border-color: #6b7280;
  }
}
</style>
