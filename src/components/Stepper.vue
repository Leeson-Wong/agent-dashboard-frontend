<template>
  <div :class="stepperClasses">
    <!-- Horizontal Stepper -->
    <template v-if="orientation === 'horizontal'">
      <div class="stepper__horizontal">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="stepper__item"
          :class="getItemClasses(index)"
          @click="handleStepClick(index)"
        >
          <!-- Connector Line (before step) -->
          <div
            v-if="index > 0"
            class="stepper__line stepper__line--before"
            :class="getLineClasses(index - 1)"
          ></div>

          <!-- Step Content -->
          <div class="stepper__step">
            <!-- Step Icon/Number -->
            <div class="stepper__icon">
              <component
                v-if="getStepStatus(index) === 'completed' && completedIcon"
                :is="completedIcon"
                class="stepper__icon-check"
              />
              <component
                v-else-if="getStepStatus(index) === 'error' && errorIcon"
                :is="errorIcon"
                class="stepper__icon-error"
              />
              <span v-else class="stepper__icon-number">{{ index + 1 }}</span>
            </div>

            <!-- Step Label -->
            <div v-if="showLabels" class="stepper__label">
              <div class="stepper__label-title">{{ step.title }}</div>
              <div v-if="step.subtitle" class="stepper__label-subtitle">{{ step.subtitle }}</div>
            </div>
          </div>

          <!-- Connector Line (after step) -->
          <div
            v-if="index < steps.length - 1"
            class="stepper__line stepper__line--after"
            :class="getLineClasses(index)"
          ></div>
        </div>
      </div>
    </template>

    <!-- Vertical Stepper -->
    <template v-else>
      <div class="stepper__vertical">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="stepper__item"
          :class="getItemClasses(index)"
          @click="handleStepClick(index)"
        >
          <!-- Step Row -->
          <div class="stepper__step">
            <!-- Step Icon/Number -->
            <div class="stepper__icon">
              <component
                v-if="getStepStatus(index) === 'completed' && completedIcon"
                :is="completedIcon"
                class="stepper__icon-check"
              />
              <component
                v-else-if="getStepStatus(index) === 'error' && errorIcon"
                :is="errorIcon"
                class="stepper__icon-error"
              />
              <span v-else class="stepper__icon-number">{{ index + 1 }}</span>
            </div>

            <!-- Step Label -->
            <div v-if="showLabels" class="stepper__label">
              <div class="stepper__label-title">{{ step.title }}</div>
              <div v-if="step.subtitle" class="stepper__label-subtitle">{{ step.subtitle }}</div>
            </div>
          </div>

          <!-- Connector Line -->
          <div
            v-if="index < steps.length - 1"
            class="stepper__line stepper__line--vertical"
            :class="getLineClasses(index)"
          ></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export interface Step {
  title: string
  subtitle?: string
}

export type StepperSize = 'sm' | 'md' | 'lg'
export type StepperColor = 'default' | 'primary' | 'success' | 'warning' | 'error'
export type StepperOrientation = 'horizontal' | 'vertical'

interface Props {
  steps: Step[]
  modelValue: number
  size?: StepperSize
  color?: StepperColor
  orientation?: StepperOrientation
  showLabels?: boolean
  clickable?: boolean
  linear?: boolean
  completedIcon?: any
  errorIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  orientation: 'horizontal',
  showLabels: true,
  clickable: false,
  linear: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'step-click': [index: number]
}>()

// Default icons
const defaultCompletedIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polyline', { points: '20 6 9 17 4 12' })])
})

const defaultErrorIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('circle', { cx: '12', cy: '12', r: '10' }), h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }), h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })])
})

const completedIcon = computed(() => props.completedIcon || defaultCompletedIcon)
const errorIcon = computed(() => props.errorIcon || defaultErrorIcon)

// Computed classes
const stepperClasses = computed(() => [
  'stepper',
  `stepper--${props.size}`,
  `stepper--${props.color}`,
  `stepper--${props.orientation}`,
  {
    'stepper--clickable': props.clickable
  }
])

// Get step status
const getStepStatus = (index: number) => {
  const current = props.modelValue

  if (index < current) return 'completed'
  if (index === current) return 'active'
  return 'pending'
}

