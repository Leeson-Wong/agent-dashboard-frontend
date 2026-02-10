<template>
  <label :class="wrapperClasses">
    <!-- Native Checkbox (Hidden) -->
    <input
      ref="inputRef"
      v-model="checked"
      type="checkbox"
      :disabled="disabled"
      :name="name"
      class="switch__input"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    >

    <!-- Switch Track -->
    <span class="switch__track" :class="trackClasses">
      <!-- Switch Thumb -->
      <span class="switch__thumb" :class="thumbClasses">
        <!-- Icon (optional) -->
        <svg v-if="checkedIcon && checked" class="switch__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>

        <svg v-if="uncheckedIcon && !checked" class="switch__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
    </span>

    <!-- Label -->
    <span v-if="$slots.default || label" class="switch__label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Description -->
    <span v-if="description" class="switch__description">
      {{ description }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type SwitchSize = 'sm' | 'md' | 'lg'
export type SwitchColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: SwitchSize
  color?: SwitchColor
  name?: string
  checkedIcon?: boolean
  uncheckedIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  checkedIcon: false,
  uncheckedIcon: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'change': [value: boolean]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Internal v-model
const checked = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'switch',
    `switch--${props.size}`,
    `switch--${props.color}`,
    {
      'switch--disabled': props.disabled,
      'switch--focused': isFocused.value,
      'switch--checked': checked.value
    }
  ]
})

// Track classes
const trackClasses = computed(() => {
  return [
    {
      'switch__track--checked': checked.value
    }
  ]
})

// Thumb classes
const thumbClasses = computed(() => {
  return [
    'switch__thumb',
    {
      'switch__thumb--checked': checked.value
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
const handleBlur (event: FocusEvent): void => {
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
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.switch--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Hidden Input */
.switch__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Track */
.switch__track {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background-color: #e5e7eb;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.switch__track--checked {
  background-color: #3b82f6;
}

.switch:hover:not(.switch--disabled) .switch__track {
  background-color: #d1d5db;
}

.switch:hover:not(.switch--disabled) .switch__track--checked {
  background-color: #2563eb;
}

.switch--focused .switch__track {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Thumb */
.switch__thumb {
  background-color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  transform: translateX(0);
}

.switch__thumb--checked {
  transform: translateX(100%);
}

/* Icon */
.switch__icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.75em;
  height: 0.75em;
  color: currentColor;
}

/* Sizes */
.switch--sm .switch__track {
  width: 2.5rem;
  height: 1.25rem;
  padding: 0.125rem;
}

.switch--sm .switch__thumb {
  width: 1rem;
  height: 1rem;
}

.switch--md .switch__track {
  width: 3rem;
  height: 1.5rem;
  padding: 0.125rem;
}

.switch--md .switch__thumb {
  width: 1.25rem;
  height: 1.25rem;
}

.switch--lg .switch__track {
  width: 3.5rem;
  height: 1.75rem;
  padding: 0.125rem;
}

.switch--lg .switch__thumb {
  width: 1.5rem;
  height: 1.5rem;
}

/* Label */
.switch__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.25rem;
}

.switch--disabled .switch__label {
  color: #9ca3af;
}

/* Description */
.switch__description {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
  line-height: 1rem;
}

.switch--disabled .switch__description {
  color: #9ca3af;
}

/* Color Variants */
.switch--success .switch__track--checked {
  background-color: #22c55e;
}

.switch--success:hover:not(.switch--disabled) .switch__track--checked {
  background-color: #16a34a;
}

.switch--success.switch--focused .switch__track {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.switch--warning .switch__track--checked {
  background-color: #f59e0b;
}

.switch--warning:hover:not(.switch--disabled) .switch__track--checked {
  background-color: #d97706;
}

.switch--warning.switch--focused .switch__track {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.switch--error .switch__track--checked {
  background-color: #ef4444;
}

.switch--error:hover:not(.switch--disabled) .switch__track--checked {
  background-color: #dc2626;
}

.switch--error.switch--focused .switch__track {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .switch__track {
    background-color: #374151;
  }

  .switch:hover:not(.switch--disabled) .switch__track {
    background-color: #4b5563;
  }

  .switch__thumb {
    background-color: #f9fafb;
  }

  .switch__label {
    color: #d1d5db;
  }

  .switch--disabled .switch__label {
    color: #6b7280;
  }

  .switch__description {
    color: #9ca3af;
  }

  .switch--disabled .switch__description {
    color: #6b7280;
  }
}
</style>
