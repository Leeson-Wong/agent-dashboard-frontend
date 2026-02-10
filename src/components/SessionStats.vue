<template>
  <div class="session-stats">
    <button
      class="stats-indicator"
      @click="showDetails = !showDetails"
      title="会话统计信息"
    >
      <span class="stats-icon">📊</span>
      <span class="stats-label">{{ uptimeFormatted }}</span>
    </button>

    <!-- Stats Modal -->
    <Transition name="fade">
      <div v-if="showDetails" class="stats-modal" @click.self="showDetails = false">
        <div class="stats-modal-content">
          <div class="stats-modal-header">
            <h3>会话统计</h3>
            <button class="close-btn" @click="showDetails = false">×</button>
          </div>

          <div v-if="loading" class="stats-loading">
            <div class="spinner"></div>
            <p>正在加载统计信息...</p>
          </div>

          <div v-else-if="error" class="stats-error">
            <div class="error-icon">⚠️</div>
            <p>无法加载统计信息</p>
            <p class="error-message">{{ error }}</p>
            <button @click="fetchStats" class="retry-btn">重试</button>
          </div>

          <div v-else-if="stats" class="stats-modal-body">
            <!-- Session Info -->
            <div class="stats-section">
              <h4>会话信息</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">运行时间</span>
                  <span class="stat-value highlight">{{ stats.session.uptimeFormatted }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">开始时间</span>
                  <span class="stat-value">{{ formatTime(stats.session.startTime) }}</span>
                </div>
              </div>
            </div>

            <!-- Counters -->
            <div class="stats-section">
              <h4>计数器</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">总请求数</span>
                  <span class="stat-value">{{ formatNumber(stats.counters.totalRequests) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">WebSocket 消息</span>
                  <span class="stat-value">{{ formatNumber(stats.counters.websocketMessages) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Agent 状态变化</span>
                  <span class="stat-value">{{ formatNumber(stats.counters.agentStateChanges) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">错误数</span>
                  <span class="stat-value" :class="{ 'has-errors': stats.counters.errors > 0 }">
                    {{ formatNumber(stats.counters.errors) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Rates -->
            <div class="stats-section">
              <h4>速率</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">请求/分钟</span>
                  <span class="stat-value">{{ formatRate(stats.rates.requestsPerMinute) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">消息/分钟</span>
                  <span class="stat-value">{{ formatRate(stats.rates.messagesPerMinute) }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="stats-actions">
              <button @click="refreshStats" class="action-btn" :disabled="loading">
                🔄 刷新
              </button>
              <button @click="resetStats" class="action-btn danger">
                🔃 重置统计
              </button>
              <button @click="showDetails = false" class="action-btn">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface SessionStats {
  session: {
    startTime: string
    uptimeSeconds: number
    uptimeFormatted: string
  }
  counters: {
    totalRequests: number
    websocketMessages: number
    agentStateChanges: number
    errors: number
  }
  rates: {
    requestsPerMinute: number
    messagesPerMinute: number
  }
}

const showDetails = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<SessionStats | null>(null)

let refreshInterval: ReturnType<typeof setInterval> | null = null

// Format time
const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    return date.toLocaleString()
  } catch {
    return '-'
  }
}

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Format rate
const formatRate = (rate: number): string => {
  if (rate < 1) {
    return rate.toFixed(2)
  } else if (rate < 10) {
    return rate.toFixed(1)
  } else {
    return Math.round(rate).toString()
  }
}

// Uptime formatted for button
const uptimeFormatted = ref('0s')

// Fetch statistics
const fetchStats = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('http://localhost:8080/api/stats/session')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    stats.value = data.data
    uptimeFormatted.value = data.data.session.uptimeFormatted
  } catch (e) {
    console.error('Failed to fetch session stats:', e)
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

// Refresh statistics
const refreshStats = () => {
  fetchStats()
}

// Reset statistics
const resetStats = async () => {
  if (!confirm('确定要重置会话统计信息吗?')) {
    return
  }

  try {
    const response = await fetch('http://localhost:8080/api/stats/reset', {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Refresh stats after reset
    await fetchStats()
  } catch (e) {
    console.error('Failed to reset session stats:', e)
    error.value = e instanceof Error ? e.message : 'Unknown error'
  }
}

// Auto refresh every 5 seconds
onMounted(() => {
  fetchStats()
  refreshInterval = setInterval(fetchStats, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.session-stats {
  display: inline-block;
}

.stats-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.stats-indicator:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: scale(1.05);
}

.stats-icon {
  font-size: 16px;
}

.stats-label {
  font-weight: 500;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* Modal */
.stats-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.stats-modal-content {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.3);
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  overflow-y: auto;
}

.stats-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.stats-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f5f9;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.stats-modal-body {
  padding: 20px;
}

.stats-loading,
.stats-error {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #fca5a5;
  font-size: 14px;
  margin: 8px 0 20px;
}

.retry-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(59, 130, 246, 0.4);
}

.stats-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.stats-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.stats-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.stat-label {
  color: #64748b;
  font-size: 13px;
}

.stat-value {
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
}

.stat-value.highlight {
  color: #60a5fa;
  font-size: 15px;
}

.stat-value.has-errors {
  color: #ef4444;
}

.stats-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  padding: 10px 20px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.8);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
.stats-modal-content::-webkit-scrollbar {
  width: 8px;
}

.stats-modal-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.stats-modal-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 4px;
}

.stats-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
