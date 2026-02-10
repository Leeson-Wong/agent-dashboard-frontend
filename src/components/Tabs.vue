<template>
  <div class="tabs" :class="tabsClasses">
    <!-- Tab Headers -->
    <div
      class="tabs__header"
      :class="headerClasses"
      role="tablist"
      :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    >
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tabs__tab"
        :class="getTabClasses(tab)"
        :disabled="tab.disabled"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :aria-disabled="tab.disabled"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="modelValue === tab.id ? 0 : -1"
        @click="selectTab(tab.id)"
        @keydown.enter="selectTab(tab.id)"
        @keydown.space.prevent="selectTab(tab.id)"
      >
        <span v-if="tab.icon" class="tabs__tab-icon">
          <component :is="tab.icon" />
        </span>
        <span class="tabs__tab-label">{{ tab.label }}</span>
        <Badge
          v-if="tab.badge !== undefined"
          :count="tab.badge"
          :variant="tab.badgeVariant || 'default'"
          size="xs"
        />
        <span
          v-if="tab.closable && !tab.disabled"
          class="tabs__tab-close"
          role="button"
          :aria-label="`Close ${tab.label}`"
          tabindex="0"
          @click.stop="closeTab(tab.id)"
          @keydown.enter.stop="closeTab(tab.id)"
          @keydown.space.prevent.stop="closeTab(tab.id)"
        >
          ×
        </span>
      </button>

      <!-- Add Tab Button -->
      <button
        v-if="showAddButton"
        class="tabs__add"
        :aria-label="addButtonLabel"
        @click="onAdd"
      >
        <span>+</span>
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="tabs__panels">
      <slot :active-tab="activeTab">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          :id="`panel-${tab.id}`"
          class="tabs__panel"
          :class="{ 'tabs__panel--active': modelValue === tab.id }"
          role="tabpanel"
          :aria-labelledby="`tab-${tab.id}`"
          :hidden="modelValue !== tab.id"
        >
          <slot :name="`panel-${tab.id}`" :tab="tab">
            {{ tab.content }}
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, Component } from 'vue'
import Badge from './Badge.vue'

export interface Tab {
  id: string
  label: string
  icon?: Component
  content?: string
  disabled?: boolean
  closable?: boolean
  badge?: number
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
}

export type TabsVariant = 'default' | 'pills' | 'underline'
export type TabsSize = 'sm' | 'md' | 'lg'
export type TabsPosition = 'top' | 'right' | 'bottom' | 'left'
export type TabsAlignment = 'start' | 'center' | 'end' | 'space-between'

interface Props {
  modelValue: string // Active tab ID
  tabs: Tab[]
  variant?: TabsVariant
  size?: TabsSize
  position?: TabsPosition
  alignment?: TabsAlignment
  vertical?: boolean
  showAddButton?: boolean
  addButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  position: 'top',
  alignment: 'start',
  vertical: false,
  showAddButton: false,
  addButtonLabel: 'Add new tab'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'add': []
  'close': [tabId: string]
}>()

// Active tab
const activeTab = computed(() => {
  return props.tabs.find(t => t.id === props.modelValue)
})

// Tabs classes
const tabsClasses = computed(() => {
  return [
    `tabs--${props.position}`,
    {
      'tabs--vertical': props.vertical
    }
  ]
})

// Header classes
const headerClasses = computed(() => {
  return [
    `tabs__header--${props.alignment}`,
    `tabs__header--${props.size}`
  ]
})

// Get tab classes
const getTabClasses = (tab: Tab) => {
  return [
    {
      'tabs__tab--active': props.modelValue === tab.id,
      'tabs__tab--disabled': tab.disabled,
      'tabs__tab--closable': tab.closable
    }
  ]
}

// Select tab
const selectTab = (tabId: string): void => {
  const tab = props.tabs.find(t => t.id === tabId)
  if (tab && !tab.disabled) {
    emit('update:modelValue', tabId)
  }
}

// Close tab
const closeTab = (tabId: string): void => {
  emit('close', tabId)
}

// Add tab
const onAdd = (): void => {
  emit('add')
}
</script>

<style scoped>
.tabs {
  display: flex;
  width: 100%;
}

/* Header Positioning */
.tabs--top {
  flex-direction: column;
}

.tabs--bottom {
  flex-direction: column-reverse;
}

.tabs--left {
  flex-direction: row;
}

.tabs--right {
  flex-direction: row-reverse;
}

.tabs--vertical .tabs__header {
  flex-direction: column;
  border-bottom: none;
  border-right: 1px solid #e5e7eb;
}

.tabs--vertical.tabs--right .tabs__header {
  border-right: none;
  border-left: 1px solid #e5e7eb;
}

/* Header */
.tabs__header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Header Alignment */
.tabs__header--start {
  justify-content: flex-start;
}

.tabs__header--center {
  justify-content: center;
}

.tabs__header--end {
  justify-content: flex-end;
}

.tabs__header--space-between {
  justify-content: space-between;
}

/* Header Size */
.tabs__header--sm {
  padding: 0.25rem 0.5rem;
}

.tabs__header--lg {
  padding: 0.75rem 1rem;
}

/* Tab Button */
.tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  position: relative;
}

.tabs__tab:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #374151;
}

.tabs__tab--active {
  color: #3b82f6;
  background-color: #ffffff;
  border-color: #e5e7eb;
}

.tabs__tab--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs__tab--closable {
  padding-right: 2rem;
}

/* Tab Icon */
.tabs__tab-icon {
  display: flex;
  align-items: center;
  font-size: 1rem;
}

/* Tab Label */
.tabs__tab-label {
  flex: 1;
}

/* Tab Close Button */
.tabs__tab-close {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
  line-height: 1;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.tabs__tab-close:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

/* Add Button */
.tabs__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 1rem;
  color: #6b7280;
  background-color: transparent;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabs__add:hover {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #9ca3af;
}

/* Panels Container */
.tabs__panels {
  flex: 1;
  overflow: auto;
}

/* Panel */
.tabs__panel {
  display: none;
  padding: 1rem;
}

.tabs__panel--active {
  display: block;
}

/* Pills Variant */
.tabs__tab--pills {
  border-radius: 9999px;
  border: none;
}

.tabs__tab--pills.tabs__tab--active {
  background-color: #3b82f6;
  color: white;
  border-color: transparent;
}

/* Underline Variant */
.tabs__tab--underline {
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  padding-bottom: 0.5rem;
}

.tabs__tab--underline.tabs__tab--active {
  background-color: transparent;
  border-color: #3b82f6;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .tabs__header {
    background-color: #1f2937;
    border-color: #374151;
  }

  .tabs__tab {
    color: #9ca3af;
  }

  .tabs__tab:hover:not(:disabled) {
    background-color: #374151;
    color: #d1d5db;
  }

  .tabs__tab--active {
    background-color: #111827;
    border-color: #374151;
    color: #60a5fa;
  }

  .tabs__add {
    color: #9ca3af;
    border-color: #4b5563;
  }

  .tabs__add:hover {
    background-color: #374151;
    color: #d1d5db;
    border-color: #6b7280;
  }
}
</style>
