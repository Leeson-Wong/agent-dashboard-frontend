<template>
  <div class="performance-monitor" :class="{ 'monitor-minimized': !isExpanded }">
    <button
      class="monitor-toggle"
      @click="toggleExpanded"
      :class="{ active: isExpanded }"
      :title="isExpanded ? '隐藏性能监控' : '显示性能监控'"
    >
      <span class="monitor-icon">{{ isExpanded ? '📊' : '📈' }}</span>
      <span v-if="!isExpanded" class="mini-fps">{{ Math.round(metrics.fps) }} FPS</span>
    </button>

    <Transition name="expand">
      <div v-if="isExpanded" class="monitor-content">
        <div class="monitor-header">
          <span class="monitor-title">性能监控</span>
          <button
            class="monitor-close"
            @click="isExpanded = false"
            title="隐藏"
          >
            ×
          </button>
        </div>

        <!-- FPS Section -->
        <div class="monitor-section">
          <div class="section-header">
            <span class="section-label">帧率</span>
            <span :class="['fps-value', fpsStatus]">{{ Math.round(metrics.fps) }} FPS</span>
          </div>
          <div class="fps-chart">
            <div
              v-for="(value, index) in fpsBars"
              :key="index"
              class="fps-bar"
              :style="{ height: `${(value / 60) * 100}%` }"
              :class="fpsStatus"
            ></div>
          </div>
        </div>

        <!-- Memory Section -->
        <div class="monitor-section">
          <div class="section-header">
            <span class="section-label">内存</span>
            <span :class="['memory-value', memoryStatus]">{{ getMemoryString }}</span>
          </div>
          <div class="memory-bar-container">
            <div class="memory-bar">
              <div
                class="memory-used"
                :style="{ width: `${(metrics.memory.used / metrics.memory.limit) * 100}%` }"
                :class="memoryStatus"
              ></div>
            </div>
          </div>
        </div>

        <!-- Page Timing Section -->
        <div class="monitor-section" v-if="hasTimingData">
          <div class="section-header">
            <span class="section-label">页面加载</span>
          </div>
          <div class="timing-grid">
            <div class="timing-item">
              <span class="timing-label">DCL</span>
              <span class="timing-value">{{ metrics.timing.domContentLoaded }}ms</span>
            </div>
            <div class="timing-item">
              <span class="timing-label">Load</span>
              <span class="timing-value">{{ metrics.timing.load }}ms</span>
            </div>
            <div class="timing-item">
              <span class="timing-label">FP</span>
              <span class="timing-value">{{ metrics.timing.firstPaint }}ms</span>
            </div>
            <div class="timing-item">
              <span class="timing-label">FCP</span>
              <span class="timing-value">{{ metrics.timing.firstContentfulPaint }}ms</span>
            </div>
          </div>
        </div>

        <!-- Agent Stats -->
        <div class="monitor-section">
          <div class="section-header">
            <span class="section-label">数据</span>
          </div>
          <div class="data-stats">
            <div class="data-item">
              <span class="data-label">Agent 数</span>
              <span class="data-value">{{ metrics.agents }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">更新率</span>
              <span class="data-value">{{ metrics.updateRate }}/s</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="monitor-footer">
          <span class="footer-text">{{ updateText }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor'

const {
  metrics,
  getMemoryString,
  getFPSStatus,
  getMemoryStatus,
  setAgentCount,
  start,
  stop
} = usePerformanceMonitor(2000)

const isExpanded = ref(false)

// Toggle expanded state
const toggleExpanded = (): void => {
  isExpanded.value = !isExpanded.value
}

// FPS bars for chart
const fpsBars = computed(() => {
  return [...metrics.value.fpsTrend]
    .reverse()
    .concat(Array(10 - metrics.value.fpsTrend.length).fill(metrics.value.fps))
})

// Check if timing data is available
const hasTimingData = computed(() => {
  return metrics.value.timing.domContentLoaded > 0 ||
         metrics.value.timing.load > 0
})

// Update time text
const updateText = computed(() => {
  const now = new Date()
  return `更新于 ${now.toLocaleTimeString()}`
})

// Expose methods
defineExpose({
  setAgentCount
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 900;
  font-size: 12px;
}

.monitor-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.monitor-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.monitor-toggle.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.monitor-icon {
  font-size: 16px;
}

.mini-fps {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.monitor-content {
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  min-width: 220px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.monitor-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.monitor-close {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s;
}

.monitor-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.monitor-section {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.monitor-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.fps-value,
.memory-value {
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.fps-value.good,
.memory-value.good {
  color: #22c55e;
}

.fps-value.warning,
.memory-value.warning {
  color: #f59e0b;
}

.fps-value.poor,
.memory-value.poor {
  color: #ef4444;
}

.fps-chart {
  display: flex;
  gap: 2px;
  height: 30px;
  align-items: flex-end;
}

.fps-bar {
  flex: 1;
  min-height: 4px;
  border-radius: 2px;
  transition: all 0.3s;
}

.fps-bar.good {
  background: rgba(34, 197, 94, 0.6);
}

.fps-bar.warning {
  background: rgba(251, 191, 36, 0.6);
}

.fps-bar.poor {
  background: rgba(239, 68, 68, 0.6);
}

.memory-bar-container {
  margin-top: 6px;
}

.memory-bar {
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 4px;
  overflow: hidden;
}

.memory-used {
  height: 100%;
  transition: all 0.3s;
  border-radius: 4px;
}

.memory-used.good {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(34, 197, 94, 0.8));
}

.memory-used.warning {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.6), rgba(251, 191, 36, 0.8));
}

.memory-used.poor {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.8));
}

.timing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.timing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.timing-label {
  font-size: 10px;
  color: #64748b;
}

.timing-value {
  font-size: 11px;
  font-weight: 500;
  color: #cbd5e1;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.data-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.data-label {
  font-size: 10px;
  color: #64748b;
}

.data-value {
  font-size: 11px;
  font-weight: 500;
  color: #cbd5e1;
}

.monitor-footer {
  padding: 8px 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-text {
  font-size: 10px;
  color: #64748b;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  transform: translateY(0);
}
</style>
