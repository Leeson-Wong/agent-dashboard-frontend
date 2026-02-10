<template>
  <label :class="wrapperClasses">
    <!-- Native Radio (Hidden) -->
    <input
      ref="inputRef"
      v-model="checked"
      type="radio"
      :disabled="disabled"
      :value="value"
      :name="name"
      class="radio__input"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    >

    <!-- Custom Radio -->
    <span class="radio__box" :class="boxClasses">
      <span class="radio__dot"></span>
    </span>

    <!-- Label -->
    <span v-if="$slots.default || label" class="radio__label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Description -->
    <span v-if="description" class="radio__description">
      {{ description }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type RadioSize = 'sm' | 'md' | 'lg'
export type RadioColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  modelValue?: string | number | boolean
  value: string | number | boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: RadioSize
  color?: RadioColor
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'change': [value: string | number | boolean]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Checked state
const isChecked = computed(() => props.modelValue === props.value)

// Internal v-model
const checked = computed({
  get: () => props.modelValue,
  set: (value: string | number | boolean) => {
    emit('update:modelValue', props.value)
  }
})

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'radio',
    `radio--${props.size}`,
    `radio--${props.color}`,
    {
      'radio--disabled': props.disabled,
      'radio--focused': isFocused.value,
      'radio--checked': isChecked.value
    }
  ]
})

// Box classes
const boxClasses = computed(() => {
  return [
    {
      'radio__box--checked': isChecked.value
    }
  ]
})

// Handle change
const handleChange = (): void => {
  emit('change', props.value)
}

// Handle focus
const handleFocus = (event: FocusEvent): void => {
  isFocused.value = true
  emit('focus', event)
}

// Handle blur
const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  emit('blur', event)
}

// Expose methods
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>

<style scoped>
.radio {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.radio--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Hidden Input */
.radio__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Radio Box */
.radio__box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.radio:hover:not(.radio--disabled) .radio__box {
  border-color: #9ca3af;
}

.radio--focused .radio__box {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.radio__box--checked {
  border-color: #3b82f6;
}

/* Radio Dot */
.radio__dot {
  background-color: #3b82f6;
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.2s ease;
}

.radio__box--checked .radio__dot {
  transform: scale(1);
}

/* Sizes */
.radio--sm .radio__box {
  width: 1rem;
  height: 1rem;
}

.radio--sm .radio__dot {
  width: 0.5rem;
  height: 0.5rem;
}

.radio--md .radio__box {
  width: 1.25rem;
  height: 1.25rem;
}

.radio--md .radio__dot {
  width: 0.625rem;
  height: 0.625rem;
}

.radio--lg .radio__box {
  width: 1.5rem;
  height: 1.5rem;
}

.radio--lg .radio__dot {
  width: 0.75rem;
  height: 0.75rem;
}

/* Label */
.radio__label {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.25rem;
}

.radio--disabled .radio__label {
  color: #9ca3af;
}

/* Description */
.radio__description {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
  line-height: 1rem;
}

.radio--disabled .radio__description {
  color: #9ca3af;
}

/* Color Variants */
.radio--success.radio--checked .radio__box {
  border-color: #22c55e;
}

.radio--success .radio__dot {
  background-color: #22c55e;
}

.radio--success.radio--focused .radio__box {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.radio--warning.radio--checked .radio__box {
  border-color: #f59e0b;
}

.radio--warning .radio__dot {
  background-color: #f59e0b;
}

.radio--warning.radio--focused .radio__box {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.radio--error.radio--checked .radio__box {
  border-color: #ef4444;
}

.radio--error .radio__dot {
  background-color: #ef4444;
}

.radio--error.radio--focused .radio__box {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .radio__box {
    background-color: #1f2937;
    border-color: #4b5563;
  }

  .radio:hover:not(.radio--disabled) .radio__box {
    border-color: #6b7280;
  }

  .radio__label {
    color: #d1d5db;
  }

  .radio--disabled .radio__label {
    color: #6b7280;
  }

  .radio__description {
    color: #9ca3af;
  }

  .radio--disabled .radio__description {
    color: #6b7280;
  }
}
</style>
