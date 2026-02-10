<template>
  <div class="agent-detail-panel">
    <div v-if="agent" class="panel-scroll-container" ref="panelScrollRef">
      <div class="panel-content">
        <!-- Scroll to top button -->
        <transition name="scroll-to-top">
          <button
            v-show="showScrollToTop"
            class="scroll-to-top-btn"
            @click="scrollToTop"
            title="回到顶部 (按 Home 键)"
          >
            ↑
          </button>
        </transition>

        <!-- Header -->
        <div class="panel-header">
        <div class="agent-title">
          <h2>{{ agent.role || agent.agentId }}</h2>
          <span :class="['status-badge', agent.status]">
            {{ statusText }}
          </span>
        </div>
        <div class="header-actions">
          <CopyMenu
            v-if="agent"
            :data="agent"
            @copied="handleCopySuccess"
          />
          <button ref="closeBtnRef" class="close-btn" @click="closePanelAndRestoreFocus" title="关闭面板 (按 Esc 键)">×</button>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="info-grid">
        <div class="info-card">
          <div class="label">框架</div>
          <div class="value-with-copy">
            <div class="value">{{ agent.framework || '-' }}</div>
            <button
              v-if="agent.framework"
              class="copy-mini-btn"
              @click="copyToClipboard(agent.framework, '框架')"
              title="复制框架信息"
            >📋</button>
          </div>
        </div>
        <div class="info-card">
          <div class="label">语言</div>
          <div class="value-with-copy">
            <div class="value">{{ agent.language || '-' }}</div>
            <button
              v-if="agent.language"
              class="copy-mini-btn"
              @click="copyToClipboard(agent.language, '语言')"
              title="复制语言信息"
            >📋</button>
          </div>
        </div>
        <div class="info-card">
          <div class="label">Agent ID</div>
          <div class="value-with-copy">
            <div class="value monospace">{{ agent.agentId.slice(0, 8) }}...</div>
            <button
              class="copy-mini-btn"
              @click="copyToClipboard(agent.agentId, 'Agent ID')"
              title="复制 Agent ID (按 C 键)"
            >📋</button>
          </div>
        </div>
        <div class="info-card">
          <div class="label">服务器</div>
          <div class="value-with-copy">
            <div class="value">{{ agent.serverId }}</div>
            <button
              class="copy-mini-btn"
              @click="copyToClipboard(agent.serverId, '服务器 ID')"
              title="复制服务器 ID"
            >📋</button>
          </div>
        </div>
      </div>

      <!-- Runtime Statistics -->
      <div class="section">
        <h3>运行统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-label">运行时长</div>
              <div class="stat-value">{{ runtimeDuration }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-label">当前状态</div>
              <div class="stat-value status-indicator" :class="agent.status">
                {{ statusText }}
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🕐</div>
            <div class="stat-info">
              <div class="stat-label">距离上次活动</div>
              <div class="stat-value">{{ timeSinceLastActivity }}</div>
            </div>
          </div>
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

      <!-- Notes -->
      <div class="section">
        <AgentNotes :agent="agent" />
      </div>

      <!-- Status History Timeline -->
      <div class="section">
        <StatusTimeline
          :agent-id="agent.agentId"
          @clear-history="handleClearStatusHistory"
        />
      </div>

      <!-- Tags -->
      <div class="section">
        <div class="section-header">
          <h3>标签</h3>
          <div class="section-header-actions">
            <span v-if="hasUnsavedTags" class="unsaved-badge">未保存</span>
            <button
              v-if="!editingTags"
              class="edit-btn"
              @click="startEditingTags"
              title="编辑标签 (按 T 键)"
            >
              ✏️ 编辑
            </button>
          </div>
        </div>

        <div v-if="!editingTags && parsedTags.length > 0" class="tags-display" @click="startEditingTags" title="点击编辑标签 (按 T 键)">
          <span
            v-for="tag in parsedTags"
            :key="tag"
            :class="['tag-item', getTagColor(tag)]"
          >
            {{ tag }}
          </span>
        </div>

        <div v-else-if="!editingTags" class="tags-empty" @click="startEditingTags" title="点击添加标签 (按 T 键)">
          点击添加标签...
        </div>

        <div v-else class="tags-edit">
          <div class="tags-input-row">
            <input
              ref="tagInputRef"
              v-model="newTag"
              :class="['tag-input', { 'has-unsaved-changes': hasUnsavedTags }]"
              placeholder="输入标签... (按 Enter 添加)"
              @keydown.enter="addTag"
              @keydown.backspace="handleBackspace"
            />
            <button class="tag-add-btn" @click="addTag" title="添加标签 (按 Enter 键)">添加</button>
          </div>
          <div class="tags-list">
            <span
              v-for="(tag, index) in localTags"
              :key="index"
              :class="['tag-item', 'editable', getTagColor(tag)]"
            >
              {{ tag }}
              <button class="tag-remove" @click="removeTag(index)" title="删除标签">×</button>
            </span>
          </div>
          <div class="tags-actions">
            <button class="tags-btn save" @click="saveTags" title="保存标签修改">保存</button>
            <button class="tags-btn cancel" @click="cancelEditingTags" title="取消编辑 (按 Esc)">取消</button>
          </div>
        </div>
      </div>

      <!-- Memory Info -->
      <div v-if="agent.memoryId" class="section">
        <h3>关联 Memory</h3>
        <div class="memory-box clickable" @click="$emit('viewMemory', agent.memoryId)" title="点击查看 Memory 详情">
          <div class="memory-icon">🧠</div>
          <div class="memory-info">
            <div class="memory-id monospace">{{ agent.memoryId.slice(0, 16) }}...</div>
            <div class="memory-hint">点击查看详情 →</div>
          </div>
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
        <button class="action-btn primary" @click="viewLogs" title="查看 Agent 运行日志">查看日志</button>
        <button class="action-btn" @click="viewTasks" title="查看 Agent 任务执行历史">任务历史</button>
        <button class="action-btn danger" @click="pauseAgent" :title="isPaused ? '恢复 Agent 运行' : '暂停 Agent 运行'">{{ isPaused ? '恢复' : '暂停' }}</button>
      </div>

      <!-- Keyboard Shortcuts Hint -->
      <div class="shortcuts-hint">
        <span class="shortcut-hint">
          <kbd>C</kbd> 复制ID
        </span>
        <span class="shortcut-hint">
          <kbd>F</kbd> 收藏
        </span>
        <span class="shortcut-hint">
          <kbd>N</kbd> 备注
        </span>
        <span class="shortcut-hint">
          <kbd>T</kbd> 标签
        </span>
        <span class="shortcut-hint">
          <kbd>Esc</kbd> 关闭
        </span>
      </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🤖</div>
      <div class="empty-text">选择一个 Agent 查看详情</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { AgentState } from '../../shared/types'
import { useToast } from '../composables/useToast'
import { useKeyboard } from '../composables/useKeyboard'
import { useFavoriteAgents } from '../composables/useFavoriteAgents'
import { clearAgentStatusHistory } from '../composables/useAgentStatusHistory'
import CopyMenu from './CopyMenu.vue'
import AgentNotes from './AgentNotes.vue'
import StatusTimeline from './StatusTimeline.vue'

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
  viewMemory: [memoryId: string]
}>()

