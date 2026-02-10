<template>
  <div :class="wrapperClasses">
    <!-- Label -->
    <label
      v-if="label"
      :for="textareaId"
      class="textarea__label"
      :class="{ 'textarea__label--required': required }"
    >
      {{ label }}
    </label>

    <!-- Textarea Container -->
    <div class="textarea__container" :class="containerClasses">
      <textarea
        :id="textareaId"
        ref="textareaRef"
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :minlength="minlength"
        :rows="rows"
        :cols="cols"
        :autocomplete="autocomplete"
        :name="name"
        :resize="resize"
        class="textarea__field"
        :class="inputClasses"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- Footer: Count and Limit -->
    <div v-if="showCount || maxlength" class="textarea__footer">
      <span class="textarea__count">
        {{ length }}{{ maxlength ? `/${maxlength}` : '' }} characters
      </span>
    </div>

    <!-- Helper Text / Error Message -->
    <div v-if="helperText || errorMessage" class="textarea__helper">
      <span v-if="errorMessage" class="textarea__error">{{ errorMessage }}</span>
      <span v-else class="textarea__helper-text">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

export type TextareaSize = 'sm' | 'md' | 'lg'
export type TextareaVariant = 'default' | 'filled' | 'outlined'
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  showCount?: boolean
  size?: TextareaSize
  variant?: TextareaVariant
  resize?: TextareaResize
  rows?: number
  cols?: number
  minlength?: number
  maxlength?: number
  autocomplete?: string
  name?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  resize: 'vertical',
  rows: 3,
  autocomplete: 'off'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const isFocused = ref(false)

// Generate unique ID
const textareaId = computed(() => props.id || `textarea-${Math.random().toString(36).slice(2, 11)}`)

// Internal value
const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (value: string) => emit('update:modelValue', value)
})

// Length of input value
const length = computed(() => String(inputValue.value).length)

// Wrapper classes
const wrapperClasses = computed(() => {
  return [
    'textarea',
    `textarea--${props.size}`,
    `textarea--${props.variant}`
  ]
})

// Container classes
const containerClasses = computed(() => {
  return [
    {
      'textarea__container--disabled': props.disabled,
      'textarea__container--readonly': props.readonly,
      'textarea__container--focused': isFocused.value,
      'textarea__container--error': props.errorMessage
    }
  ]
})

// Input classes
const inputClasses = computed(() => {
  return [
    `textarea__field--${props.variant}`,
    `textarea__field--resize-${props.resize}`
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

// Expose methods
defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
  select: () => textareaRef.value?.select()
})
</script>

<style scoped>
.textarea {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Label */
.textarea__label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.textarea__label--required::after {
  content: ' *';
  color: #ef4444;
}

/* Container */
.textarea__container {
  position: relative;
  display: flex;
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.textarea__container:hover:not(.textarea__container--disabled):not(.textarea__container--readonly) {
  border-color: #9ca3af;
}

.textarea__container--focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea__container--error {
  border-color: #ef4444;
}

.textarea__container--error.textarea__container--focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.textarea__container--disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.textarea__container--readonly {
  background-color: #f9fafb;
}

/* Textarea Field */
.textarea__field {
  flex: 1;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  color: #111827;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  outline: none;
  resize: vertical;
}

.textarea__field::placeholder {
  color: #9ca3af;
}

.textarea__field:disabled {
  cursor: not-allowed;
}

/* Resize variants */
.textarea__field--resize-none {
  resize: none;
}

.textarea__field--resize-vertical {
  resize: vertical;
}

.textarea__field--resize-horizontal {
  resize: horizontal;
}

.textarea__field--resize-both {
  resize: both;
}

/* Variants */
.textarea__field--default {
  background-color: transparent;
}

.textarea__field--filled {
  background-color: #f3f4f6;
}

.textarea__field--outlined {
  background-color: transparent;
}

/* Sizes */
.textarea--sm .textarea__field {
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}

.textarea--lg .textarea__field {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Footer */
.textarea__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.textarea__count {
  color: #6b7280;
}

/* Helper Text / Error */
.textarea__helper {
  margin-top: 0.375rem;
  font-size: 0.75rem;
}

.textarea__helper-text {
  color: #6b7280;
}

.textarea__error {
  color: #ef4444;
}

/* Variant: Filled */
.textarea--filled .textarea__container {
  border: none;
  background-color: #f3f4f6;
}

.textarea--filled .textarea__container--focused {
  background-color: #e5e7eb;
}

/* Variant: Outlined */
.textarea--outlined .textarea__container {
  background-color: transparent;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .textarea__label {
    color: #d1d5db;
  }

  .textarea__container {
    background-color: #1f2937;
    border-color: #4b5563;
  }

  .textarea__container:hover:not(.textarea__container--disabled):not(.textarea__container--readonly) {
    border-color: #6b7280;
  }

  .textarea__container--focused {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }

  .textarea__container--disabled,
  .textarea__container--readonly {
    background-color: #374151;
  }

  .textarea__field {
    color: #f9fafb;
  }

  .textarea__field::placeholder {
    color: #6b7280;
  }

  .textarea__count,
  .textarea__helper-text {
    color: #9ca3af;
  }

  .textarea--filled .textarea__container {
    background-color: #374151;
  }

  .textarea--filled .textarea__container--focused {
    background-color: #4b5563;
  }
}
</style>
