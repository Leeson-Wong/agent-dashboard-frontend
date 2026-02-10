<template>
  <div :class="collapsibleClasses">
    <!-- Header -->
    <div
      class="collapsible__header"
      @click="toggle"
    >
      <slot name="header" :expanded="expanded">
        <span class="collapsible__title">{{ title }}</span>
      </slot>

      <div class="collapsible__toggle" :class="{ 'collapsible__toggle--expanded': expanded }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>

    <!-- Content -->
    <Transition
      @before-enter="handleBeforeEnter"
      @enter="handleEnter"
      @after-enter="handleAfterEnter"
      @before-leave="handleBeforeLeave"
      @leave="handleLeave"
      @after-leave="handleAfterLeave"
    >
      <div v-if="expanded" class="collapsible__content-wrapper">
        <div class="collapsible__content">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type CollapsibleSize = 'sm' | 'md' | 'lg'
export type CollapsibleVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  title?: string
  expanded?: boolean
  disabled?: boolean
  size?: CollapsibleSize
  variant?: CollapsibleVariant
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  expanded: false,
  disabled: false,
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'toggle': [value: boolean]
}>()

// State
const isExpanded = ref(props.expanded)

// Computed
const expanded = computed({
  get: () => isExpanded.value,
  set: (value) => {
    isExpanded.value = value
    emit('update:expanded', value)
    emit('toggle', value)
  }
})

const collapsibleClasses = computed(() => [
  'collapsible',
  `collapsible--${props.size}`,
  `collapsible--${props.variant}`,
  {
    'collapsible--disabled': props.disabled,
    'collapsible--expanded': expanded.value
  }
])

// Methods
const toggle = () => {
  if (props.disabled) return
  expanded.value = !expanded.value
}

// Transition handlers
const handleBeforeEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.overflow = 'hidden'
}

const handleEnter = (el: HTMLElement) => {
  const height = el.scrollHeight
  el.style.height = `${height}px`
}

const handleAfterEnter = (el: HTMLElement) => {
  el.style.height = ''
  el.style.overflow = ''
}

const handleBeforeLeave = (el: HTMLElement) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.overflow = 'hidden'
}

const handleLeave = (el: HTMLElement) => {
  requestAnimationFrame(() => {
    el.style.height = '0'
  })
}

const handleAfterLeave = (el: HTMLElement) => {
  el.style.height = ''
  el.style.overflow = ''
}
</script>

<style scoped>
.collapsible {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: #ffffff;
  overflow: hidden;
}

.collapsible--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Header */
.collapsible__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.collapsible__header:hover {
  background-color: #f9fafb;
}

.collapsible--disabled .collapsible__header {
  cursor: not-allowed;
}

/* Sizes */
.collapsible--sm .collapsible__header {
  padding: 0.5rem 0.75rem;
}

.collapsible--lg .collapsible__header {
  padding: 1rem 1.25rem;
}

/* Title */
.collapsible__title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
}

.collapsible--sm .collapsible__title {
  font-size: 0.875rem;
}

.collapsible--lg .collapsible__title {
  font-size: 1rem;
}

/* Toggle */
.collapsible__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
  transition: transform 0.2s ease, color 0.2s ease;
}

.collapsible__toggle svg {
  width: 1rem;
  height: 1rem;
}

.collapsible__toggle--expanded {
  transform: rotate(180deg);
}

.collapsible--primary .collapsible__toggle {
  color: #3b82f6;
}

.collapsible--success .collapsible__toggle {
  color: #22c55e;
}

.collapsible--warning .collapsible__toggle {
  color: #f59e0b;
}

.collapsible--error .collapsible__toggle {
  color: #ef4444;
}

/* Content Wrapper */
.collapsible__content-wrapper {
  overflow: hidden;
  transition: height 0.3s ease;
}

/* Content */
.collapsible__content {
  padding: 0 1rem 1rem;
}

.collapsible--sm .collapsible__content {
  padding: 0 0.75rem 0.75rem;
  font-size: 0.875rem;
}

.collapsible--lg .collapsible__content {
  padding: 0 1.25rem 1.25rem;
  font-size: 0.9375rem;
}

/* Variant Styles */
.collapsible--primary {
  border-color: #3b82f6;
}

.collapsible--primary .collapsible__header {
  background-color: #eff6ff;
}

.collapsible--success {
  border-color: #22c55e;
}

.collapsible--success .collapsible__header {
  background-color: #dcfce7;
}

.collapsible--warning {
  border-color: #f59e0b;
}

.collapsible--warning .collapsible__header {
  background-color: #fef3c7;
}

.collapsible--error {
  border-color: #ef4444;
}

.collapsible--error .collapsible__header {
  background-color: #fee2e2;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .collapsible {
    background-color: #1f2937;
    border-color: #374151;
  }

  .collapsible__header:hover {
    background-color: #374151;
  }

  .collapsible__title {
    color: #f9fafb;
  }

  .collapsible__toggle {
    color: #9ca3af;
  }

  .collapsible--primary {
    border-color: #3b82f6;
  }

  .collapsible--primary .collapsible__header {
    background-color: #1e3a8a;
  }

  .collapsible--success {
    border-color: #22c55e;
  }

  .collapsible--success .collapsible__header {
    background-color: #14532d;
  }

  .collapsible--warning {
    border-color: #f59e0b;
  }

  .collapsible--warning .collapsible__header {
    background-color: #78350f;
  }

  .collapsible--error {
    border-color: #ef4444;
  }

  .collapsible--error .collapsible__header {
    background-color: #7f1d1d;
  }
}
</style>
