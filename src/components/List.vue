<template>
  <component :is="tag" :class="listClasses" role="list">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ListSize = 'sm' | 'md' | 'lg'
export type ListVariant = 'default' | 'bordered' | 'striped' | 'hover'
export type ListAlign = 'left' | 'center' | 'right'

interface Props {
  size?: ListSize
  variant?: ListVariant
  align?: ListAlign
  spaced?: boolean
  numbered?: boolean
  inline?: boolean
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  align: 'left',
  spaced: false,
  numbered: false,
  inline: false,
  tag: 'ul'
})

// List classes
const listClasses = computed(() => {
  return [
    'list',
    `list--${props.size}`,
    `list--${props.variant}`,
    `list--align-${props.align}`,
    {
      'list--spaced': props.spaced,
      'list--numbered': props.numbered,
      'list--inline': props.inline
    }
  ]
})
</script>

<style scoped>
.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Sizes */
.list--sm .list-item {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
}

.list--md .list-item {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.list--lg .list-item {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
}

/* Variant: Default */
.list--default .list-item {
  background-color: transparent;
}

/* Variant: Bordered */
.list--bordered {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.list--bordered .list-item {
  border-bottom: 1px solid #e5e7eb;
}

.list--bordered .list-item:last-child {
  border-bottom: none;
}

/* Variant: Striped */
.list--striped .list-item:nth-child(even) {
  background-color: #f9fafb;
}

/* Variant: Hover */
.list--hover .list-item {
  transition: background-color 0.2s ease;
}

.list--hover .list-item:hover {
  background-color: #f3f4f6;
  cursor: pointer;
}

/* Alignment */
.list--align-left {
  text-align: left;
}

.list--align-center {
  text-align: center;
}

.list--align-right {
  text-align: right;
}

/* Spaced */
.list--spaced .list-item {
  margin-bottom: 0.5rem;
}

.list--spaced .list-item:last-child {
  margin-bottom: 0;
}

/* Numbered */
.list--numbered {
  counter-reset: list-counter;
  padding-left: 0;
}

.list--numbered .list-item {
  counter-increment: list-counter;
  display: flex;
  align-items: center;
}

.list--numbered .list-item::before {
  content: counter(list-counter) '.';
  font-weight: 600;
  margin-right: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
}

/* Inline */
.list--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.list--inline .list-item {
  display: inline-flex;
  align-items: center;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .list--bordered {
    border-color: #374151;
  }

  .list--bordered .list-item {
    border-color: #374151;
  }

  .list--striped .list-item:nth-child(even) {
    background-color: #1f2937;
  }

  .list--hover .list-item:hover {
    background-color: #374151;
  }

  .list--numbered .list-item::before {
    color: #9ca3af;
  }
}
</style>
