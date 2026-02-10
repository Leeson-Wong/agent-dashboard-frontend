<template>
  <div :class="['skeleton', `skeleton-${variant}`, { 'skeleton-animated': animated }]" :style="customStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'circle' | 'rect' | 'custom'
  width?: string
  height?: string
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  width: '100%',
  height: '1em',
  animated: true
})

const customStyle = computed(() => ({
  width: props.width,
  height: props.height
}))
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(100, 116, 139, 0.2) 0%,
    rgba(100, 116, 139, 0.35) 50%,
    rgba(100, 116, 139, 0.2) 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  display: inline-block;
}

.skeleton-animated {
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-rect {
  border-radius: 0;
}

/* Dark mode adjustments */
:global(.dark-mode) .skeleton {
  background: linear-gradient(
    90deg,
    rgba(51, 65, 85, 0.4) 0%,
    rgba(71, 85, 105, 0.6) 50%,
    rgba(51, 65, 85, 0.4) 100%
  );
}
</style>
