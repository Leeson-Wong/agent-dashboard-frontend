/**
 * Agent Dashboard - Main Entry Point
 *
 * 3D visualization for monitoring multiple agents
 * 数据一致性策略：
 * - API 全量同步（初始加载 + 定期校验）
 * - WebSocket 增量更新（实时推送）
 * - AgentStore 合并数据（时间戳比较 + 事件去重）
 */

import './styles/index.css'
import { AgentScene } from './scene/AgentScene'
import { apiClient } from './api/ApiClient'
import { EventStream } from './api/EventStream'
import { agentStore } from './store/AgentStore'
import type { AgentState, AgentStatus, AgentEvent } from '@shared/types'

// ============================================================================
// Configuration
// ============================================================================

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_WS_URL

// ============================================================================
// UI State
// ============================================================================

interface DashboardUIState {
  selectedAgentId: string | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

const uiState: DashboardUIState = {
  selectedAgentId: null,
  connectionStatus: 'connecting',
}

// ============================================================================
// Scene Setup
// ============================================================================

const container = document.getElementById('canvas-container')
if (!container) {
  throw new Error('Canvas container not found')
}

const scene = new AgentScene(container)

// Track agent zones by index for consistent positioning
const agentZoneIndexes = new Map<string, number>()

// ============================================================================
// Event Stream (WebSocket)
// ============================================================================

const eventStream = new EventStream(WS_URL, {
  reconnectInterval: 3000,
  maxReconnectAttempts: Infinity,
  onConnect: () => {
    console.log('[Dashboard] Connected to server')
    uiState.connectionStatus = 'connected'
    updateConnectionStatus()
  },
  onDisconnect: () => {
    console.log('[Dashboard] Disconnected from server')
    uiState.connectionStatus = 'disconnected'
    updateConnectionStatus()
  },
  onError: (error) => {
    console.error('[Dashboard] Error:', error)
    uiState.connectionStatus = 'error'
    updateConnectionStatus()
  },
  onAgentUpdate: (agents: AgentState[]) => {
    // WebSocket 推送的全量更新（重连后）
    console.log(`[Dashboard] Received ${agents.length} agents via WebSocket`)
    handleAgentsUpdate(agents)
  },
  onEvent: (event: AgentEvent) => {
    // WebSocket 推送的增量事件
    handleAgentEvent(event)
  },
})

// ============================================================================
// Data Handlers
// ============================================================================

/**
 * 处理 Agent 数据更新（全量）
 */
function handleAgentsUpdate(agents: AgentState[]): void {
  // 使用 AgentStore 进行状态管理
  agentStore.syncAll(agents)

  // 同步到 UI 和 3D 场景
  syncAgentsToScene()
  renderAgentList()
  updateStats()
}

/**
 * 处理 Agent 事件（增量）
 */
function handleAgentEvent(event: AgentEvent): void {
  console.log('[Dashboard] Received event:', event.type, 'for', event.agentId)

  // 根据事件类型更新状态
  switch (event.type) {
    case 'agent_status':
      // 更新状态
      agentStore.updateStatus(
        event.agentId,
        event.status,
        undefined
      )
      break

    case 'agent_activity':
      // 更新活动（通常伴随着状态变化为 busy）
      if (event.activity) {
        const agent = agentStore.get(event.agentId)
        if (agent) {
          agentStore.update({
            ...agent,
            currentActivity: event.activity,
            status: 'busy',
            lastActivity: new Date(event.timestamp).toISOString(),
            updatedAt: new Date(event.timestamp).toISOString(),
          }, event.id)
        }
      }
      break

    case 'agent_error':
      // 更新为错误状态
      agentStore.updateStatus(
        event.agentId,
        'error',
        event.error
      )
      break
  }

  // 同步到 UI 和 3D 场景
  syncAgentsToScene()
  renderAgentList()
  updateStats()
}

/**
 * 同步 Agents 到 3D 场景
 */
function syncAgentsToScene(): void {
  const agents = agentStore.getAll()

  // 创建新的 agent zones
  agents.forEach((agent, index) => {
    if (!agentZoneIndexes.has(agent.agentId)) {
      scene.createAgentZone(agent.agentId, index)
      agentZoneIndexes.set(agent.agentId, index)
    }

    // 更新状态
    scene.updateAgentStatus(agent.agentId, agent.status)
  })

  // 注意：我们不删除已下线的 agent zones，保留它们以供查看
}

// ============================================================================
// UI Rendering
// ============================================================================

function renderAgentList(): void {
  const listEl = document.getElementById('agent-list')
  if (!listEl) return

  const agents = agentStore.getAll()

  if (agents.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤖</div>
        <div class="empty-state-text">No agents connected</div>
      </div>
    `
    return
  }

  listEl.innerHTML = agents
    .map(agent => {
      const isActive = uiState.selectedAgentId === agent.agentId
      const statusIcon = getStatusIcon(agent.status)
      const timeAgo = formatTimeAgo(new Date(agent.lastActivity))

      return `
        <div class="agent-item ${isActive ? 'active' : ''}" data-agent-id="${agent.agentId}">
          <div class="agent-status-indicator ${agent.status}"></div>
          <div class="agent-info">
            <div class="agent-name">${agent.agentId}</div>
            <div class="agent-details">
              <span class="agent-framework">${agent.framework}</span>
              <span class="agent-language">${agent.language}</span>
            </div>
            ${agent.currentActivity ? `
              <div class="agent-activity">${statusIcon} ${agent.currentActivity}</div>
            ` : ''}
            <div class="agent-activity text-muted">Last active: ${timeAgo}</div>
          </div>
        </div>
      `
    })
    .join('')

  // Add click handlers
  listEl.querySelectorAll('.agent-item').forEach(item => {
    item.addEventListener('click', () => {
      const agentId = item.getAttribute('data-agent-id')
      if (agentId) {
        selectAgent(agentId === uiState.selectedAgentId ? null : agentId)
      }
    })
  })
}

function updateStats(): void {
  const stats = agentStore.getStats()

  // Update HUD
  const agentCountEl = document.getElementById('agent-count')
  const onlineCountEl = document.getElementById('online-count')

  if (agentCountEl) {
    agentCountEl.textContent = `Agents: ${stats.total}`
  }
  if (onlineCountEl) {
    onlineCountEl.textContent = `Online: ${stats.online}`
  }
}

function updateConnectionStatus(): void {
  const statusEl = document.getElementById('connection-status')

  // 如果元素不存在，创建它
  if (!statusEl) {
    const statsEl = document.querySelector('.stats')
    if (statsEl) {
      const newStatusEl = document.createElement('span')
      newStatusEl.id = 'connection-status'
      newStatusEl.className = 'connection-status'
      statsEl.appendChild(newStatusEl)
    }
  }

  const targetEl = document.getElementById('connection-status')
  if (targetEl) {
    const statusConfig = {
      connecting: { text: 'Connecting...', color: '#f59e0b' },
      connected: { text: '● Connected', color: '#22c55e' },
      disconnected: { text: '○ Disconnected', color: '#6b7280' },
      error: { text: '● Error', color: '#ef4444' },
    }
    const config = statusConfig[uiState.connectionStatus]
    targetEl.textContent = config.text
    targetEl.style.color = config.color
  }
}

function getStatusIcon(status: AgentStatus): string {
  switch (status) {
    case 'online':
      return '🟢'
    case 'offline':
      return '⚫'
    case 'busy':
      return '🟡'
    case 'error':
      return '🔴'
    default:
      return '⚪'
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// ============================================================================
// User Interactions
// ============================================================================

function selectAgent(agentId: string | null): void {
  uiState.selectedAgentId = agentId
  scene.setFocusedZone(agentId)
  renderAgentList()
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

document.addEventListener('keydown', (e) => {
  // Press 0-9 to select agents
  if (e.key >= '0' && e.key <= '9') {
    const index = parseInt(e.key)
    const agents = agentStore.getAll()
    if (index === 0) {
      selectAgent(null)
    } else if (index <= agents.length) {
      selectAgent(agents[index - 1].agentId)
    }
  }

  // Escape to deselect
  if (e.key === 'Escape') {
    selectAgent(null)
  }
})

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  console.log('🚀 Agent Dashboard initializing...')

  updateConnectionStatus()

  if (USE_MOCK_DATA) {
    console.log('⚠️  Using mock data (VITE_USE_MOCK_DATA=true)')
    initMockData()
  } else {
    try {
      // 初始加载：从 API 获取所有 agents
      console.log('📡 Fetching agents from API...')
      const agents = await apiClient.getAgents()
      console.log(`✅ Loaded ${agents.length} agents`)

      handleAgentsUpdate(agents)

      // 连接 WebSocket 进行实时更新
      console.log('🔌 Connecting to WebSocket...')
      eventStream.connect()

      // 定期清理事件ID（防止内存泄漏）
      setInterval(() => {
        agentStore.cleanupEventIds()
      }, 60000) // 每分钟清理一次

      // 定期全量同步（校验数据一致性）
      setInterval(async () => {
        if (eventStream.connected) {
          // WebSocket 连接正常，不需要同步
          return
        }

        console.log('🔄 Periodic full sync (WebSocket disconnected)...')
        try {
          const agents = await apiClient.getAgents()
          handleAgentsUpdate(agents)
        } catch (error) {
          console.error('Failed to sync:', error)
        }
      }, 30000) // 每 30 秒同步一次

    } catch (error) {
      console.error('❌ Failed to initialize:', error)
      uiState.connectionStatus = 'error'
      updateConnectionStatus()

      // 降级到模拟数据
      console.log('⚠️  Falling back to mock data')
      initMockData()
    }
  }

  const stats = agentStore.getStats()
  console.log('📊 Stats:', stats)
  console.log('⌨️  Press 0-9 to select agents, Escape to deselect')
}

// ============================================================================
// Mock Data (fallback)
// ============================================================================

function initMockData() {
  const mockAgents: AgentState[] = [
    {
      agentId: 'agent-001',
      serverId: 'server-1',
      framework: 'LangGraph',
      language: 'Python',
      status: 'online',
      currentActivity: 'Processing user request',
      role: 'Assistant',
      lastActivity: new Date(Date.now() - 5000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 5000).toISOString(),
    },
    {
      agentId: 'agent-002',
      serverId: 'server-1',
      framework: 'LangChain',
      language: 'TypeScript',
      status: 'busy',
      currentActivity: 'Executing database query',
      role: 'Analyst',
      lastActivity: new Date(Date.now() - 30000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 30000).toISOString(),
    },
    {
      agentId: 'agent-003',
      serverId: 'server-2',
      framework: 'AutoGen',
      language: 'Python',
      status: 'offline',
      currentActivity: undefined,
      role: 'Developer',
      lastActivity: new Date(Date.now() - 600000).toISOString(),
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      agentId: 'agent-004',
      serverId: 'server-2',
      framework: 'CrewAI',
      language: 'Python',
      status: 'online',
      currentActivity: 'Analyzing data',
      role: 'Researcher',
      lastActivity: new Date(Date.now() - 15000).toISOString(),
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 15000).toISOString(),
    },
    {
      agentId: 'agent-005',
      serverId: 'server-3',
      framework: 'OpenAI',
      language: 'JavaScript',
      status: 'error',
      currentActivity: 'API rate limit exceeded',
      role: 'Bot',
      lastActivity: new Date(Date.now() - 120000).toISOString(),
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 120000).toISOString(),
    },
  ]

  handleAgentsUpdate(mockAgents)

  // 模拟实时更新
  setInterval(() => {
    if (Math.random() > 0.5) {
      simulateActivity()
    }
  }, 5000)
}

function simulateActivity(): void {
  const agents = agentStore.getAll()
  const randomAgent = agents[Math.floor(Math.random() * agents.length)]

  const statuses: AgentStatus[] = ['online', 'offline', 'busy', 'error']
  const activities = [
    'Processing task',
    'Waiting for input',
    'Analyzing data',
    'Executing code',
    'Calling API',
    'Thinking...',
  ]

  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
  const randomActivity = activities[Math.floor(Math.random() * activities.length)]

  const updated: AgentState = {
    ...randomAgent,
    status: randomStatus,
    currentActivity: randomActivity,
    lastActivity: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  agentStore.update(updated)
  syncAgentsToScene()
  renderAgentList()
  updateStats()
}

// ============================================================================
// Start
// ============================================================================

init()

// Expose for debugging
;(window as any).agentDashboard = {
  agentStore,
  scene,
  eventStream,
  selectAgent,
  simulateActivity,
}
