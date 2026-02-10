<template>
  <div :class="imageClasses" :style="containerStyle">
    <!-- Loading State -->
    <div v-if="loading && !error" class="image__loading">
      <slot name="loading">
        <Spinner size="md" />
      </slot>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="image__error">
      <slot name="error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 15" />
        </svg>
        <span class="image__error-text">Failed to load</span>
      </slot>
    </div>

    <!-- Image -->
    <img
      v-else
      :src="src"
      :alt="alt"
      :class="imageClass"
      :style="imgStyle"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Placeholder -->
    <div v-if="placeholder && !loaded && !loading && !error" class="image__placeholder">
      <slot name="placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 8v8" />
        </svg>
      </slot>
    </div>

    <!-- Overlay Content -->
    <div v-if="$slots.overlay" class="image__overlay">
      <slot name="overlay"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
export type ImageShape = 'square' | 'circle' | 'rounded'

interface Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  fit?: ImageFit
  shape?: ImageShape
  loading?: 'lazy' | 'eager'
  placeholder?: boolean
  fallback?: string
  preview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  fit: 'cover',
  shape: 'rounded',
  loading: 'lazy',
  placeholder: false
})

// State
const loaded = ref(false)
const error = ref(false)
const loading = ref(true)

// Computed
const imageClasses = computed(() => [
  'image',
  `image--${props.shape}`,
  `image--${props.fit}`,
  {
    'image--loading': loading.value,
    'image--error': error.value,
    'image--loaded': loaded.value
  }
])

const imageClass = computed(() => [
  'image__img',
  {
    'image__img--cover': props.fit === 'cover',
    'image__img--contain': props.fit === 'contain'
  }
])

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  return style
})

const imgStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.fit !== 'cover') {
    style.objectFit = props.fit
  }
  return style
})

// Methods
const handleLoad = () => {
  loaded.value = true
  loading.value = false
  error.value = false
}

const handleError = () => {
  if (props.fallback) {
    // Try fallback image
    const img = new Image()
    img.onload = () => {
      loaded.value = true
      loading.value = false
      error.value = false
    }
    img.onerror = () => {
      error.value = true
      loading.value = false
      loaded.value = false
    }
    img.src = props.fallback
  } else {
    error.value = true
    loading.value = false
    loaded.value = false
  }
}
</script>

<style scoped>
.image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f3f4f6;
}

.image--square {
  border-radius: 0;
}

.image--circle {
  border-radius: 50%;
}

.image--rounded {
  border-radius: 0.375rem;
}

.image--loading,
.image--error {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image__img--cover {
  object-fit: cover;
}

.image__img--contain {
  object-fit: contain;
}

/* Loading */
.image__loading {
  color: #9ca3af;
}

/* Error */
.image__error {
  flex-direction: column;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.image__error svg {
  width: 2rem;
  height: 2rem;
}

.image__error-text {
  font-size: 0.75rem;
}

/* Placeholder */
.image__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  background-color: #f3f4f6;
}

.image__placeholder svg {
  width: 3rem;
  height: 3rem;
  opacity: 0.5;
}

/* Overlay */
.image__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .image {
    background-color: #1f2937;
  }

  .image__loading,
  .image__error {
    color: #6b7280;
  }

  .image__placeholder {
    background-color: #374151;
  }

  .image__placeholder svg {
    color: #9ca3af;
  }
}
</style>