// Scroll to top functionality
const panelScrollRef = ref<HTMLElement | null>(null)
const closeBtnRef = ref<HTMLButtonElement | null>(null)
const showScrollToTop = ref(false)
const previousActiveElement = ref<HTMLElement | null>(null)

// Scroll to top
const scrollToTop = (): void => {
  if (panelScrollRef.value) {
    panelScrollRef.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

// Handle scroll event
const handleScroll = (): void => {
  if (panelScrollRef.value) {
    const scrollTop = panelScrollRef.value.scrollTop
    showScrollToTop.value = scrollTop > 200
  }
}

// Handle clear status history
const handleClearStatusHistory = (): void => {
  if (props.agent) {
    clearAgentStatusHistory(props.agent.agentId)
    success('状态历史记录已清除')
  }
}

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

// Calculate runtime duration
const runtimeDuration = computed(() => {
  if (!props.agent) return '-'
  const created = new Date(props.agent.createdAt)
  const now = new Date()
  const diff = now.getTime() - created.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟`
  return '不到 1 分钟'
})

// Calculate active percentage (simulated)
const activePercentage = computed(() => {
  if (!props.agent) return 0
  // This is a simplified calculation - in real app, track actual active time
  const created = new Date(props.agent.createdAt)
  const now = new Date()
  const totalAge = now.getTime() - created.getTime()
  if (totalAge < 60000) return 100 // Less than 1 minute
  return Math.min(95, Math.max(5, 100 - Math.floor(totalAge / (1000 * 60 * 30)))) // Decays over time
})

// Mock update count (in real app, this would come from backend)
const updateCount = computed(() => {
  if (!props.agent) return 0
  const created = new Date(props.agent.createdAt)
  const now = new Date()
  const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  return Math.floor(hours * 2) + Math.floor(Math.random() * 5)
})

// Time since last activity
const timeSinceLastActivity = computed(() => {
  if (!props.agent) return '-'
  const lastActivity = new Date(props.agent.lastActivity)
  const now = new Date()
  const diff = now.getTime() - lastActivity.getTime()

  if (diff < 1000) return '刚刚'
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
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

// Tags editing
const editingTags = ref(false)
const localTags = ref<string[]>([])
const newTag = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)

// Parse tags from JSON string
const parsedTags = computed(() => {
  if (!props.agent?.tags) return []
  try {
    return JSON.parse(props.agent.tags)
  } catch {
    return []
  }
})

// Check if tags have unsaved changes
const hasUnsavedTags = computed(() => {
  if (!props.agent) return false
  if (!editingTags.value) return false

  const originalTags = parsedTags.value.sort()
  const currentTags = [...localTags.value].sort()

  if (originalTags.length !== currentTags.length) return true
  return !originalTags.every((tag, index) => tag === currentTags[index])
})

// Check if there are any unsaved changes
const hasUnsavedChanges = computed(() => {
  return hasUnsavedTags.value
})

// Get color for tag based on its content
const getTagColor = (tag: string): string => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const startEditingTags = (): void => {
  localTags.value = [...parsedTags.value]
  editingTags.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const cancelEditingTags = (): void => {
  editingTags.value = false
  localTags.value = []
  newTag.value = ''
}

const addTag = (): void => {
  const trimmed = newTag.value.trim()
  if (trimmed && !localTags.value.includes(trimmed)) {
    localTags.value.push(trimmed)
    newTag.value = ''
  }
}

const removeTag = (index: number): void => {
  localTags.value.splice(index, 1)
}

const handleBackspace = (): void => {
  if (newTag.value === '' && localTags.value.length > 0) {
    localTags.value.pop()
  }
}

const saveTags = async (): Promise<void> => {
  if (!props.agent) return

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const tagsJson = JSON.stringify(localTags.value)

    const response = await fetch(`${apiUrl}/api/agents/${props.agent.agentId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tagsJson })
    })

    if (!response.ok) {
      throw new Error('保存标签失败')
    }

    // Update local agent state
    if (props.agent) {
      props.agent.tags = tagsJson
    }

    editingTags.value = false
    newTag.value = ''
    success('标签已保存')
  } catch (error) {
    console.error('Save tags failed:', error)
  }
}

