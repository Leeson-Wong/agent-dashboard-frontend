<template>
  <div class="app">
    <!-- 3D Scene -->
    <div ref="sceneContainer" class="scene-container"></div>

    <!-- Initial Loading Overlay -->
    <Transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在初始化系统...</div>
          <div v-if="loadingError" class="loading-error">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{{ loadingError }}</div>
            <button class="btn-retry" @click="retryLoad">重新加载</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- UI Overlay -->
    <div class="ui-overlay">
      <!-- Header -->
      <header :class="['app-header', headerModeClass]">
        <h1>Agent Dashboard</h1>
        <HeaderModeToggle />
        <div class="header-stats" :class="{ 'is-compact': isHeaderCompact }">
          <span class="stat">在线: {{ stats.online }}</span>
          <span class="stat">总 Agent: {{ stats.total }}</span>
          <span class="stat" :class="{ connected: wsConnected }">
            {{ wsConnected ? '● 已连接' : '○ 未连接' }}
          </span>
          <span class="stat" :class="{ 'message-flash': messageFlash }">
            消息: {{ messageCount }}
          </span>
          <span class="stat last-update">
            {{ lastMessageTime ? timeSinceLastUpdate : '无消息' }}
          </span>
          <button class="memory-btn" @click="openMemoryPanel()">
            🧠 Memory 管理
          </button>
          <button
            class="refresh-btn"
            :class="{ refreshing: isRefreshing, 'animate-spin': refreshAnimation }"
            @click="refreshData"
            :disabled="isRefreshing"
            title="刷新数据 (Ctrl+R)"
          >
            {{ isRefreshing ? '⏳' : '🔄' }}
          </button>
          <button class="shortcut-btn" @click="showKeyboardHelp = true" title="键盘快捷键 (按 ?)">
            ⌨️
          </button>
          <button class="command-palette-btn" @click="openCommandPalette" title="命令面板 (Ctrl+Shift+P)">
            ⌘
          </button>
          <ThemeToggle />
          <FullscreenToggle ref="fullscreenToggle" />
          <QuickActionsMenu
            :user-settings="userSettings"
            :is-healthy="isHealthy"
            @refresh="refreshData"
            @toggle-theme="handleThemeToggle"
            @toggle-fullscreen="handleFullscreenToggle"
            @open-settings="showSettings = true"
            @open-about="showAbout = true"
            @open-keyboard-help="showKeyboardHelp = true"
          />
          <button class="settings-btn" @click="showSettings = true" title="设置 (按 ,)">
            ⚙️
          </button>
          <button class="about-btn" @click="showAbout = true" title="关于 (按 Ctrl+I)">
            ℹ️
          </button>
          <HealthStatus ref="healthStatus" />
          <WebSocketStatus />
          <SessionStats />
          <ShareViewButton />
          <CompactModeToggle />
          <SoundToggle />
          <DensityModeSelector />
          <ColumnVisibilitySelector />
          <ViewModeSelector />
          <HelpTooltip />
        </div>
      </header>

      <!-- Main Content -->
      <div class="app-content">
        <!-- Quick Filter Bar -->
        <div class="quick-filter-bar">
          <QuickFilterButtons
            :agents="agents"
            v-model="quickFilter"
            :has-tag-filter="hasTagFilter"
            :has-quick-filter="hasQuickFilter"
            @filter-change="handleQuickFilterChange"
            @clear-all="handleClearAllFilters"
          />
          <SortSelector />
        </div>

        <!-- Agent List Panel (Left) -->
        <AgentListPanel
          :agents="filteredAgents"
          :loading="loading"
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
          @view-memory="viewMemoryFromAgent"
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
      @close="showTaskPanel = false"
      @retry="retryTask"
    />

    <!-- Memory Management Panel -->
    <div v-if="showMemoryPanel" class="memory-overlay">
      <MemoryListPanel
        :selected-id="selectedMemoryId"
        @close="closeMemoryPanel"
        @select-memory="selectMemory"
      />
      <MemoryDetailPanel
        v-if="selectedMemoryId"
        :memory-id="selectedMemoryId"
        @close="selectedMemoryId = null"
      />
    </div>

    <!-- WebSocket Test Panel -->
    <WebSocketTest v-if="config.debugMode" />

    <!-- API Debug Panel -->
    <ApiDebugPanel />

    <!-- Toast Container -->
    <ToastContainer :toasts="toastList" @remove="removeToast" />

    <!-- Keyboard Help Dialog -->
    <KeyboardHelp
      :show="showKeyboardHelp"
      :shortcuts="getShortcuts()"
      @close="showKeyboardHelp = false"
    />

    <!-- About Dialog -->
    <AboutDialog
      :show="showAbout"
      @close="showAbout = false"
    />

    <!-- User Settings Dialog -->
    <UserSettings
      :show="showSettings"
      @close="showSettings = false"
      @settings-change="handleSettingsChange"
    />

    <!-- Command Palette -->
    <CommandPalette
      :is-open="commandPaletteOpen"
      :search-query="commandSearchQuery"
      :selected-index="commandSelectedIndex"
      :grouped-commands="commandGroupedCommands"
      :total-commands="commandTotalCommands"
      @update:search-query="commandSearchQuery = $event"
      @update:selected-index="commandSelectedIndex = $event"
      @close="closeCommandPalette"
      @navigate="navigateCommands"
      @execute-selected="executeCommandSelected"
    />

    <!-- Context Menu -->
    <ContextMenu />

    <!-- Performance Monitor -->
    <PerformanceMonitor ref="performanceMonitor" />

    <!-- Activity Feed -->
    <div class="activity-feed-wrapper">
      <ActivityFeed />
    </div>

    <!-- Statistics Cards -->
    <StatisticsCards :agents="agents" />

    <!-- Tag Filter Panel -->
    <TagFilterPanel
      ref="tagFilterPanel"
      :agents="agents"
      :selected-tags="selectedTags"
      :all-tags="allTags"
      :selected-count="selectedCount"
      @toggle-tag="toggleTag"
      @clear-filters="clearFilters"
    />

    <!-- Mini Map -->
    <MiniMap
      ref="miniMap"
      :agents="agents"
      :selected-agent-id="selectedAgentId"
      @select-agent="selectAgent"
    />

    <!-- Scratchpad -->
    <Scratchpad ref="scratchpad" />

    <!-- Time Display -->
    <TimeDisplay ref="timeDisplay" />

    <!-- Resource Monitor -->
    <ResourceMonitor ref="resourceMonitor" />

    <!-- Global Search -->
    <GlobalSearch ref="globalSearch" :agents="agents" @select-agent="selectAgent" />

    <!-- System Info -->
    <SystemInfo ref="systemInfo" />

    <!-- Scroll to Top Button -->
    <ScrollToTopButton />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { AgentScene } from './scene/AgentScene'
