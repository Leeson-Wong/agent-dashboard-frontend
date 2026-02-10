<template>
  <div :class="progressBarClasses" role="progressbar" :aria-valuenow="normalizedValue" :aria-valuemin="min" :aria-valuemax="max">
    <!-- Track/Background -->
    <div class="progress-bar__track" :style="trackStyles">
      <!-- Fill/Progress -->
      <div
        class="progress-bar__fill"
        :style="fillStyles"
        :class="fillClasses"
      >
        <!-- Striped animation -->
        <div v-if="striped && animated" class="progress-bar__stripes"></div>
      </div>

      <!-- Label inside bar -->
      <span v-if="showLabel && labelInside" class="progress-bar__label progress-bar__label--inside">
        <slot name="label">{{ displayLabel }}</slot>
      </span>
    </div>

    <!-- Label outside bar -->
    <span v-if="showLabel && !labelInside" class="progress-bar__label progress-bar__label--outside">
      <slot name="label">{{ displayLabel }}</slot>
    </span>

    <!-- Helper text -->
    <span v-if="helperText" class="progress-bar__helper">
      {{ helperText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ProgressBarVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  value?: number // Progress value (0-100)
  min?: number // Minimum value
  max?: number // Maximum value
  variant?: ProgressBarVariant
  size?: ProgressBarSize
  striped?: boolean
  animated?: boolean
  showLabel?: boolean
  labelInside?: boolean
  label?: string // Custom label
  helperText?: string
  height?: string
  borderRadius?: string
  color?: string // Custom fill color
  backgroundColor?: string // Custom track color
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  min: 0,
  max: 100,
  variant: 'primary',
  size: 'md',
  striped: false,
  animated: false,
  showLabel: false,
  labelInside: false
})

// Normalized value (0-100)
const normalizedValue = computed(() => {
  const range = props.max - props.min
  const clamped = Math.max(props.min, Math.min(props.max, props.value))
  return ((clamped - props.min) / range) * 100
})

// Display label
const displayLabel = computed(() => {
  if (props.label) {
    return props.label
  }
  return `${Math.round(normalizedValue.value)}%`
})

// Progress bar classes
const progressBarClasses = computed(() => {
  return [
    'progress-bar',
    `progress-bar--${props.size}`,
    {
      'progress-bar--label-inside': props.labelInside,
      'progress-bar--label-outside': !props.labelInside && props.showLabel
    }
  ]
})

// Fill classes
const fillClasses = computed(() => {
  return [
    `progress-bar__fill--${props.variant}`,
    {
      'progress-bar__fill--striped': props.striped,
      'progress-bar__fill--animated': props.striped && props.animated
    }
  ]
})

// Track styles
const trackStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor
  }

  if (props.borderRadius) {
    styles.borderRadius = props.borderRadius
  }

  return styles
})

// Fill styles
const fillStyles = computed(() => {
  const styles: Record<string, string> = {
    width: `${normalizedValue.value}%`
  }

  if (props.color) {
    styles.backgroundColor = props.color
  }

  if (props.height) {
    styles.height = props.height
  }

  return styles
})
</script>

<style scoped>
.progress-bar {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Track */
.progress-bar__track {
  position: relative;
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

/* Fill */
.progress-bar__fill {
  position: relative;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 9999px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* Variants */
.progress-bar__fill--default {
  background-color: #6b7280;
}

.progress-bar__fill--primary {
  background-color: #3b82f6;
}

.progress-bar__fill--success {
  background-color: #22c55e;
}

.progress-bar__fill--warning {
  background-color: #f59e0b;
}

.progress-bar__fill--error {
  background-color: #ef4444;
}

.progress-bar__fill--info {
  background-color: #06b6d4;
}

/* Sizes */
.progress-bar--xs .progress-bar__track {
  height: 0.25rem;
}

.progress-bar--sm .progress-bar__track {
  height: 0.5rem;
}

.progress-bar--md .progress-bar__track {
  height: 0.75rem;
}

.progress-bar--lg .progress-bar__track {
  height: 1rem;
}

/* Striped */
.progress-bar__fill--striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

/* Animated stripes */
.progress-bar__fill--animated {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

/* Labels */
.progress-bar__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-bar__label--inside {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  white-space: nowrap;
  z-index: 1;
}

.progress-bar__label--outside {
  margin-top: 0.25rem;
}

/* Helper text */
.progress-bar__helper {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Label positioning adjustments */
.progress-bar--label-inside {
  margin-bottom: 0;
}

.progress-bar--label-outside {
  margin-bottom: 0.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .progress-bar__track {
    background-color: #374151;
  }

  .progress-bar__label,
  .progress-bar__helper {
    color: #9ca3af;
  }
}
</style>
