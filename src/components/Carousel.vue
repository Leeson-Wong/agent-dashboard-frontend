<template>
  <div :class="carouselClasses" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- Carousel Track -->
    <div class="carousel__viewport" ref="viewportRef">
      <div
        class="carousel__track"
        :style="trackStyle"
        @transitionend="handleTransitionEnd"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          class="carousel__item"
          :class="{ 'carousel__item--active': index === currentIndex }"
        >
          <slot name="item" :item="item" :index="index">
            <img v-if="typeof item === 'string'" :src="item" :alt="`Slide ${index}`" />
            <div v-else class="carousel__item-default">{{ item }}</div>
          </slot>
        </div>
      </div>
    </div>

    <!-- Navigation Arrows -->
    <button
      v-if="showArrows"
      class="carousel__nav carousel__nav--prev"
      :disabled="!canGoPrevious"
      @click="previous"
      aria-label="Previous slide"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <button
      v-if="showArrows"
      class="carousel__nav carousel__nav--next"
      :disabled="!canGoNext"
      @click="next"
      aria-label="Next slide"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <!-- Indicators -->
    <div v-if="showIndicators" class="carousel__indicators">
      <button
        v-for="(_, index) in items"
        :key="index"
        class="carousel__indicator"
        :class="{ 'carousel__indicator--active': index === currentIndex }"
        @click="goTo(index)"
        :aria-label="`Go to slide ${index + 1}`"
      ></button>
    </div>

    <!-- Caption -->
    <div v-if="caption && currentCaption" class="carousel__caption">
      {{ currentCaption }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

export type CarouselSize = 'sm' | 'md' | 'lg'
export type CarouselEffect = 'slide' | 'fade' | 'scale'

interface CarouselItem {
  src?: string
  alt?: string
  caption?: string
  [key: string]: any
}

interface Props {
  items: (string | CarouselItem)[]
  autoplay?: boolean
  interval?: number
  loop?: boolean
  showArrows?: boolean
  showIndicators?: boolean
  size?: CarouselSize
  effect?: CarouselEffect
  pauseOnHover?: boolean
  height?: string | number
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  interval: 5000,
  loop: true,
  showArrows: true,
  showIndicators: true,
  size: 'md',
  effect: 'slide',
  pauseOnHover: true,
  fit: 'cover'
})

const emit = defineEmits<{
  change: [currentIndex: number, previousIndex: number]
}>()

// State
const currentIndex = ref(0)
const isTransitioning = ref(false)
const isPaused = ref(false)
const viewportRef = ref<HTMLElement>()

// Timer
let autoplayTimer: number | null = null

// Computed
const canGoPrevious = computed(() => props.loop || currentIndex.value > 0)
const canGoNext = computed(() => props.loop || currentIndex.value < props.items.length - 1)

const carouselClasses = computed(() => [
  'carousel',
  `carousel--${props.size}`,
  `carousel--${props.effect}`
])

const trackStyle = computed(() => {
  if (props.effect === 'fade' || props.effect === 'scale') {
    return {}
  }

  const translate = -(currentIndex.value * 100)
  return {
    transform: `translateX(${translate}%)`,
    transition: isTransitioning.value ? `transform ${props.interval / 1000}s ease-in-out` : 'none'
  }
})

const currentCaption = computed(() => {
  const item = props.items[currentIndex.value]
  if (typeof item === 'string') return props.caption
  return item.caption || ''
})

// Methods
const next = () => {
  if (isTransitioning.value) return

  if (currentIndex.value < props.items.length - 1) {
    goTo(currentIndex.value + 1)
  } else if (props.loop) {
    goTo(0)
  }
}

const previous = () => {
  if (isTransitioning.value) return

  if (currentIndex.value > 0) {
    goTo(currentIndex.value - 1)
  } else if (props.loop) {
    goTo(props.items.length - 1)
  }
}

const goTo = (index: number) => {
  if (isTransitioning.value || index === currentIndex.value) return

  const previousIndex = currentIndex.value
  currentIndex.value = index
  isTransitioning.value = true

  emit('change', index, previousIndex)
}

const handleTransitionEnd = () => {
  isTransitioning.value = false
}

const handleMouseEnter = () => {
  if (props.pauseOnHover && props.autoplay) {
    isPaused.value = true
    stopAutoplay()
  }
}

const handleMouseLeave = () => {
  if (props.pauseOnHover && props.autoplay) {
    isPaused.value = false
    startAutoplay()
  }
}

const startAutoplay = () => {
  if (!props.autoplay) return

  stopAutoplay()
  autoplayTimer = window.setTimeout(() => {
    next()
    startAutoplay()
  }, props.interval)
}

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

// Lifecycle
onMounted(() => {
  if (props.autoplay) {
    startAutoplay()
  }
})

onUnmounted(() => {
  stopAutoplay()
})

// Watch for items changes
watch(() => props.items, () => {
  currentIndex.value = 0
}, { deep: true })
</script>

<style scoped>
.carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
}

/* Sizes */
.carousel--sm {
  max-width: 400px;
}

.carousel--md {
  max-width: 800px;
}

.carousel--lg {
  max-width: 1200px;
}

/* Viewport */
.carousel__viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.carousel__viewport {
  height: 300px;
}

.carousel--sm .carousel__viewport {
  height: 200px;
}

.carousel--lg .carousel__viewport {
  height: 400px;
}

/* Track */
.carousel__track {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Item */
.carousel__item {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel__item-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  font-size: 1.5rem;
  color: #9ca3af;
}

/* Effect: Fade */
.carousel--fade .carousel__item {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.carousel--fade .carousel__item--active {
  opacity: 1;
  z-index: 1;
}

/* Effect: Scale */
.carousel--scale .carousel__item {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.5s ease-in-out;
}

.carousel--scale .carousel__item--active {
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

/* Navigation */
.carousel__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #111827;
}

.carousel__nav:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.carousel__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel__nav--prev {
  left: 1rem;
}

.carousel__nav--next {
  right: 1rem;
}

.carousel__nav svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Indicators */
.carousel__indicators {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 0.5rem;
}

.carousel__indicator {
  width: 0.75rem;
  height: 0.75rem;
  padding: 0;
  border: none;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel__indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.carousel__indicator--active {
  background-color: #ffffff;
  width: 2rem;
  border-radius: 0.375rem;
}

/* Caption */
.carousel__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #ffffff;
  text-align: center;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .carousel__nav {
    background-color: rgba(31, 41, 55, 0.8);
    color: #f9fafb;
  }

  .carousel__nav:hover:not(:disabled) {
    background-color: rgba(31, 41, 55, 0.95);
  }

  .carousel__indicator {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .carousel__indicator:hover {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .carousel__indicator--active {
    background-color: #ffffff;
  }

  .carousel__item-default {
    background-color: #1f2937;
    color: #6b7280;
  }
}
</style>
