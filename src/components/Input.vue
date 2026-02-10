<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="input__label"
      :class="{ 'input__label--required': required }"
    >
      {{ label }}
    </label>

    <!-- Input Container -->
    <div class="input__container" :class="containerClasses">
      <!-- Prefix Icon/Slot -->
      <span v-if="$slots.prefix || prefixIcon" class="input__prefix">
        <slot name="prefix">
          <component :is="prefixIcon" class="input__prefix-icon" />
        </slot>
      </span>

      <!-- Input Element -->
      <input
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :name="name"
        class="input__field"
        :class="inputClasses"
        @focus="handleFocus"
        @blur="handleBlur"
      >

      <!-- Clear Button -->
      <button
        v-if="clearable && inputValue && !disabled && !readonly"
        type="button"
        class="input__clear"
        tabindex="-1"
        @click="handleClear"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Suffix Icon/Slot -->
      <span v-if="$slots.suffix || suffixIcon" class="input__suffix">
        <slot name="suffix">
          <component :is="suffixIcon" class="input__suffix-icon" />
        </slot>
      </span>

      <!-- Character Count -->
      <span v-if="showCount" class="input__count">
        {{ length }}{{ maxlength ? `/${maxlength}` : '' }}
      </span>
    </div>

    <!-- Helper Text / Error Message -->
    <div v-if="helperText || errorMessage" class="input__helper">
      <span v-if="errorMessage" class="input__error">{{ errorMessage }}</span>
      <span v-else class="input__helper-text">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

export type InputSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'filled' | 'outlined'

interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  showCount?: boolean
  size?: InputSize
  variant?: InputVariant
  maxlength?: number
  minlength?: number
  min?: number
  max?: number
  step?: number
  autocomplete?: string
  name?: string
  prefixIcon?: any
  suffixIcon?: any
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  autocomplete: 'off'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'clear': []
  'change': [value: string | number]
}>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// Generate unique ID
const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 11)}`)

// Internal value
const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value)
})

// Length of input value
const length = computed(() => String(inputValue.value).length)

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'input',
    `input--${props.size}`,
    `input--${props.variant}`
  ]
})

// Container classes
const containerClasses = computed(() => {
  return [
    {
      'input__container--disabled': props.disabled,
      'input__container--readonly': props.readonly,
      'input__container--focused': isFocused.value,
      'input__container--error': props.errorMessage,
      'input__container--has-prefix': props.prefixIcon || props.$slots?.prefix,
      'input__container--has-suffix': props.suffixIcon || props.$slots?.suffix
    }
  ]
})

// Input classes
const inputClasses = computed(() => {
  return [
    `input__field--${props.variant}`
  ]
})

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

// Handle clear
const handleClear = (): void => {
  emit('update:modelValue', '')
  emit('clear')
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Expose methods
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
})
</script>

<style scoped>
.input {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Label */
.input__label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input__label--required::after {
  content: ' *';
  color: #ef4444;
}

/* Container */
.input__container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.input__container:hover:not(.input__container--disabled):not(.input__container--readonly) {
  border-color: #9ca3af;
}

.input__container--focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input__container--error {
  border-color: #ef4444;
}

.input__container--error.input__container--focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input__container--disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.input__container--readonly {
  background-color: #f9fafb;
}

/* Input Field */
.input__field {
  flex: 1;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  background: transparent;
  border: none;
  outline: none;
}

.input__field::placeholder {
  color: #9ca3af;
}

.input__field:disabled {
  cursor: not-allowed;
}

/* Variants */
.input__field--default {
  background-color: transparent;
}

.input__field--filled {
  background-color: #f3f4f6;
}

.input__field--outlined {
  background-color: transparent;
}

/* Sizes */
.input--sm .input__field {
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}

.input--md .input__field {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.input--lg .input__field {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* With Prefix/Suffix */
.input__container--has-prefix .input__field {
  padding-left: 0;
}

.input__container--has-suffix .input__field {
  padding-right: 0;
}

/* Prefix */
.input__prefix {
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
  color: #6b7280;
}

.input__prefix-icon {
  width: 1rem;
  height: 1rem;
}

/* Suffix */
.input__suffix {
  display: flex;
  align-items: center;
  padding-right: 0.75rem;
  color: #6b7280;
}

.input__suffix-icon {
  width: 1rem;
  height: 1rem;
}

/* Clear Button */
.input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  padding: 0;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.input__clear:hover {
  color: #6b7280;
  background-color: #f3f4f6;
}

.input__clear svg {
  width: 0.75rem;
  height: 0.75rem;
}

/* Character Count */
.input__count {
  padding-right: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Helper Text / Error */
.input__helper {
  margin-top: 0.375rem;
  font-size: 0.75rem;
}

.input__helper-text {
  color: #6b7280;
}

.input__error {
  color: #ef4444;
}

/* Variant: Filled */
.input--filled .input__container {
  border: none;
  background-color: #f3f4f6;
}

.input--filled .input__container--focused {
  background-color: #e5e7eb;
}

/* Variant: Outlined */
.input--outlined .input__container {
  background-color: transparent;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .input__label {
    color: #d1d5db;
  }

  .input__container {
    background-color: #1f2937;
    border-color: #4b5563;
  }

  .input__container:hover:not(.input__container--disabled):not(.input__container--readonly) {
    border-color: #6b7280;
  }

  .input__container--focused {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }

  .input__container--disabled,
  .input__container--readonly {
    background-color: #374151;
  }

  .input__field {
    color: #f9fafb;
  }

  .input__field::placeholder {
    color: #6b7280;
  }

  .input__prefix,
  .input__suffix {
    color: #9ca3af;
  }

  .input__clear {
    color: #6b7280;
  }

  .input__clear:hover {
    color: #9ca3af;
    background-color: #374151;
  }

  .input__helper-text {
    color: #9ca3af;
  }

  .input--filled .input__container {
    background-color: #374151;
  }

  .input--filled .input__container--focused {
    background-color: #4b5563;
  }
}
</style>
