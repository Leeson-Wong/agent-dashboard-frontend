<template>
  <div :class="cardClasses" :style="cardStyles">
    <!-- Card Header -->
    <div v-if="$slots.header || title || subtitle" class="card__header">
      <slot name="header">
        <div class="card__header-content">
          <div v-if="title" class="card__title">{{ title }}</div>
          <div v-if="subtitle" class="card__subtitle">{{ subtitle }}</div>
        </div>
        <div v-if="$slots.actions" class="card__actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>

    <!-- Card Body -->
    <div v-if="$slots.default" class="card__body" :class="bodyClasses">
      <slot />
    </div>

    <!-- Card Footer -->
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>

    <!-- Card Overlay -->
    <div v-if="$slots.overlay" class="card__overlay">
      <slot name="overlay" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type CardSize = 'sm' | 'md' | 'lg'
export type CardElevation = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  title?: string
  subtitle?: string
  variant?: CardVariant
  size?: CardSize
  elevation?: CardElevation
  hoverable?: boolean
  clickable?: boolean
  bordered?: boolean
  padding?: string
  bodyPadding?: string
  noPadding?: boolean
  rounded?: boolean
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  elevation: 'sm',
  hoverable: false,
  clickable: false,
  bordered: false,
  noPadding: false,
  rounded: true
})

// Card classes
const cardClasses = computed(() => {
  return [
    'card',
    `card--${props.variant}`,
    `card--${props.size}`,
    `card--elevation-${props.elevation}`,
    {
      'card--hoverable': props.hoverable,
      'card--clickable': props.clickable,
      'card--bordered': props.bordered,
      'card--no-padding': props.noPadding,
      'card--rounded': props.rounded
    }
  ]
})

// Body classes
const bodyClasses = computed(() => {
  return {
    'card__body--no-padding': props.noPadding
  }
})

// Card styles
const cardStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.padding) {
    styles.padding = props.padding
  }

  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor
  }

  return styles
})
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

/* Variants */
.card--primary {
  background-color: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.card--success {
  background-color: #f0fdf4;
  border-left: 4px solid #22c55e;
}

.card--warning {
  background-color: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.card--error {
  background-color: #fef2f2;
  border-left: 4px solid #ef4444;
}

.card--info {
  background-color: #ecfeff;
  border-left: 4px solid #06b6d4;
}

/* Sizes */
.card--sm .card__body {
  font-size: 0.875rem;
}

.card--md .card__body {
  font-size: 1rem;
}

.card--lg .card__body {
  font-size: 1.125rem;
}

/* Elevations */
.card--elevation-none {
  box-shadow: none;
}

.card--elevation-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.card--elevation-sm {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.card--elevation-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.card--elevation-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.card--elevation-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

/* Hoverable */
.card--hoverable:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Clickable */
.card--clickable {
  cursor: pointer;
}

.card--clickable:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card--clickable:active {
  transform: translateY(0);
}

/* Bordered */
.card--bordered {
  border: 1px solid #e5e7eb;
}

/* Rounded */
.card--rounded {
  border-radius: 0.5rem;
}

/* No padding */
.card--no-padding .card__body,
.card--no-padding .card__header,
.card--no-padding .card__footer {
  padding: 0;
}

/* Header */
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.card__header-content {
  flex: 1;
}

.card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.card__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

/* Body */
.card__body {
  flex: 1;
  padding: 1.25rem;
  color: #374151;
}

.card__body--no-padding {
  padding: 0;
}

/* Footer */
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  background-color: #f9fafb;
}

/* Overlay */
.card__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0.5rem;
  z-index: 10;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .card {
    background-color: #1f2937;
  }

  .card--primary {
    background-color: #1e3a5f;
    border-left-color: #3b82f6;
  }

  .card--success {
    background-color: #14532d;
    border-left-color: #22c55e;
  }

  .card--warning {
    background-color: #78350f;
    border-left-color: #f59e0b;
  }

  .card--error {
    background-color: #7f1d1d;
    border-left-color: #ef4444;
  }

  .card--info {
    background-color: #164e63;
    border-left-color: #06b6d4;
  }

  .card__title {
    color: #f9fafb;
  }

  .card__subtitle {
    color: #9ca3af;
  }

  .card__body {
    color: #d1d5db;
  }

  .card__header,
  .card--bordered {
    border-color: #374151;
  }

  .card__footer {
    background-color: #111827;
    border-color: #374151;
  }

  .card__overlay {
    background-color: rgba(31, 41, 55, 0.9);
  }
}
</style>
