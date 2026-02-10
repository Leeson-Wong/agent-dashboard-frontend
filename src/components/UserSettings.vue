<template>
  <Transition name="modal">
    <div v-if="show" class="settings-overlay" @click.self="$emit('close')">
      <div class="settings-dialog">
        <div class="dialog-header">
          <h2>⚙️ 用户设置</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="dialog-content">
          <!-- Appearance -->
          <div class="setting-category">
            <div class="category-header">
              <span class="category-icon">🎨</span>
              <span class="category-title">外观设置</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">主题模式</div>
                <div class="setting-description">选择界面的主题外观</div>
              </div>
              <select v-model="localSettings.theme" class="setting-select">
                <option value="dark">深色模式</option>
                <option value="light">浅色模式</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">紧凑模式</div>
                <div class="setting-description">减少界面元素间距</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.compactMode" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Data -->
          <div class="setting-category">
            <div class="category-header">
              <span class="category-icon">📊</span>
              <span class="category-title">数据设置</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">自动刷新</div>
                <div class="setting-description">定期自动刷新 Agent 数据</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.autoRefresh" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div v-if="localSettings.autoRefresh" class="setting-item nested">
              <div class="setting-info">
                <div class="setting-label">刷新间隔</div>
                <div class="setting-description">自动刷新的时间间隔</div>
              </div>
              <select v-model="localSettings.refreshInterval" class="setting-select">
                <option :value="5000">5 秒</option>
                <option :value="10000">10 秒</option>
                <option :value="30000">30 秒</option>
                <option :value="60000">60 秒</option>
              </select>
            </div>
          </div>

          <!-- Notifications -->
          <div class="setting-category">
            <div class="category-header">
              <span class="category-icon">🔔</span>
              <span class="category-title">通知设置</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">状态变化通知</div>
                <div class="setting-description">Agent 状态改变时显示通知</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.notifyStatusChange" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">错误通知</div>
                <div class="setting-description">Agent 发生错误时显示通知</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.notifyErrors" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">声音提醒</div>
                <div class="setting-description">通知时播放提示音</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.soundEnabled" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Display -->
          <div class="setting-category">
            <div class="category-header">
              <span class="category-icon">🖼️</span>
              <span class="category-title">显示设置</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">默认视图</div>
                <div class="setting-description">Agent 列表的默认显示模式</div>
              </div>
              <select v-model="localSettings.defaultView" class="setting-select">
                <option value="list">列表视图</option>
                <option value="grid">网格视图</option>
              </select>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">显示 Agent ID</div>
                <div class="setting-description">在列表中显示完整的 Agent ID</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.showFullAgentId" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">时间格式</div>
                <div class="setting-description">选择时间的显示格式</div>
              </div>
              <select v-model="localSettings.timeFormat" class="setting-select">
                <option value="relative">相对时间 (3分钟前)</option>
                <option value="absolute">绝对时间 (14:30:25)</option>
              </select>
            </div>
          </div>

          <!-- Advanced -->
          <div class="setting-category">
            <div class="category-header">
              <span class="category-icon">🔧</span>
              <span class="category-title">高级设置</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">调试模式</div>
                <div class="setting-description">显示详细的调试信息</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.debugMode" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">WS 日志</div>
                <div class="setting-description">在控制台显示 WebSocket 消息</div>
              </div>
              <label class="toggle-switch">
                <input v-model="localSettings.wsLogging" type="checkbox" />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">系统配置</div>
                <div class="setting-description">查看服务器运行时配置</div>
              </div>
              <button class="config-btn" @click="openConfigPanel">
                🔧 打开系统配置
              </button>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="resetToDefaults">恢复默认</button>
          <button class="btn-primary" @click="saveSettings">保存设置</button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Config Panel Modal -->
  <Transition name="modal">
    <div v-if="showConfigPanel" class="config-modal-overlay" @click.self="showConfigPanel = false">
      <ConfigPanel @close="showConfigPanel = false" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import ConfigPanel from './ConfigPanel.vue'
import type { UserSettings } from '../types/userSettings'

