<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      class="select__label"
      :class="{ 'select__label--required': required }"
    >
      {{ label }}
    </label>

    <!-- Select Container -->
    <div class="select__container" :class="containerClasses">
      <!-- Select Element -->
      <select
        :id="selectId"
        ref="selectRef"
        v-model="selectedValue"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :size="size"
        class="select__field"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <option
          v-if="placeholder && !multiple"
          value=""
          disabled
          :selected="selectedValue === ''"
        >
          {{ placeholder }}
        </option>

        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
          :disabled="option.disabled"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>

      <!-- Suffix Icon (Dropdown Arrow) -->
      <span v-if="!multiple" class="select__icon">
        <slot name="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </slot>
      </span>
    </div>

    <!-- Helper Text / Error Message -->
    <div v-if="helperText || errorMessage" class="select__helper">
      <span v-if="errorMessage" class="select__error">{{ errorMessage }}</span>
      <span v-else class="select__helper-text">{{ helperText }}</span>
    </div>

    <!-- Selected Values Display (for multiple) -->
    <div v-if="multiple && selectedOptions.length > 0" class="select__selected">
      <Badge
        v-for="option in selectedOptions"
        :key="getOptionValue(option)"
        :text="getOptionLabel(option)"
        variant="primary"
        size="sm"
        :closable="!disabled"
        @close="deselectOption(option)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Badge from './Badge.vue'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export type SelectSize = 'sm' | 'md' | 'lg'
export type SelectVariant = 'default' | 'filled' | 'outlined'

interface Props {
  modelValue?: string | number | string[] | number[]
  options: SelectOption[]
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  disabled?: boolean
  required?: boolean
  multiple?: boolean
  size?: SelectSize
  variant?: SelectVariant
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | string[] | number[]]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'change': [value: string | number | string[] | number[]]
}>()

const selectRef = ref<HTMLSelectElement>()
const isFocused = ref(false)

// Generate unique ID
const selectId = computed(() => props.id || `select-${Math.random().toString(36).slice(2, 11)}`)

// Get option value
const getOptionValue = (option: SelectOption): string => {
  return String(option.value)
}

// Get option label
const getOptionLabel = (option: SelectOption): string => {
  return option.label
}

// Internal value
const selectedValue = computed({
  get: () => props.modelValue ?? (props.multiple ? [] : ''),
  set: (value) => emit('update:modelValue', value)
})

// Selected options for multiple select
const selectedOptions = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) {
    return []
  }
  return props.options.filter(option =>
    props.modelValue.includes(option.value)
  )
})

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'select',
    `select--${props.size}`,
    `select--${props.variant}`
  ]
})

// Container classes
const containerClasses = computed(() => {
  return [
    {
      'select__container--disabled': props.disabled,
      'select__container--focused': isFocused.value,
      'select__container--error': props.errorMessage,
      'select__container--multiple': props.multiple
    }
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

// Handle change
const handleChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement
  if (props.multiple) {
    const values = Array.from(target.selectedOptions).map(opt => opt.value)
    emit('change', values)
  } else {
    emit('change', target.value)
  }
}

// Deselect option (multiple)
const deselectOption = (option: SelectOption): void => {
  if (Array.isArray(props.modelValue)) {
    const newValue = props.modelValue.filter(v => v !== option.value)
    emit('update:modelValue', newValue)
  }
}

// Expose methods
defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur()
})
</script>

<style scoped>
.select {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Label */
.select__label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.select__label--required::after {
  content: ' *';
  color: #ef4444;
}

/* Container */
.select__container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.select__container:hover:not(.select__container--disabled) {
  border-color: #9ca3af;
}

.select__container--focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select__container--error {
  border-color: #ef4444;
}

.select__container--error.select__container--focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.select__container--disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Select Field */
.select__field {
  flex: 1;
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  appearance: none;
  outline: none;
}

.select__field:disabled {
  cursor: not-allowed;
}

.select__field::placeholder {
  color: #9ca3af;
}

/* Multiple select */
.select__container--multiple .select__field {
  padding-right: 0.75rem;
}

/* Icon */
.select__icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
  color: #6b7280;
}

.select__icon svg {
  width: 1rem;
  height: 1rem;
}

/* Sizes */
.select--sm .select__field {
  padding: 0.375rem 2rem 0.375rem 0.5rem;
  font-size: 0.875rem;
}

.select--lg .select__field {
  padding: 0.75rem 2.75rem 0.75rem 1rem;
  font-size: 1rem;
}

/* Helper Text / Error */
.select__helper {
  margin-top: 0.375rem;
  font-size: 0.75rem;
}

.select__helper-text {
  color: #6b7280;
}

.select__error {
  color: #ef4444;
}

/* Selected Values (Multiple) */
.select__selected {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Variant: Filled */
.select--filled .select__container {
  border: none;
  background-color: #f3f4f6;
}

.select--filled .select__container--focused {
  background-color: #e5e7eb;
}

/* Variant: Outlined */
.select--outlined .select__container {
  background-color: transparent;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .select__label {
    color: #d1d5db;
  }

  .select__container {
    background-color: #1f2937;
    border-color: #4b5563;
  }

  .select__container:hover:not(.select__container--disabled) {
    border-color: #6b7280;
  }

  .select__container--focused {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }

  .select__container--disabled {
    background-color: #374151;
  }

  .select__field {
    color: #f9fafb;
  }

  .select__icon {
    color: #9ca3af;
  }

  .select__helper-text {
    color: #9ca3af;
  }

  .select--filled .select__container {
    background-color: #374151;
  }

  .select--filled .select__container--focused {
    background-color: #4b5563;
  }
}
</style>
