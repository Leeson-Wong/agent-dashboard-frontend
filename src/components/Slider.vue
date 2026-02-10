<template>
  <div :class="sliderClasses" :style="sliderStyles">
    <!-- Track -->
    <div class="slider__track">
      <!-- Fill -->
      <div class="slider__fill" :style="fillStyles"></div>
    </div>

    <!-- Ticks -->
    <div v-if="showTicks" class="slider__ticks">
      <div
        v-for="tick in ticks"
        :key="tick"
        class="slider__tick"
        :class="{ 'slider__tick--active': tick <= percentage }"
        :style="{ left: `${tick}%` }"
      ></div>
    </div>

    <!-- Thumb -->
    <div
      ref="thumbRef"
      class="slider__thumb"
      :style="thumbStyles"
      :tabindex="disabled ? undefined : '0'"
      role="slider"
      :aria-label="ariaLabel"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      :aria-disabled="disabled"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @keydown="handleKeydown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <!-- Tooltip -->
      <div v-if="showTooltip" class="slider__tooltip">
        {{ formatValue(modelValue) }}
      </div>
    </div>

    <!-- Labels (min/max) -->
    <div v-if="showLabels" class="slider__labels">
      <span class="slider__label slider__label--min">{{ formatValue(min) }}</span>
      <span class="slider__label slider__label--max">{{ formatValue(max) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

export type SliderSize = 'sm' | 'md' | 'lg'
export type SliderColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  size?: SliderSize
  color?: SliderColor
  disabled?: boolean
  showTooltip?: boolean
  showTicks?: boolean
  showLabels?: boolean
  tickStep?: number
  formatValue?: (value: number) => string | number
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  color: 'default',
  disabled: false,
  showTooltip: false,
  showTicks: false,
  showLabels: false,
  tickStep: 10,
  formatValue: (value: number) => value,
  ariaLabel: 'Slider'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

// Refs
const thumbRef = ref<HTMLElement>()

// State
const isDragging = ref(false)
const isFocused = ref(false)

// Computed percentage
const percentage = computed(() => {
  const range = props.max - props.min
  const value = Math.max(props.min, Math.min(props.max, props.modelValue))
  return ((value - props.min) / range) * 100
})

// Computed classes
const sliderClasses = computed(() => [
  'slider',
  `slider--${props.size}`,
  `slider--${props.color}`,
  {
    'slider--disabled': props.disabled,
    'slider--dragging': isDragging.value,
    'slider--focused': isFocused.value
  }
])

// Slider styles
const sliderStyles = computed(() => {
  return {}
})

// Fill styles
const fillStyles = computed(() => {
  return {
    width: `${percentage.value}%`
  }
})

// Thumb styles
const thumbStyles = computed(() => {
  return {
    left: `${percentage.value}%`
  }
})

// Ticks
const ticks = computed(() => {
  const tickCount = Math.floor((props.max - props.min) / props.tickStep)
  return Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
})

// Update value from position
const updateValue = (clientX: number) => {
  if (!thumbRef.value || props.disabled) return

  const track = thumbRef.value.parentElement
  if (!track) return

  const rect = track.getBoundingClientRect()
  const percentage = (clientX - rect.left) / rect.width
  const rawValue = props.min + percentage * (props.max - props.min)

  // Snap to step
  const steppedValue = Math.round(rawValue / props.step) * props.step

  // Clamp to min/max
  const clampedValue = Math.max(props.min, Math.min(props.max, steppedValue))

  emit('update:modelValue', clampedValue)
  emit('change', clampedValue)
}

// Handle mouse down
const handleMouseDown = (event: MouseEvent) => {
  if (props.disabled) return

  isDragging.value = true
  updateValue(event.clientX)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Handle mouse move
const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return
  updateValue(event.clientX)
}

// Handle mouse up
const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Handle touch start
const handleTouchStart = (event: TouchEvent) => {
  if (props.disabled) return

  isDragging.value = true
  updateValue(event.touches[0].clientX)

  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

// Handle touch move
const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) return
  event.preventDefault()
  updateValue(event.touches[0].clientX)
}

// Handle touch end
const handleTouchEnd = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

// Handle keydown
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  let newValue = props.modelValue

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      newValue = Math.min(props.max, props.modelValue + props.step)
      event.preventDefault()
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      newValue = Math.max(props.min, props.modelValue - props.step)
      event.preventDefault()
      break
    case 'Home':
      newValue = props.min
      event.preventDefault()
      break
    case 'End':
      newValue = props.max
      event.preventDefault()
      break
    case 'PageUp':
      newValue = Math.min(props.max, props.modelValue + props.step * 10)
      event.preventDefault()
      break
    case 'PageDown':
      newValue = Math.max(props.min, props.modelValue - props.step * 10)
      event.preventDefault()
      break
    default:
      return
  }

  emit('update:modelValue', newValue)
  emit('change', newValue)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  user-select: none;
}

/* Track */
.slider__track {
  position: relative;
  width: 100%;
  height: 0.375rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.slider--sm .slider__track {
  height: 0.25rem;
}

.slider--lg .slider__track {
  height: 0.5rem;
}

/* Fill */
.slider__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.1s ease;
}

.slider--primary .slider__fill {
  background-color: #3b82f6;
}

.slider--success .slider__fill {
  background-color: #22c55e;
}

.slider--warning .slider__fill {
  background-color: #f59e0b;
}

.slider--error .slider__fill {
  background-color: #ef4444;
}

.slider--default .slider__fill {
  background-color: #6b7280;
}

/* Thumb */
.slider__thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1.25rem;
  height: 1.25rem;
  background-color: #ffffff;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  cursor: grab;
  transition: all 0.2s ease;
  z-index: 1;
}

.slider--sm .slider__thumb {
  width: 1rem;
  height: 1rem;
}

.slider--lg .slider__thumb {
  width: 1.5rem;
  height: 1.5rem;
}

.slider__thumb:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.slider__thumb:active,
.slider--dragging .slider__thumb {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.15);
}

.slider--focused .slider__thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Thumb colors */
.slider--primary .slider__thumb {
  border-color: #3b82f6;
}

.slider--success .slider__thumb {
  border-color: #22c55e;
}

.slider--warning .slider__thumb {
  border-color: #f59e0b;
}

.slider--error .slider__thumb {
  border-color: #ef4444;
}

.slider--default .slider__thumb {
  border-color: #6b7280;
}

/* Tooltip */
.slider__tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

.slider__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 0.25rem solid transparent;
  border-top-color: #1f2937;
}

/* Ticks */
.slider__ticks {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.slider__tick {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 0.5rem;
  background-color: #d1d5db;
}

.slider__tick--active {
  background-color: #9ca3af;
}

.slider--sm .slider__tick {
  height: 0.375rem;
}

.slider--lg .slider__tick {
  height: 0.625rem;
}

/* Labels */
.slider__labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.5rem;
}

.slider__label {
  font-size: 0.75rem;
  color: #6b7280;
}

.slider--sm .slider__label {
  font-size: 0.6875rem;
}

.slider--lg .slider__label {
  font-size: 0.8125rem;
}

/* Disabled */
.slider--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.slider--disabled .slider__thumb {
  cursor: not-allowed;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .slider__track {
    background-color: #374151;
  }

  .slider__thumb {
    background-color: #1f2937;
  }

  .slider__tick {
    background-color: #4b5563;
  }

  .slider__tick--active {
    background-color: #6b7280;
  }

  .slider__label {
    color: #9ca3af;
  }
}
</style>
