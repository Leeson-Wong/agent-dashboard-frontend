<template>
  <div class="copy-menu">
    <button
      class="copy-menu-trigger"
      @click="toggleMenu"
      :class="{ active: showMenu }"
      title="复制"
    >
      <span class="trigger-icon">📋</span>
    </button>

    <Transition name="dropdown">
      <div v-if="showMenu" class="copy-dropdown" @click.outside="closeMenu">
        <div class="dropdown-header">
          <span class="dropdown-title">复制为</span>
        </div>
        <div class="dropdown-section">
          <button class="dropdown-item" @click="copyAs('text')">
            <span class="item-icon">📄</span>
            <span class="item-text">纯文本</span>
            <span class="item-shortcut">简洁格式</span>
          </button>
          <button class="dropdown-item" @click="copyAs('json')">
            <span class="item-icon">{}</span>
            <span class="item-text">JSON</span>
            <span class="item-shortcut">结构化数据</span>
          </button>
          <button class="dropdown-item" @click="copyAs('markdown')">
            <span class="item-icon">M↓</span>
            <span class="item-text">Markdown</span>
            <span class="item-shortcut">文档格式</span>
          </button>
          <button class="dropdown-item" @click="copyAs('csv')">
            <span class="item-icon">📊</span>
            <span class="item-text">CSV</span>
            <span class="item-shortcut">表格数据</span>
          </button>
        </div>
        <div v-if="showCopiedToast" class="copy-toast">
          <span class="toast-icon">✓</span>
          <span class="toast-text">已复制到剪贴板</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '../composables/useClipboard'

interface Props {
  data: Record<string, unknown> | unknown[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  copied: [format: string, text: string]
}>()

const {
  showCopiedToast,
  copyToClipboard,
  formatAsText,
  formatAsJSON,
  formatAsCSV,
  formatAsMarkdown
} = useClipboard()

const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const copyAs = async (format: 'text' | 'json' | 'csv' | 'markdown'): Promise<void> => {
  let text = ''

  if (Array.isArray(props.data)) {
    // For arrays, use table format
    text = format === 'text' || format === 'csv'
      ? formatAsCSV(props.data[0] as Record<string, unknown>) // Use first item for now
      : format === 'json'
        ? JSON.stringify(props.data, null, 2)
        : formatAsMarkdown(props.data[0] as Record<string, unknown>)
  } else {
    // For single objects
    switch (format) {
      case 'text':
        text = formatAsText(props.data)
        break
      case 'json':
        text = formatAsJSON(props.data)
        break
      case 'csv':
        text = formatAsCSV(props.data)
        break
      case 'markdown':
        text = formatAsMarkdown(props.data)
        break
    }
  }

  const success = await copyToClipboard(text)
  if (success) {
    emit('copied', format, text)
  }

  closeMenu()
}
</script>

<style scoped>
.copy-menu {
  position: relative;
  display: inline-block;
}

.copy-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.copy-menu-trigger:hover {
  background: rgba(71, 85, 105, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  transform: scale(1.05);
}

.copy-menu-trigger.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.trigger-icon {
  font-size: 14px;
}

.copy-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 220px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.dropdown-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-section {
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: rgba(51, 65, 85, 0.6);
}

.dropdown-item:active {
  background: rgba(51, 65, 85, 0.8);
  transform: scale(0.98);
}

.item-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-weight: 500;
}

.item-shortcut {
  font-size: 10px;
  color: #64748b;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

.copy-toast {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 4px 8px 8px;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
}

.toast-icon {
  color: #22c55e;
  font-size: 14px;
}

.toast-text {
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
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
</style>
