<template>
  <div :class="transferClasses">
    <!-- Source List -->
    <div class="transfer__panel">
      <div class="transfer__header">
        <h3 class="transfer__title">{{ sourceTitle }}</h3>
        <span class="transfer__count">{{ selectedCount }} / {{ sourceItems.length }}</span>
      </div>

      <!-- Search -->
      <div v-if="filterable" class="transfer__search">
        <Input
          v-model="sourceQuery"
          placeholder="Search..."
          size="sm"
          clearable
        />
      </div>

      <!-- Source Items -->
      <div class="transfer__list">
        <div
          v-for="item in filteredSourceItems"
          :key="item.key"
          class="transfer__item"
          :class="{ 'transfer__item--disabled': item.disabled }"
          @click="handleSelect(item, 'source')"
        >
          <Checkbox
            :model-value="isItemChecked(item, sourceItems)"
            @update:model-value="(checked) => handleItemCheck(item, checked, 'source')"
            :disabled="item.disabled"
          />
          <span class="transfer__item-label">{{ item.label }}</span>
        </div>
        <div v-if="filteredSourceItems.length === 0" class="transfer__empty">
          No items
        </div>
      </div>
    </div>

    <!-- Operations -->
    <div class="transfer__operations">
      <button
        class="transfer__button"
        :disabled="!canMoveToTarget"
        @click="moveToTarget"
        aria-label="Move to target"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>
      <button
        class="transfer__button"
        :disabled="!canMoveToSource"
        @click="moveToSource"
        aria-label="Move to source"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
    </div>

    <!-- Target List -->
    <div class="transfer__panel">
      <div class="transfer__header">
        <h3 class="transfer__title">{{ targetTitle }}</h3>
        <span class="transfer__count">{{ targetItems.length }}</span>
      </div>

      <!-- Search -->
      <div v-if="filterable" class="transfer__search">
        <Input
          v-model="targetQuery"
          placeholder="Search..."
          size="sm"
          clearable
        />
      </div>

      <!-- Target Items -->
      <div class="transfer__list">
        <div
          v-for="item in filteredTargetItems"
          :key="item.key"
          class="transfer__item"
          :class="{ 'transfer__item--disabled': item.disabled }"
          @click="handleSelect(item, 'target')"
        >
          <Checkbox
            :model-value="isItemChecked(item, targetItems)"
            @update:model-value="(checked) => handleItemCheck(item, checked, 'target')"
            :disabled="item.disabled"
          />
          <span class="transfer__item-label">{{ item.label }}</span>
        </div>
        <div v-if="filteredTargetItems.length === 0" class="transfer__empty">
          No items
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type TransferSize = 'sm' | 'md' | 'lg'

export interface TransferItem {
  key: string | number
  label: string
  disabled?: boolean
  [key: string]: any
}

interface Props {
  dataSource: TransferItem[]
  modelValue: TransferItem[]
  targetKeys?: (string | number)[]
  size?: TransferSize
  filterable?: boolean
  sourceTitle?: string
  targetTitle?: string
  titles?: [string, string]
}

const props = withDefaults(defineProps<Props>(), {
  dataSource: () => [],
  modelValue: () => [],
  targetKeys: undefined,
  size: 'md',
  filterable: false,
  sourceTitle: 'Source',
  targetTitle: 'Target'
})

const emit = defineEmits<{
  'update:modelValue': [value: TransferItem[]]
  'change': [newTargetValue: TransferItem[], direction: 'right' | 'left', movedKeys: (string | number)[]]
}>()

// State
const sourceQuery = ref('')
const targetQuery = ref('')
const selectedSourceItems = ref<TransferItem[]>([])
const selectedTargetItems = ref<TransferItem[]>([])

// Computed
const targetKeys = computed(() => {
  if (props.targetKeys) return props.targetKeys
  return props.modelValue.map(item => item.key)
})

const sourceItems = computed(() => {
  return props.dataSource.filter(item => !targetKeys.value.includes(item.key))
})

const targetItems = computed(() => {
  const keys = targetKeys.value
  return props.dataSource.filter(item => keys.includes(item.key))
})

const filteredSourceItems = computed(() => {
  if (!props.filterable || !sourceQuery.value) return sourceItems.value
  const query = sourceQuery.value.toLowerCase()
  return sourceItems.value.filter(item =>
    item.label.toLowerCase().includes(query)
  )
})