// Get item classes
const getItemClasses = (index: number) => {
  const status = getStepStatus(index)

  return [
    `stepper__item--${status}`,
    {
      'stepper__item--clickable': props.clickable && canClickStep(index)
    }
  ]
}

// Get line classes
const getLineClasses = (index: number) => {
  const status = getStepStatus(index + 1)
  return {
    'stepper__line--completed': status === 'completed',
    'stepper__line--active': status === 'active'
  }
}

// Check if step can be clicked
const canClickStep = (index: number) => {
  if (!props.linear) return true
  return index <= props.modelValue
}

// Handle step click
const handleStepClick = (index: number) => {
  if (!props.clickable || !canClickStep(index)) return

  emit('update:modelValue', index)
  emit('step-click', index)
}
</script>

<style scoped>
.stepper {
  width: 100%;
}

/* Horizontal Stepper */
.stepper__horizontal {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stepper--horizontal .stepper__item {
  flex: 1;
  display: flex;
  align-items: center;
}

/* Vertical Stepper */
.stepper__vertical {
  display: flex;
  flex-direction: column;
}

.stepper--vertical .stepper__item {
  display: flex;
  flex-direction: column;
}

/* Item */
.stepper__item {
  position: relative;
}

.stepper__item--clickable {
  cursor: pointer;
}

.stepper__item--clickable:hover .stepper__icon {
  transform: scale(1.1);
}

/* Step */
.stepper__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 1;
}

.stepper--vertical .stepper__step {
  flex-direction: row;
  width: 100%;
}

/* Icon */
.stepper__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.3s ease;
}

.stepper--sm .stepper__icon {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
}

.stepper--lg .stepper__icon {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1rem;
}

/* Icon states */
.stepper__item--active .stepper__icon {
  background-color: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.stepper__item--completed .stepper__icon {
  background-color: #22c55e;
  color: #ffffff;
}

.stepper__item--error .stepper__icon {
  background-color: #ef4444;
  color: #ffffff;
}

/* Icon content */
.stepper__icon-number {
  font-size: inherit;
}

.stepper__icon-check,
.stepper__icon-error {
  width: 1em;
  height: 1em;
}

/* Label */
.stepper__label {
  text-align: center;
}

.stepper--vertical .stepper__label {
  text-align: left;
  margin-left: 0.75rem;
}

.stepper__label-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.stepper--sm .stepper__label-title {
  font-size: 0.8125rem;
}

.stepper--lg .stepper__label-title {
  font-size: 0.9375rem;
}

.stepper__item--active .stepper__label-title {
  color: #3b82f6;
}

.stepper__label-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

/* Line */
.stepper__line {
  background-color: #e5e7eb;
  flex: 1;
}

.stepper--horizontal .stepper__line--before {
  height: 2px;
  min-width: 2rem;
}

.stepper--horizontal .stepper__line--after {
  height: 2px;
  min-width: 2rem;
}

.stepper--vertical .stepper__line--vertical {
  width: 2px;
  height: 2rem;
  margin-left: 1rem;
}

.stepper--sm .stepper__line--vertical {
  height: 1.5rem;
  margin-left: 0.75rem;
}

.stepper--lg .stepper__line--vertical {
  height: 2.5rem;
  margin-left: 1.25rem;
}

/* Line states */
.stepper__line--completed,
.stepper__line--active {
  background-color: #22c55e;
}

.stepper__item--error + .stepper__line,
.stepper__item--error ~ .stepper__line {
  background-color: #ef4444;
}

/* Color variants */
.stepper--primary .stepper__item--active .stepper__icon {
  background-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.stepper--success .stepper__item--active .stepper__icon {
  background-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

.stepper--warning .stepper__item--active .stepper__icon {
  background-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
}

.stepper--error .stepper__item--active .stepper__icon {
  background-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

.stepper--default .stepper__item--active .stepper__icon {
  background-color: #6b7280;
  box-shadow: 0 0 0 4px rgba(107, 114, 128, 0.2);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .stepper__icon {
    background-color: #374151;
    color: #9ca3af;
  }

  .stepper__label-title {
    color: #f3f4f6;
  }

  .stepper__label-subtitle {
    color: #9ca3af;
  }

  .stepper__line {
    background-color: #374151;
  }

  .stepper__item--active .stepper__label-title {
    color: #60a5fa;
  }
}
</style>
