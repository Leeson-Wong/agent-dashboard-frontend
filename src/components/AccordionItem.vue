<template>
  <div
    class="accordion-item"
    :class="itemClasses"
  >
    <!-- Header/Trigger -->
    <button
      class="accordion-item__header"
      :class="headerClasses"
      :disabled="item.disabled"
      :aria-expanded="isOpen"
      :aria-controls="`content-${item.id}`"
      @click="handleToggle"
    >
      <!-- Icon Slot (Left) -->
      <div v-if="iconPosition === 'left'" class="accordion-item__icon accordion-item__icon--left">
        <slot name="icon" :item="item" :is-open="isOpen">
          <span class="accordion-item__icon-default">{{ isOpen ? '−' : '+' }}</span>
        </slot>
      </div>

      <!-- Title -->
      <div class="accordion-item__title">
        <slot name="title" :item="item">
          {{ item.title }}
        </slot>
      </div>

      <!-- Badge/Actions -->
      <div class="accordion-item__meta">
        <slot name="actions" :item="item" />
      </div>

      <!-- Icon Slot (Right) -->
      <div v-if="iconPosition === 'right'" class="accordion-item__icon accordion-item__icon--right">
        <slot name="icon" :item="item" :is-open="isOpen">
          <span class="accordion-item__icon-default">{{ isOpen ? '−' : '+' }}</span>
        </slot>
      </div>
    </button>

    <!-- Content Panel -->
    <transition
      name="accordion"
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
    >
      <div
        v-if="isOpen"
        :id="`content-${item.id}`"
        class="accordion-item__content"
        :class="contentClasses"
        role="region"
        :aria-labelledby="`header-${item.id}`"
      >
        <slot name="content" :item="item">
          {{ item.content }}
        </slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AccordionItemData, AccordionVariant, AccordionSize, IconPosition } from './Accordion.vue'

interface Props {
  item: AccordionItemData
  index: number
  multiple: boolean
  variant: AccordionVariant
  size: AccordionSize
  bordered: boolean
  iconPosition: IconPosition
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [itemId: string]
}>()

// Item classes
const itemClasses = computed(() => {
  return [
    `accordion-item--${props.variant}`,
    `accordion-item--${props.size}`,
    {
      'accordion-item--open': props.isOpen,
      'accordion-item--disabled': props.item.disabled,
      'accordion-item--bordered': props.bordered
    }
  ]
})

// Header classes
const headerClasses = computed(() => {
  return [
    {
      'accordion-item__header--open': props.isOpen,
      'accordion-item__header--disabled': props.item.disabled
    }
  ]
})

// Content classes
const contentClasses = computed(() => {
  return [
    `accordion-item__content--${props.size}`
  ]
})

// Handle toggle
const handleToggle = (): void => {
  if (!props.item.disabled) {
    emit('toggle', props.item.id)
  }
}

// Transition hooks
const beforeEnter = (el: HTMLElement) => {
  el.style.height = '0'
  el.style.overflow = 'hidden'
}

const enter = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
}

const leave = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
  // Force reflow
  el.offsetHeight
  el.style.height = '0'
}
</script>

<style scoped>
.accordion-item {
  overflow: hidden;
}

/* Variants */
.accordion-item--default {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.accordion-item--bordered {
  border: 1px solid #e5e7eb;
  border-radius: 0;
}

.accordion-item--bordered:not(:last-child) {
  border-bottom: none;
}

.accordion-item--ghost {
  background-color: transparent;
  border-radius: 0.5rem;
}

.accordion-item--ghost:hover {
  background-color: #f9fafb;
}

/* Header */
.accordion-item__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem;
  font-size: inherit;
  font-weight: 500;
  color: #374151;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  gap: 0.75rem;
}

.accordion-item__header:hover:not(:disabled) {
  background-color: #f9fafb;
}

.accordion-item__header--open {
  background-color: #f9fafb;
}

.accordion-item__header--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icon */
.accordion-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
}

.accordion-item__icon--left {
  order: -1;
}

.accordion-item__icon--right {
  order: 1;
  margin-left: auto;
}

.accordion-item__icon-default {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 300;
}

/* Title */
.accordion-item__title {
  flex: 1;
}

/* Meta */
.accordion-item__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Content */
.accordion-item__content {
  padding: 0 1rem;
  color: #6b7280;
  overflow: hidden;
  transition: height 0.3s ease;
}

.accordion-item__content--sm {
  padding: 0 0.75rem 0.75rem;
  font-size: 0.875rem;
}

.accordion-item__content--md {
  padding: 0 1rem 1rem;
  font-size: 1rem;
}

.accordion-item__content--lg {
  padding: 0 1.25rem 1.25rem;
  font-size: 1.125rem;
}

/* Sizes */
.accordion-item--sm .accordion-item__header {
  padding: 0.75rem;
}

.accordion-item--lg .accordion-item__header {
  padding: 1.25rem;
}

/* Transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: height 0.3s ease;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .accordion-item--default {
    background-color: #1f2937;
  }

  .accordion-item--bordered {
    border-color: #374151;
  }

  .accordion-item--ghost:hover {
    background-color: #374151;
  }

  .accordion-item__header {
    color: #d1d5db;
  }

  .accordion-item__header:hover:not(:disabled),
  .accordion-item__header--open {
    background-color: #374151;
  }

  .accordion-item__content {
    color: #9ca3af;
  }
}
</style>
