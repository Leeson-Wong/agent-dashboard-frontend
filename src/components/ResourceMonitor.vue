<template>
  <div class="resource-monitor" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button
      class="monitor-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开资源监控' : '收起资源监控'"
    >
      <span class="toggle-icon">📊</span>
      <span v-if="isCollapsed && memoryStatus === 'critical'" class="warning-indicator">⚠️</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="monitor-container">
        <!-- Header -->
        <div class="monitor-header">
          <span class="header-title">资源监控</span>
          <button
            class="refresh-btn"
            @click="updateMetrics"
            title="立即刷新"
          >
            🔄
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span class="loading-text">加载中...</span>
        </div>

        <!-- Metrics -->
        <div v-else class="metrics-content">
          <!-- Memory Section -->
          <div class="metric-section" :class="`status-${memoryStatus}`">
            <div class="metric-header">
              <span class="metric-icon">🧠</span>
              <span class="metric-label">内存使用</span>
            </div>
            <div class="metric-value">{{ formatBytes(metrics.usedMemory) }}</div>
            <div class="metric-bar">
              <div
                class="metric-bar-fill"
                :style="{ width: `${metrics.memoryUsagePercent}%` }"
                :class="`status-${memoryStatus}`"
              ></div>
            </div>
            <div class="metric-details">
              <span class="detail-item">总计: {{ formatBytes(metrics.totalMemory) }}</span>
              <span class="detail-item">{{ metrics.memoryUsagePercent.toFixed(1) }}%</span>
            </div>
          </div>

          <!-- Performance Section -->
          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-icon">⚡</span>
              <span class="metric-label">性能</span>
            </div>
            <div class="metric-grid">
              <div class="grid-item">
                <span class="grid-label">FPS</span>
                <span class="grid-value">{{ metrics.fps || '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">加载时间</span>
                <span class="grid-value">{{ metrics.pageLoadTime }}ms</span>
              </div>
            </div>
          </div>

          <!-- DOM Section -->
          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-icon">🌲</span>
              <span class="metric-label">DOM</span>
            </div>
            <div class="metric-grid">
              <div class="grid-item">
                <span class="grid-label">节点数</span>
                <span class="grid-value">{{ metrics.domNodes }}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">监听器</span>
                <span class="grid-value">~{{ metrics.eventListeners }}</span>
              </div>
            </div>
          </div>

          <!-- Network Section -->
          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-icon">🌐</span>
              <span class="metric-label">网络</span>
            </div>
            <div class="metric-grid">
              <div class="grid-item">
                <span class="grid-label">类型</span>
                <span class="grid-value">{{ metrics.networkType }}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">状态</span>
                <span class="grid-value" :class="{ online: metrics.online }">
                  {{ metrics.online ? '在线' : '离线' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Screen Section -->
          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-icon">🖥️</span>
              <span class="metric-label">屏幕</span>
            </div>
            <div class="metric-grid">
              <div class="grid-item">
                <span class="grid-label">分辨率</span>
                <span class="grid-value">{{ metrics.screenWidth }}x{{ metrics.screenHeight }}</span>
              </div>
              <div class="grid-item">
                <span class="grid-label">像素比</span>
                <span class="grid-value">{{ metrics.pixelRatio }}x</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="monitor-footer">
          <span class="footer-hint">每 5 秒自动更新</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useResourceMonitor } from '../composables/useResourceMonitor'

// Resource monitor
const {
  metrics,
  isLoading,
  memoryStatus,
  formatBytes,
  updateMetrics
} = useResourceMonitor()

// UI state
const isCollapsed = ref(false)

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Expose methods
defineExpose({
  toggleCollapsed,
  updateMetrics
})
</script>

<style scoped>
.resource-monitor {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 800;
  font-size: 11px;
}

.monitor-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.monitor-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 18px;
}

.warning-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.monitor-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 260px;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 8px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.refresh-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
}

.loading-state {
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(100, 116, 139, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 12px;
  color: #64748b;
}

.metrics-content {
  padding: 12px;
}

.metric-section {
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
}

.metric-section:last-child {
  margin-bottom: 0;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.metric-icon {
  font-size: 14px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  margin-bottom: 8px;
}

.metric-bar {
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.metric-bar-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.metric-bar-fill.status-warning {
  background: #f59e0b;
}

.metric-bar-fill.status-critical {
  background: #ef4444;
}

.metric-details {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
}

.detail-item {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grid-label {
  font-size: 10px;
  color: #64748b;
}

.grid-value {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.grid-value.online {
  color: #22c55e;
}

.monitor-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-hint {
  font-size: 10px;
  color: #475569;
  text-align: center;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .resource-monitor {
    top: auto;
    bottom: 180px;
    right: 10px;
  }

  .monitor-container {
    width: 240px;
  }
}
</style>