// Copy to clipboard
const copyToClipboard = async (text: string, label: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    success(`已复制${label}: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`)
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

// Handle copy success from CopyMenu
const handleCopySuccess = (format: string, text: string): void => {
  const formatNames: Record<string, string> = {
    text: '纯文本',
    json: 'JSON',
    csv: 'CSV',
    markdown: 'Markdown'
  }
  success(`已复制为 ${formatNames[format] || format}`)
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

// Toggle favorite from keyboard
const { success } = useToast()
const { toggleFavorite: toggleFavoriteLocalStorage, isFavorite: isLocalStorageFavorite } = useFavoriteAgents()

const toggleFavoriteShortcut = (): void => {
  if (props.agent) {
    const newStatus = !props.agent.isFavorite
    props.agent.isFavorite = newStatus

    // Also sync with localStorage
    toggleFavoriteLocalStorage(props.agent.agentId)

    // TODO: Call API to update favorite status
    success(newStatus ? '已添加到收藏' : '已取消收藏')
  }
}

// Sync favorite status from localStorage when agent changes
watch(() => props.agent?.agentId, (agentId) => {
  if (agentId && props.agent) {
    // Update isFavorite based on localStorage
    props.agent.isFavorite = isLocalStorageFavorite(agentId)
  }
}, { immediate: true })

// Register keyboard shortcuts
const { registerShortcut } = useKeyboard()

onMounted(() => {
  // Store the previously focused element
  previousActiveElement.value = document.activeElement as HTMLElement

  // Focus the close button after panel opens
  nextTick(() => {
    if (closeBtnRef.value) {
      closeBtnRef.value.focus()
    }
  })

  // Register shortcuts when panel is open
  if (props.agent) {
    registerShortcut({
      key: 'c',
      description: '复制 Agent ID',
      handler: () => {
        if (props.agent) {
          copyToClipboard(props.agent.agentId, 'Agent ID')
        }
      },
    })

    registerShortcut({
      key: 'f',
      description: '收藏/取消收藏',
      handler: () => {
        toggleFavoriteShortcut()
      },
    })

    registerShortcut({
      key: 't',
      description: '编辑标签',
      handler: () => {
        if (props.agent && !editingTags.value) {
          startEditingTags()
        }
      },
    })

    registerShortcut({
      key: 'escape',
      description: '关闭详情面板',
      handler: () => {
        closePanelAndRestoreFocus()
      },
    })

    registerShortcut({
      key: 'home',
      description: '滚动到顶部',
      handler: () => {
        scrollToTop()
      },
    })
  }

  // Add scroll listener
  nextTick(() => {
    if (panelScrollRef.value) {
      panelScrollRef.value.addEventListener('scroll', handleScroll)
    }
  })
})

onUnmounted(() => {
  // Restore focus to the previously focused element
  if (previousActiveElement.value) {
    previousActiveElement.value.focus()
  }

  // Remove scroll listener
  if (panelScrollRef.value) {
    panelScrollRef.value.removeEventListener('scroll', handleScroll)
  }
})

// Close panel and restore focus
const closePanelAndRestoreFocus = (): void => {
  // Store the previous active element before closing
  const currentFocus = document.activeElement as HTMLElement

  emit('close')

  // Restore focus after panel closes
  nextTick(() => {
    if (previousActiveElement.value && currentFocus === closeBtnRef.value) {
      previousActiveElement.value.focus()
    }
  })
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
  overflow: hidden;
}

.panel-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scroll-behavior: smooth;
}

.panel-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.panel-scroll-container::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.panel-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.panel-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.panel-content {
  padding: 20px;
  padding-bottom: 40px;
}

/* Scroll to top button */
.scroll-to-top-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.scroll-to-top-btn:hover {
  background: rgba(59, 130, 246, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.scroll-to-top-btn:active {
  transform: translateY(0);
}

/* Scroll to top transition */
.scroll-to-top-enter-active,
.scroll-to-top-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-to-top-enter-from,
.scroll-to-top-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.close-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
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

.value-with-copy {
  display: flex;
  align-items: center;
  gap: 6px;
}

.value-with-copy .value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-mini-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.copy-mini-btn:hover {
  background: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  transform: scale(1.1);
}

.copy-mini-btn:active {
  transform: scale(0.95);
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

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value.status-indicator {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.stat-value.status-indicator.online { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.stat-value.status-indicator.ready { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.stat-value.status-indicator.busy { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.stat-value.status-indicator.thinking { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.stat-value.status-indicator.offline { background: rgba(100, 116, 139, 0.2); color: #6b7280; }
.stat-value.status-indicator.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.stat-value.status-indicator.paused { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

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

.memory-box.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.memory-box.clickable:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(59, 130, 246, 0.4);
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

.memory-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memory-hint {
  font-size: 11px;
  color: #3b82f6;
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

.action-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
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

/* Notes Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unsaved-badge {
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #f59e0b;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.edit-btn {
  padding: 4px 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

.edit-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Tags Section */
.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
}

.tags-empty {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  color: #64748b;
  font-style: italic;
  cursor: pointer;
  transition: all 0.2s;
}

.tags-empty:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(100, 116, 139, 0.4);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.tag-item.blue {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.tag-item.green {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.tag-item.purple {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.tag-item.orange {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.tag-item.pink {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.tag-item.cyan {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

.tags-edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tags-input-row {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.tag-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.tag-input.has-unsaved-changes {
  border-color: rgba(245, 158, 11, 0.6);
  background: rgba(245, 158, 11, 0.05);
}

.tag-input.has-unsaved-changes:focus {
  border-color: rgba(245, 158, 11, 0.8);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}

.tag-add-btn {
  padding: 8px 14px;
  background: rgba(59, 130, 246, 0.8);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-add-btn:hover {
  background: rgba(59, 130, 246, 1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}

.tag-item.editable {
  padding-right: 8px;
}

.tag-remove {
  margin-left: 6px;
  width: 16px;
  height: 16px;
  border: none;
  background: rgba(0, 0, 0, 0.2);
  color: currentColor;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.tags-actions {
  display: flex;
  gap: 8px;
}

.tags-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tags-btn.save {
  background: rgba(34, 197, 94, 0.8);
  color: #fff;
}

.tags-btn.save:hover {
  background: rgba(34, 197, 94, 1);
}

.tags-btn.cancel {
  background: rgba(51, 65, 85, 0.8);
  color: #94a3b8;
}

.tags-btn.cancel:hover {
  background: rgba(71, 85, 105, 1);
  color: #e2e8f0;
}

/* Keyboard Shortcuts Hint */
.shortcuts-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  margin-top: 12px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.1);
  border-radius: 6px;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.shortcut-hint kbd {
  padding: 2px 6px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  color: #e2e8f0;
}
</style>
