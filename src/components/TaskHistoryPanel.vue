<template>
  <div class="task-history-panel" :class="{ collapsed: isCollapsed }">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <h3>任务历史</h3>
        <span v-if="agentId" class="agent-badge">{{ agentId.slice(0, 8) }}...</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" title="切换视图" @click="toggleView">
          {{ viewMode === 'list' ? '📊' : '📋' }}
        </button>
        <button class="icon-btn" title="刷新" @click="refreshTasks">🔄</button>
        <button class="icon-btn" :title="isCollapsed ? '展开' : '收起'" @click="toggleCollapse">
          {{ isCollapsed ? '▲' : '▼' }}
        </button>
        <button class="icon-btn close-btn" title="关闭" @click="$emit('close')">×</button>
      </div>
    </div>

    <!-- Filters & Stats -->
    <div v-if="!isCollapsed" class="panel-controls">
      <!-- Status Filter -->
      <div class="filter-group">
        <label>状态:</label>
        <button
          v-for="status in taskStatuses"
          :key="status.value"
          :class="['filter-btn', { active: selectedStatuses.includes(status.value) }]"
          @click="toggleStatus(status.value)"
        >
          <span :class="['status-dot', status.value]"></span>
          {{ status.label }}
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <span class="stat-item">总计: {{ tasks.length }}</span>
        <span class="stat-item success">成功: {{ stats.completed }}</span>
        <span class="stat-item failed">失败: {{ stats.failed }}</span>
        <span class="stat-item running">运行中: {{ stats.running }}</span>
      </div>
    </div>

    <!-- Content -->
    <div v-if="!isCollapsed" class="panel-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <div>加载中...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ error }}</div>
        <button class="btn-small" @click="loadTasks">重试</button>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="task-list">
        <div v-if="filteredTasks.length === 0" class="empty-state">
          {{ selectedStatuses.length === 0 ? '请选择要显示的状态' : '暂无任务' }}
        </div>
        <div
          v-for="task in filteredTasks"
          :key="task.taskId"
          :class="['task-item', task.status]"
          @click="selectTask(task)"
        >
          <div class="task-header">
            <span class="task-name">{{ task.name }}</span>
            <span :class="['status-badge', task.status]">{{ statusText(task.status) }}</span>
          </div>
          <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          <div class="task-meta">
            <span class="meta-item">优先级: {{ task.priority }}</span>
            <span class="meta-item">{{ formatTime(task.createdAt) }}</span>
            <span v-if="task.progress > 0 && task.progress < 100" class="meta-item progress">
              {{ task.progress }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div v-else class="task-timeline">
        <div v-if="filteredTasks.length === 0" class="empty-state">
          {{ selectedStatuses.length === 0 ? '请选择要显示的状态' : '暂无任务' }}
        </div>
        <div class="timeline">
          <div
            v-for="(task, index) in sortedTasks"
            :key="task.taskId"
            :class="['timeline-item', task.status]"
            @click="selectTask(task)"
          >
            <div class="timeline-dot"></div>
            <div v-if="index < sortedTasks.length - 1" class="timeline-line"></div>
            <div class="timeline-content">
              <div class="timeline-time">{{ formatDateTime(task.createdAt) }}</div>
              <div class="timeline-title">{{ task.name }}</div>
              <div :class="['timeline-status', task.status]">{{ statusText(task.status) }}</div>
              <div v-if="task.error" class="timeline-error">{{ task.error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="selectedTask" class="task-detail-modal" @click.self="selectedTask = null">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ selectedTask.name }}</h3>
          <button class="icon-btn close-btn" @click="selectedTask = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="label">状态:</span>
            <span :class="['status-badge', selectedTask.status]">
              {{ statusText(selectedTask.status) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">优先级:</span>
            <span class="value">{{ selectedTask.priority }}</span>
          </div>
          <div v-if="selectedTask.description" class="detail-row">
            <span class="label">描述:</span>
            <span class="value">{{ selectedTask.description }}</span>
          </div>
          <div v-if="selectedTask.agentId" class="detail-row">
            <span class="label">Agent ID:</span>
            <span class="value monospace">{{ selectedTask.agentId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDateTime(selectedTask.createdAt) }}</span>
          </div>
          <div v-if="selectedTask.startedAt" class="detail-row">
            <span class="label">开始时间:</span>
            <span class="value">{{ formatDateTime(selectedTask.startedAt) }}</span>
          </div>
          <div v-if="selectedTask.completedAt" class="detail-row">
            <span class="label">完成时间:</span>
            <span class="value">{{ formatDateTime(selectedTask.completedAt) }}</span>
          </div>
          <div v-if="selectedTask.progress > 0" class="detail-row">
            <span class="label">进度:</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: selectedTask.progress + '%' }"></div>
            </div>
          </div>
          <div v-if="selectedTask.error" class="detail-row error">
            <span class="label">错误:</span>
            <span class="value error-msg">{{ selectedTask.error }}</span>
          </div>
          <div v-if="selectedTask.output" class="detail-row">
            <span class="label">输出:</span>
            <pre class="value output">{{ formatOutput(selectedTask.output) }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="selectedTask.status === 'failed'" class="btn primary" @click="retryTask(selectedTask)">
            重试
          </button>
          <button class="btn" @click="selectedTask = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getAPIClient } from '../api/ApiClientNew'

// Props
interface Props {
  agentId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  retry: [task: Task]
}>()

// Types
export interface Task {
  taskId: string
  name: string
  description?: string
  type?: string
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: number
  agentId?: string
  memoryId?: string
  input?: string
  output?: string
  error?: string
  progress: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// State
const tasks = ref<Task[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const isCollapsed = ref(false)
const viewMode = ref<'list' | 'timeline'>('list')
const selectedStatuses = ref<string[]>(['completed', 'failed', 'running'])
const selectedTask = ref<Task | null>(null)

// Task statuses
const taskStatuses = [
  { value: 'pending', label: '待分配' },
  { value: 'assigned', label: '已分配' },
  { value: 'running', label: '运行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'cancelled', label: '已取消' },
]

// Status text mapping
const statusTextMap: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

// Computed
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    // Filter by status
    if (!selectedStatuses.value.includes(task.status)) return false
    // Filter by agent if specified
    if (props.agentId && task.agentId !== props.agentId) return false
    return true
  })
})

const sortedTasks = computed(() => {
  return [...filteredTasks.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const stats = computed(() => {
  return {
    total: tasks.value.length,
    completed: tasks.value.filter(t => t.status === 'completed').length,
    failed: tasks.value.filter(t => t.status === 'failed').length,
    running: tasks.value.filter(t => t.status === 'running').length,
  }
})

// Methods
const statusText = (status: string): string => {
  return statusTextMap[status] || status
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatOutput = (output: unknown): string => {
  if (typeof output === 'string') return output
  return JSON.stringify(output, null, 2)
}

const toggleStatus = (status: string): void => {
  const index = selectedStatuses.value.indexOf(status)
  if (index > -1) {
    selectedStatuses.value.splice(index, 1)
  } else {
    selectedStatuses.value.push(status)
  }
}

const toggleView = (): void => {
  viewMode.value = viewMode.value === 'list' ? 'timeline' : 'list'
}

const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const refreshTasks = async (): Promise<void> => {
  await loadTasks()
}

const loadTasks = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    const api = getAPIClient()
    const allTasks = await api.getAllTasks()

    // Filter by agent if specified
    if (props.agentId) {
      tasks.value = allTasks.filter(t => t.agentId === props.agentId)
    } else {
      tasks.value = allTasks
    }

    console.log(`Loaded ${tasks.value.length} tasks`)
  } catch (err) {
    console.error('Failed to load tasks:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load tasks'
  } finally {
    loading.value = false
  }
}

const selectTask = (task: Task): void => {
  selectedTask.value = task
}

const retryTask = (task: Task): void => {
  emit('retry', task)
  selectedTask.value = null
}

// Lifecycle hooks
onMounted(() => {
  loadTasks()
})

// Watch for agentId changes
watch(() => props.agentId, () => {
  loadTasks()
})
</script>

<style scoped>
.task-history-panel {
  position: fixed;
  right: 400px;
  bottom: 50px;
  width: 450px;
  max-height: 500px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.task-history-panel.collapsed {
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

.icon-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.panel-controls {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(30, 41, 59, 0.6);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.pending { background: #6b7280; }
.status-dot.assigned { background: #3b82f6; }
.status-dot.running { background: #8b5cf6; }
.status-dot.completed { background: #22c55e; }
.status-dot.failed { background: #ef4444; }
.status-dot.cancelled { background: #f97316; }

.stats-bar {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.stat-item {
  color: #94a3b8;
}

.stat-item.success { color: #22c55e; }
.stat-item.failed { color: #ef4444; }
.stat-item.running { color: #8b5cf6; }

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.4);
}

.task-item.running { border-left: 3px solid #8b5cf6; }
.task-item.completed { border-left: 3px solid #22c55e; }
.task-item.failed { border-left: 3px solid #ef4444; }

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.status-badge.pending { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
.status-badge.assigned { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.status-badge.running { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
.status-badge.completed { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status-badge.failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.status-badge.cancelled { background: rgba(249, 115, 22, 0.2); color: #f97316; }

.task-desc {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.meta-item {
  color: #64748b;
}

.meta-item.progress {
  color: #8b5cf6;
  font-weight: 500;
}

/* Timeline View */
.task-timeline {
  padding: 16px 8px;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
  cursor: pointer;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -30px;
  top: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #64748b;
  border: 2px solid #0f172a;
  z-index: 2;
}

.timeline-item.running .timeline-dot { background: #8b5cf6; }
.timeline-item.completed .timeline-dot { background: #22c55e; }
.timeline-item.failed .timeline-dot { background: #ef4444; }

.timeline-line {
  position: absolute;
  left: -25px;
  top: 14px;
  bottom: -24px;
  width: 2px;
  background: rgba(100, 116, 139, 0.3);
}

.timeline-content {
  padding-left: 8px;
}

.timeline-time {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
}

.timeline-title {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.timeline-status {
  font-size: 11px;
  font-weight: 500;
}

.timeline-status.running { color: #8b5cf6; }
.timeline-status.completed { color: #22c55e; }
.timeline-status.failed { color: #ef4444; }

.timeline-error {
  font-size: 11px;
  color: #fca5a5;
  margin-top: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 13px;
}

/* Modal */
.task-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 500px;
  max-height: 80vh;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-row .label {
  width: 100px;
  flex-shrink: 0;
  font-size: 12px;
  color: #94a3b8;
}

.detail-row .value {
  flex: 1;
  font-size: 13px;
  color: #e2e8f0;
  word-break: break-word;
}

.detail-row.error .value.error-msg {
  color: #fca5a5;
}

.detail-row .value.output {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  background: rgba(15, 23, 42, 0.8);
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s;
}

.monospace {
  font-family: 'Consolas', 'Monaco', monospace;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.btn {
  padding: 8px 16px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(71, 85, 105, 1);
}

.btn.primary {
  background: rgba(59, 130, 246, 0.8);
  border-color: rgba(59, 130, 246, 0.5);
}

.btn.primary:hover {
  background: rgba(59, 130, 246, 1);
}

/* Loading & Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.btn-small {
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  background: rgba(71, 85, 105, 1);
}
</style>