import { getWebSocketConnection, type WebSocketConnection } from './api/WebSocketConnection'
import { getAPIClient } from './api/ApiClientNew'
import { useHeaderMode } from './composables/useHeaderMode'
import HeaderModeToggle from './components/HeaderModeToggle.vue'
import ScrollToTopButton from './components/ScrollToTopButton.vue'
import { agentStore } from './store/AgentStore'
import AgentListPanel from './components/AgentListPanel.vue'
import AgentDetailPanel from './components/AgentDetailPanel.vue'
import LogPanel, { type LogEntry } from './components/LogPanel.vue'
import TaskHistoryPanel, { type Task } from './components/TaskHistoryPanel.vue'
import MemoryListPanel from './components/MemoryListPanel.vue'
import MemoryDetailPanel from './components/MemoryDetailPanel.vue'
import WebSocketTest from './components/WebSocketTest.vue'
import ApiDebugPanel from './components/ApiDebugPanel.vue'
import ToastContainer from './components/ToastContainer.vue'
import KeyboardHelp from './components/KeyboardHelp.vue'
import AboutDialog from './components/AboutDialog.vue'
import UserSettings from './components/UserSettings.vue'
import HealthStatus from './components/HealthStatus.vue'
import WebSocketStatus from './components/WebSocketStatus.vue'
import SessionStats from './components/SessionStats.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import FullscreenToggle from './components/FullscreenToggle.vue'
import QuickActionsMenu from './components/QuickActionsMenu.vue'
import DensityModeSelector from './components/DensityModeSelector.vue'
import ColumnVisibilitySelector from './components/ColumnVisibilitySelector.vue'
import ViewModeSelector from './components/ViewModeSelector.vue'
import CommandPalette from './components/CommandPalette.vue'
import ContextMenu from './components/ContextMenu.vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'
import ActivityFeed from './components/ActivityFeed.vue'
import StatisticsCards from './components/StatisticsCards.vue'
import TagFilterPanel from './components/TagFilterPanel.vue'
import MiniMap from './components/MiniMap.vue'
import Scratchpad from './components/Scratchpad.vue'
import TimeDisplay from './components/TimeDisplay.vue'
import ResourceMonitor from './components/ResourceMonitor.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import SystemInfo from './components/SystemInfo.vue'
import ShareViewButton from './components/ShareViewButton.vue'
import CompactModeToggle from './components/CompactModeToggle.vue'
import SoundToggle from './components/SoundToggle.vue'
import HelpTooltip from './components/HelpTooltip.vue'
import QuickFilterButtons from './components/QuickFilterButtons.vue'
import SortSelector from './components/SortSelector.vue'
import type { UserSettings as UserSettingsType } from '../types/userSettings'
import { useToast, toastList } from './composables/useToast'
import { useKeyboard, setupGlobalKeyboard, teardownGlobalKeyboard } from './composables/useKeyboard'
import { useNotificationManager } from './composables/useNotificationManager'
import { useCommandPalette } from './composables/useCommandPalette'
import { useTagFilter } from './composables/useTagFilter'
import { useQuickFilter, type QuickFilterType } from './composables/useQuickFilter'
import { useAgentSort } from './composables/useAgentSort'
import { useRecentAgents } from './composables/useRecentAgents'
import { useFilterPersistency } from './composables/useFilterPersistency'
import type { Command } from './composables/useCommandPalette'
import type { AgentState, SnapshotAgentData } from '../shared/types'
import { config } from './config/env'

