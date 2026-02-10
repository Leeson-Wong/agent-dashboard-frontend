<template>
  <div class="compact-mode-toggle">
    <button
      class="toggle-btn"
      @click="cycleLevel"
      :title="getTitle()"
      :class="{ compact: isCompact, ultra: isUltraCompact }"
    >
      <span class="toggle-icon">{{ getIcon() }}</span>
      <span class="toggle-label">{{ getLabel() }}</span>
    </button>

    <!-- Tooltip -->
    <Transition name="fade">
      <div v-if="showTooltip" class="tooltip">
        {{ getTooltip() }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCompactMode, type CompactLevel } from '../composables/useCompactMode'

const {
  compactLevel,
  isCompact,
  isUltraCompact,
  cycleLevel
} = useCompactMode()

const showTooltip = ref(false)
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null

const getIcon = (): string => {
  switch (compactLevel.value) {
    case 'normal': return '🔲'
    case 'compact': return '▦'
    case 'ultra': return '▣'
    default: return '🔲'
  }
}

const getLabel = (): string => {
  switch (compactLevel.value) {
    case 'normal': return '正常'
    case 'compact': return '紧凑'
    case 'ultra': return '超紧凑'
    default: return '正常'
  }
}

const getTitle = (): string => {
  return `切换显示密度（当前：${getLabel()}）`
}

const getTooltip = (): string => {
  const tooltips: Record<CompactLevel, string> = {
    normal: '正常显示模式',
    compact: '紧凑模式 - 显示更多内容',
    ultra: '超紧凑模式 - 最大化内容显示'
  }
  return tooltips[compactLevel.value]
}

// Show tooltip briefly on cycle
const showBriefTooltip = (): void => {
  showTooltip.value = true

  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }

  tooltipTimeout = setTimeout(() => {
    showTooltip.value = false
  }, 2000)
}
</script>

<style scoped>
.compact-mode-toggle {
  position: relative;
  display: inline-block;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.toggle-btn.compact {
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.toggle-btn.compact:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
}

.toggle-btn.ultra {
  border-color: rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.toggle-btn.ultra:hover {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.5);
}

.toggle-icon {
  font-size: 16px;
  line-height: 1;
}

.toggle-label {
  font-weight: 500;
}

/* Tooltip */
.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: #e2e8f0;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(100, 116, 139, 0.3);
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

/* Responsive */
@media (max-width: 768px) {
  .toggle-label {
    display: none;
  }
}
</style>
