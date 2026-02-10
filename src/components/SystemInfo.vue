<template>
  <div class="system-info" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button
      class="info-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开系统信息' : '收起系统信息'"
    >
      <span class="toggle-icon">💻</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="info-container">
        <!-- Header -->
        <div class="info-header">
          <span class="header-title">系统信息</span>
          <button
            class="refresh-btn"
            @click="refresh"
            title="刷新信息"
          >
            🔄
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span class="loading-text">加载中...</span>
        </div>

        <!-- Content -->
        <div v-else class="info-content">
          <!-- Browser Section -->
          <div class="info-section">
            <div class="section-header">
              <span class="section-icon">🌐</span>
              <span class="section-title">浏览器</span>
            </div>
            <div class="section-body">
              <div class="info-row">
                <span class="info-label">名称</span>
                <span class="info-value">{{ browserName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">版本</span>
                <span class="info-value">{{ browser?.version }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">语言</span>
                <span class="info-value">{{ browser?.language }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">平台</span>
                <span class="info-value">{{ browser?.platform }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">在线状态</span>
                <span class="info-value" :class="{ online: browser?.onLine }">
                  {{ browser?.onLine ? '在线' : '离线' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Screen Section -->
          <div class="info-section">
            <div class="section-header">
              <span class="section-icon">🖥️</span>
              <span class="section-title">屏幕</span>
            </div>
            <div class="section-body">
              <div class="info-row">
                <span class="info-label">分辨率</span>
                <span class="info-value">{{ screen?.width }}x{{ screen?.height }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">可用大小</span>
                <span class="info-value">{{ screen?.availWidth }}x{{ screen?.availHeight }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">像素比</span>
                <span class="info-value">{{ screen?.pixelRatio }}x</span>
              </div>
              <div class="info-row">
                <span class="info-label">方向</span>
                <span class="info-value">{{ getOrientationLabel(screen?.orientation) }}</span>
              </div>
            </div>
          </div>

          <!-- Performance Section -->
          <div v-if="perfInfo" class="info-section">
            <div class="section-header">
              <span class="section-icon">⚡</span>
              <span class="section-title">性能</span>
            </div>
            <div class="section-body">
              <div class="info-row">
                <span class="info-label">加载时间</span>
                <span class="info-value">{{ formatTime(perfInfo.loadTime) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">DOM 内容加载</span>
                <span class="info-value">{{ formatTime(perfInfo.domContentLoaded) }}</span>
              </div>
              <div v-if="perfInfo.firstPaint" class="info-row">
                <span class="info-label">首次绘制</span>
                <span class="info-value">{{ formatTime(perfInfo.firstPaint) }}</span>
              </div>
              <div v-if="perfInfo.firstContentfulPaint" class="info-row">
                <span class="info-label">首次内容绘制</span>
                <span class="info-value">{{ formatTime(perfInfo.firstContentfulPaint) }}</span>
              </div>
            </div>
          </div>

          <!-- Memory Section -->
          <div v-if="memory" class="info-section">
            <div class="section-header">
              <span class="section-icon">🧠</span>
              <span class="section-title">内存</span>
            </div>
            <div class="section-body">
              <div class="info-row">
                <span class="info-label">已使用</span>
                <span class="info-value">{{ formatBytes(memory.usedJSHeapSize) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">总计</span>
                <span class="info-value">{{ formatBytes(memory.totalJSHeapSize) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">限制</span>
                <span class="info-value">{{ formatBytes(memory.jsHeapSizeLimit) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">使用率</span>
                <span class="info-value">{{ getMemoryPercent() }}%</span>
              </div>
            </div>
          </div>

          <!-- Network Section -->
          <div v-if="connection" class="info-section">
            <div class="section-header">
              <span class="section-icon">📡</span>
              <span class="section-title">网络</span>
            </div>
            <div class="section-body">
              <div class="info-row">
                <span class="info-label">类型</span>
                <span class="info-value">{{ getNetworkTypeLabel(connection.effectiveType) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">下行速度</span>
                <span class="info-value">~{{ connection.downlink }} Mbps</span>
              </div>
              <div class="info-row">
                <span class="info-label">往返时延</span>
                <span class="info-value">~{{ connection.rtt }} ms</span>
              </div>
              <div class="info-row">
                <span class="info-label">省流量模式</span>
                <span class="info-value">{{ connection.saveData ? '是' : '否' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="info-footer">
          <span class="footer-text">信息仅供参考</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSystemInfo } from '../composables/useSystemInfo'

// System info
const {
  isLoading,
  browser,
  screen,
  performance: perfInfo,
  memory,
  connection,
  formatBytes,
  formatTime,
  loadInfo,
  refresh
} = useSystemInfo()

// UI state
const isCollapsed = ref(false)

// Computed properties
const browserName = computed(() => browser.value?.name || 'Unknown')
const browserVersion = computed(() => browser.value?.version || 'Unknown')
const osPlatform = computed(() => browser.value?.platform || 'Unknown')

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Get orientation label
const getOrientationLabel = (orientation?: string): string => {
  if (!orientation) return '未知'
  const labels: Record<string, string> = {
    'portrait-primary': '竖屏（主）',
    'portrait-secondary': '竖屏（副）',
    'landscape-primary': '横屏（主）',
    'landscape-secondary': '横屏（副）',
    'portrait': '竖屏',
    'landscape': '横屏'
  }
  return labels[orientation] || orientation
}

// Get memory percent
const getMemoryPercent = (): string => {
  if (!memory.value) return '0'
  const percent = (memory.value.usedJSHeapSize / memory.value.jsHeapSizeLimit) * 100
  return percent.toFixed(1)
}

// Get network type label
const getNetworkTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'slow-2g': '2G (慢)',
    '2g': '2G',
    '3g': '3G',
    '4g': '4G',
    'unknown': '未知'
  }
  return labels[type] || type
}

// Initialize on mount
onMounted(() => {
  loadInfo()
})

// Expose methods
defineExpose({
  toggleCollapsed,
  refresh
})
</script>

<style scoped>
.system-info {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 800;
  font-size: 11px;
}

.info-toggle {
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

.info-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 18px;
}

.info-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 280px;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 8px;
}

.info-header {
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

.info-content {
  padding: 8px 0;
}

.info-section {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.info-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 14px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 11px;
  color: #e2e8f0;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-weight: 500;
}

.info-value.online {
  color: #22c55e;
}

.info-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-text {
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

/* Scrollbar */
.info-container::-webkit-scrollbar {
  width: 6px;
}

.info-container::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.info-container::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.info-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .system-info {
    bottom: 10px;
    left: 10px;
  }

  .info-container {
    width: 260px;
  }
}
</style>