// Header mode
const { currentMode: headerMode, getModeClass } = useHeaderMode()
const headerModeClass = getModeClass()
const isHeaderCompact = computed(() => headerMode.value === 'compact')

// Scene
const sceneContainer = ref<HTMLElement | null>(null)
const performanceMonitor = ref<InstanceType<typeof PerformanceMonitor> | null>(null)
const tagFilterPanel = ref<InstanceType<typeof import('./components/TagFilterPanel.vue').default> | null>(null)
const miniMap = ref<InstanceType<typeof import('./components/MiniMap.vue').default> | null>(null)
let scene: AgentScene | null = null

// State
const agents = ref<AgentState[]>([])
const selectedAgentId = ref<string | null>(null)
const wsConnected = ref(false)
const lastMessageTime = ref<string | null>(null)
const messageCount = ref(0)
const messageFlash = ref(false)
const logs = ref<LogEntry[]>([])
const logAgentId = ref<string | null>(null)
const showLogPanel = ref(false)
const taskAgentId = ref<string | null>(null)
const showTaskPanel = ref(false)

// Memory management state
const showMemoryPanel = ref(false)
const selectedMemoryId = ref<string | null>(null)

// Initial loading state
const isLoading = ref(true)
const loadingError = ref<string | null>(null)

// Toast notifications
const { removeToast } = useToast()

// Keyboard shortcuts
const showKeyboardHelp = ref(false)
const showAbout = ref(false)
const showSettings = ref(false)
const { registerShortcut, getShortcuts, handleKeydown } = useKeyboard()

// Refresh state
const isRefreshing = ref(false)
const refreshAnimation = ref(false)

// Auto-refresh state
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null
const userSettings = ref<UserSettingsType | null>(null)

// Notification manager
const notificationManager = useNotificationManager(userSettings)

// Loading state for agent list
const loading = ref(true)

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

// Tag filter
const {
  selectedTags,
  allTags,
  selectedCount,
  updateTags,
  toggleTag,
  isTagSelected,
  clearFilters,
  filterAgents
} = useTagFilter()

// Quick filter
const {
  activeFilter: quickFilter,
  hasActiveFilter: hasQuickFilter,
  filteredAgents: quickFilteredAgents,
  setFilter: setQuickFilter,
  clearFilter: clearQuickFilter,
  toggleFilter: toggleQuickFilter,
  getAllFilters
} = useQuickFilter(ref(agents))

// Sort
const {
  sortField,
  sortOrder,
  sortAgents
} = useAgentSort()

// Recent agents
const { addRecent: addToRecent } = useRecentAgents()

// Filter persistency - automatically saves and restores filter state
const {
  clearPersistedState,
  restoreState,
  saveState
} = useFilterPersistency(
  quickFilter,
  selectedTags,
  sortField,
  sortOrder,
  {
    enabled: true,
    onRestore: (state) => {
      console.log('Filter state restored:', state)
    },
    onSave: (state) => {
      console.log('Filter state saved:', state)
    }
  }
)

// Filtered and sorted agents (for AgentListPanel) - combines tag filter, quick filter, and sort
const filteredAgents = computed(() => {
  let result = agents.value

  // Apply tag filter first
  result = filterAgents(result)

  // Then apply quick filter
  if (quickFilter.value) {
    const allFilters = getAllFilters()
    const filter = allFilters.find(f => f.id === quickFilter.value)
    if (filter) {
      result = result.filter(filter.predicate)
    }
  }

  // Finally apply sort
  result = sortAgents(result)

  return result
})

