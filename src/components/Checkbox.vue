<template>
  <label :class="wrapperClasses">
    <!-- Native Checkbox (Hidden) -->
    <input
      ref="inputRef"
      v-model="checked"
      type="checkbox"
      :disabled="disabled"
      :indeterminate="indeterminate"
      :value="value"
      :name="name"
      class="checkbox__input"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    >

    <!-- Custom Checkbox -->
    <span class="checkbox__box" :class="boxClasses">
      <!-- Check Icon -->
      <svg v-if="!indeterminate && (isChecked || (isModelArray && isChecked))" class="checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>

      <!-- Indeterminate Icon -->
      <svg v-if="indeterminate" class="checkbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <line x1="4" y1="12" x2="20" y2="12"></line>
      </svg>
    </span>

    <!-- Label -->
    <span v-if="$slots.default || label" class="checkbox__label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Description -->
    <span v-if="description" class="checkbox__description">
      {{ description }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type CheckboxSize = 'sm' | 'md' | 'lg'
export type CheckboxColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  modelValue?: boolean | string[] | number[]
  value?: string | number
  label?: string
  description?: string
  disabled?: boolean
  indeterminate?: boolean
  size?: CheckboxSize
  color?: CheckboxColor
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string[] | number[]]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'change': [value: boolean | string[] | number[]]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Check if model value is array
const isModelArray = computed(() => Array.isArray(props.modelValue))

// Checked state for boolean model
const isChecked = computed(() => {
  if (isModelArray.value) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue
})

// Internal v-model
const checked = computed({
  get: () => {
    if (isModelArray.value) {
      return props.modelValue.includes(props.value)
    }
    return props.modelValue
  },
  set: (value: boolean) => {
    if (isModelArray.value && props.value !== undefined) {
      const currentArray = [...(props.modelValue as any[])]
      if (value) {
        if (!currentArray.includes(props.value)) {
          currentArray.push(props.value)
        }
      } else {
        const index = currentArray.indexOf(props.value)
        if (index > -1) {
          currentArray.splice(index, 1)
        }
      }
      emit('update:modelValue', currentArray)
    } else {
      emit('update:modelValue', value)
    }
  }
})

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'checkbox',
    `checkbox--${props.size}`,
    `checkbox--${props.color}`,
    {
      'checkbox--disabled': props.disabled,
      'checkbox--focused': isFocused.value,
      'checkbox--checked': isChecked.value,
      'checkbox--indeterminate': props.indeterminate
    }
  ]
})

// Box classes
const boxClasses = computed(() => {
  return [
    {
      'checkbox__box--checked': isChecked.value || props.indeterminate,
      'checkbox__box--indeterminate': props.indeterminate
    }
  ]
})

// Handle change
const handleChange = (): void => {
  emit('change', checked.value)
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
.checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Hidden Input */
.checkbox__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Checkbox Box */
.checkbox__box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.checkbox:hover:not(.checkbox--disabled) .checkbox__box {
  border-color: #9ca3af;
}

.checkbox--focused .checkbox__box {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox--checked .checkbox__box,
.checkbox__box--checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox--indeterminate .checkbox__box {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

/* Sizes */
.checkbox--sm .checkbox__box {
  width: 1rem;
  height: 1rem;
}

.checkbox--md .checkbox__box {
  width: 1.25rem;
  height: 1.25rem;
}

.checkbox--lg .checkbox__box {
  width: 1.5rem;
  height: 1.5rem;
}

/* Check Icon */
.checkbox__icon {
  width: 0.75em;
  height: 0.75em;
  color: #ffffff;
}

.checkbox--sm .checkbox__icon {
  width: 0.625rem;
  height: 0.625rem;
}

.checkbox--lg .checkbox__icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Label */
.checkbox__label {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.25rem;
}

.checkbox--disabled .checkbox__label {
  color: #9ca3af;
}

/* Description */
.checkbox__description {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
  line-height: 1rem;
}

.checkbox--disabled .checkbox__description {
  color: #9ca3af;
}

/* Color Variants */
.checkbox--success.checkbox--checked .checkbox__box,
.checkbox--success .checkbox__box--checked {
  background-color: #22c55e;
  border-color: #22c55e;
}

.checkbox--success.checkbox--focused .checkbox__box {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.checkbox--warning.checkbox--checked .checkbox__box,
.checkbox--warning .checkbox__box--checked {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.checkbox--warning.checkbox--focused .checkbox__box {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.checkbox--error.checkbox--checked .checkbox__box,
.checkbox--error .checkbox__box--checked {
  background-color: #ef4444;
  border-color: #ef4444;
}

.checkbox--error.checkbox--focused .checkbox__box {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .checkbox__box {
    background-color: #1f2937;
    border-color: #4b5563;
  }

  .checkbox:hover:not(.checkbox--disabled) .checkbox__box {
    border-color: #6b7280;
  }

  .checkbox__label {
    color: #d1d5db;
  }

  .checkbox--disabled .checkbox__label {
    color: #6b7280;
  }

  .checkbox__description {
    color: #9ca3af;
  }

  .checkbox--disabled .checkbox__description {
    color: #6b7280;
  }
}
</style>
