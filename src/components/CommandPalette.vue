<template>
  <Transition name="modal">
    <div v-if="isOpen" class="command-palette-overlay" @click.self="close" @keydown.esc="close">
      <div class="command-palette" @click.stop>
        <!-- Search Input -->
        <div class="command-search">
          <span class="search-icon">🔍</span>
          <input
            ref="searchInputRef"
            :value="searchQuery"
            @input="updateSearchQuery"
            type="text"
            class="search-input"
            placeholder="输入命令或搜索... (Ctrl+Shift+P)"
            @keydown.down.prevent="navigate('down')"
            @keydown.up.prevent="navigate('up')"
            @keydown.enter.prevent="executeSelected"
            autofocus
          />
          <span v-if="searchQuery" class="search-count">{{ totalCommands }}</span>
        </div>

        <!-- Command List -->
        <div class="command-list" ref="commandListRef">
          <div v-if="groupedCommands.length === 0" class="command-empty">
            <span class="empty-icon">🔍</span>
            <span class="empty-text">未找到匹配的命令</span>
          </div>

          <div v-else>
            <div
              v-for="(group, groupIndex) in groupedCommands"
              :key="group.category"
              class="command-group"
            >
              <div class="group-header">
                <span class="group-title">{{ group.category }}</span>
                <span class="group-count">{{ group.commands.length }}</span>
              </div>
              <button
                v-for="(command, index) in group.commands"
                :key="command.id"
                :class="[
                  'command-item',
                  { selected: isSelected(command, groupIndex, index) },
                  { disabled: command.disabled }
                ]"
                :disabled="command.disabled"
                @click="command.action(); close()"
                @mouseenter="updateSelectedIndex(groupIndex, index)"
              >
                <span class="command-icon">{{ command.icon || '▶️' }}</span>
                <span class="command-label">{{ command.label }}</span>
                <span v-if="command.description" class="command-description">
                  {{ command.description }}
                </span>
                <span v-if="command.shortcut" class="command-shortcut">
                  {{ command.shortcut }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="command-footer">
          <div class="footer-hints">
            <span class="hint-item"><kbd>↑↓</kbd> 导航</span>
            <span class="hint-item"><kbd>Enter</kbd> 执行</span>
            <span class="hint-item"><kbd>Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, type PropType } from 'vue'
import type { Command } from '../composables/useCommandPalette'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  searchQuery: {
    type: String,
    required: true
  },
  selectedIndex: {
    type: Number,
    required: true
  },
  groupedCommands: {
    type: Array as PropType<Array<{ category: string; commands: Command[] }>>,
    required: true
  },
  totalCommands: {
    type: Number,
    required: true
  }
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedIndex': [value: number]
  close: []
  navigate: [direction: 'up' | 'down']
  executeSelected: []
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const commandListRef = ref<HTMLElement | null>(null)

// Update search query
const updateSearchQuery = (event: Event): void => {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
  emit('update:selectedIndex', 0)
}

// Watch for open state to focus input
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      if (searchInputRef.value) {
        searchInputRef.value.focus()
      }
    })
  }
})

// Check if command is selected
const isSelected = (command: Command, groupIndex: number, index: number): boolean => {
  let indexCounter = 0
  for (let i = 0; i < groupIndex; i++) {
    indexCounter += props.groupedCommands[i].commands.length
  }
  indexCounter += index
  return indexCounter === props.selectedIndex
}

// Update selected index on mouse enter
const updateSelectedIndex = (groupIndex: number, index: number): void => {
  let indexCounter = 0
  for (let i = 0; i < groupIndex; i++) {
    indexCounter += props.groupedCommands[i].commands.length
  }
  indexCounter += index
  emit('update:selectedIndex', indexCounter)
}

// Navigate commands
const navigate = (direction: 'up' | 'down'): void => {
  emit('navigate', direction)
  scrollToSelected()
}

// Execute selected command
const executeSelected = (): void => {
  emit('executeSelected')
}

// Close palette
const close = (): void => {
  emit('close')
}

// Scroll to selected command
const scrollToSelected = (): void => {
  nextTick(() => {
    if (!commandListRef.value) return

    const selectedElement = commandListRef.value.querySelector('.command-item.selected') as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// Handle global keyboard shortcuts
const handleKeydown = (event: KeyboardEvent): void => {
  // Ctrl+P or Cmd+P to open
  if ((event.ctrlKey || event.metaKey) && event.key === 'p' && !event.shiftKey) {
    event.preventDefault()
    // Let parent handle opening
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 3000;
}

.command-palette {
  width: 90%;
  max-width: 600px;
  max-height: 400px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.command-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.search-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 16px;
  outline: none;
}

.search-input::placeholder {
  color: #64748b;
}

.search-count {
  font-size: 12px;
  color: #64748b;
  background: rgba(15, 23, 42, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
}

.command-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.command-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.command-group {
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px 4px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-count {
  font-size: 10px;
  color: #64748b;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.command-item:hover:not(.disabled) {
  background: rgba(51, 65, 85, 0.6);
}

.command-item.selected:not(.disabled) {
  background: rgba(59, 130, 246, 0.2);
}

.command-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.command-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.command-label {
  flex: 1;
  font-weight: 500;
}

.command-description {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 8px;
}

.command-shortcut {
  font-size: 11px;
  color: #64748b;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.command-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-hints {
  display: flex;
  gap: 16px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.hint-item kbd {
  background: rgba(15, 23, 42, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .command-palette,
.modal-leave-active .command-palette {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .command-palette,
.modal-leave-to .command-palette {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

/* Scrollbar styling */
.command-list::-webkit-scrollbar {
  width: 8px;
}

.command-list::-webkit-scrollbar-track {
  background: transparent;
}

.command-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.command-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
