<template>
  <div class="agent-list-panel">
    <div class="panel-header">
      <h2>Agent 状态</h2>
      <div class="stats">
        <span class="stat online">在线: {{ stats.online }}</span>
        <span class="stat busy">忙碌: {{ stats.busy }}</span>
        <span class="stat thinking">思考: {{ stats.thinking }}</span>
        <span class="stat error">错误: {{ stats.error }}</span>
      </div>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索 Agent..."
        class="search-input"
      />
    </div>

    <div class="agent-list">
      <div
        v-for="agent in filteredAgents"
        :key="agent.agentId"
        :class="['agent-item', { selected: selectedAgentId === agent.agentId }]"
        @click="selectAgent(agent.agentId)"
      >
        <div class="agent-status-indicator" :class="agent.status"></div>

        <div class="agent-info">
          <div class="agent-name">{{ agent.role || agent.agentId }}</div>
          <div class="agent-meta">
            <span class="framework">{{ agent.framework }}</span>
            <span class="language">{{ agent.language }}</span>
          </div>
          <div v-if="agent.currentActivity" class="agent-activity">
            {{ agent.currentActivity }}
          </div>
          <div v-if="agent.currentTool" class="agent-tool">
            工具: {{ agent.currentTool }}
          </div>
        </div>

        <div class="agent-time">
          {{ formatTime(agent.lastActivity) }}
        </div>
      </div>

      <div v-if="filteredAgents.length === 0" class="empty-state">
        {{ searchQuery ? '没有找到匹配的 Agent' : '暂无 Agent 在线' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { AgentState } from '../../shared/types'
import { getWebSocketConnection } from '../api/WebSocketConnection'

// Props
interface Props {
  agents: AgentState[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  selectAgent: [agentId: string]
}>()

// State
const selectedAgentId = ref<string | null>(null)
const searchQuery = ref('')

// 统计数据
const stats = computed(() => {
  const online = props.agents.filter(a => a.status === 'online' || a.status === 'ready').length
  const busy = props.agents.filter(a => a.status === 'busy').length
  const thinking = props.agents.filter(a => a.status === 'thinking').length
  const error = props.agents.filter(a => a.status === 'error').length
  return { online, busy, thinking, error }
})

// 过滤后的 Agent 列表
const filteredAgents = computed(() => {
  if (!searchQuery.value) return props.agents

  const query = searchQuery.value.toLowerCase()
  return props.agents.filter(agent =>
    agent.agentId.toLowerCase().includes(query) ||
    (agent.role && agent.role.toLowerCase().includes(query)) ||
    (agent.currentActivity && agent.currentActivity.toLowerCase().includes(query))
  )
})

// 选择 Agent
const selectAgent = (agentId: string): void => {
  selectedAgentId.value = agentId
  emit('selectAgent', agentId)
}

// 格式化时间
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

// WebSocket 连接
let wsUnsubscribe: (() => void) | null = null

onMounted(() => {
  const ws = getWebSocketConnection()
  wsUnsubscribe = ws.onMessage((message) => {
    // 处理 WebSocket 消息，更新 agents 会在父组件处理
    console.log('WebSocket message:', message)
  })

  // 连接 WebSocket
  ws.connect().catch(err => {
    console.error('WebSocket connection failed:', err)
  })
})

onUnmounted(() => {
  if (wsUnsubscribe) {
    wsUnsubscribe()
  }
})
</script>

<style scoped>
.agent-list-panel {
  width: 320px;
  height: 100%;
  background: rgba(15, 23, 42, 0.9);
  border-right: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.panel-header h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
}

.stat.online { color: #22c55e; }
.stat.busy { color: #f59e0b; }
.stat.thinking { color: #8b5cf6; }
.stat.error { color: #ef4444; }

.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-input::placeholder {
  color: #64748b;
}

.agent-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.agent-list::-webkit-scrollbar {
  width: 6px;
}

.agent-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.agent-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.agent-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.3);
  transform: translateX(2px);
}

.agent-item.selected {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.agent-status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.agent-status-indicator.online { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.agent-status-indicator.offline { background: #6b7280; }
.agent-status-indicator.error { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
.agent-status-indicator.busy { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
.agent-status-indicator.thinking { background: #8b5cf6; box-shadow: 0 0 8px #8b5cf6; animation: pulse 1.5s infinite; }
.agent-status-indicator.ready { background: #3b82f6; }
.agent-status-indicator.waiting { background: #f97316; }
.agent-status-indicator.paused { background: #a855f7; }
.agent-status-indicator.stopped { background: #64748b; }
.agent-status-indicator.initializing { background: #0ea5e9; animation: pulse 1s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.framework, .language {
  padding: 2px 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
}

.agent-activity {
  font-size: 12px;
  color: #cbd5e1;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-tool {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.agent-time {
  font-size: 11px;
  color: #64748b;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 14px;
}
</style>
