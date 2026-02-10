<template>
  <div :class="loaderClasses" v-bind="$attrs">
    <!-- Pulse animation overlay -->
    <div class="skeleton-pulse"></div>

    <!-- Content slot -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded'
export type SkeletonSize = 'sm' | 'md' | 'lg'
export type SkeletonAnimation = 'pulse' | 'wave' | 'none'

interface Props {
  variant?: SkeletonVariant
  size?: SkeletonSize
  width?: string | number
  height?: string | number
  animation?: SkeletonAnimation
  centered?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  size: 'md',
  animation: 'pulse',
  centered: false,
  loading: true
})

const loaderClasses = computed(() => [
  'skeleton-loader',
  `skeleton-loader--${props.variant}`,
  `skeleton-loader--${props.size}`,
  `skeleton-loader--${props.animation}`,
  {
    'skeleton-loader--centered': props.centered
  }
])
</script>

<style scoped>
.skeleton-loader {
  position: relative;
  display: inline-block;
  background-color: #e5e7eb;
  overflow: hidden;
}

/* Variants */
.skeleton-loader--text {
  height: 1em;
  border-radius: 0.25rem;
  width: 100%;
}

.skeleton-loader--circular {
  border-radius: 50%;
}

.skeleton-loader--rectangular {
  border-radius: 0.25rem;
}

.skeleton-loader--rounded {
  border-radius: 9999px;
}

/* Sizes */
.skeleton-loader--sm {
  height: 0.75rem;
}

.skeleton-loader--md {
  height: 1rem;
}

.skeleton-loader--lg {
  height: 1.5rem;
}

/* Custom sizes */
.skeleton-loader[style*="width"] {
  width: var(--custom-width);
}

.skeleton-loader[style*="height"] {
  height: var(--custom-height);
}

/* Centered */
.skeleton-loader--centered {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Pulse animation */
.skeleton-loader--pulse {
  position: relative;
}

.skeleton-loader--pulse::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transform: translateX(-100%);
  animation: skeleton-pulse 1.5s infinite;
}

@keyframes skeleton-pulse {
  100% {
    transform: translateX(100%);
  }
}

/* Wave animation */
.skeleton-loader--wave {
  position: relative;
}

.skeleton-loader--wave::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 20%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.3) 80%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: skeleton-wave 1.5s infinite;
}

@keyframes skeleton-wave {
  100% {
    transform: translateX(100%);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .skeleton-loader {
    background-color: #374151;
  }

  .skeleton-loader--pulse::after,
  .skeleton-loader--wave::after {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }
}
</style>