const filteredTargetItems = computed(() => {
  if (!props.filterable || !targetQuery.value) return targetItems.value
  const query = targetQuery.value.toLowerCase()
  return targetItems.value.filter(item =>
    item.label.toLowerCase().includes(query)
  )
})

const selectedCount = computed(() => selectedSourceItems.value.length)

const canMoveToTarget = computed(() => selectedSourceItems.value.length > 0)

const canMoveToSource = computed(() => selectedTargetItems.value.length > 0)

const transferClasses = computed(() => [
  'transfer',
  `transfer--${props.size}`
])

// Methods
const isItemChecked = (item: TransferItem, items: TransferItem[]) => {
  const selected = selectedSourceItems.value.concat(selectedTargetItems.value)
  return selected.some(s => s.key === item.key)
}

const handleSelect = (item: TransferItem, list: 'source' | 'target') => {
  if (item.disabled) return

  const selected = list === 'source' ? selectedSourceItems : selectedTargetItems
  const index = selected.value.findIndex(s => s.key === item.key)

  if (index > -1) {
    selected.value.splice(index, 1)
  } else {
    selected.value.push(item)
  }
}

const handleItemCheck = (item: TransferItem, checked: boolean, list: 'source' | 'target') => {
  const selected = list === 'source' ? selectedSourceItems : selectedTargetItems

  if (checked) {
    if (!selected.value.some(s => s.key === item.key)) {
      selected.value.push(item)
    }
  } else {
    const index = selected.value.findIndex(s => s.key === item.key)
    if (index > -1) {
      selected.value.splice(index, 1)
    }
  }
}

const moveToTarget = () => {
  if (!canMoveToTarget.value) return

  const movedKeys = selectedSourceItems.value.map(item => item.key)
  const newTargetValue = [...props.modelValue, ...selectedSourceItems.value]

  emit('update:modelValue', newTargetValue)
  emit('change', newTargetValue, 'right', movedKeys)

  selectedSourceItems.value = []
}

const moveToSource = () => {
  if (!canMoveToSource.value) return

  const movedKeys = selectedTargetItems.value.map(item => item.key)
  const newTargetValue = props.modelValue.filter(
    item => !movedKeys.includes(item.key)
  )

  emit('update:modelValue', newTargetValue)
  emit('change', newTargetValue, 'left', movedKeys)

  selectedTargetItems.value = []
}
</script>

<style scoped>
.transfer {
  display: flex;
  align-items: stretch;
  gap: 1rem;
}

/* Sizes */
.transfer--sm {
  font-size: 0.8125rem;
}

.transfer--md {
  font-size: 0.875rem;
}

.transfer--lg {
  font-size: 0.9375rem;
}

/* Panel */
.transfer__panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #ffffff;
  overflow: hidden;
}

/* Header */
.transfer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.transfer__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.transfer__count {
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

/* Search */
.transfer__search {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* List */
.transfer__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  max-height: 300px;
}

.transfer__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.transfer__item:hover:not(.transfer__item--disabled) {
  background-color: #f3f4f6;
}

.transfer__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transfer__item-label {
  flex: 1;
  color: #374151;
}

.transfer__empty {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Operations */
.transfer__operations {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: center;
}

.transfer__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background-color: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.transfer__button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #3b82f6;
  color: #3b82f6;
}

.transfer__button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.transfer__button svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .transfer__panel {
    background-color: #1f2937;
    border-color: #374151;
  }

  .transfer__header {
    background-color: #374151;
    border-bottom-color: #374151;
  }

  .transfer__title {
    color: #f9fafb;
  }

  .transfer__count {
    background-color: #4b5563;
    color: #d1d5db;
  }

  .transfer__search {
    border-bottom-color: #374151;
  }

  .transfer__item:hover:not(.transfer__item--disabled) {
    background-color: #374151;
  }

  .transfer__item-label {
    color: #d1d5db;
  }

  .transfer__empty {
    color: #6b7280;
  }

  .transfer__button {
    background-color: #1f2937;
    border-color: #4b5563;
    color: #9ca3af;
  }

  .transfer__button:hover:not(:disabled) {
    background-color: #374151;
    border-color: #3b82f6;
    color: #3b82f6;
  }
}
</style>
