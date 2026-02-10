<template>
  <div class="scratchpad" :class="{ 'is-collapsed': isCollapsed, 'is-floating': isFloating }">
    <!-- Toggle Button -->
    <button
      class="scratchpad-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开便签板' : '收起便签板'"
    >
      <span class="toggle-icon">📝</span>
      <span v-if="isCollapsed && isDirty" class="dirty-indicator">●</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="scratchpad-container">
        <!-- Header -->
        <div class="scratchpad-header">
          <span class="header-title">便签板</span>
          <div class="header-actions">
            <button
              class="header-btn"
              @click="handleFloat"
              :title="isFloating ? '固定位置' : '浮动模式'"
            >
              {{ isFloating ? '📌' : '📍' }}
            </button>
            <button
              class="header-btn"
              @click="handleExport"
              title="导出为文本文件"
            >
              💾
            </button>
            <button
              class="header-btn"
              @click="handleClear"
              title="清空"
            >
              🗑️
            </button>
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
          <span class="stat-item">{{ wordCount }} 词</span>
          <span class="stat-item">{{ lineCount }} 行</span>
          <span v-if="isDirty" class="stat-item status-dirty">未保存</span>
          <span v-else class="stat-item status-saved">已保存</span>
        </div>

        <!-- Editor -->
        <textarea
          ref="textareaRef"
          class="scratchpad-textarea"
          placeholder="在这里输入笔记...&#10;&#10;支持自动保存到本地存储"
          v-model="localContent"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>

        <!-- Footer -->
        <div class="scratchpad-footer">
          <span class="footer-hint">自动保存已启用</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useScratchpad } from '../composables/useScratchpad'

const {
  content,
  isDirty,
  wordCount,
  lineCount,
  load,
  save,
  clear,
  update,
  updateStats,
  exportAsText
} = useScratchpad()

// UI state
const isCollapsed = ref(false)
const isFloating = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Local content (v-model)
const localContent = computed({
  get: () => content.value,
  set: (value) => update(value)
})

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
  if (!isCollapsed.value) {
    // Focus textarea when expanding
    setTimeout(() => {
      textareaRef.value?.focus()
    }, 100)
  }
}

// Toggle float mode
const handleFloat = (): void => {
  isFloating.value = !isFloating.value
}

// Handle input
const handleInput = (): void => {
  updateStats()
}

// Handle keydown
const handleKeydown = (event: KeyboardEvent): void => {
  // Ctrl+S to save manually
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    save()
  }
  // Escape to collapse
  if (event.key === 'Escape') {
    isCollapsed.value = true
  }
}

// Handle export
const handleExport = (): void => {
  exportAsText()
}

// Handle clear
const handleClear = (): void => {
  clear()
  updateStats()
}

// Initialize on mount
onMounted(() => {
  load()
  updateStats()
})

// Expose methods
defineExpose({
  toggleCollapsed,
  save,
  clear
})
</script>

<style scoped>
.scratchpad {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  z-index: 800;
  font-size: 12px;
}

.scratchpad.is-floating {
  top: 20px;
  transform: none;
}

.scratchpad-toggle {
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

.scratchpad-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 18px;
}

.dirty-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  color: #f59e0b;
  font-size: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.scratchpad-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 300px;
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.scratchpad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-btn {
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

.header-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

.stats-bar {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.stat-item {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}

.stat-item.status-dirty {
  color: #f59e0b;
}

.stat-item.status-saved {
  color: #22c55e;
}

.scratchpad-textarea {
  flex: 1;
  min-height: 200px;
  max-height: 350px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.8);
  border: none;
  color: #e2e8f0;
  font-size: 13px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  line-height: 1.6;
  resize: none;
}

.scratchpad-textarea::placeholder {
  color: #475569;
}

.scratchpad-textarea:focus {
  outline: none;
}

.scratchpad-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-hint {
  font-size: 10px;
  color: #475569;
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
  .scratchpad {
    right: 10px;
    left: 10px;
    width: auto;
  }

  .scratchpad-container {
    width: 100%;
    max-width: none;
  }
}
</style>
