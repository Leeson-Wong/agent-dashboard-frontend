<template>
  <div class="quick-actions">
    <button
      class="quick-actions-trigger"
      @click="toggleMenu"
      :class="{ active: showMenu }"
      title="快速操作"
    >
      <span class="trigger-icon">⚡</span>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="showMenu" class="actions-menu" @click.outside="closeMenu">
        <div class="menu-section">
          <div class="section-title">数据操作</div>
          <button class="menu-item" @click="handleAction('refresh')">
            <span class="item-icon">🔄</span>
            <span class="item-text">刷新数据</span>
            <span class="item-shortcut">Ctrl+R</span>
          </button>
          <button class="menu-item" @click="handleAction('autoRefresh')">
            <span class="item-icon" :class="{ enabled: userSettings?.autoRefresh }">
              {{ userSettings?.autoRefresh ? '✓' : '○' }}
            </span>
            <span class="item-text">自动刷新</span>
          </button>
        </div>

        <div class="menu-section">
          <div class="section-title">视图</div>
          <button class="menu-item" @click="handleAction('toggleTheme')">
            <span class="item-icon">{{ themeIcon }}</span>
            <span class="item-text">切换主题</span>
            <span class="item-shortcut">🌙/☀️</span>
          </button>
          <button class="menu-item" @click="handleAction('fullscreen')">
            <span class="item-icon">⛶</span>
            <span class="item-text">全屏模式</span>
            <span class="item-shortcut">F11</span>
          </button>
        </div>

        <div class="menu-section">
          <div class="section-title">工具</div>
          <button class="menu-item" @click="handleAction('keyboard')">
            <span class="item-icon">⌨️</span>
            <span class="item-text">键盘快捷键</span>
            <span class="item-shortcut">?</span>
          </button>
          <button class="menu-item" @click="handleAction('settings')">
            <span class="item-icon">⚙️</span>
            <span class="item-text">用户设置</span>
            <span class="item-shortcut">,</span>
          </button>
          <button class="menu-item" @click="handleAction('about')">
            <span class="item-icon">ℹ️</span>
            <span class="item-text">关于</span>
            <span class="item-shortcut">Ctrl+I</span>
          </button>
        </div>

        <div class="menu-section">
          <div class="section-title">系统</div>
          <button class="menu-item" @click="handleAction('health')">
            <span class="item-icon" :class="{ 'health-ok': isHealthy, 'health-error': !isHealthy }">
              {{ isHealthy ? '✓' : '✗' }}
            </span>
            <span class="item-text">系统状态</span>
          </button>
          <button class="menu-item" @click="handleAction('stats')">
            <span class="item-icon">📊</span>
            <span class="item-text">会话统计</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { UserSettings } from '../types/userSettings'

interface Props {
  userSettings?: UserSettings | null
  isHealthy?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
  toggleTheme: []
  toggleFullscreen: []
  openSettings: []
  openAbout: []
  openKeyboardHelp: []
  close: []
}>()

const showMenu = ref(false)

// Theme icon based on current theme
const themeIcon = computed(() => {
  // This will be updated by listening to theme changes
  return '🌙'
})

// Toggle menu
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

// Close menu
const closeMenu = () => {
  showMenu.value = false
}

// Handle action
const handleAction = (action: string) => {
  closeMenu()

  switch (action) {
    case 'refresh':
      emit('refresh')
      break
    case 'autoRefresh':
      emit('openSettings')
      // Auto-scroll to auto-refresh setting
      setTimeout(() => {
        const autoRefreshElement = document.querySelector('.setting-item:has(.toggle-switch input[value="autoRefresh"])')
        if (autoRefreshElement) {
          autoRefreshElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      break
    case 'toggleTheme':
      emit('toggleTheme')
      break
    case 'fullscreen':
      emit('toggleFullscreen')
      break
    case 'settings':
      emit('openSettings')
      break
    case 'about':
      emit('openAbout')
      break
    case 'keyboard':
      emit('openKeyboardHelp')
      break
    case 'health':
      // Open health status modal
      const healthElement = document.querySelector('.health-status')
      if (healthElement instanceof HTMLElement) {
        healthElement.click()
      }
      break
    case 'stats':
      // Open session stats modal
      const statsElement = document.querySelector('.session-stats')
      if (statsElement instanceof HTMLElement) {
        statsElement.click()
      }
      break
  }
}

// Listen for theme changes to update icon
const updateThemeIcon = () => {
  const root = document.documentElement
  themeIcon.value = root.classList.contains('theme-light') ? '☀️' : '🌙'
}

// Watch for theme changes
const observer = new MutationObserver(updateThemeIcon)
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
})

// Cleanup on unmount (though this component stays mounted)
</script>

<style scoped>
.quick-actions {
  position: relative;
  display: inline-block;
}

.quick-actions-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.quick-actions-trigger:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  transform: scale(1.05);
}

.quick-actions-trigger.active {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
}

.trigger-icon {
  font-size: 18px;
  display: block;
  transition: transform 0.3s ease;
}

.quick-actions-trigger:hover .trigger-icon {
  transform: scale(1.1) rotate(20deg);
}

.quick-actions-trigger.active .trigger-icon {
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Dropdown Menu */
.actions-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 1000;
}

.menu-section {
  padding: 8px 0;
}

.menu-section:not(:last-child) {
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.section-title {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: rgba(51, 65, 85, 0.5);
}

.menu-item:active {
  background: rgba(51, 65, 85, 0.8);
  transform: scale(0.98);
}

.item-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.item-icon.health-ok {
  color: #22c55e;
}

.item-icon.health-error {
  color: #ef4444;
}

.item-icon.enabled {
  color: #22c55e;
}

.item-text {
  flex: 1;
  font-weight: 500;
}

.item-shortcut {
  font-size: 11px;
  color: #64748b;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Glow effect for trigger */
.quick-actions-trigger::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.quick-actions-trigger:hover::before {
  width: 150%;
  height: 150%;
}

.quick-actions-trigger.active::before {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
}
</style>
