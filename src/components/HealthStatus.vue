<template>
  <div class="health-status" :class="{ 'health-down': !isHealthy }">
    <button
      class="health-indicator"
      @click="showDetails = !showDetails"
      :title="isHealthy ? '系统运行正常' : '系统存在问题'"
    >
      <span class="health-dot" :class="{ 'dot-down': !isHealthy }"></span>
      <span class="health-label">{{ isHealthy ? '系统正常' : '系统异常' }}</span>
    </button>

    <!-- Health Details Modal -->
    <Transition name="fade">
      <div v-if="showDetails" class="health-modal" @click.self="showDetails = false">
        <div class="health-modal-content">
          <div class="health-modal-header">
            <h3>系统健康状态</h3>
            <button class="close-btn" @click="showDetails = false">×</button>
          </div>

          <div v-if="loading" class="health-loading">
            <div class="spinner"></div>
            <p>正在检查系统状态...</p>
          </div>

          <div v-else-if="healthData" class="health-modal-body">
            <!-- Overall Status -->
            <div class="health-section">
              <div class="health-status-badge" :class="healthData.data.status.toLowerCase()">
                {{ healthData.data.status === 'UP' ? '✓ 运行正常' : '✗ 系统异常' }}
              </div>
              <div class="health-timestamp">
                更新时间: {{ formatTimestamp(healthData.data.timestamp) }}
              </div>
            </div>

            <!-- Components -->
            <div class="health-section">
              <h4>组件状态</h4>
              <div class="components-grid">
                <div
                  v-for="(component, key) in healthData.data.components"
                  :key="key"
                  class="component-item"
                  :class="{ 'component-down': component.status !== 'UP' }"
                >
                  <div class="component-icon">
                    {{ getComponentIcon(key) }}
                  </div>
                  <div class="component-info">
                    <div class="component-name">{{ getComponentName(key) }}</div>
                    <div class="component-status">{{ component.status }}</div>
                    <div v-if="component.description" class="component-desc">
                      {{ component.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Application Info -->
            <div class="health-section">
              <h4>应用信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">名称:</span>
                  <span class="info-value">{{ healthData.data.application.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">版本:</span>
                  <span class="info-value">{{ healthData.data.application.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">环境:</span>
                  <span class="info-value">{{ healthData.data.application.environment }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">运行时间:</span>
                  <span class="info-value">{{ healthData.data.application.uptime }}</span>
                </div>
              </div>
            </div>

            <!-- System Info -->
            <div class="health-section">
              <h4>系统信息</h4>
              <div class="system-info">
                <div class="info-item">
                  <span class="info-label">操作系统:</span>
                  <span class="info-value">{{ healthData.data.system.os.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">处理器:</span>
                  <span class="info-value">{{ healthData.data.system.os.processors }} 核心</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Java:</span>
                  <span class="info-value">{{ healthData.data.system.java.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">堆内存:</span>
                  <span class="info-value">
                    {{ healthData.data.system.memory.heap }} / {{ healthData.data.system.memory.heapMax }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="health-actions">
              <button @click="refreshHealth" class="action-btn primary">
                🔄 刷新
              </button>
              <button @click="showDetails = false" class="action-btn">
                关闭
              </button>
            </div>
          </div>

          <div v-else-if="error" class="health-error">
            <div class="error-icon">⚠️</div>
            <p>无法获取系统状态</p>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { apiClient } from '../api/ApiClient'

interface HealthData {
  status: string
  timestamp: string
  system: {
    memory: {
      heap: string
      heapMax: string
      nonHeap: string
      nonHeapMax: string
    }
    os: {
      name: string
      version: string
      arch: string
      processors: number
      systemLoadAverage: number
    }
    java: {
      version: string
      vendor: string
      home: string
    }
  }
  application: {
    name: string
    version: string
    environment: string
    uptime: string
    uptimeSeconds: number
    startTime: string
  }
  components: {
    [key: string]: {
      status: string
      description: string
    }
  }
}

const showDetails = ref(false)
const loading = ref(false)
const healthData = ref<{ data: HealthData } | null>(null)
const error = ref<string | null>(null)
const isHealthy = ref(true)

let healthCheckInterval: ReturnType<typeof setInterval> | null = null

// Get component icon
const getComponentIcon = (key: string): string => {
  const icons: Record<string, string> = {
    database: '🗄️',
    websocket: '🔌',
    api: '🌐',
  }
  return icons[key] || '📦'
}

// Get component name
const getComponentName = (key: string): string => {
  const names: Record<string, string> = {
    database: '数据库',
    websocket: 'WebSocket',
    api: 'API',
  }
  return names[key] || key
}

// Format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// Fetch health status
const fetchHealth = async () => {
  try {
    error.value = null

    // First try detailed health check
    try {
      const response = await fetch(`${apiClient['baseUrl']}/api/health/detailed`)
      if (response.ok) {
        const data = await response.json()
        healthData.value = data
        isHealthy.value = data.data.status === 'UP'
        return
      }
    } catch {
      // Fall back to simple health check
    }

    // Fallback to simple health check
    const response = await fetch(`${apiClient['baseUrl']}/api/health`)
    if (response.ok) {
      const data = await response.json()
      isHealthy.value = data.status === 'UP'
    } else {
      isHealthy.value = false
      error.value = '服务器返回错误状态'
    }
  } catch (e) {
    isHealthy.value = false
    error.value = e instanceof Error ? e.message : '无法连接到服务器'
  }
}

// Refresh health
const refreshHealth = async () => {
  loading.value = true
  await fetchHealth()
  loading.value = false
}

// Open details and fetch
const openDetails = async () => {
  showDetails.value = true
  if (!healthData.value) {
    await refreshHealth()
  }
}

// Auto health check
onMounted(() => {
  fetchHealth()
  healthCheckInterval = setInterval(fetchHealth, 30000) // Check every 30 seconds
})

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
})

// Expose openDetails method
defineExpose({ openDetails })
</script>

<style scoped>
.health-status {
  display: inline-block;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 20px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.health-indicator:hover {
  background: rgba(34, 197, 94, 0.2);
  transform: scale(1.05);
}

.health-status.health-down .health-indicator {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.health-status.health-down .health-indicator:hover {
  background: rgba(239, 68, 68, 0.2);
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s ease-in-out infinite;
}

.health-dot.dot-down {
  background: #ef4444;
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.health-label {
  font-weight: 500;
}

/* Modal */
.health-modal {
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

.health-modal-content {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.health-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.health-modal-header h3 {
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

.health-modal-body {
  padding: 20px;
}

.health-loading,
.health-error {
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
}

.health-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.health-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.health-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.health-status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.health-status-badge.up {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.health-status-badge.down {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.health-timestamp {
  font-size: 13px;
  color: #64748b;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  transition: all 0.2s;
}

.component-item:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(100, 116, 139, 0.4);
}

.component-item.component-down {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.component-icon {
  font-size: 24px;
}

.component-info {
  flex: 1;
}

.component-name {
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.component-status {
  font-size: 12px;
  color: #22c55e;
}

.component-item.component-down .component-status {
  color: #ef4444;
}

.component-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.info-grid,
.system-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
}

.info-label {
  color: #64748b;
  font-size: 13px;
}

.info-value {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
}

.health-actions {
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

.action-btn:hover {
  background: rgba(51, 65, 85, 0.8);
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 0.4);
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
.health-modal-content::-webkit-scrollbar {
  width: 8px;
}

.health-modal-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.health-modal-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 4px;
}

.health-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
