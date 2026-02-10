<template>
  <Transition name="modal">
    <div v-if="show" class="keyboard-help-overlay" @click.self="$emit('close')">
      <div class="keyboard-help-dialog">
        <div class="dialog-header">
          <h2>⌨️ 键盘快捷键</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="dialog-content">
          <div class="shortcuts-list">
            <div v-for="category in categorizedShortcuts" :key="category.name" class="category">
              <div class="category-header">{{ category.name }}</div>
              <div class="shortcuts">
                <div v-for="shortcut in category.shortcuts" :key="shortcut.key" class="shortcut-item">
                  <div class="shortcut-keys">
                    <kbd v-for="(key, index) in shortcut.keys" :key="index" class="key">
                      {{ key }}
                    </kbd>
                  </div>
                  <div class="shortcut-description">{{ shortcut.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <div class="hint">按 ESC 或 ? 关闭此对话框</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKeyboard, type KeyboardShortcut } from '../composables/useKeyboard'

interface Props {
  show: boolean
  shortcuts: KeyboardShortcut[]
}

interface ShortcutDisplay {
  keys: string[]
  description: string
}

interface Category {
  name: string
  shortcuts: ShortcutDisplay[]
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const { formatShortcut } = useKeyboard()

// Categorize shortcuts
const categorizedShortcuts = computed<Category[]>(() => {
  const categories: Category[] = [
    { name: '面板操作', shortcuts: [] },
    { name: 'Agent 操作', shortcuts: [] },
    { name: '其他', shortcuts: [] },
  ]

  for (const shortcut of props.shortcuts) {
    const display: ShortcutDisplay = {
      keys: formatShortcut(shortcut).split(' + '),
      description: shortcut.description,
    }

    // Categorize based on description
    if (shortcut.description.includes('面板') || shortcut.description.includes('关闭') || shortcut.description.includes('日志')) {
      categories[0].shortcuts.push(display)
    } else if (shortcut.description.includes('Agent')) {
      categories[1].shortcuts.push(display)
    } else {
      categories[2].shortcuts.push(display)
    }
  }

  return categories.filter(c => c.shortcuts.length > 0)
})
</script>

<style scoped>
.keyboard-help-overlay {
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

.keyboard-help-dialog {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
  max-height: calc(80vh - 100px);
  overflow-y: auto;
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

.category {
  margin-bottom: 24px;
}

.category:last-child {
  margin-bottom: 0;
}

.category-header {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  min-width: 120px;
}

.key {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 12px;
  color: #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.shortcut-description {
  font-size: 14px;
  color: #cbd5e1;
}

.dialog-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  text-align: center;
}

.hint {
  font-size: 12px;
  color: #64748b;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .keyboard-help-dialog,
.modal-leave-active .keyboard-help-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .keyboard-help-dialog,
.modal-leave-to .keyboard-help-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