const defaultSettings: UserSettings = {
  theme: 'dark',
  compactMode: false,
  autoRefresh: false,
  refreshInterval: 30000,
  notifyStatusChange: true,
  notifyErrors: true,
  soundEnabled: false,
  defaultView: 'list',
  showFullAgentId: false,
  timeFormat: 'relative',
  debugMode: false,
  wsLogging: false,
}

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  settingsChange: [settings: UserSettings]
}>()

// Config panel visibility
const showConfigPanel = ref(false)

const openConfigPanel = () => {
  showConfigPanel.value = true
}

const localSettings = ref<UserSettings>({ ...defaultSettings })

// Load settings from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem('userSettings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      localSettings.value = { ...defaultSettings, ...parsed }
    } catch (e) {
      console.error('Failed to parse settings:', e)
    }
  }
})

// Save settings to localStorage
const saveSettings = (): void => {
  localStorage.setItem('userSettings', JSON.stringify(localSettings.value))
  emit('settingsChange', localSettings.value)
  emit('close')
}

// Reset to defaults
const resetToDefaults = (): void => {
  if (confirm('确定要恢复所有设置为默认值吗?')) {
    localSettings.value = { ...defaultSettings }
  }
}

// Apply theme
watch(() => localSettings.value.theme, (theme) => {
  const root = document.documentElement
  root.classList.remove('theme-dark', 'theme-light')

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
  } else {
    root.classList.add(`theme-${theme}`)
  }
}, { immediate: true })

// Apply compact mode
watch(() => localSettings.value.compactMode, (compact) => {
  document.body.classList.toggle('compact-mode', compact)
}, { immediate: true })

// Sync with external theme changes (from ThemeToggle button)
onMounted(() => {
  // Listen for theme changes from ThemeToggle
  const handleThemeChange = ((e: CustomEvent) => {
    if (e.detail && e.detail.theme && localSettings.value.theme !== e.detail.theme) {
      localSettings.value.theme = e.detail.theme
    }
  }) as EventListener

  window.addEventListener('theme-changed', handleThemeChange)

  // Also listen for storage changes (sync across tabs)
  const handleStorageChange = ((e: StorageEvent) => {
    if (e.key === 'userSettings' && e.newValue) {
      try {
        const settings = JSON.parse(e.newValue)
        if (settings.theme && settings.theme !== localSettings.value.theme) {
          localSettings.value.theme = settings.theme
        }
      } catch (err) {
        console.error('Failed to parse settings from storage:', err)
      }
    }
  }) as EventListener

  window.addEventListener('storage', handleStorageChange)

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('theme-changed', handleThemeChange)
    window.removeEventListener('storage', handleStorageChange)
  })
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.settings-dialog {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.dialog-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.setting-category {
  margin-bottom: 28px;
}

.setting-category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.category-icon {
  font-size: 20px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  gap: 16px;
}

.setting-item.nested {
  padding-left: 24px;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 12px;
  color: #64748b;
}

.setting-select {
  padding: 6px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
  flex-shrink: 0;
}

.setting-select:hover {
  border-color: rgba(100, 116, 139, 0.5);
}

.setting-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.setting-select option {
  background: #1e293b;
  color: #e2e8f0;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  transition: all 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: #94a3b8;
  transition: all 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background-color: #60a5fa;
}

.toggle-switch:hover .toggle-slider {
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-switch:hover input:checked + .toggle-slider {
  border-color: rgba(59, 130, 246, 0.6);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.btn-primary:hover {
  background: rgba(59, 130, 246, 0.5);
  border-color: rgba(59, 130, 246, 0.6);
}

.btn-secondary {
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.btn-secondary:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

.config-btn {
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.config-btn:hover {
  background: rgba(59, 130, 246, 0.4);
  border-color: rgba(59, 130, 246, 0.6);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .settings-dialog,
.modal-leave-active .settings-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .settings-dialog,
.modal-leave-to .settings-dialog {
  transform: scale(0.95);
  opacity: 0;
}

/* Config Modal Overlay */
.config-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
