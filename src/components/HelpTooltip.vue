<template>
  <div class="help-tooltip-wrapper">
    <!-- Help button -->
    <button
      class="help-button"
      @click="toggleHelp"
      :class="{ active: isOpen }"
      :title="isOpen ? '关闭帮助' : '打开帮助'"
    >
      <span class="help-icon">?</span>
    </button>

    <!-- Help panel -->
    <Transition name="slide-fade">
      <div v-if="isOpen" class="help-panel" @click.self="closeHelp">
        <div class="help-content">
          <!-- Header -->
          <div class="help-header">
            <h3>快速帮助</h3>
            <button class="close-btn" @click="closeHelp">×</button>
          </div>

          <!-- Search -->
          <div class="help-search">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索帮助主题..."
              class="search-input"
            />
          </div>

          <!-- Categories -->
          <div class="help-categories">
            <div
              v-for="category in filteredCategories"
              :key="category.id"
              class="help-category"
            >
              <button
                class="category-toggle"
                @click="toggleCategory(category.id)"
                :class="{ expanded: expandedCategories.has(category.id) }"
              >
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.items.length }}</span>
              </button>

              <Transition name="expand">
                <div v-if="expandedCategories.has(category.id)" class="category-items">
                  <div
                    v-for="item in category.items"
                    :key="item.id"
                    class="help-item"
                    @click="showHelpItem(item)"
                  >
                    <span class="item-icon">{{ item.icon }}</span>
                    <span class="item-title">{{ item.title }}</span>
                    <span class="item-shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div class="help-footer">
            <button class="reset-btn" @click="resetTooltips" title="重置所有提示">
              🔄 重置提示
            </button>
            <button class="close-footer-btn" @click="closeHelp">
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHelpTooltip, type HelpTooltip } from '../composables/useHelpTooltip'

const {
  resetDismissed
} = useHelpTooltip()

// UI state
const isOpen = ref(false)
const searchQuery = ref('')
const expandedCategories = ref<Set<string>>(new Set(['shortcuts', 'navigation']))

// Help data
const categories = ref([
  {
    id: 'shortcuts',
    name: '键盘快捷键',
    icon: '⌨️',
    items: [
      { id: 'shortcut-refresh', title: '刷新数据', shortcut: 'Ctrl+R', icon: '🔄' },
      { id: 'shortcut-search', title: '搜索 Agent', shortcut: '/', icon: '🔍' },
      { id: 'shortcut-command', title: '命令面板', shortcut: 'Ctrl+Shift+P', icon: '⌘' },
      { id: 'shortcut-settings', title: '打开设置', shortcut: ',', icon: '⚙️' },
      { id: 'shortcut-help', title: '键盘帮助', shortcut: '?', icon: '?' }
    ]
  },
  {
    id: 'navigation',
    name: '导航操作',
    icon: '🧭',
    items: [
      { id: 'nav-select', title: '选择 Agent', icon: '🖱️' },
      { id: 'nav-detail', title: '查看详情', icon: '📄' },
      { id: 'nav-logs', title: '查看日志', icon: '📋' },
      { id: 'nav-tasks', title: '查看任务', icon: '✅' }
    ]
  },
  {
    id: 'view',
    name: '视图控制',
    icon: '👁️',
    items: [
      { id: 'view-compact', title: '紧凑模式', icon: '🔲' },
      { id: 'view-theme', title: '切换主题', icon: '🌓' },
      { id: 'view-fullscreen', title: '全屏模式', icon: '⛶' }
    ]
  },
  {
    id: 'features',
    name: '功能说明',
    icon: '✨',
    items: [
      { id: 'feat-sound', title: '声音通知', icon: '🔊' },
      { id: 'feat-export', title: '数据导出', icon: '💾' },
      { id: 'feat-share', title: '分享视图', icon: '🔗' }
    ]
  }
])

// Computed
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value

  const query = searchQuery.value.toLowerCase()
  return categories.value.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.title.toLowerCase().includes(query)
    )
  })).filter(category => category.items.length > 0)
})

// Methods
const toggleHelp = (): void => {
  isOpen.value = !isOpen.value
}

const closeHelp = (): void => {
  isOpen.value = false
}

const toggleCategory = (categoryId: string): void => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const showHelpItem = (item: any): void => {
  // In a real implementation, this would show detailed help
  console.log('Show help for:', item)
  closeHelp()
}

const resetTooltips = (): void => {
  resetDismissed()
  alert('所有帮助提示已重置')
}

// Expose
defineExpose({
  toggleHelp,
  closeHelp
})
</script>

<style scoped>
.help-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.help-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.help-button:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.help-button.active {
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.help-button.active:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
}

.help-icon {
  line-height: 1;
}

/* Help panel */
.help-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 120px);
  z-index: 1000;
}

.help-content {
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.help-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

/* Search */
.help-search {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.search-input::placeholder {
  color: #64748b;
}

/* Categories */
.help-categories {
  padding: 8px 0;
  overflow-y: auto;
  flex: 1;
}

.help-category {
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.help-category:last-child {
  border-bottom: none;
}

.category-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.category-toggle:hover {
  background: rgba(51, 65, 85, 0.5);
}

.category-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.category-count {
  font-size: 11px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
}

.category-items {
  background: rgba(15, 23, 42, 0.3);
}

.help-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 10px 32px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid transparent;
}

.help-item:hover {
  background: rgba(51, 65, 85, 0.5);
  border-left-color: #3b82f6;
}

.item-icon {
  font-size: 14px;
}

.item-title {
  flex: 1;
  font-size: 13px;
  color: #cbd5e1;
}

.item-shortcut {
  font-size: 11px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

/* Footer */
.help-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  gap: 8px;
}

.reset-btn,
.close-footer-btn {
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover,
.close-footer-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
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
.help-categories::-webkit-scrollbar {
  width: 6px;
}

.help-categories::-webkit-scrollbar-track {
  background: transparent;
}

.help-categories::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.help-categories::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

/* Responsive */
@media (max-width: 640px) {
  .help-panel {
    top: 70px;
    right: 10px;
    width: 280px;
  }
}
</style>
