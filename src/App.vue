<template>
  <div class="app">
    <!-- 3D Scene -->
    <div ref="sceneContainer" class="scene-container"></div>

    <!-- UI Overlay -->
    <div class="ui-overlay">
      <!-- Header -->
      <header class="app-header">
        <h1>Agent Dashboard</h1>
        <div class="header-stats">
          <span class="stat">在线: {{ stats.online }}</span>
          <span class="stat">总 Agent: {{ stats.total }}</span>
          <span class="stat" :class="{ connected: wsConnected }">
            {{ wsConnected ? '● 已连接' : '○ 未连接' }}
          </span>
        </div>
      </header>

      <!-- Main Content -->
      <div class="app-content">
        <!-- Agent List Panel (Left) -->
        <AgentListPanel
          :agents="agents"
          @select-agent="selectAgent"
        />

        <!-- Center: 3D Scene (managed by AgentScene) -->
        <div class="scene-spacer"></div>

        <!-- Agent Detail Panel (Right) -->
        <AgentDetailPanel
          :agent="selectedAgent"
          @close="closeDetailPanel"
          @view-logs="viewLogs"
          @view-tasks="viewTasks"
          @pause-agent="pauseAgent"
        />
      </div>
    </div>

    <!-- Log Panel -->
    <LogPanel
      v-if="showLogPanel"
      :agent-id="logAgentId"
      :logs="logs"
      :is-connected="wsConnected"
      @close="showLogPanel = false"
      @clear="logs = []"
      @export="exportLogs"
    />

    <!-- Task History Panel -->
    <TaskHistoryPanel
      v-if="showTaskPanel"
      :agent-id="taskAgentId"
      :tasks="tasks"
      @close="showTaskPanel = false"
      @refresh="refreshTasks"
      @retry="retryTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { AgentScene } from './scene/AgentScene'
import { getWebSocketConnection, type WebSocketConnection } from './api/WebSocketConnection'
import { getAPIClient } from './api/ApiClientNew'
import { agentStore } from './store/AgentStore'
import AgentListPanel from './components/AgentListPanel.vue'
import AgentDetailPanel from './components/AgentDetailPanel.vue'
import LogPanel, { type LogEntry } from './components/LogPanel.vue'
import TaskHistoryPanel, { type Task } from './components/TaskHistoryPanel.vue'
import type { AgentState } from '../shared/types'
import { config } from './config/env'

// Scene
const sceneContainer = ref<HTMLElement | null>(null)
let scene: AgentScene | null = null

// State
const agents = ref<AgentState[]>([])
const selectedAgentId = ref<string | null>(null)
const wsConnected = ref(false)
const logs = ref<LogEntry[]>([])
const logAgentId = ref<string | null>(null)
const showLogPanel = ref(false)
const tasks = ref<Task[]>([])
const taskAgentId = ref<string | null>(null)
const showTaskPanel = ref(false)

// Computed
const selectedAgent = computed(() => {
  return selectedAgentId.value
    ? agents.value.find(a => a.agentId === selectedAgentId.value) || null
    : null
})

const stats = computed(() => {
  const online = agents.value.filter(a => a.status === 'online' || a.status === 'ready').length
  const total = agents.value.length
  return { online, total }
})

// WebSocket
let ws: WebSocketConnection | null = null

// Methods
const selectAgent = (agentId: string): void => {
  selectedAgentId.value = agentId
  if (scene) {
    scene.setFocusedZone(agentId)
  }
}

const closeDetailPanel = (): void => {
  selectedAgentId.value = null
  if (scene) {
    scene.setFocusedZone(null)
  }
}

const viewLogs = (agentId: string): void => {
  logAgentId.value = agentId
  showLogPanel.value = true

  // Add some sample logs
  logs.value = [
    { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'info', agentId, message: 'Agent 初始化完成' },
    { timestamp: new Date(Date.now() - 8000).toISOString(), level: 'debug', agentId, message: '加载配置文件 config.yaml' },
    { timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', agentId, message: '连接到 LLM 服务: gpt-4' },
    { timestamp: new Date(Date.now() - 3000).toISOString(), level: 'warn', agentId, message: 'API 响应时间较长: 2.3s' },
    { timestamp: new Date(Date.now() - 1000).toISOString(), level: 'info', agentId, message: '任务执行成功' },
  ]
}

const viewTasks = (agentId: string): void => {
  taskAgentId.value = agentId
  showTaskPanel.value = true

  // Add some sample tasks
  tasks.value = [
    {
      taskId: 'task-001',
      name: '数据分析任务',
      description: '分析用户行为数据并生成报告',
      status: 'completed',
      priority: 8,
      agentId,
      progress: 100,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      startedAt: new Date(Date.now() - 3500000).toISOString(),
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      output: { summary: '分析完成，发现3个关键趋势' },
    },
    {
      taskId: 'task-002',
      name: '文档生成',
      description: '生成API接口文档',
      status: 'running',
      priority: 5,
      agentId,
      progress: 65,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - 1700000).toISOString(),
    },
    {
      taskId: 'task-003',
      name: '代码审查',
      description: '审查前端组件代码',
      status: 'failed',
      priority: 7,
      agentId,
      progress: 40,
      error: '无法访问Git仓库：连接超时',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
      startedAt: new Date(Date.now() - 850000).toISOString(),
    },
  ]
}