const timeSinceLastUpdate = computed(() => {
  if (!lastMessageTime.value) return ''

  const now = new Date()
  const lastTime = new Date(lastMessageTime.value)
  const diff = now.getTime() - lastTime.getTime()

  if (diff < 1000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  return `${Math.floor(diff / 3600000)}小时前`
})

// Page title - dynamic update
const pageTitle = computed(() => {
  const { online, total } = stats
  const status = wsConnected.value ? '●' : '○'
  return `(${status} ${online}/${total}) Agent Dashboard`
})

// Update document title when relevant state changes
watch([pageTitle, selectedAgent], ([newTitle]) => {
  document.title = newTitle
}, { immediate: true })

// Favicon - dynamic update based on connection status
const updateFavicon = (connected: boolean): void => {
  // Create SVG favicon with connection status
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="${connected ? '12' : '10'}" fill="${connected ? '#22c55e' : 'none'}" stroke="${connected ? '#22c55e' : '#64748b'}" stroke-width="${connected ? '0' : '3'}"/>
    </svg>
  `.trim()

  const faviconUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = faviconUrl
}

// Watch connection status and update favicon
watch(wsConnected, (connected) => {
  updateFavicon(connected)
}, { immediate: true })

// Update performance monitor with agent count
watch(agents, (newAgents) => {
  if (performanceMonitor.value) {
    performanceMonitor.value.setAgentCount(newAgents.length)
  }
  // Update tag filter
  updateTags(newAgents)
  // Update mini map
  if (miniMap.value) {
    miniMap.value.update()
  }
}, { immediate: true })

// WebSocket
let ws: WebSocketConnection | null = null

// Methods
const selectAgent = (agentId: string): void => {
  selectedAgentId.value = agentId
  if (scene) {
    scene.setFocusedZone(agentId)
  }
  // Add to recent agents
  addToRecent(agentId)
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
  // TaskHistoryPanel will load tasks from API on mount
}

const pauseAgent = async (agentId: string): Promise<void> => {
  const { success, error } = useToast()

  try {
    const api = getAPIClient()

    // Find the agent to determine if we should pause or resume
    const agent = agents.value.find(a => a.agentId === agentId)
    if (!agent) return

    // If already paused, resume; otherwise pause
    if (agent.status === 'paused') {
      await api.resumeAgent(agentId)
      success(`Agent ${agent.role || agentId} 已恢复运行`)
    } else {
      await api.pauseAgent(agentId)
      success(`Agent ${agent.role || agentId} 已暂停`)
    }

    // The agent state will be updated via WebSocket
  } catch (err) {
    console.error('Failed to pause/resume agent:', err)
    error('操作失败，请稍后重试')
  }
}

const exportLogs = (logsToExport: LogEntry[]): void => {
  const { success } = useToast()

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

  success('日志已导出')
}

const retryTask = (task: Task): void => {
  console.log('Retrying task:', task.taskId)
  // In a real app, this would call the API to retry the task
}

// Memory management methods
const openMemoryPanel = (memoryId?: string) => {
  selectedMemoryId.value = memoryId || null
  showMemoryPanel.value = true
}

const closeMemoryPanel = (): void => {
  showMemoryPanel.value = false
  selectedMemoryId.value = null
}

const selectMemory = (memoryId: string): void => {
  selectedMemoryId.value = memoryId
}

const viewMemoryFromAgent = (memoryId: string): void => {
  selectedMemoryId.value = memoryId
  showMemoryPanel.value = true
}

const retryLoad = (): void => {
  loadingError.value = null
  isLoading.value = true
  // Reload the page to retry initialization
  window.location.reload()
}

// Manual data refresh
const refreshData = async (): Promise<void> => {
  const { success, error: showError } = useToast()

  isRefreshing.value = true
  refreshAnimation.value = true
  loading.value = true

  try {
    const api = getAPIClient()

    // Fetch latest snapshot
    console.log('Refreshing agent data...')
    const snapshot = await api.getLatestSnapshot()

    if (snapshot) {
      console.log('Refreshed snapshot with', snapshot.data.agents.length, 'agents')

      // Convert SnapshotAgentData[] to AgentState[]
      agents.value = snapshot.data.agents.map(agent => ({
        agentId: agent.agentId,
        serverId: agent.serverId,
        framework: agent.framework,
        language: agent.language,
        status: agent.status,
        currentActivity: agent.currentActivity,
        currentTool: agent.currentTool,
        currentTaskId: agent.currentTaskId,
        memoryId: agent.memoryId,
        role: agent.role,
        lastActivity: agent.lastActivity,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))

      // Update AgentStore
      agentStore.clear()
      agents.value.forEach(agent => {
        agentStore.update(agent, snapshot.createdAt)
      })

      // Update 3D scene
      if (scene) {
        // Remove old zones and create new ones
        agents.value.forEach((agent, index) => {
          scene.createAgentZone(agent.agentId, index)
          scene.updateAgentStatus(agent.agentId, agent.status as any)
        })
      }

      console.log('Refresh complete:', agents.value.length, 'agents')
      success(`数据已刷新，共 ${agents.value.length} 个 Agent`)
    }
  } catch (err) {
    console.error('Failed to refresh data:', err)
    showError('数据刷新失败，请稍后重试')
  } finally {
    isRefreshing.value = false
    loading.value = false
    setTimeout(() => {
      refreshAnimation.value = false
    }, 500)
  }
}

// Auto-refresh functions
const startAutoRefresh = (interval: number): void => {
  stopAutoRefresh()
  console.log('Starting auto-refresh with interval:', interval)
  autoRefreshTimer = setInterval(() => {
    if (!isRefreshing.value) {
      console.log('Auto-refreshing data...')
      refreshData()
    }
  }, interval)
}

const stopAutoRefresh = (): void => {
  if (autoRefreshTimer) {
    console.log('Stopping auto-refresh')
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

// Load user settings from localStorage
const loadUserSettings = (): void => {
  const saved = localStorage.getItem('userSettings')
  if (saved) {
    try {
      userSettings.value = JSON.parse(saved)
      // Apply auto-refresh if enabled
      if (userSettings.value?.autoRefresh && userSettings.value?.refreshInterval) {
        startAutoRefresh(userSettings.value.refreshInterval)
      }
    } catch (e) {
      console.error('Failed to parse user settings:', e)
    }
  }
}

// Handle settings changes
const handleSettingsChange = (settings: UserSettingsType): void => {
  const { success } = useToast()
  console.log('Settings changed:', settings)

  // Update user settings ref
  userSettings.value = settings

  // Apply debug mode
  config.debugMode = settings.debugMode

  // Apply auto-refresh
  if (settings.autoRefresh && settings.refreshInterval) {
    startAutoRefresh(settings.refreshInterval)
    console.log('Auto-refresh enabled with interval:', settings.refreshInterval)
  } else {
    stopAutoRefresh()
    console.log('Auto-refresh disabled')
  }

  // Apply WS logging
  // This would require updating the WebSocket connection

  success('设置已保存')
}

// Handle theme toggle from QuickActionsMenu
const handleThemeToggle = (): void => {
  const themeElement = document.querySelector('.theme-toggle') as HTMLElement
  if (themeElement) {
    themeElement.click()
  }
}

// Handle fullscreen toggle from QuickActionsMenu
const handleFullscreenToggle = (): void => {
  const fullscreenElement = document.querySelector('.fullscreen-toggle') as HTMLElement
  if (fullscreenElement) {
    fullscreenElement.click()
  }
}

// Handle quick filter change
const handleQuickFilterChange = (filter: any): void => {
  console.log('Quick filter changed:', filter)
  // The filter is already applied via the computed property
}

// Computed property to check if tag filter is active
const hasTagFilter = computed(() => {
  return selectedTags.value && selectedTags.value.length > 0
})

// Handle clear all filters
const handleClearAllFilters = (): void => {
  // Clear quick filter
  clearQuickFilter()
  // Clear tag filter
  if (selectedTags.value) {
    selectedTags.value = []
  }
  // Clear persisted state
  clearPersistedState()
  info('已清除所有过滤器和持久化状态')
}

// Command Palette Setup
// Define all available commands (must be after all handler functions are defined)
const commands: Command[] = [
  // Data operations
  {
    id: 'refresh',
    label: '刷新数据',
    description: '重新加载所有 Agent 数据',
    icon: '🔄',
    category: '数据操作',
    shortcut: 'Ctrl+R',
    keywords: ['reload', 'update', 'sync'],
    action: () => refreshData()
  },
  {
    id: 'settings-auto-refresh',
    label: '切换自动刷新',
    description: '启用/禁用自动数据刷新',
    icon: '🔁',
    category: '数据操作',
    keywords: ['auto', 'toggle', 'interval'],
    action: () => { showSettings.value = true }
  },
  {
    id: 'clear-all-filters',
    label: '清除所有过滤器',
    description: '清除所有过滤器和持久化状态',
    icon: '🗑️',
    category: '数据操作',
    keywords: ['clear', 'reset', 'filter', 'clean'],
    action: () => handleClearAllFilters()
  },

  // View
  {
    id: 'toggle-theme',
    label: '切换主题',
    description: '切换深色/浅色/自动主题',
    icon: '🌙',
    category: '视图',
    shortcut: '🌙/☀️',
    keywords: ['dark', 'light', 'theme', 'color'],
    action: () => handleThemeToggle()
  },
  {
    id: 'fullscreen',
    label: '全屏模式',
    description: '切换全屏显示',
    icon: '⛶',
    category: '视图',
    shortcut: 'F11',
    keywords: ['fullscreen', 'fullscreen'],
    action: () => handleFullscreenToggle()
  },

  // Tools
  {
    id: 'keyboard-shortcuts',
    label: '键盘快捷键',
    description: '查看所有键盘快捷键',
    icon: '⌨️',
    category: '工具',
    shortcut: '?',
    keywords: ['help', 'shortcuts', 'keys', 'hotkeys'],
    action: () => { showKeyboardHelp.value = true }
  },
  {
    id: 'settings',
    label: '用户设置',
    description: '打开用户设置面板',
    icon: '⚙️',
    category: '工具',
    shortcut: ',',
    keywords: ['preferences', 'config', 'options'],
    action: () => { showSettings.value = true }
  },
  {
    id: 'about',
    label: '关于',
    description: '查看应用信息',
    icon: 'ℹ️',
    category: '工具',
    shortcut: 'Ctrl+I',
    keywords: ['info', 'version', 'about'],
    action: () => { showAbout.value = true }
  },

  // System
  {
    id: 'health',
    label: '系统状态',
    description: '查看系统健康状态',
    icon: '✓',
    category: '系统',
    keywords: ['health', 'status', 'system'],
    action: () => {
      const healthElement = document.querySelector('.health-status') as HTMLElement
      if (healthElement) healthElement.click()
    }
  },
  {
    id: 'session-stats',
    label: '会话统计',
    description: '查看会话统计信息',
    icon: '📊',
    category: '系统',
    keywords: ['stats', 'session', 'statistics'],
    action: () => {
      const statsElement = document.querySelector('.session-stats') as HTMLElement
      if (statsElement) statsElement.click()
    }
  },

  // Memory
  {
    id: 'memory-panel',
    label: 'Memory 管理',
    description: '打开 Memory 管理面板',
    icon: '🧠',
    category: 'Memory',
    keywords: ['memory', 'manage', 'panel'],
    action: () => openMemoryPanel()
  }
]

const {
  isOpen: commandPaletteOpen,
  searchQuery: commandSearchQuery,
  selectedIndex: commandSelectedIndex,
  groupedCommands: commandGroupedCommands,
  totalCommands: commandTotalCommands,
  open: openCommandPalette,
  close: closeCommandPalette,
  executeSelected: executeCommandSelected,
  navigate: navigateCommands
} = useCommandPalette(commands)

// Initialize scene
onMounted(async () => {
  if (!sceneContainer.value) return

  // Load user settings first (including auto-refresh)
  loadUserSettings()

  // Create 3D scene
  scene = new AgentScene(sceneContainer.value)

  // Initialize agents array
  agents.value = []

  // Load agents from backend API (snapshot + delta sync)
  try {
    const api = getAPIClient()

    // First, try to get the latest snapshot
    console.log('Fetching agent snapshot from backend...')
    const snapshot = await api.getLatestSnapshot()

    if (snapshot) {
      console.log('Loaded snapshot with', snapshot.data.agents.length, 'agents')

      // Convert SnapshotAgentData[] to AgentState[]
      agents.value = snapshot.data.agents.map(agent => ({
        agentId: agent.agentId,
        serverId: agent.serverId,
        framework: agent.framework,
        language: agent.language,
        status: agent.status,
        currentActivity: agent.currentActivity,
        currentTool: agent.currentTool,
        currentTaskId: agent.currentTaskId,
        memoryId: agent.memoryId,
        role: agent.role,
        lastActivity: agent.lastActivity,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))

      // Update AgentStore with snapshot
      agentStore.clear()
      agents.value.forEach(agent => {
        agentStore.update(agent, snapshot.createdAt)
      })

      // Get delta events after snapshot
      console.log('Fetching delta events since snapshot seq:', snapshot.seq)
      try {
        const deltaEvents = await api.getEventsSince(snapshot.seq)
        if (deltaEvents && deltaEvents.events && deltaEvents.events.length > 0) {
          console.log('Applying', deltaEvents.events.length, 'delta events')
          // Apply delta events to update agents
          deltaEvents.events.forEach(event => {
            if (event.type === 'agent_update' && event.data) {
              const idx = agents.value.findIndex(a => a.agentId === event.data.agentId)
              if (idx !== -1) {
                agents.value[idx] = { ...agents.value[idx], ...event.data }
                agentStore.update(agents.value[idx], event.timestamp)
              }
            }
          })
        } else {
          console.log('No delta events to apply')
        }
      } catch (deltaError) {
        console.warn('Failed to fetch delta events:', deltaError)
        // Continue without delta events - not critical
      }
    } else {
      console.log('No snapshot available, fetching agents via API...')
      // Fallback: get agents via regular API
      agents.value = await api.getAgents()
      agents.value.forEach(agent => {
        agentStore.update(agent, new Date().toISOString())
      })
    }

    // Initialize notification manager with current agent states
    notificationManager.initializeAgentStates(agents.value)

    // Create agent zones in 3D scene after all data loaded
    agents.value.forEach((agent, index) => {
      if (scene) {
        scene.createAgentZone(agent.agentId, index)
        scene.updateAgentStatus(agent.agentId, agent.status as any)
      }
    })

    console.log('Initial agent load complete:', agents.value.length, 'agents')
    // Loading complete
    isLoading.value = false
    loading.value = false
  } catch (error) {
    console.error('Failed to load agents from backend:', error)

    // Check if mock data is enabled
    if (config.development.useMockData) {
      console.warn('Falling back to mock data')
      const mockAgents: AgentState[] = Array.from({ length: config.development.mockAgentsCount }, (_, i) => {
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

      agents.value = mockAgents
      mockAgents.forEach((agent, index) => {
        if (scene) {
          scene.createAgentZone(agent.agentId, index)
          scene.updateAgentStatus(agent.agentId, agent.status)
        }
        agentStore.update(agent, new Date().toISOString())
      })
      // Loading complete with mock data
      isLoading.value = false
      loading.value = false
    } else {
      // No mock data fallback - show error
      loadingError.value = error instanceof Error ? error.message : '无法连接到后端服务'
      loading.value = false
    }
  }

  // Setup WebSocket
  ws = getWebSocketConnection()
  ws.connect().catch(err => {
    console.error('WebSocket connection failed:', err)
  })

  // Setup keyboard shortcuts
  setupGlobalKeyboard(handleKeydown)

  // Register shortcuts
  registerShortcut({
    key: '?',
    description: '显示/隐藏快捷键帮助',
    handler: () => {
      showKeyboardHelp.value = !showKeyboardHelp.value
    },
  })

  // Command Palette shortcut (Ctrl+Shift+P)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      openCommandPalette()
    }
  })

  registerShortcut({
    key: 'escape',
    description: '关闭当前面板 / 退出全屏',
    handler: () => {
      // If in fullscreen mode, let browser handle it natively
      if (document.fullscreenElement) {
        return
      }
      // Close panels in reverse order of priority
      if (showKeyboardHelp.value) {
        showKeyboardHelp.value = false
      } else if (showAbout.value) {
        showAbout.value = false
      } else if (showSettings.value) {
        showSettings.value = false
      } else if (selectedAgentId.value) {
        closeDetailPanel()
      } else if (showTaskPanel.value) {
        showTaskPanel.value = false
      } else if (showLogPanel.value) {
        showLogPanel.value = false
      } else if (showMemoryPanel.value) {
        closeMemoryPanel()
      }
    },
  })

  // F11 key for fullscreen (alternative to Ctrl+F)
  const handleF11 = (e: KeyboardEvent) => {
    if (e.key === 'F11') {
      e.preventDefault()
      const fullscreenElement = document.querySelector('.fullscreen-toggle') as HTMLElement
      if (fullscreenElement) {
        fullscreenElement.click()
      }
    }
  }

  window.addEventListener('keydown', handleF11)

  // Store for cleanup

  registerShortcut({
    key: 'l',
    ctrl: true,
    description: '打开选中 Agent 的日志',
    handler: () => {
      if (selectedAgentId.value) {
        viewLogs(selectedAgentId.value)
      }
    },
  })

  registerShortcut({
    key: 't',
    ctrl: true,
    description: '打开选中 Agent 的任务历史',
    handler: () => {
      if (selectedAgentId.value) {
        viewTasks(selectedAgentId.value)
      }
    },
  })

  registerShortcut({
    key: 'p',
    ctrl: true,
    description: '暂停/恢复选中的 Agent',
    handler: () => {
      if (selectedAgentId.value) {
        pauseAgent(selectedAgentId.value)
      }
    },
  })

  registerShortcut({
    key: 'm',
    ctrl: true,
    description: '打开 Memory 管理面板',
    handler: () => {
      openMemoryPanel()
    },
  })

  registerShortcut({
    key: 'r',
    ctrl: true,
    description: '刷新数据',
    handler: () => {
      refreshData()
    },
  })

  registerShortcut({
    key: 'i',
    ctrl: true,
    description: '打开关于对话框',
    handler: () => {
      showAbout.value = !showAbout.value
    },
  })

  registerShortcut({
    key: ',',
    description: '打开用户设置',
    handler: () => {
      showSettings.value = !showSettings.value
    },
  })

  registerShortcut({
    key: 'f',
    ctrl: true,
    description: '切换全屏模式 (Ctrl+F)',
    handler: () => {
      // Trigger fullscreen toggle via the component
      const fullscreenElement = document.querySelector('.fullscreen-toggle') as HTMLElement
      if (fullscreenElement) {
        fullscreenElement.click()
      }
    },
  })

  const unsubscribe = ws.onMessage((message) => {
    console.log('WebSocket message:', message)

    // Update activity tracking
    lastMessageTime.value = new Date().toISOString()
    messageCount.value++

    // Track WebSocket message in session stats
    fetch('http://localhost:8080/api/stats/websocket-message', { method: 'POST' }).catch(() => {
      // Silently fail - stats are not critical
    })

    // Trigger flash animation
    messageFlash.value = true
    setTimeout(() => {
      messageFlash.value = false
    }, 300)

    // Handle agent_update messages from backend
    if ((message as Record<string, unknown>).type === 'agent_update') {
      const msg = message as { type: string; data: AgentState; timestamp: string }
      const agentState = msg.data

      // Find existing agent for notification
      const existingAgent = agents.value.find(a => a.agentId === agentState.agentId)

      // Update AgentStore
      if (agentStore.update(agentState, msg.timestamp)) {
        // Update local agents array
        agents.value = agentStore.getAll()

        // Handle notifications (before updating scene)
        if (existingAgent) {
          notificationManager.handleAgentUpdate(
            agentState.agentId,
            { status: agentState.status, error: agentState.lastError }
          )

          // Record agent state change in session stats
          if (existingAgent.status !== agentState.status) {
            fetch('http://localhost:8080/api/stats/agent-change', { method: 'POST' }).catch(() => {
              // Silently fail - stats are not critical
            })
          }
        }

        // Update 3D scene
        if (scene) {
          // Check if this is a new agent or status change
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
    teardownGlobalKeyboard(handleKeydown)
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
  teardownGlobalKeyboard(handleKeydown)
  // Cleanup auto-refresh timer
  stopAutoRefresh()
  // Cleanup F11 event listener
  window.removeEventListener('keydown', handleF11)
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
  transition: all 0.3s ease;
}

/* Compact Header Mode */
.app-header.header-compact {
  padding: 8px 16px;
}

.app-header.header-compact h1 {
  font-size: 16px;
}

.app-header.header-compact .header-stats {
  gap: 12px;
}

.app-header.header-compact .header-stats.is-compact {
  display: none;
}

.app-header.header-compact .stat {
  font-size: 11px;
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

.stat.message-flash {
  animation: flash 300ms ease-out;
  color: #3b82f6;
}

@keyframes flash {
  0% {
    background-color: rgba(59, 130, 246, 0.3);
    padding: 4px 8px;
    border-radius: 4px;
  }
  100% {
    background-color: transparent;
    padding: 0;
  }
}

.memory-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.memory-btn:hover {
  background: rgba(139, 92, 246, 0.4);
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn.refreshing {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s linear infinite;
}

.shortcut-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.command-palette-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.command-palette-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  transform: scale(1.05);
}

.about-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.settings-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
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

/* Memory Overlay */
.memory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  pointer-events: auto;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.loading-content {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(148, 163, 184, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #94a3b8;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.loading-error {
  margin-top: 24px;
  padding: 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}

.loading-error .error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.loading-error .error-message {
  color: #fca5a5;
  font-size: 14px;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: rgba(239, 68, 68, 0.5);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Quick Filter Bar */
.quick-filter-bar {
  pointer-events: auto;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

/* Activity Feed Wrapper */
.activity-feed-wrapper {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  max-width: calc(100vw - 40px);
  z-index: 800;
}

@media (max-width: 768px) {
  .activity-feed-wrapper {
    top: auto;
    bottom: 80px;
    right: 20px;
    width: 300px;
  }
}
</style>
