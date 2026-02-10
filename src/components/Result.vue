<template>
  <div :class="resultClasses">
    <!-- Icon -->
    <div v-if="showIcon" class="result__icon">
      <slot name="icon">
        <component :is="defaultIcon" class="result__icon-svg" />
      </slot>
    </div>

    <!-- Title -->
    <div v-if="title" class="result__title">
      {{ title }}
    </div>

    <!-- Subtitle -->
    <div v-if="subtitle" class="result__subtitle">
      {{ subtitle }}
    </div>

    <!-- Extra Content -->
    <div v-if="$slots.default" class="result__content">
      <slot></slot>
    </div>

    <!-- Actions -->
    <div v-if="showActions" class="result__actions">
      <slot name="actions">
        <Button
          v-if="primaryAction"
          :variant="primaryActionVariant"
          @click="handlePrimaryAction"
        >
          {{ primaryAction }}
        </Button>
        <Button
          v-if="secondaryAction"
          variant="outline"
          @click="handleSecondaryAction"
        >
          {{ secondaryAction }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export type ResultStatus = 'success' | 'error' | 'warning' | 'info' | '404' | '403' | '500'
export type ResultSize = 'sm' | 'md' | 'lg'

interface Props {
  status?: ResultStatus
  title?: string
  subtitle?: string
  size?: ResultSize
  showIcon?: boolean
  primaryAction?: string
  secondaryAction?: string
  icon?: any
}

const props = withDefaults(defineProps<Props>(), {
  status: 'info',
  size: 'md',
  showIcon: true
})

const emit = defineEmits<{
  primary: []
  secondary: []
}>()

// Result classes
const resultClasses = computed(() => [
  'result',
  `result--${props.status}`,
  `result--${props.size}`
])

// Primary action variant
const primaryActionVariant = computed(() => {
  const variants: Record<ResultStatus, string> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'primary',
    '404': 'primary',
    '403': 'warning',
    '500': 'error'
  }
  return variants[props.status]
})

// Default icons
const defaultIcon = computed(() => {
  const icons = {
    success: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--success'
      }, [
        h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
        h('polyline', { points: '22 4 12 14.01 9 11.01' })
      ])
    }),
    error: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--error'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
        h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })
      ])
    }),
    warning: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--warning'
      }, [
        h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
        h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
        h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
      ])
    }),
    info: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--info'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
        h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
      ])
    }),
    '404': defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--info'
      }, [
        h('circle', { cx: '12', cy: '12', r: '10' }),
        h('path', { d: 'M12 16v-4' }),
        h('path', { d: 'M12 8h.01' })
      ])
    }),
    '403': defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--warning'
      }, [
        h('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
        h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
      ])
    }),
    '500': defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        class: 'result__icon-svg result__icon-svg--error'
      }, [
        h('path', { d: 'M18.36 6.64a9 9 0 1 1-12.73 0' }),
        h('line', { x1: '12', y1: '2', x2: '12', y2: '12' })
      ])
    })
  }
  return props.icon || icons[props.status]
})

// Show actions
const showActions = computed(() => {
  return !!props.primaryAction || !!props.secondaryAction || !!$slots.actions
})

// Handle primary action
const handlePrimaryAction = () => {
  emit('primary')
}

// Handle secondary action
const handleSecondaryAction = () => {
  emit('secondary')
}
</script>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

/* Sizes */
.result--sm {
  padding: 1rem;
}

.result--md {
  padding: 2rem;
}

.result--lg {
  padding: 3rem;
}

/* Icon */
.result__icon {
  margin-bottom: 1rem;
}

.result--sm .result__icon {
  margin-bottom: 0.75rem;
}

.result--lg .result__icon {
  margin-bottom: 1.5rem;
}

.result__icon-svg {
  width: 4rem;
  height: 4rem;
}

.result--sm .result__icon-svg {
  width: 3rem;
  height: 3rem;
}

.result--lg .result__icon-svg {
  width: 5rem;
  height: 5rem;
}

.result__icon-svg--success {
  color: #22c55e;
}

.result__icon-svg--error {
  color: #ef4444;
}

.result__icon-svg--warning {
  color: #f59e0b;
}

.result__icon-svg--info {
  color: #3b82f6;
}

/* Title */
.result__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.result--sm .result__title {
  font-size: 1rem;
}

.result--lg .result__title {
  font-size: 1.5rem;
}

/* Subtitle */
.result__subtitle {
  font-size: 0.9375rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  max-width: 400px;
}

.result--sm .result__subtitle {
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.result--lg .result__subtitle {
  font-size: 1rem;
  margin-bottom: 2rem;
}

/* Content */
.result__content {
  margin-bottom: 1.5rem;
}

.result--sm .result__content {
  margin-bottom: 1rem;
}

.result--lg .result__content {
  margin-bottom: 2rem;
}

/* Actions */
.result__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Status-specific styles */
.result--success .result__title {
  color: #22c55e;
}

.result--error .result__title {
  color: #ef4444;
}

.result--warning .result__title {
  color: #f59e0b;
}

.result--info .result__title {
  color: #3b82f6;
}

.result--404 .result__title {
  color: #3b82f6;
}

.result--403 .result__title {
  color: #f59e0b;
}

.result--500 .result__title {
  color: #ef4444;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .result__title {
    color: #f9fafb;
  }

  .result__subtitle {
    color: #d1d5db;
  }
}
</style>
