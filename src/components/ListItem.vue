<template>
  <component :is="tag" :class="itemClasses" role="listitem" v-bind="$attrs">
    <!-- Leading icon/avatar -->
    <div v-if="$slots.leading" class="list-item__leading">
      <slot name="leading" />
    </div>

    <!-- Checkbox for selection -->
    <div v-if="selectable" class="list-item__checkbox">
      <Checkbox
        :model-value="selected"
        @update:model-value="handleSelect"
      />
    </div>

    <!-- Main content -->
    <div class="list-item__content">
      <!-- Title -->
      <div v-if="title || $slots.title" class="list-item__title">
        <slot name="title">{{ title }}</slot>
      </div>

      <!-- Subtitle -->
      <div v-if="subtitle || $slots.subtitle" class="list-item__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </div>

      <!-- Default content -->
      <div v-if="$slots.default && !title && !subtitle" class="list-item__text">
        <slot />
      </div>

      <!-- Meta information -->
      <div v-if="meta || $slots.meta" class="list-item__meta">
        <slot name="meta">{{ meta }}</slot>
      </div>
    </div>

    <!-- Trailing icon/action -->
    <div v-if="$slots.trailing || trailingIcon" class="list-item__trailing">
      <slot name="trailing">
        <component v-if="trailingIcon" :is="trailingIcon" class="list-item__trailing-icon" />
      </slot>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from './Checkbox.vue'

export type ListItemSize = 'sm' | 'md' | 'lg'
export type ListItemColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

interface Props {
  tag?: string
  title?: string
  subtitle?: string
  meta?: string
  size?: ListItemSize
  color?: ListItemColor
  disabled?: boolean
  active?: boolean
  selectable?: boolean
  selected?: boolean
  trailingIcon?: any
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'li',
  size: 'md',
  color: 'default',
  disabled: false,
  active: false,
  selectable: false,
  selected: false,
  clickable: false
})

const emit = defineEmits<{
  'click': [event: Event]
  'select': [selected: boolean]
}>()

// Item classes
const itemClasses = computed(() => {
  return [
    'list-item',
    `list-item--${props.size}`,
    props.color !== 'default' ? `list-item--${props.color}` : '',
    {
      'list-item--disabled': props.disabled,
      'list-item--active': props.active,
      'list-item--selectable': props.selectable,
      'list-item--selected': props.selected,
      'list-item--clickable': props.clickable || props.selectable
    }
  ]
})

// Handle select
const handleSelect = (value: boolean) => {
  emit('select', value)
}

// Handle click
const handleClick = (event: Event) => {
  if (props.disabled) return
  emit('click', event)
}
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
  position: relative;
}

/* Sizes */
.list-item--sm {
  min-height: 2rem;
  padding: 0.375rem 0.5rem;
  gap: 0.5rem;
}

.list-item--md {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  gap: 0.75rem;
}

.list-item--lg {
  min-height: 3.5rem;
  padding: 0.75rem 1rem;
  gap: 1rem;
}

/* Leading section */
.list-item__leading {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Checkbox */
.list-item__checkbox {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Content */
.list-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

/* Title */
.list-item__title {
  font-weight: 500;
  color: #111827;
  line-height: 1.25;
}

.list-item--sm .list-item__title {
  font-size: 0.8125rem;
}

.list-item--md .list-item__title {
  font-size: 0.875rem;
}

.list-item--lg .list-item__title {
  font-size: 0.9375rem;
}

/* Subtitle */
.list-item__subtitle {
  font-size: 0.8125em;
  color: #6b7280;
  line-height: 1.25;
}

.list-item--sm .list-item__subtitle {
  font-size: 0.6875rem;
}

.list-item--md .list-item__subtitle {
  font-size: 0.75rem;
}

.list-item--lg .list-item__subtitle {
  font-size: 0.8125rem;
}

/* Text content */
.list-item__text {
  color: #374151;
  line-height: 1.5;
}

/* Meta */
.list-item__meta {
  font-size: 0.8125em;
  color: #9ca3af;
  margin-top: 0.125rem;
}

/* Trailing section */
.list-item__trailing {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.list-item__trailing-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}

/* Clickable */
.list-item--clickable {
  cursor: pointer;
}

.list-item--clickable:hover {
  background-color: #f3f4f6;
}

/* Active */
.list-item--active {
  background-color: #eff6ff;
  color: #1e40af;
}

.list-item--active .list-item__title {
  color: #1e40af;
}

/* Selected */
.list-item--selected {
  background-color: #dbeafe;
}

/* Disabled */
.list-item--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Color variants */
.list-item--primary .list-item__title {
  color: #3b82f6;
}

.list-item--success .list-item__title {
  color: #22c55e;
}

.list-item--warning .list-item__title {
  color: #f59e0b;
}

.list-item--error .list-item__title {
  color: #ef4444;
}

.list-item--info .list-item__title {
  color: #06b6d4;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .list-item__title {
    color: #f9fafb;
  }

  .list-item__subtitle {
    color: #9ca3af;
  }

  .list-item__text {
    color: #d1d5db;
  }

  .list-item__meta {
    color: #6b7280;
  }

  .list-item--clickable:hover {
    background-color: #374151;
  }

  .list-item--active {
    background-color: #1e3a8a;
    color: #93c5fd;
  }

  .list-item--active .list-item__title {
    color: #93c5fd;
  }

  .list-item--selected {
    background-color: #1e40af;
  }

  .list-item__trailing-icon {
    color: #6b7280;
  }
}
</style>
