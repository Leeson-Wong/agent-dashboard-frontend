<template>
  <li :class="itemClasses" role="none">
    <!-- Divider -->
    <div v-if="item.divider" class="menu-item__divider"></div>

    <!-- Menu Item -->
    <button
      v-else
      class="menu-item__button"
      :disabled="item.disabled"
      @click="handleClick"
    >
      <!-- Icon Slot -->
      <div v-if="$slots.icon || item.icon" class="menu-item__icon">
        <slot name="icon" :item="item">
          <component :is="item.icon" v-if="item.icon" />
        </slot>
      </div>

      <!-- Content Slot -->
      <div class="menu-item__content">
        <slot :item="item">{{ item.label }}</slot>
      </div>

      <!-- Shortcut/Extra -->
      <div v-if="item.shortcut" class="menu-item__shortcut">
        {{ item.shortcut }}
      </div>
    </button>
  </li>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

export interface MenuItemData {
  key?: string | number
  label: string
  icon?: any
  disabled?: boolean
  divider?: boolean
  shortcut?: string
}

interface Props {
  item: MenuItemData
  index: number
  selectedIndex?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  select: [item: MenuItemData, index: number]
}>()

// Get size from parent
const size = inject('menuSize', 'md')
const variant = inject('menuVariant', 'default')

const itemClasses = computed(() => [
  'menu-item',
  `menu-item--${size}`,
  `menu-item--${variant}`,
  {
    'menu-item--selected': props.index === props.selectedIndex,
    'menu-item--disabled': props.item.disabled || props.disabled
  }
])

const handleClick = () => {
  if (props.item.disabled) return
  emit('select', props.item, props.index)
}
</script>

<style scoped>
.menu-item {
  margin: 0;
}

/* Divider */
.menu-item__divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.25rem 0;
}

/* Button */
.menu-item__button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
}

.menu-item__button:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.menu-item__button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.menu-item__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.menu-item--sm .menu-item__button {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
}

.menu-item--lg .menu-item__button {
  padding: 0.625rem 0.875rem;
  font-size: 0.9375rem;
}

/* Icon */
.menu-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.menu-item--sm .menu-item__icon {
  width: 0.875rem;
  height: 0.875rem;
}

.menu-item--lg .menu-item__icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Content */
.menu-item__content {
  flex: 1;
  font-size: 0.875rem;
}

.menu-item--sm .menu-item__content {
  font-size: 0.8125rem;
}

.menu-item--lg .menu-item__content {
  font-size: 0.9375rem;
}

/* Shortcut */
.menu-item__shortcut {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: auto;
}

/* Selected State */
.menu-item--selected .menu-item__button {
  background-color: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.menu-item--primary.menu-item--selected .menu-item__button {
  background-color: #dbeafe;
}

.menu-item--success.menu-item--selected .menu-item__button {
  background-color: #dcfce7;
  color: #22c55e;
}

.menu-item--warning.menu-item--selected .menu-item__button {
  background-color: #fef3c7;
  color: #d97706;
}

.menu-item--error.menu-item--selected .menu-item__button {
  background-color: #fee2e2;
  color: #ef4444;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .menu-item__divider {
    background-color: #374151;
  }

  .menu-item__button {
    color: #d1d5db;
  }

  .menu-item__button:hover:not(:disabled) {
    background-color: #374151;
  }

  .menu-item__shortcut {
    color: #6b7280;
  }

  .menu-item--selected .menu-item__button {
    background-color: #1e3a8a;
    color: #60a5fa;
  }

  .menu-item--primary.menu-item--selected .menu-item__button {
    background-color: #1e3a8a;
  }

  .menu-item--success.menu-item--selected .menu-item__button {
    background-color: #14532d;
  }

  .menu-item--warning.menu-item--selected .menu-item__button {
    background-color: #78350f;
  }

  .menu-item--error.menu-item--selected .menu-item__button {
    background-color: #7f1d1d;
  }
}
</style>
