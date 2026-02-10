<template>
  <div v-if="isVisible" class="api-debug-panel" :class="{ 'panel-open': isOpen }">
    <!-- Toggle Button -->
    <button
      class="debug-toggle-btn"
      @click="togglePanel"
      :title="isOpen ? '隐藏调试面板' : '显示调试面板'"
    >
      {{ isOpen ? '×' : '🔍' }}
    </button>

    <!-- Panel Content -->
    <Transition name="slide">
      <div v-if="isOpen" class="debug-content">
        <div class="debug-header">
          <h3>API 调试面板</h3>
          <div class="debug-stats">
            <span class="stat-item">
              <span class="stat-label">总计:</span>
              <span class="stat-value">{{ stats.totalRequests }}</span>
            </span>
            <span class="stat-item success">
              <span class="stat-label">成功:</span>
              <span class="stat-value">{{ stats.successRequests }}</span>
            </span>
            <span class="stat-item error">
              <span class="stat-label">错误:</span>
              <span class="stat-value">{{ stats.errorRequests }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">平均:</span>
              <span class="stat-value">{{ formatDuration(stats.avgDuration) }}</span>
            </span>
          </div>
          <div class="debug-actions">
            <button @click="refreshLogs" class="action-btn" title="刷新">
              🔄
            </button>
            <button @click="copyLogs" class="action-btn" title="复制 JSON">
              📋
            </button>
            <button @click="exportLogs" class="action-btn" title="导出">
              💾
            </button>
            <button @click="clearLogs" class="action-btn danger" title="清空">
              🗑️
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="debug-filter">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索 URL..."
            class="filter-input"
          />
          <select v-model="filterMethod" class="filter-select">
            <option value="">所有方法</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <select v-model="filterStatus" class="filter-select">
            <option value="">所有状态</option>
            <option value="success">成功 (2xx)</option>
            <option value="warning">警告 (3xx/4xx)</option>
            <option value="error">错误 (5xx)</option>
          </select>
        </div>

        <!-- Log List -->
        <div class="debug-logs">
          <div
            v-for="log in filteredLogs"
            :key="log.request.id"
            :class="['log-item', { error: log.error, expanded: expandedLogId === log.request.id }]"
            @click="toggleExpand(log.request.id)"
          >
            <!-- Log Summary -->
            <div class="log-summary">
              <span :class="['log-method', log.request.method.toLowerCase()]">
                {{ log.request.method }}
              </span>
              <span class="log-url">{{ truncateUrl(log.request.url) }}</span>
              <span
                v-if="log.response"
                :class="['log-status', getStatusClass(log.response.status)]"
              >
                {{ log.response.status }}
              </span>
              <span v-else-if="log.error" class="log-status error">
                {{ log.error.status || 'ERR' }}
              </span>
              <span
                v-if="log.response"
                class="log-duration"
                :class="{ slow: log.response.duration > 1000 }"
              >
                {{ formatDuration(log.response.duration) }}
              </span>
              <span v-else-if="log.error" class="log-duration">
                {{ formatDuration(log.error.duration) }}
              </span>
              <span class="log-expand">{{ expandedLogId === log.request.id ? '▼' : '▶' }}</span>
            </div>

            <!-- Log Details -->
            <Transition name="expand">
              <div v-if="expandedLogId === log.request.id" class="log-details">
                <div class="detail-section">
                  <h4>请求</h4>
                  <div class="detail-row">
                    <span class="detail-label">URL:</span>
                    <span class="detail-value">{{ log.request.url }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">时间:</span>
                    <span class="detail-value">{{ formatTimestamp(log.request.timestamp) }}</span>
                  </div>
                  <div v-if="log.request.body" class="detail-row">
                    <span class="detail-label">请求体:</span>
                    <pre class="detail-value">{{ formatJson(log.request.body) }}</pre>
                  </div>
                </div>

                <div v-if="log.response" class="detail-section">
                  <h4>响应</h4>
                  <div class="detail-row">
                    <span class="detail-label">状态:</span>
                    <span class="detail-value">{{ log.response.status }} {{ log.response.statusText }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">持续时间:</span>
                    <span class="detail-value">{{ formatDuration(log.response.duration) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">大小:</span>
                    <span class="detail-value">{{ log.response.size }} bytes</span>
                  </div>
                  <div v-if="log.response.body" class="detail-row">
                    <span class="detail-label">响应体:</span>
                    <pre class="detail-value">{{ formatJson(log.response.body) }}</pre>
                  </div>
                </div>

                <div v-if="log.error" class="detail-section error">
                  <h4>错误</h4>
                  <div class="detail-row">
                    <span class="detail-label">消息:</span>
                    <span class="detail-value">{{ log.error.message }}</span>
                  </div>
                  <div v-if="log.error.code" class="detail-row">
                    <span class="detail-label">代码:</span>
                    <span class="detail-value">{{ log.error.code }}</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Empty State -->
          <div v-if="filteredLogs.length === 0" class="empty-state">
            <p>暂无日志记录</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getLogHistory, clearLogHistory, exportLogs as exportLogsUtil, getStats, type APILogEntry } from '../utils/apiLogger'

const isVisible = ref(true)
const isOpen = ref(false)
const expandedLogId = ref<string | null>(null)
const searchQuery = ref('')
const filterMethod = ref('')
const filterStatus = ref('')

let refreshInterval: ReturnType<typeof setInterval> | null = null

// Stats
const stats = ref(getStats())

// Logs
const logs = ref<APILogEntry[]>([])

// Refresh logs
const refreshLogs = () => {
  logs.value = getLogHistory()
  stats.value = getStats()
}

// Toggle panel
const togglePanel = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    refreshLogs()
  }
}

// Toggle expand
const toggleExpand = (logId: string) => {
  if (expandedLogId.value === logId) {
    expandedLogId.value = null
  } else {
    expandedLogId.value = logId
  }
}

// Get status class
const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 500) return 'warning'
  return 'error'
}

