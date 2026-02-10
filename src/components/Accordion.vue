<template>
  <div class="accordion" :class="accordionClasses">
    <AccordionItem
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :index="index"
      :multiple="multiple"
      :variant="variant"
      :size="size"
      :bordered="bordered"
      :icon-position="iconPosition"
      :is-open="isOpen(item.id)"
      @toggle="toggleItem(item.id)"
    >
      <template #icon="{ item, isOpen }">
        <slot name="icon" :item="item" :is-open="isOpen" />
      </template>
      <template #title="{ item }">
        <slot name="title" :item="item">{{ item.title }}</slot>
      </template>
      <template #content="{ item }">
        <slot name="content" :item="item">
          {{ item.content }}
        </slot>
      </template>
      <template #actions="{ item }">
        <slot name="actions" :item="item" />
      </template>
    </AccordionItem>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AccordionItem from './AccordionItem.vue'

export interface AccordionItemData {
  id: string
  title: string
  content?: string
  disabled?: boolean
  icon?: any
}

export type AccordionVariant = 'default' | 'bordered' | 'ghost'
export type AccordionSize = 'sm' | 'md' | 'lg'
export type IconPosition = 'left' | 'right'

interface Props {
  items: AccordionItemData[]
  modelValue?: string | string[] // v-model for open items
  multiple?: boolean // Allow multiple items open
  variant?: AccordionVariant
  size?: AccordionSize
  bordered?: boolean
  iconPosition?: IconPosition
  defaultOpen?: string[] // IDs of items open by default
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  variant: 'default',
  size: 'md',
  bordered: false,
  iconPosition: 'right',
  defaultOpen: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'toggle': [itemId: string, isOpen: boolean]
}>()

// Internal state for open items
const openItems = ref<Set<string>>(new Set(props.defaultOpen))

// Get current open items (from v-model or internal state)
const currentOpen = computed(() => {
  if (props.modelValue !== undefined) {
    return Array.isArray(props.modelValue)
      ? new Set(props.modelValue)
      : new Set([props.modelValue])
  }
  return openItems.value
})

// Accordion classes
const accordionClasses = computed(() => {
  return [
    `accordion--${props.variant}`,
    `accordion--${props.size}`
  ]
})

// Check if item is open
const isOpen = (itemId: string): boolean => {
  return currentOpen.value.has(itemId)
}

// Toggle item open/closed
const toggleItem = (itemId: string): void => {
  const item = props.items.find(i => i.id === itemId)
  if (!item || item.disabled) return

  const newOpen = new Set(currentOpen.value)
  const wasOpen = newOpen.has(itemId)

  if (props.multiple) {
    // Multiple mode: toggle this item
    if (wasOpen) {
      newOpen.delete(itemId)
    } else {
      newOpen.add(itemId)
    }
  } else {
    // Single mode: close all, open this (or close if already open)
    newOpen.clear()
    if (!wasOpen) {
      newOpen.add(itemId)
    }
  }

  // Update internal state
  openItems.value = newOpen

  // Emit v-model update
  if (props.multiple) {
    emit('update:modelValue', Array.from(newOpen))
  } else {
    emit('update:modelValue', Array.from(newOpen)[0] || '')
  }

  // Emit toggle event
  emit('toggle', itemId, !wasOpen)
}
</script>

<style scoped>
.accordion {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Variants */
.accordion--default {
  gap: 0.25rem;
}

.accordion--bordered {
  gap: 0;
}

.accordion--ghost {
  gap: 0.5rem;
}

/* Sizes */
.accordion--sm {
  font-size: 0.875rem;
}

.accordion--md {
  font-size: 1rem;
}

.accordion--lg {
  font-size: 1.125rem;
}
</style>
