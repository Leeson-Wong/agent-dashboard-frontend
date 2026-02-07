<template>
  <div class="agent-detail-panel">
    <div v-if="agent" class="panel-content">
      <!-- Header -->
      <div class="panel-header">
        <div class="agent-title">
          <h2>{{ agent.role || agent.agentId }}</h2>
          <span :class="['status-badge', agent.status]">
            {{ statusText }}
          </span>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <!-- Info Cards -->
      <div class="info-grid">
        <div class="info-card">
          <div class="label">框架</div>
          <div class="value">{{ agent.framework }}</div>
        </div>
        <div class="info-card">
          <div class="label">语言</div>
          <div class="value">{{ agent.language }}</div>
        </div>
        <div class="info-card">
          <div class="label">Agent ID</div>
          <div class="value monospace">{{ agent.agentId.slice(0, 8) }}...</div>
        </div>
        <div class="info-card">
          <div class="label">服务器</div>
          <div class="value">{{ agent.serverId }}</div>
        </div>
      </div>

      <!-- Current Activity -->
      <div v-if="agent.currentActivity" class="section">
        <h3>当前活动</h3>
        <div class="activity-box">
          <div class="activity-icon">⚡</div>
          <div class="activity-text">{{ agent.currentActivity }}</div>
        </div>
      </div>

      <!-- Current Tool -->
      <div v-if="agent.currentTool" class="section">
        <h3>当前工具</h3>
        <div class="tool-box">
          <div class="tool-icon">🔧</div>
          <div class="tool-name">{{ agent.currentTool }}</div>
        </div>
      </div>

      <!-- Memory Info -->
      <div v-if="agent.memoryId" class="section">
        <h3>关联 Memory</h3>
        <div class="memory-box">
          <div class="memory-icon">🧠</div>
          <div class="memory-id monospace">{{ agent.memoryId.slice(0, 16) }}...</div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="section">
        <h3>时间线</h3>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-label">最后活动</div>
              <div class="timeline-time">{{ formatDateTime(agent.lastActivity) }}</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-label">创建时间</div>
              <div class="timeline-time">{{ formatDateTime(agent.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="action-btn primary" @click="viewLogs">查看日志</button>
        <button class="action-btn" @click="viewTasks">任务历史</button>
        <button class="action-btn danger" @click="pauseAgent">{{ isPaused ? '恢复' : '暂停' }}</button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🤖</div>
      <div class="empty-text">选择一个 Agent 查看详情</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgentState } from '../../shared/types'

// Props
interface Props {
  agent: AgentState | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  viewLogs: [agentId: string]
  viewTasks: [agentId: string]
  pauseAgent: [agentId: string]
}>()

// 状态文本映射
const statusTextMap: Record<string, string> = {
  online: '在线',
  offline: '离线',
  error: '错误',
  busy: '忙碌',
  thinking: '思考中',
  ready: '就绪',
  waiting: '等待中',
  paused: '已暂停',
  stopped: '已停止',
  initializing: '初始化中',
}

const statusText = computed(() => {
  return props.agent ? statusTextMap[props.agent.status] || props.agent.status : ''
})

const isPaused = computed(() => {
  return props.agent?.status === 'paused'
})

// 格式化日期时间
const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 操作方法
const viewLogs = (): void => {
  if (props.agent) {
    emit('viewLogs', props.agent.agentId)
  }
}

const viewTasks = (): void => {
  if (props.agent) {
    emit('viewTasks', props.agent.agentId)
  }
}

const pauseAgent = (): void => {
  if (props.agent) {
    emit('pauseAgent', props.agent.agentId)
  }
}
</script>

<style scoped>
.agent-detail-panel {
  width: 380px;
  height: 100%;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.panel-content {
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.agent-title h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.online { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status-badge.offline { background: rgba(107, 114, 128, 0.2); color: #6b7280; }
.status-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.status-badge.busy { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.status-badge.thinking { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.status-badge.ready { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.status-badge.waiting { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.status-badge.paused { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
.status-badge.stopped { background: rgba(100, 116, 139, 0.2); color: #64748b; }
.status-badge.initializing { background: rgba(14, 165, 233, 0.2); color: #0ea5e9; }

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.info-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.info-card .label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.info-card .value {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.activity-box,
.tool-box,
.memory-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.activity-icon,
.tool-icon,
.memory-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.activity-text,
.tool-name,
.memory-id {
  font-size: 13px;
  color: #e2e8f0;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: rgba(100, 116, 139, 0.3);
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #0f172a;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}

.timeline-time {
  font-size: 13px;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.action-btn:hover {
  background: rgba(71, 85, 105, 1);
  transform: translateY(-1px);
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.8);
  color: #fff;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 1);
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.monospace {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #64748b;
}
</style>
