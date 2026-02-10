<template>
  <div :class="spinnerClasses" :style="spinnerStyles" role="status" :aria-label="ariaLabel">
    <!-- Ring Spinner (Default) -->
    <svg
      v-if="variant === 'ring'"
      class="spinner__ring"
      viewBox="0 0 50 50"
    >
      <circle
        class="spinner__ring-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        :stroke="color"
        stroke-width="4"
      ></circle>
    </svg>

    <!-- Dots Spinner -->
    <div v-else-if="variant === 'dots'" class="spinner__dots">
      <span
        v-for="i in 3"
        :key="i"
        class="spinner__dot"
        :style="{ backgroundColor: color }"
      ></span>
    </div>

    <!-- Bar Spinner -->
    <div v-else-if="variant === 'bars'" class="spinner__bars">
      <span
        v-for="i in 4"
        :key="i"
        class="spinner__bar"
        :style="{ backgroundColor: color }"
      ></span>
    </div>

    <!-- Pulse Spinner -->
    <div v-else-if="variant === 'pulse'" class="spinner__pulse">
      <span
        v-for="i in 3"
        :key="i"
        class="spinner__pulse-circle"
        :style="{ backgroundColor: color }"
      ></span>
    </div>

    <!-- Text Label (Optional) -->
    <span v-if="label" class="spinner__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerVariant = 'ring' | 'dots' | 'bars' | 'pulse'

interface Props {
  variant?: SpinnerVariant
  size?: SpinnerSize
  color?: string
  label?: string
  ariaLabel?: string
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ring',
  size: 'md',
  color: 'currentColor',
  ariaLabel: 'Loading...'
})

// Spinner classes
const spinnerClasses = computed(() => {
  return [
    'spinner',
    `spinner--${props.variant}`,
    `spinner--${props.size}`,
    {
      'spinner--center': props.center
    }
  ])
})

// Spinner styles
const spinnerStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.color !== 'currentColor') {
    styles.color = props.color
  }

  return styles
})
</script>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.spinner--center {
  display: flex;
  justify-content: center;
}

/* Ring Spinner */
.spinner__ring {
  display: inline-block;
  animation: spinner-ring-rotate 2s linear infinite;
}

.spinner__ring-path {
  animation: spinner-ring-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
}

@keyframes spinner-ring-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-ring-dash {
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

/* Sizes for Ring Spinner */
.spinner--xs .spinner__ring {
  width: 1rem;
  height: 1rem;
}

.spinner--sm .spinner__ring {
  width: 1.25rem;
  height: 1.25rem;
}

.spinner--md .spinner__ring {
  width: 1.5rem;
  height: 1.5rem;
}

.spinner--lg .spinner__ring {
  width: 2rem;
  height: 2rem;
}

.spinner--xl .spinner__ring {
  width: 2.5rem;
  height: 2.5rem;
}

/* Dots Spinner */
.spinner__dots {
  display: inline-flex;
  gap: 0.25rem;
}

.spinner__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  animation: spinner-dots-bounce 1.4s infinite ease-in-out both;
}

.spinner__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner__dot:nth-child(2) {
  animation-delay: -0.16s;
}

.spinner__dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes spinner-dots-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Sizes for Dots Spinner */
.spinner--xs .spinner__dot {
  width: 0.25rem;
  height: 0.25rem;
}

.spinner--sm .spinner__dot {
  width: 0.3125rem;
  height: 0.3125rem;
}

.spinner--lg .spinner__dot {
  width: 0.5rem;
  height: 0.5rem;
}

.spinner--xl .spinner__dot {
  width: 0.625rem;
  height: 0.625rem;
}

/* Bar Spinner */
.spinner__bars {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.spinner__bar {
  width: 0.25rem;
  border-radius: 0.125rem;
  animation: spinner-bars-stretch 1.2s ease-in-out infinite;
}

.spinner__bar:nth-child(1) {
  animation-delay: -1.1s;
}

.spinner__bar:nth-child(2) {
  animation-delay: -1.0s;
}

.spinner__bar:nth-child(3) {
  animation-delay: -0.9s;
}

.spinner__bar:nth-child(4) {
  animation-delay: -0.8s;
}

@keyframes spinner-bars-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }
  20% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* Sizes for Bar Spinner */
.spinner--xs .spinner__bar {
  height: 1rem;
}

.spinner--sm .spinner__bar {
  height: 1.25rem;
}

.spinner--md .spinner__bar {
  height: 1.5rem;
}

.spinner--lg .spinner__bar {
  height: 2rem;
}

.spinner--xl .spinner__bar {
  height: 2.5rem;
}

/* Pulse Spinner */
.spinner__pulse {
  display: inline-flex;
  gap: 0.375rem;
}

.spinner__pulse-circle {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  animation: spinner-pulse-scale 1.5s ease-in-out infinite;
}

.spinner__pulse-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner__pulse-circle:nth-child(2) {
  animation-delay: -0.16s;
}

.spinner__pulse-circle:nth-child(3) {
  animation-delay: 0s;
}

@keyframes spinner-pulse-scale {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Sizes for Pulse Spinner */
.spinner--xs .spinner__pulse-circle {
  width: 0.25rem;
  height: 0.25rem;
}

.spinner--sm .spinner__pulse-circle {
  width: 0.375rem;
  height: 0.375rem;
}

.spinner--lg .spinner__pulse-circle {
  width: 0.625rem;
  height: 0.625rem;
}

.spinner--xl .spinner__pulse-circle {
  width: 0.75rem;
  height: 0.75rem;
}

/* Label */
.spinner__label {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Label size variants */
.spinner--xs .spinner__label {
  font-size: 0.75rem;
}

.spinner--sm .spinner__label {
  font-size: 0.8125rem;
}

.spinner--lg .spinner__label {
  font-size: 0.9375rem;
}

.spinner--xl .spinner__label {
  font-size: 1rem;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner__ring,
  .spinner__dot,
  .spinner__bar,
  .spinner__pulse-circle {
    animation: none !important;
  }

  .spinner__dot,
  .spinner__pulse-circle {
    opacity: 1;
    transform: scale(1);
  }

  .spinner__bar {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
