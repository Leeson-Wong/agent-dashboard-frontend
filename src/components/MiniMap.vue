<template>
  <div class="minimap" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button
      class="minimap-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开小地图' : '收起小地图'"
    >
      <span class="toggle-icon">🗺️</span>
      <span v-if="isCollapsed" class="toggle-count">{{ nodes.length }}</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="minimap-container">
        <!-- Stats Bar -->
        <div class="stats-bar">
          <span
            v-for="(count, status) in statusStats"
            :key="status"
            :class="['stat-item', `status-${status}`]"
            :title="`${status}: ${count}`"
          >
            <span class="stat-dot"></span>
            <span class="stat-count">{{ count }}</span>
          </span>
        </div>

        <!-- Canvas -->
        <div class="canvas-container" ref="canvasContainer">
          <svg
            :viewBox="`0 0 ${width} ${height}`"
            class="minimap-svg"
            @click="handleCanvasClick"
          >
            <!-- Background -->
            <rect
              :width="width"
              :height="height"
              fill="rgba(15, 23, 42, 0.9)"
              rx="4"
            />

            <!-- Nodes -->
            <circle
              v-for="node in nodes"
              :key="node.id"
              :cx="node.x"
              :cy="node.y"
              :r="nodeSize"
              :fill="getStatusColor(node.status)"
              :class="{ 'is-selected': node.selected }"
              :stroke="node.selected ? '#60a5fa' : 'none'"
              :stroke-width="node.selected ? 2 : 0"
              @click.stop="handleNodeClick(node.id)"
              class="minimap-node"
            >
              <title>{{ node.id }} ({{ node.status }})</title>
            </circle>
          </svg>
        </div>

        <!-- Legend -->
        <div class="legend">
          <span class="legend-item" title="在线/就绪">
            <span class="legend-dot" style="background: #22c55e"></span>
            <span class="legend-label">在线</span>
          </span>
          <span class="legend-item" title="离线/暂停">
            <span class="legend-dot" style="background: #64748b"></span>
            <span class="legend-label">离线</span>
          </span>
          <span class="legend-item" title="暂停">
            <span class="legend-dot" style="background: #f59e0b"></span>
            <span class="legend-label">暂停</span>
          </span>
          <span class="legend-item" title="错误">
            <span class="legend-dot" style="background: #ef4444"></span>
            <span class="legend-label">错误</span>
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMiniMap } from '../composables/useMiniMap'

interface Props {
  agents?: Array<{
    agentId: string
    status: string
    framework?: string
  }>
  selectedAgentId?: string | null
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  agents: () => [],
  selectedAgentId: null,
  width: 150,
  height: 150
})

const emit = defineEmits<{
  selectAgent: [agentId: string]
}>()

// Mini map
const canvasContainer = ref<HTMLElement | null>(null)
const {
  nodes,
  nodeSize,
  statusStats,
  updateNodes,
  getStatusColor,
  handleNodeClick: onNodeClick
} = useMiniMap({ width: props.width, height: props.height, nodeCount: props.agents.length })

// UI state
const isCollapsed = ref(false)

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Update nodes when agents change
const update = (): void => {
  updateNodes(props.agents, props.selectedAgentId)
}

// Handle node click
const handleNodeClick = (nodeId: string): void => {
  onNodeClick(nodeId, (agentId) => {
    emit('selectAgent', agentId)
  })
}

// Handle canvas click (for deselecting)
const handleCanvasClick = (): void => {
  // Optional: deselect when clicking on empty space
}

// Initial update
update()

// Expose methods
defineExpose({
  toggleCollapsed,
  update
})
</script>

<style scoped>
.minimap {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 850;
  font-size: 11px;
}

.minimap-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.minimap-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 14px;
}

.toggle-count {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.minimap-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  margin-top: 8px;
  min-width: 170px;
}

.stats-bar {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.5);
  font-size: 9px;
  font-weight: 500;
}

.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.stat-item.status-online .stat-dot,
.stat-item.status-ready .stat-dot {
  background: #22c55e;
}

.stat-item.status-offline .stat-dot {
  background: #64748b;
}

.stat-item.status-paused .stat-dot {
  background: #f59e0b;
}

.stat-item.status-error .stat-dot {
  background: #ef4444;
}

.stat-count {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  color: #e2e8f0;
}

.canvas-container {
  padding: 8px;
  display: flex;
  justify-content: center;
}

.minimap-svg {
  width: 100%;
  max-width: 150px;
  height: auto;
  cursor: pointer;
}

.minimap-node {
  cursor: pointer;
  transition: r 0.2s ease;
}

.minimap-node:hover {
  r: v-bind('nodeSize + 1') !important;
}

.minimap-node.is-selected {
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.6));
}

.legend {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  justify-content: space-around;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  color: #64748b;
  cursor: help;
}

.legend-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.legend-label {
  font-weight: 500;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .minimap {
    bottom: 20px;
    left: 10px;
  }

  .minimap-container {
    min-width: 150px;
  }
}
</style>
