<template>
  <div :class="ratingClasses" @mouseleave="handleMouseLeave">
    <div
      v-for="index in max"
      :key="index"
      class="rating__star"
      :class="starClasses(index)"
      :style="starStyles(index)"
      @mouseenter="handleMouseEnter(index)"
      @click="handleClick(index)"
    >
      <!-- Empty Star -->
      <component :is="emptyStarIcon" class="rating__icon rating__icon--empty" />

      <!-- Partial Fill (for decimal values) -->
      <component
        v-if="isPartialStar(index)"
        :is="halfStarIcon"
        class="rating__icon rating__icon--half"
      />

      <!-- Filled Star -->
      <component
        v-if="isFilledStar(index)"
        :is="filledStarIcon"
        class="rating__icon rating__icon--filled"
      />
    </div>

    <!-- Label/Value -->
    <div v-if="showLabel || showValue" class="rating__label">
      <template v-if="showLabel">
        {{ label }}
      </template>
      <template v-if="showValue">
        {{ formatValue(displayValue) }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'

export type RatingSize = 'sm' | 'md' | 'lg'
export type RatingColor = 'default' | 'primary' | 'success' | 'warning' | 'error'
export type RatingIcon = 'star' | 'heart' | 'thumb' | 'circle'

interface Props {
  modelValue: number
  max?: number
  size?: RatingSize
  color?: RatingColor
  icon?: RatingIcon
  readonly?: boolean
  disabled?: boolean
  half?: boolean
  showLabel?: boolean
  showValue?: boolean
  label?: string
  formatValue?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  max: 5,
  size: 'md',
  color: 'warning',
  icon: 'star',
  readonly: false,
  disabled: false,
  half: false,
  showLabel: false,
  showValue: false,
  label: '',
  formatValue: (value: number) => value.toFixed(1)
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'hover': [value: number]
  'leave': []
}>()

// Icons
const emptyStarIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' })])
})

const filledStarIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    stroke: 'none'
  }, [h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' })])
})

const halfStarIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('defs', [
      h('linearGradient', { id: 'half-fill' }, [
        h('stop', { offset: '50%', 'stop-color': 'currentColor' }),
        h('stop', { offset: '50%', 'stop-color': 'transparent', 'stop-opacity': '0' })
      ])
    ]),
    h('polygon', {
      points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
      fill: 'url(#half-fill)'
    })
  ])
})

// State
const hoverValue = ref<number | null>(null)

// Display value (hover or actual)
const displayValue = computed(() => {
  return hoverValue.value ?? props.modelValue
})

// Computed classes
const ratingClasses = computed(() => [
  'rating',
  `rating--${props.size}`,
  `rating--${props.color}`,
  `rating--${props.icon}`,
  {
    'rating--readonly': props.readonly,
    'rating--disabled': props.disabled,
    'rating--half': props.half
  }
])

// Star classes
const starClasses = (index: number) => {
  const value = displayValue.value
  const isActive = index <= value
  const isPartial = props.half && index === Math.ceil(value) && value % 1 !== 0

  return {
    'rating__star--active': isActive && !isPartial,
    'rating__star--partial': isPartial,
    'rating__star--readonly': props.readonly || props.disabled
  }
}

// Star styles
const starStyles = (index: number) => {
  return {}
}

// Check if star is partially filled
const isPartialStar = (index: number) => {
  if (!props.half) return false
  const value = displayValue.value
  return index === Math.ceil(value) && value % 1 !== 0
}

// Check if star is fully filled
const isFilledStar = (index: number) => {
  const value = displayValue.value
  return index <= value && !(props.half && index === Math.ceil(value) && value % 1 !== 0)
}

// Handle mouse enter
const handleMouseEnter = (index: number) => {
  if (props.readonly || props.disabled) return
  hoverValue.value = index
  emit('hover', index)
}

// Handle mouse leave
const handleMouseLeave = () => {
  if (props.readonly || props.disabled) return
  hoverValue.value = null
  emit('leave')
}

// Handle click
const handleClick = (index: number) => {
  if (props.readonly || props.disabled) return
  emit('update:modelValue', index)
}
</script>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Sizes */
.rating--sm .rating__star {
  width: 1rem;
  height: 1rem;
}

.rating--md .rating__star {
  width: 1.25rem;
  height: 1.25rem;
}

.rating--lg .rating__star {
  width: 1.5rem;
  height: 1.5rem;
}

/* Star */
.rating__star {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.rating__star:hover:not(.rating__star--readonly) {
  transform: scale(1.1);
}

.rating--sm .rating__star:hover:not(.rating__star--readonly) {
  transform: scale(1.15);
}

.rating--lg .rating__star:hover:not(.rating__star--readonly) {
  transform: scale(1.05);
}

/* Icon */
.rating__icon {
  width: 100%;
  height: 100%;
  transition: color 0.2s ease;
}

/* Empty star color */
.rating__icon--empty {
  color: #d1d5db;
}

/* Filled star colors */
.rating--default .rating__icon--filled,
.rating--default .rating__icon--half {
  color: #6b7280;
}

.rating--primary .rating__icon--filled,
.rating--primary .rating__icon--half {
  color: #3b82f6;
}

.rating--success .rating__icon--filled,
.rating--success .rating__icon--half {
  color: #22c55e;
}

.rating--warning .rating__icon--filled,
.rating--warning .rating__icon--half {
  color: #f59e0b;
}

.rating--error .rating__icon--filled,
.rating--error .rating__icon--half {
  color: #ef4444;
}

/* Half star */
.rating__icon--half {
  position: absolute;
  top: 0;
  left: 0;
}

/* Readonly/Disabled */
.rating__star--readonly {
  cursor: default;
}

.rating--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Label */
.rating__label {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.rating--sm .rating__label {
  font-size: 0.8125rem;
}

.rating--lg .rating__label {
  font-size: 0.9375rem;
}

/* Icon variants - Heart */
.rating--heart .rating__icon--empty {
  color: #fca5a5;
}

.rating--heart .rating__icon--filled {
  color: #ef4444;
}

/* Icon variants - Thumb */
.rating--thumb .rating__icon--empty {
  color: #d1d5db;
}

.rating--thumb .rating__icon--filled {
  color: #22c55e;
}

/* Icon variants - Circle */
.rating--circle .rating__icon--empty {
  color: #d1d5db;
}

.rating--circle .rating__icon--filled {
  color: #3b82f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .rating__icon--empty {
    color: #4b5563;
  }

  .rating__label {
    color: #d1d5db;
  }

  .rating--default .rating__icon--filled,
  .rating--default .rating__icon--half {
    color: #9ca3af;
  }

  .rating--heart .rating__icon--empty {
    color: #7f1d1d;
  }

  .rating--thumb .rating__icon--empty {
    color: #4b5563;
  }

  .rating--circle .rating__icon--empty {
    color: #4b5563;
  }
}
</style>