// Format duration
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Format JSON
const formatJson = (data: unknown): string => {
  return JSON.stringify(data, null, 2)
}

// Truncate URL
const truncateUrl = (url: string): string => {
  if (url.length <= 60) return url
  return url.substring(0, 60) + '...'
}

// Filter logs
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.request.url.toLowerCase().includes(query)
    )
  }

  // Method filter
  if (filterMethod.value) {
    filtered = filtered.filter(log =>
      log.request.method === filterMethod.value
    )
  }

  // Status filter
  if (filterStatus.value) {
    filtered = filtered.filter(log => {
      if (!log.response) return false
      if (filterStatus.value === 'success') return log.response.status >= 200 && log.response.status < 300
      if (filterStatus.value === 'warning') return log.response.status >= 300 && log.response.status < 500
      if (filterStatus.value === 'error') return log.response.status >= 500
      return true
    })
  }

  return filtered.slice(-50).reverse() // Show latest 50, newest first
})

// Clear logs
const clearLogs = () => {
  if (confirm('确定要清空所有日志吗？')) {
    clearLogHistory()
    refreshLogs()
  }
}

// Copy logs
const copyLogs = () => {
  const json = exportLogsUtil()
  navigator.clipboard.writeText(json).then(() => {
    alert('日志已复制到剪贴板')
  }).catch(() => {
    alert('复制失败')
  })
}

// Export logs
const exportLogs = () => {
  const json = exportLogsUtil()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `api-logs-${new Date().toISOString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Auto refresh
onMounted(() => {
  refreshLogs()
  refreshInterval = setInterval(refreshLogs, 2000) // Refresh every 2 seconds
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.api-debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-size: 13px;
}

.debug-toggle-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-toggle-btn:hover {
  background: rgba(59, 130, 246, 1);
  transform: scale(1.1);
}

.debug-content {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 600px;
  max-height: 500px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.3);
  display: flex;
  flex-direction: column;
}

.debug-header {
  padding: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  align-items: center;
  gap: 16px;
}

.debug-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.debug-stats {
  display: flex;
  gap: 12px;
  flex: 1;
}

.stat-item {
  display: flex;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #94a3b8;
}

.stat-value {
  font-weight: 600;
  color: #f1f5f9;
}

.stat-item.success .stat-value {
  color: #22c55e;
}

.stat-item.error .stat-value {
  color: #ef4444;
}

.debug-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.debug-filter {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.filter-input,
.filter-select {
  padding: 6px 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  font-size: 12px;
}

.filter-input {
  flex: 1;
}

.filter-select {
  min-width: 120px;
}

.debug-logs {
  overflow-y: auto;
  max-height: 350px;
  padding: 8px;
}

.log-item {
  margin-bottom: 4px;
  border-radius: 6px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.log-item:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(100, 116, 139, 0.4);
}

.log-item.error {
  border-color: rgba(239, 68, 68, 0.3);
}

.log-summary {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-method {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-method.get {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.log-method.post {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.log-method.put {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.log-method.delete {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.log-method.patch {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.log-url {
  flex: 1;
  color: #cbd5e1;
  font-family: monospace;
  font-size: 12px;
}

.log-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.log-status.success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.log-status.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.log-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.log-duration {
  color: #94a3b8;
  font-size: 11px;
  font-family: monospace;
}

.log-duration.slow {
  color: #f59e0b;
}

.log-expand {
  color: #64748b;
  font-size: 10px;
}

.log-details {
  padding: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.detail-section {
  margin-bottom: 12px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 8px;
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
}

.detail-section.error h4 {
  color: #ef4444;
}

.detail-row {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.detail-label {
  color: #64748b;
  min-width: 80px;
  font-size: 12px;
}

.detail-value {
  color: #cbd5e1;
  font-size: 12px;
  flex: 1;
  word-break: break-all;
}

.detail-value pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Scrollbar */
.debug-logs::-webkit-scrollbar {
  width: 8px;
}

.debug-logs::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.debug-logs::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 4px;
}

.debug-logs::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
