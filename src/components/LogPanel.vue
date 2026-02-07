<template>
  <div class="log-panel" :class="{ collapsed: isCollapsed }">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <h3>Agent 日志</h3>
        <span v-if="agentId" class="agent-badge">{{ agentId.slice(0, 8) }}...</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" title="自动滚动" @click="toggleAutoScroll">
          <span :class="{ active: autoScroll }">⬇</span>
        </button>
        <button class="icon-btn" title="清空日志" @click="clearLogs">🗑</button>
        <button class="icon-btn" title="导出日志" @click="exportLogs">⬇</button>
        <button class="icon-btn" :title="isCollapsed ? '展开' : '收起'" @click="toggleCollapse">
          {{ isCollapsed ? '▲' : '▼' }}
        </button>
        <button class="icon-btn close-btn" title="关闭" @click="$emit('close')">×</button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!isCollapsed" class="panel-filters">
      <div class="filter-group">
        <label>级别:</label>
        <button
          v-for="level in logLevels"
          :key="level.value"
          :class="['filter-btn', { active: selectedLevels.includes(level.value) }]"
          @click="toggleLevel(level.value)"
        >
          <span :class="['level-dot', level.value]"></span>
          {{ level.label }}
        </button>
      </div>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索日志..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Log Content -->
    <div v-if="!isCollapsed" ref="logContainer" class="log-content" @scroll="handleScroll">
      <div v-if="filteredLogs.length === 0" class="empty-state">
        {{ searchQuery ? '没有找到匹配的日志' : '暂无日志' }}
      </div>
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        :class="['log-entry', log.level, { highlighted: index === highlightedIndex }]"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-level">
          <span :class="['level-dot', log.level]"></span>
          {{ log.level.toUpperCase() }}
        </span>
        <span v-if="log.agentId" class="log-agent">{{ log.agentId.slice(0, 8) }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>

    <!-- Status Bar -->
    <div v-if="!isCollapsed" class="panel-status">
      <span class="status-item">总计: {{ logs.length }} 条</span>
      <span class="status-item">显示: {{ filteredLogs.length }} 条</span>
      <span v-if="isConnected" class="status-item connected">● 实时</span>
      <span v-else class="status-item disconnected">○ 离线</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  agentId?: string
  logs?: LogEntry[]
  isConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  logs: () => [],
  isConnected: false,
})

// Emits
const emit = defineEmits<{
  close: []
  clear: []
  export: [logs: LogEntry[]]
}>()

// Types
export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  agentId?: string
  message: string
}

// State
const isCollapsed = ref(false)
const autoScroll = ref(true)
const searchQuery = ref('')
const selectedLevels = ref<string[]>(['info', 'warn', 'error', 'debug'])
const highlightedIndex = ref(-1)
const logContainer = ref<HTMLElement | null>(null)

// Log levels
const logLevels = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
]

// Computed
const filteredLogs = computed(() => {
  let result = props.logs

  // Filter by level
  result = result.filter(log => selectedLevels.value.includes(log.level))

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log =>
      log.message.toLowerCase().includes(query) ||
      (log.agentId && log.agentId.toLowerCase().includes(query))
    )
  }

  return result
})

// Methods
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const toggleAutoScroll = (): void => {
  autoScroll.value = !autoScroll.value
}

const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const clearLogs = (): void => {
  emit('clear')
}

const exportLogs = (): void => {
  emit('export', filteredLogs.value)
}

const toggleLevel = (level: string): void => {
  const index = selectedLevels.value.indexOf(level)
  if (index > -1) {
    selectedLevels.value.splice(index, 1)
  } else {
    selectedLevels.value.push(level)
  }
}

const handleScroll = (): void => {
  if (!logContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = logContainer.value
  autoScroll.value = scrollTop + clientHeight >= scrollHeight - 50
}

const scrollToBottom = (): void => {
  if (!autoScroll.value || !logContainer.value) return
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// Watch for new logs
watch(
  () => props.logs.length,
  () => {
    scrollToBottom()
  }
)

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  // Cleanup
})
</script>

<style scoped>
.log-panel {
  position: fixed;
  right: 400px;
  top: 50%;
  transform: translateY(-50%);
  width: 500px;
  max-height: 600px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.log-panel.collapsed {
  max-height: 50px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.agent-badge {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: #60a5fa;
  font-family: 'Consolas', 'Monaco', monospace;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.icon-btn .active {
  color: #22c55e;
}

.icon-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.panel-filters {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(30, 41, 59, 0.6);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-group label {
  font-size: 12px;
  color: #94a3b8;
  margin-right: 4px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  background: rgba(51, 65, 85, 0.5);
  border-radius: 4px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(71, 85, 105, 0.8);
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.level-dot.debug { background: #6b7280; }
.level-dot.info { background: #3b82f6; }
.level-dot.warn { background: #f59e0b; }
.level-dot.error { background: #ef4444; }

.search-box {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-input::placeholder {
  color: #64748b;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: rgba(15, 23, 42, 0.5);
}

.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 13px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  transition: background 0.2s;
}

.log-entry:hover {
  background: rgba(51, 65, 85, 0.5);
}

.log-entry.highlighted {
  background: rgba(59, 130, 246, 0.2);
}

.log-entry.info { color: #e2e8f0; }
.log-entry.debug { color: #9ca3af; }
.log-entry.warn { color: #fbbf24; }
.log-entry.error { color: #fca5a5; background: rgba(239, 68, 68, 0.1); }

.log-time {
  color: #64748b;
  flex-shrink: 0;
}

.log-level {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
}

.log-agent {
  color: #60a5fa;
  flex-shrink: 0;
  font-size: 11px;
}

.log-message {
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;
}

.panel-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(30, 41, 59, 0.8);
  font-size: 11px;
}

.status-item {
  color: #64748b;
}

.status-item.connected {
  color: #22c55e;
}

.status-item.disconnected {
  color: #ef4444;
}
</style>
