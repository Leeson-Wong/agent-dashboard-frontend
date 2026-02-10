<template>
  <ul :class="menuClasses" :role="role">
    <MenuItem
      v-for="(item, index) in items"
      :key="item.key || index"
      :item="item"
      :index="index"
      :selected-index="selectedIndex"
      :disabled="item.disabled"
      @select="handleSelect"
    >
      <template #icon="{ item }">
        <slot name="icon" :item="item"></slot>
      </template>
      <template #default="{ item }">
        <slot :item="item">{{ item.label }}</slot>
      </template>
    </MenuItem>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type MenuSize = 'sm' | 'md' | 'lg'
export type MenuVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

export interface MenuItemData {
  key?: string | number
  label: string
  icon?: any
  disabled?: boolean
  divider?: boolean
  [key: string]: any
}

interface Props {
  items: MenuItemData[]
  selected?: string | number
  size?: MenuSize
  variant?: MenuVariant
  role?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  role: 'menu'
})

const emit = defineEmits<{
  select: [item: MenuItemData, index: number]
}>()

const selectedIndex = computed(() => {
  if (props.selected === undefined) return undefined
  return props.items.findIndex(item => item.key === props.selected)
})

const menuClasses = computed(() => [
  'menu',
  `menu--${props.size}`,
  `menu--${props.variant}`
])

const handleSelect = (item: MenuItemData, index: number) => {
  if (item.disabled) return
  emit('select', item, index)
}
</script>

<style scoped>
.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

/* Sizes */
.menu--sm {
  min-width: 10rem;
}

.menu--md {
  min-width: 12rem;
}

.menu--lg {
  min-width: 16rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .menu {
    background-color: #1f2937;
    border-color: #374151;
  }
}
</style>
