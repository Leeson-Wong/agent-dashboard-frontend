<template>
  <div class="status-timeline">
    <!-- Header -->
    <div class="timeline-header">
      <h3>状态历史</h3>
      <div class="timeline-controls">
        <select v-model="viewMode" class="view-mode-select">
          <option value="all">全部</option>
          <option value="recent">最近 10 条</option>
          <option value="today">今天</option>
        </select>
        <button
          v-if="history.length > 0"
          @click="handleClear"
          class="clear-btn"
          title="清除历史记录"
        >
          清除
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="statistics.totalChanges > 0" class="timeline-stats">
      <div class="stat-item">
        <span class="stat-label">总变化次数</span>
        <span class="stat-value">{{ statistics.totalChanges }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均持续时间</span>
        <span class="stat-value">{{ formatDuration(statistics.averageDuration) }}</span>
      </div>
    </div>

    <!-- Timeline -->
    <div v-if="displayedHistory.length > 0" class="timeline-entries">
      <div
        v-for="(entry, index) in displayedHistory"
        :key="index"
        class="timeline-entry"
        :class="`status-${entry.status}`"
      >
        <!-- Timeline dot and line -->
        <div class="timeline-marker">
          <div class="timeline-dot"></div>
          <div v-if="index < displayedHistory.length - 1" class="timeline-line"></div>
        </div>

        <!-- Entry content -->
        <div class="timeline-content">
          <div class="entry-header">
            <span class="entry-status">{{ getStatusLabel(entry.status) }}</span>
            <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
          </div>

          <div v-if="entry.previousStatus" class="entry-transition">
            从 <span class="previous-status">{{ getStatusLabel(entry.previousStatus) }}</span> 转变
          </div>

          <div v-if="entry.duration" class="entry-duration">
            持续时间: {{ formatDuration(entry.duration) }}
          </div>

          <div v-if="entry.metadata?.reason" class="entry-reason">
            原因: {{ entry.metadata.reason }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="timeline-empty">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无状态历史记录</div>
      <div class="empty-hint">Agent 状态变化时会自动记录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAgentStatusHistory, type StatusHistoryEntry } from '../composables/useAgentStatusHistory'
import type { AgentStatus } from '../../shared/types'

const props = defineProps<{
  agentId: string
}>()

const emit = defineEmits<{
  'clear-history': []
}>()

// Status history composable
const {
  history,
  statistics,
  getRecentHistory,
  formatDuration
} = useAgentStatusHistory(props.agentId)

// View mode
const viewMode = ref<'all' | 'recent' | 'today'>('recent')

// Displayed history based on view mode
const displayedHistory = computed<StatusHistoryEntry[]>(() => {
  if (viewMode.value === 'recent') {
    return getRecentHistory(10)
  } else if (viewMode.value === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return history.value.filter(entry => {
      const timestamp = entry.timestamp
      return timestamp >= today && timestamp < tomorrow
    })
  }
  return history.value
})

// Get status label in Chinese
const getStatusLabel = (status: AgentStatus): string => {
  const labels: Record<AgentStatus, string> = {
    online: '在线',
    offline: '离线',
    error: '错误',
    busy: '忙碌',
    thinking: '思考中',
    ready: '就绪',
    waiting: '等待中',
    paused: '已暂停',
    stopped: '已停止',
    initializing: '初始化中'
  }
  return labels[status] || status
}

// Format time for display
const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  } else if (hours > 0) {
    return `${hours}小时前 ${date.toLocaleTimeString()}`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else if (seconds > 0) {
    return `${seconds}秒前`
  } else {
    return '刚刚'
  }
}

// Handle clear history
const handleClear = (): void => {
  emit('clear-history')
}

// Watch agentId changes
watch(() => props.agentId, (newAgentId) => {
  // Reset view mode when agent changes
  viewMode.value = 'recent'
})
</script>

<style scoped>
.status-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.timeline-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-select {
  padding: 4px 8px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}

.view-mode-select:hover {
  border-color: rgba(100, 116, 139, 0.5);
}

.clear-btn {
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: #f87171;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.timeline-stats {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.timeline-entries {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-entry {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #1e293b;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  z-index: 1;
}

.timeline-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom, rgba(59, 130, 246, 0.5), transparent);
  min-height: 32px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(100, 116, 139, 0.2);
  flex: 1;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.entry-status {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.entry-time {
  font-size: 12px;
  color: #94a3b8;
}

.entry-transition {
  font-size: 12px;
  color: #94a3b8;
}

.previous-status {
  color: #3b82f6;
  font-weight: 500;
}

.entry-duration {
  font-size: 12px;
  color: #64748b;
}

.entry-reason {
  font-size: 12px;
  color: #fbbf24;
}

/* Status-specific colors */
.timeline-entry.status-online .timeline-dot {
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
}

.timeline-entry.status-offline .timeline-dot {
  background: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.3);
}

.timeline-entry.status-error .timeline-dot {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.timeline-entry.status-busy .timeline-dot,
.timeline-entry.status-thinking .timeline-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
}

.timeline-entry.status-paused .timeline-dot {
  background: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.timeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.empty-hint {
  font-size: 12px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .timeline-stats {
    flex-direction: column;
    gap: 8px;
  }

  .entry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
