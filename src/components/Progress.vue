<template>
  <div :class="progressClasses" :style="progressStyles">
    <!-- Circular Progress -->
    <svg
      class="progress__circle"
      :viewBox="viewBox"
      :width="size"
      :height="size"
    >
      <!-- Background Circle -->
      <circle
        class="progress__circle-bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
      />

      <!-- Progress Circle -->
      <circle
        class="progress__circle-fg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :stroke="color"
        stroke-linecap="round"
      />
    </svg>

    <!-- Content (percentage or slot) -->
    <div class="progress__content">
      <slot>
        <span class="progress__text">{{ percentage }}%</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ProgressColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  value: number
  max?: number
  size?: ProgressSize
  color?: ProgressColor
  strokeWidth?: number
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 'md',
  color: 'primary',
  strokeWidth: 8,
  showPercentage: true
})

// Size mapping
const sizeMap = {
  xs: 40,
  sm: 48,
  md: 64,
  lg: 80,
  xl: 120
}

// Computed size
const size = computed(() => sizeMap[props.size])

// Center point
const center = computed(() => size.value / 2)

// Radius (minus stroke width)
const radius = computed(() => (size.value - props.strokeWidth) / 2)

// Circumference
const circumference = computed(() => 2 * Math.PI * radius.value)

// ViewBox
const viewBox = computed(() => `0 0 ${size.value} ${size.value}`)

// Percentage
const percentage = computed(() => {
  if (props.max === 0) return 0
  return Math.round((props.value / props.max) * 100)
})

// Stroke dash offset
const strokeDashoffset = computed(() => {
  const progress = Math.min(props.value, props.max) / props.max
  return circumference.value * (1 - progress)
})

// Color
const color = computed(() => {
  const colors = {
    default: '#6b7280',
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
  return colors[props.color]
})

// Progress classes
const progressClasses = computed(() => [
  'progress',
  `progress--${props.size}`,
  `progress--${props.color}`
])

// Progress styles
const progressStyles = computed(() => {
  return {
    width: `${size.value}px`,
    height: `${size.value}px`
  }
})
</script>

<style scoped>
.progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Circle */
.progress__circle {
  transform: rotate(-90deg);
}

.progress__circle-bg {
  stroke: #e5e7eb;
}

.progress__circle-fg {
  transition: stroke-dashoffset 0.5s ease;
}

/* Sizes */
.progress--xs .progress__circle-bg {
  stroke-width: 4px;
}

.progress--sm .progress__circle-bg {
  stroke-width: 6px;
}

.progress--lg .progress__circle-bg {
  stroke-width: 10px;
}

.progress--xl .progress__circle-bg {
  stroke-width: 12px;
}

/* Content */
.progress__content {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress__text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.progress--xs .progress__text {
  font-size: 0.625rem;
}

.progress--sm .progress__text {
  font-size: 0.6875rem;
}

.progress--md .progress__text {
  font-size: 0.75rem;
}

.progress--lg .progress__text {
  font-size: 0.875rem;
}

.progress--xl .progress__text {
  font-size: 1rem;
}

/* Color text */
.progress--primary .progress__text {
  color: #3b82f6;
}

.progress--success .progress__text {
  color: #22c55e;
}

.progress--warning .progress__text {
  color: #f59e0b;
}

.progress--error .progress__text {
  color: #ef4444;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .progress__circle-bg {
    stroke: #374151;
  }

  .progress__text {
    color: #e5e7eb;
  }

  .progress--default .progress__text {
    color: #9ca3af;
  }

  .progress--primary .progress__text {
    color: #60a5fa;
  }

  .progress--success .progress__text {
    color: #4ade80;
  }

  .progress--warning .progress__text {
    color: #fbbf24;
  }

  .progress--error .progress__text {
    color: #f87171;
  }
}
</style>
