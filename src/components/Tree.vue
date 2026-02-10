<template>
  <div :class="treeClasses" role="tree">
    <TreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected="selectedNodeIds.includes(node.id)"
      :expanded="expandedNodeIds.includes(node.id)"
      :selectable="selectable"
      :expandable="expandable"
      @select="handleSelect"
      @expand="handleExpand"
      @collapse="handleCollapse"
    >
      <template #icon="{ node }">
        <slot name="icon" :node="node" />
      </template>
      <template #label="{ node }">
        <slot name="label" :node="node" />
      </template>
    </TreeNode>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TreeNode from './TreeNode.vue'

export interface TreeNodeData {
  id: string | number
  label: string
  children?: TreeNodeData[]
  icon?: any
  disabled?: boolean
}

interface Props {
  nodes: TreeNodeData[]
  selectable?: boolean
  expandable?: boolean
  selected?: string | number | (string | number)[]
  expanded?: string | number | (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  selectable: true,
  expandable: true,
  selected: () => [],
  expanded: () => []
})

const emit = defineEmits<{
  'select': [node: TreeNodeData, event: Event]
  'expand': [node: TreeNodeData, event: Event]
  'collapse': [node: TreeNodeData, event: Event]
}>()

const selectedNodeIds = computed(() => {
  return Array.isArray(props.selected) ? props.selected : [props.selected].filter(Boolean)
})

const expandedNodeIds = computed(() => {
  return Array.isArray(props.expanded) ? props.expanded : [props.expanded].filter(Boolean)
})

const handleSelect = (node: TreeNodeData, event: Event) => {
  emit('select', node, event)
}

const handleExpand = (node: TreeNodeData, event: Event) => {
  emit('expand', node, event)
}

const handleCollapse = (node: TreeNodeData, event: Event) => {
  emit('collapse', node, event)
}

// Tree classes
const treeClasses = computed(() => [
  'tree'
])
</script>

<style scoped>
.tree {
  --tree-indent: 1.5rem;
}
</style>