const pauseAgent = async (agentId: string): Promise<void> => {
  try {
    const api = getAPIClient()

    // Find the agent to determine if we should pause or resume
    const agent = agents.value.find(a => a.agentId === agentId)
    if (!agent) return

    // If already paused, resume; otherwise pause
    if (agent.status === 'paused') {
      await api.resumeAgent(agentId)
      console.log('Resumed agent:', agentId)
    } else {
      await api.pauseAgent(agentId)
      console.log('Paused agent:', agentId)
    }

    // The agent state will be updated via WebSocket
  } catch (error) {
    console.error('Failed to pause/resume agent:', error)
  }
}

const exportLogs = (logsToExport: LogEntry[]): void => {
  const content = logsToExport
    .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}]${log.agentId ? ` [${log.agentId}]` : ''} ${log.message}`)
    .join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `agent-logs-${logAgentId.value || 'all'}-${new Date().toISOString()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const refreshTasks = (): void => {
  // In a real app, this would call the API to fetch tasks
  console.log('Refreshing tasks for agent:', taskAgentId.value)
}

const retryTask = (task: Task): void => {
  console.log('Retrying task:', task.taskId)
  // In a real app, this would call the API to retry the task
}

// Initialize scene
onMounted(() => {
  if (!sceneContainer.value) return

  // Create 3D scene
  scene = new AgentScene(sceneContainer.value)

  // Create mock agents for testing (only if development mode with mock data enabled)
  const mockAgents: AgentState[] = config.development.useMockData
    ? Array.from({ length: config.development.mockAgentsCount }, (_, i) => {
        const statuses: Array<'online' | 'thinking' | 'busy' | 'ready'> = ['online', 'thinking', 'busy', 'ready']
        const frameworks = ['CrewAI', 'LangChain', 'AutoGen', 'AutoGPT']
        const languages = ['Python', 'TypeScript', 'JavaScript']
        const roles = ['研究员', '作家', '开发者', '分析师', '设计师', '测试工程师']
        const activities = [
          '研究 AI 技术趋势',
          '撰写技术文章',
          '执行代码任务',
          '分析数据',
          '设计用户界面',
          '运行测试用例',
        ]

        const status = statuses[i % statuses.length]
        const num = (i + 1).toString().padStart(3, '0')

        return {
          agentId: `agent-${num}`,
          serverId: `server-${(i % 3) + 1}`,
          framework: frameworks[i % frameworks.length],
          language: languages[i % languages.length],
          status,
          role: roles[i % roles.length],
          currentActivity: activities[i % activities.length],
          lastActivity: new Date(Date.now() - 1000 * 60 * (i * 2 + 1)).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          updatedAt: new Date().toISOString(),
        } as AgentState
      })
    : []

  agents.value = mockAgents

  // Create agent zones in 3D scene
  mockAgents.forEach((agent, index) => {
    if (scene) {
      scene.createAgentZone(agent.agentId, index)
      scene.updateAgentStatus(agent.agentId, agent.status)
    }
  })

  // Setup WebSocket
  ws = getWebSocketConnection()
  ws.connect().catch(err => {
    console.error('WebSocket connection failed:', err)
  })

  const unsubscribe = ws.onMessage((message) => {
    console.log('WebSocket message:', message)

    // Handle agent_update messages from backend
    if ((message as Record<string, unknown>).type === 'agent_update') {
      const msg = message as { type: string; data: AgentState; timestamp: string }
      const agentState = msg.data

      // Update AgentStore
      if (agentStore.update(agentState, msg.timestamp)) {
        // Update local agents array
        agents.value = agentStore.getAll()

        // Update 3D scene
        if (scene) {
          // Check if this is a new agent or status change
          const existingAgent = agents.value.find(a => a.agentId === agentState.agentId)
          if (!existingAgent) {
            // New agent - create zone
            const index = agents.value.length
            scene.createAgentZone(agentState.agentId, index)
          }
          // Update agent status in 3D scene
          scene.updateAgentStatus(agentState.agentId, agentState.status as any)
        }
      }
    }

    wsConnected.value = ws.isConnected()
  })

  // Cleanup
  window.addEventListener('beforeunload', () => {
    unsubscribe()
    if (scene) {
      scene.dispose()
    }
  })
})

onUnmounted(() => {
  if (scene) {
    scene.dispose()
    scene = null
  }
  if (ws) {
    ws.disconnect()
  }
})
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.scene-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

.app-header {
  pointer-events: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat {
  font-size: 14px;
  color: #94a3b8;
}

.stat.connected {
  color: #22c55e;
}

.app-content {
  flex: 1;
  display: flex;
  pointer-events: none;
}

.scene-spacer {
  flex: 1;
}

/* 让子组件可以交互 */
.ui-overlay > * {
  pointer-events: auto;
}
</style>
