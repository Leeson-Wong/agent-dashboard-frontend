<template>
  <div class="ws-status-container">
    <button
      class="ws-status-btn"
      :class="statusClass"
      @click="toggleDetails"
      :title="tooltip"
    >
      <span class="ws-icon">{{ statusIcon }}</span>
      <span class="ws-label">{{ statusLabel }}</span>
      <span v-if="info.state === ConnectionState.RECONNECTING" class="ws-reconnect-count">
        ({{ info.reconnectAttempts }}/{{ info.maxReconnectAttempts }})
      </span>
    </button>

    <!-- Status Details Modal -->
    <Transition name="fade">
      <div v-if="showDetails" class="ws-modal" @click.self="showDetails = false">
        <div class="ws-modal-content">
          <div class="ws-modal-header">
            <h3>WebSocket 连接状态</h3>
            <button class="close-btn" @click="showDetails = false">×</button>
          </div>

          <div class="ws-modal-body">
            <!-- Current Status -->
            <div class="ws-status-display">
              <div class="ws-status-badge" :class="statusClass">
                <span class="status-icon">{{ statusIcon }}</span>
                <span class="status-text">{{ statusLabel }}</span>
              </div>
            </div>

            <!-- Connection Details -->
            <div class="ws-details">
              <div class="detail-row">
                <span class="detail-label">连接地址:</span>
                <span class="detail-value">{{ formatUrl(info.url) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">连接状态:</span>
                <span class="detail-value">{{ info.state }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">已连接:</span>
                <span class="detail-value">{{ info.connected ? '是' : '否' }}</span>
              </div>

              <template v-if="info.lastConnectedTime">
                <div class="detail-row">
                  <span class="detail-label">连接时间:</span>
                  <span class="detail-value">{{ formatTimestamp(info.lastConnectedTime) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">已连接时长:</span>
                  <span class="detail-value">{{ getDuration(info.lastConnectedTime) }}</span>
                </div>
              </template>

              <template v-if="info.lastDisconnectedTime">
                <div class="detail-row">
                  <span class="detail-label">断开时间:</span>
                  <span class="detail-value">{{ formatTimestamp(info.lastDisconnectedTime) }}</span>
                </div>
              </template>

              <template v-if="info.state === ConnectionState.RECONNECTING">
                <div class="detail-row">
                  <span class="detail-label">重连尝试:</span>
                  <span class="detail-value">{{ info.reconnectAttempts }} / {{ info.maxReconnectAttempts }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">下次重连:</span>
                  <span class="detail-value">{{ formatDuration(info.reconnectDelay) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">重连延迟:</span>
                  <span class="detail-value">{{ info.reconnectDelay }}ms</span>
                </div>
              </template>
            </div>

            <!-- Actions -->
            <div class="ws-actions">
              <button
                v-if="canReconnect"
                @click="handleManualReconnect"
                class="action-btn primary"
                :disabled="isReconnecting"
              >
                {{ isReconnecting ? '⏳ 重连中...' : '🔄 手动重连' }}
              </button>
              <button @click="showDetails = false" class="action-btn">
                关闭
              </button>
            </div>

            <!-- Instructions -->
            <div v-if="info.state === ConnectionState.ERROR" class="ws-instructions">
              <p><strong>连接失败可能的原因：</strong></p>
              <ul>
                <li>后端服务未启动</li>
                <li>网络连接问题</li>
                <li>防火墙阻止了 WebSocket 连接</li>
                <li>后端地址配置错误</li>
              </ul>
              <p><strong>建议操作：</strong></p>
              <ul>
                <li>检查后端服务是否运行在 {{ formatUrl(info.url) }}</li>
                <li>尝试刷新页面</li>
                <li>点击"手动重连"按钮</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getWebSocketConnection,
  ConnectionState,
  type ConnectionInfo
} from '../api/WebSocketConnection'

const ws = getWebSocketConnection()
const showDetails = ref(false)
const info = ref<ConnectionInfo>(ws.getConnectionInfo())
const isReconnecting = ref(false)

// Computed
const statusClass = computed(() => {
  const state = info.value.state
  return {
    connected: state === ConnectionState.CONNECTED,
    connecting: state === ConnectionState.CONNECTING,
    reconnecting: state === ConnectionState.RECONNECTING,
    disconnected: state === ConnectionState.DISCONNECTED,
    error: state === ConnectionState.ERROR
  }
})

const statusIcon = computed(() => {
  const state = info.value.state
  const icons = {
    [ConnectionState.CONNECTED]: '●',
    [ConnectionState.CONNECTING]: '○',
    [ConnectionState.RECONNECTING]: '⟳',
    [ConnectionState.DISCONNECTED]: '○',
    [ConnectionState.ERROR]: '✗'
  }
  return icons[state] || '○'
})

const statusLabel = computed(() => {
  const state = info.value.state
  const labels = {
    [ConnectionState.CONNECTED]: '已连接',
    [ConnectionState.CONNECTING]: '连接中...',
    [ConnectionState.RECONNECTING]: '重连中',
    [ConnectionState.DISCONNECTED]: '未连接',
    [ConnectionState.ERROR]: '连接错误'
  }
  return labels[state] || '未知'
})

const tooltip = computed(() => {
  const state = info.value.state
  if (state === ConnectionState.RECONNECTING) {
    return `正在重连 (${info.value.reconnectAttempts}/${info.value.maxReconnectAttempts})`
  }
  if (state === ConnectionState.ERROR) {
    return '连接失败，点击查看详情'
  }
  return statusLabel.value
})

const canReconnect = computed(() => {
  const state = info.value.state
  return state === ConnectionState.DISCONNECTED ||
         state === ConnectionState.ERROR ||
         state === ConnectionState.RECONNECTING
})

// Methods
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const formatUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.host + urlObj.pathname
  } catch {
    return url
  }
}

const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`
  return `${(ms / 1000).toFixed(1)}s`
}

const getDuration = (startTime: number | null): string => {
  if (!startTime) return '-'
  const diff = Date.now() - startTime
  return formatDuration(diff)
}

const handleManualReconnect = async () => {
  isReconnecting.value = true
  try {
    await ws.manualReconnect()
  } finally {
    // Wait a bit before resetting reconnecting state
    setTimeout(() => {
      isReconnecting.value = false
    }, 1000)
  }
}

// Subscribe to state changes
const unsubscribe = ws.onStateChange((newInfo) => {
  info.value = newInfo
})

onMounted(() => {
  // Initial connection if disconnected
  if (info.value.state === ConnectionState.DISCONNECTED) {
    ws.connect().catch(err => {
      console.error('Failed to connect WebSocket:', err)
    })
  }
})

onUnmounted(() => {
  unsubscribe()
})
</script>

<style scoped>
.ws-status-container {
  display: inline-block;
}

.ws-status-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 20px;
  background: rgba(30, 41, 59, 0.8);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
}

.ws-status-btn:hover {
  background: rgba(51, 65, 85, 0.8);
}

.ws-icon {
  font-size: 12px;
}

.ws-label {
  font-weight: 500;
}

.ws-reconnect-count {
  font-size: 11px;
  color: #f59e0b;
  margin-left: 4px;
}

/* Status colors */
.ws-status-btn.connected {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.ws-status-btn.connected:hover {
  background: rgba(34, 197, 94, 0.2);
}

.ws-status-btn.connected .ws-icon {
  animation: pulse-green 2s ease-in-out infinite;
}

.ws-status-btn.connecting {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.ws-status-btn.connecting:hover {
  background: rgba(59, 130, 246, 0.2);
}

.ws-status-btn.connecting .ws-icon {
  animation: spin 1s linear infinite;
}

.ws-status-btn.reconnecting {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.ws-status-btn.reconnecting:hover {
  background: rgba(245, 158, 11, 0.2);
}

.ws-status-btn.reconnecting .ws-icon {
  animation: spin 1s linear infinite;
}

.ws-status-btn.disconnected {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
}

.ws-status-btn.disconnected:hover {
  background: rgba(51, 65, 85, 0.8);
}

.ws-status-btn.error {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ws-status-btn.error:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Animations */
@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Modal */
.ws-modal {
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

.ws-modal-content {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.3);
  width: 90%;
  max-width: 500px;
}

.ws-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.ws-modal-header h3 {
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

.ws-modal-body {
  padding: 20px;
}

.ws-status-display {
  text-align: center;
  margin-bottom: 24px;
}

.ws-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.ws-status-badge.connected {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.ws-status-badge.connecting,
.ws-status-badge.reconnecting {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.ws-status-badge.disconnected {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.ws-status-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-icon {
  font-size: 24px;
}

.ws-details {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.detail-label {
  color: #64748b;
}

.detail-value {
  color: #e2e8f0;
  font-weight: 500;
  text-align: right;
}

.ws-actions {
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

.action-btn.primary {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.action-btn.primary:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.4);
}

.ws-instructions {
  margin-top: 20px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 14px;
}

.ws-instructions p {
  margin: 8px 0;
}

.ws-instructions ul {
  margin: 8px 0;
  padding-left: 20px;
}

.ws-instructions li {
  margin: 4px 0;
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
</style>
