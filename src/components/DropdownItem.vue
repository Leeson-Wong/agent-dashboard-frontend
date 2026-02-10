<template>
  <component
    :is="tag"
    :class="itemClasses"
    role="menuitem"
    :tabindex="disabled ? undefined : '0'"
    @click="handleClick"
  >
    <!-- Icon -->
    <div v-if="icon" class="dropdown-item__icon">
      <component :is="icon" />
    </div>

    <!-- Content -->
    <div class="dropdown-item__content">
      <!-- Title -->
      <div v-if="title || $slots.title" class="dropdown-item__title">
        <slot name="title">{{ title }}</slot>
      </div>

      <!-- Description -->
      <div v-if="description || $slots.description" class="dropdown-item__description">
        <slot name="description">{{ description }}</slot>
      </div>

      <!-- Default content -->
      <div v-if="!title && !description" class="dropdown-item__text">
        <slot />
      </div>
    </div>

    <!-- Trailing -->
    <div v-if="$slots.trailing || trailingIcon" class="dropdown-item__trailing">
      <slot name="trailing">
        <component v-if="trailingIcon" :is="trailingIcon" class="dropdown-item__trailing-icon" />
      </slot>
    </div>

    <!-- Shortcut -->
    <div v-if="shortcut" class="dropdown-item__shortcut">
      {{ shortcut }}
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type DropdownItemColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'danger'
export type DropdownItemSize = 'sm' | 'md' | 'lg'

interface Props {
  title?: string
  description?: string
  shortcut?: string
  icon?: any
  trailingIcon?: any
  color?: DropdownItemColor
  size?: DropdownItemSize
  disabled?: boolean
  divided?: boolean
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'default',
  size: 'md',
  disabled: false,
  divided: false,
  tag: 'button'
})

const emit = defineEmits<{
  'click': [event: Event]
}>()

// Item classes
const itemClasses = computed(() => {
  return [
    'dropdown-item',
    `dropdown-item--${props.size}`,
    `dropdown-item--${props.color}`,
    {
      'dropdown-item--disabled': props.disabled,
      'dropdown-item--divided': props.divided
    }
  ]
})

// Handle click
const handleClick = (event: Event) => {
  if (props.disabled) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  color: #374151;
}

.dropdown-item:hover:not(.dropdown-item--disabled) {
  background-color: #f3f4f6;
}

.dropdown-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

/* Sizes */
.dropdown-item--sm {
  padding: 0.375rem 0.5rem;
  gap: 0.5rem;
}

.dropdown-item--md {
  padding: 0.5rem 0.75rem;
  gap: 0.75rem;
}

.dropdown-item--lg {
  padding: 0.625rem 0.875rem;
  gap: 1rem;
}

/* Icon */
.dropdown-item__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 1.25em;
  height: 1.25em;
}

/* Content */
.dropdown-item__content {
  flex: 1;
  min-width: 0;
}

/* Title */
.dropdown-item__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.dropdown-item--sm .dropdown-item__title {
  font-size: 0.8125rem;
}

.dropdown-item--lg .dropdown-item__title {
  font-size: 0.9375rem;
}

/* Description */
.dropdown-item__description {
  font-size: 0.8125em;
  color: #6b7280;
  margin-top: 0.125rem;
}

.dropdown-item--sm .dropdown-item__description {
  font-size: 0.75rem;
}

.dropdown-item--lg .dropdown-item__description {
  font-size: 0.875rem;
}

/* Text */
.dropdown-item__text {
  font-size: 0.875rem;
  color: #374151;
}

.dropdown-item--sm .dropdown-item__text {
  font-size: 0.8125rem;
}

.dropdown-item--lg .dropdown-item__text {
  font-size: 0.9375rem;
}

/* Trailing */
.dropdown-item__trailing {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.dropdown-item__trailing-icon {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}

/* Shortcut */
.dropdown-item__shortcut {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

/* Divided */
.dropdown-item--divided {
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Disabled */
.dropdown-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Color variants */
.dropdown-item--primary:hover:not(.dropdown-item--disabled) {
  background-color: #dbeafe;
  color: #1e40af;
}

.dropdown-item--success:hover:not(.dropdown-item--disabled) {
  background-color: #dcfce7;
  color: #166534;
}

.dropdown-item--warning:hover:not(.dropdown-item--disabled) {
  background-color: #fef3c7;
  color: #b45309;
}

.dropdown-item--error:hover:not(.dropdown-item--disabled),
.dropdown-item--danger:hover:not(.dropdown-item--disabled) {
  background-color: #fee2e2;
  color: #b91c1c;
}

.dropdown-item--info:hover:not(.dropdown-item--disabled) {
  background-color: #cffafe;
  color: #0e7490;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .dropdown-item {
    color: #d1d5db;
  }

  .dropdown-item:hover:not(.dropdown-item--disabled) {
    background-color: #374151;
  }

  .dropdown-item__title {
    color: #f9fafb;
  }

  .dropdown-item__description {
    color: #9ca3af;
  }

  .dropdown-item__text {
    color: #d1d5db;
  }

  .dropdown-item__trailing-icon {
    color: #6b7280;
  }

  .dropdown-item__shortcut {
    color: #6b7280;
    background-color: #374151;
  }

  .dropdown-item--divided {
    border-color: #374151;
  }

  .dropdown-item--primary:hover:not(.dropdown-item--disabled) {
    background-color: #1e40af;
    color: #93c5fd;
  }

  .dropdown-item--success:hover:not(.dropdown-item--disabled) {
    background-color: #166534;
    color: #86efac;
  }

  .dropdown-item--warning:hover:not(.dropdown-item--disabled) {
    background-color: #b45309;
    color: #fcd34d;
  }

  .dropdown-item--error:hover:not(.dropdown-item--disabled),
  .dropdown-item--danger:hover:not(.dropdown-item--disabled) {
    background-color: #b91c1c;
    color: #fca5a5;
  }

  .dropdown-item--info:hover:not(.dropdown-item--disabled) {
    background-color: #0e7490;
    color: #67e8f9;
  }
}
</style>
