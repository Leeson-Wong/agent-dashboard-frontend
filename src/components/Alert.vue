<template>
  <div :class="alertClasses" role="alert">
    <!-- Icon -->
    <div v-if="showIcon" class="alert__icon">
      <slot name="icon">
        <component :is="defaultIcon" class="alert__icon-svg" />
      </slot>
    </div>

    <!-- Content -->
    <div class="alert__content">
      <!-- Title -->
      <div v-if="title || $slots.title" class="alert__title">
        <slot name="title">{{ title }}</slot>
      </div>

      <!-- Message -->
      <div v-if="$slots.default || message" class="alert__message">
        <slot>{{ message }}</slot>
      </div>
    </div>

    <!-- Close Button -->
    <button
      v-if="closable"
      type="button"
      class="alert__close"
      :aria-label="closeButtonLabel"
      @click="handleClose"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export type AlertType = 'info' | 'success' | 'warning' | 'error'
export type AlertSize = 'sm' | 'md' | 'lg'
export type AlertVariant = 'solid' | 'outline' | 'soft'

interface Props {
  type?: AlertType
  variant?: AlertVariant
  size?: AlertSize
  title?: string
  message?: string
  closable?: boolean
  showIcon?: boolean
  closeButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  variant: 'solid',
  size: 'md',
  closable: false,
  showIcon: true,
  closeButtonLabel: 'Close alert'
})

const emit = defineEmits<{
  'close': []
}>()

// Default icons for each type
const defaultIcon = computed(() => {
  const icons = {
    info: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
        h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
      ])
    }),
    success: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [
        h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
        h('polyline', { points: '22 4 12 14.01 9 11.01' })
      ])
    }),
    warning: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [
        h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
        h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
        h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
      ])
    }),
    error: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
        h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })
      ])
    })
  }
  return icons[props.type]
})

// Alert classes
const alertClasses = computed(() => {
  return [
    'alert',
    `alert--${props.type}`,
    `alert--${props.variant}`,
    `alert--${props.size}`,
    {
      'alert--closable': props.closable
    }
  ]
})

// Handle close
const handleClose = (): void => {
  emit('close')
}
</script>

<style scoped>
.alert {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.375rem;
  width: 100%;
}

/* Types with Solid Variant */
.alert--info.alert--solid {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.alert--success.alert--solid {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.alert--warning.alert--solid {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde047;
}

.alert--error.alert--solid {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

/* Types with Outline Variant */
.alert--info.alert--outline {
  background-color: transparent;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.alert--success.alert--outline {
  background-color: transparent;
  color: #166534;
  border: 1px solid #22c55e;
}

.alert--warning.alert--outline {
  background-color: transparent;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.alert--error.alert--outline {
  background-color: transparent;
  color: #991b1b;
  border: 1px solid #ef4444;
}

/* Types with Soft Variant */
.alert--info.alert--soft {
  background-color: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
}

.alert--success.alert--soft {
  background-color: #f0fdf4;
  color: #14532d;
  border: 1px solid #bbf7d0;
}

.alert--warning.alert--soft {
  background-color: #fffbeb;
  color: #78350f;
  border: 1px solid #fde68a;
}

.alert--error.alert--soft {
  background-color: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
}

/* Icon */
.alert__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert__icon-svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Content */
.alert__content {
  flex: 1;
}

.alert__title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.alert--sm .alert__title {
  font-size: 0.875rem;
}

.alert--md .alert__title {
  font-size: 0.9375rem;
}

.alert--lg .alert__title {
  font-size: 1rem;
}

.alert__message {
  font-size: 0.875rem;
  line-height: 1.25rem;
  opacity: 0.9;
}

/* Sizes */
.alert--sm {
  padding: 0.75rem;
  font-size: 0.875rem;
}

.alert--sm .alert__icon-svg {
  width: 1rem;
  height: 1rem;
}

.alert--lg {
  padding: 1.25rem;
  font-size: 1rem;
}

.alert--lg .alert__icon-svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* Close Button */
.alert__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  margin-left: 0.5rem;
  color: inherit;
  background: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.alert__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.alert__close svg {
  width: 1rem;
  height: 1rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .alert--info.alert--solid {
    background-color: #1e3a5f;
    color: #93c5fd;
    border-color: #1e40af;
  }

  .alert--success.alert--solid {
    background-color: #14532d;
    color: #86efac;
    border-color: #166534;
  }

  .alert--warning.alert--solid {
    background-color: #78350f;
    color: #fde047;
    border-color: #92400e;
  }

  .alert--error.alert--solid {
    background-color: #7f1d1d;
    color: #fca5a5;
    border-color: #991b1b;
  }

  .alert--info.alert--soft {
    background-color: #172554;
    color: #bfdbfe;
    border-color: #1e3a8a;
  }

  .alert--success.alert--soft {
    background-color: #052e16;
    color: #bbf7d0;
    border-color: #14532d;
  }

  .alert--warning.alert--soft {
    background-color: #451a03;
    color: #fde68a;
    border-color: #78350f;
  }

  .alert--error.alert--soft {
    background-color: #450a0a;
    color: #fecaca;
    border-color: #7f1d1d;
  }
}
</style>
