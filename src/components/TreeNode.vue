<template>
  <div class="tree-node" :class="nodeClasses">
    <!-- Node Content -->
    <div
      class="tree-node__content"
      :style="{ paddingLeft: `${depth * 1.5}rem` }"
      @click="handleClick"
    >
      <!-- Expand/Collapse Toggle -->
      <button
        v-if="hasChildren"
        class="tree-node__toggle"
        type="button"
        :aria-expanded="isExpanded"
        @click.stop="toggle"
      >
        <svg
          class="tree-node__toggle-icon"
          :class="{ 'tree-node__toggle-icon--expanded': isExpanded }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <span v-else class="tree-node__toggle-placeholder"></span>

      <!-- Icon Slot -->
      <span v-if="$slots.icon || nodeIcon" class="tree-node__icon">
        <slot name="icon" :node="node">
          <component :is="nodeIcon" v-if="nodeIcon" />
        </slot>
      </span>

      <!-- Checkbox (for selectable) -->
      <span v-if="selectable" class="tree-node__checkbox">
        <Checkbox
          :model-value="isSelected"
          @update:model-value="handleCheckboxChange"
          @click.stop
        />
      </span>

      <!-- Label -->
      <span class="tree-node__label" :class="{ 'tree-node__label--disabled': node.disabled }">
        <slot name="label" :node="node">
          {{ node.label }}
        </slot>
      </span>
    </div>

    <!-- Children -->
    <Transition name="tree-node-children">
      <div v-if="hasChildren && isExpanded" class="tree-node__children">
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :selected="isSelected"
          :selectable="selectable"
          :expandable="expandable"
          @select="$emit('select', child, $event)"
          @expand="$emit('expand', child, $event)"
          @collapse="$emit('collapse', child, $event)"
        >
          <template #icon="{ node }">
            <slot name="icon" :node="node" />
          </template>
          <template #label="{ node }">
            <slot name="label" :node="node" />
          </template>
        </TreeNode>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from './Checkbox.vue'
import type { TreeNodeData } from './Tree.vue'

interface Props {
  node: TreeNodeData
  depth?: number
  selected?: boolean
  selectable?: boolean
  expandable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  selected: false,
  selectable: true,
  expandable: true
})

const emit = defineEmits<{
  'select': [node: TreeNodeData, event: Event]
  'expand': [node: TreeNodeData, event: Event]
  'collapse': [node: TreeNodeData, event: Event]
}>()

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

const nodeIcon = computed(() => {
  return props.node.icon
})

const isSelected = computed(() => {
  return props.selected
})

// Expanded state is managed by parent
const isExpanded = computed(() => {
  return false // This would be managed by parent in real implementation
})

// Toggle expand/collapse
const toggle = (event: Event) => {
  if (!props.expandable || !hasChildren.value) return

  if (isExpanded.value) {
    emit('collapse', props.node, event)
  } else {
    emit('expand', props.node, event)
  }
}

// Handle content click
const handleClick = (event: Event) => {
  if (props.node.disabled) return

  if (props.selectable) {
    emit('select', props.node, event)
  } else if (hasChildren.value && props.expandable) {
    toggle(event)
  }
}

// Handle checkbox change
const handleCheckboxChange = (value: boolean) => {
  emit('select', props.node, new Event('change'))
}

// Node classes
const nodeClasses = computed(() => [
  'tree-node',
  {
    'tree-node--disabled': props.node.disabled,
    'tree-node--selected': isSelected.value
  }
])
</script>

<style scoped>
.tree-node {
  user-select: none;
}

/* Node Content */
.tree-node__content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.tree-node__content:hover {
  background-color: #f3f4f6;
}

.tree-node--disabled .tree-node__content {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Toggle */
.tree-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.tree-node__toggle:hover {
  background-color: #e5e7eb;
}

.tree-node__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
  transition: transform 0.2s ease;
  color: #6b7280;
}

.tree-node__toggle-icon--expanded {
  transform: rotate(90deg);
}

.tree-node__toggle-placeholder {
  width: 1rem;
  flex-shrink: 0;
}

/* Icon */
.tree-node__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: #9ca3af;
}

/* Checkbox */
.tree-node__checkbox {
  flex-shrink: 0;
}

/* Label */
.tree-node__label {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.tree-node__label--disabled {
  color: #9ca3af;
}

.tree-node--selected .tree-node__label {
  font-weight: 500;
  color: #3b82f6;
}

/* Children */
.tree-node__children {
  position: relative;
}

/* Children Transition */
.tree-node-children-enter-active,
.tree-node-children-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.tree-node-children-enter-from,
.tree-node-children-leave-to {
  max-height: 0;
  opacity: 0;
}

.tree-node-children-enter-to,
.tree-node-children-leave-from {
  max-height: 1000px;
  opacity: 1;
}

/* Connecting Lines */
.tree-node__children > .tree-node::before {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e5e7eb;
}

.tree-node__children > .tree-node::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 1.25rem;
  width: 0.75rem;
  height: 1px;
  background-color: #e5e7eb;
}

.tree-node__children > .tree-node:last-child::before {
  height: calc(50% + 1px);
}

.tree-node__children > .tree-node:last-child::after {
  display: none;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .tree-node__content:hover {
    background-color: #374151;
  }

  .tree-node__toggle:hover {
    background-color: #4b5563;
  }

  .tree-node__toggle-icon {
    color: #9ca3af;
  }

  .tree-node__label {
    color: #d1d5db;
  }

  .tree-node__label--disabled {
    color: #6b7280;
  }

  .tree-node--selected .tree-node__label {
    color: #60a5fa;
  }

  .tree-node__children > .tree-node::before,
  .tree-node__children > .tree-node::after {
    background-color: #4b5563;
  }
}
</style>
