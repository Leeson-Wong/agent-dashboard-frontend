<template>
  <div class="global-search" :class="{ 'is-active': isActive }">
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="isActive"
        class="search-overlay"
        @click="close"
      ></div>
    </Transition>

    <!-- Search Panel -->
    <Transition name="slide-down">
      <div v-if="isActive" class="search-panel">
        <!-- Search Header -->
        <div class="search-header">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索 Agent... (支持正则表达式)"
              @keydown="handleKeydown"
              autofocus
            />
            <button
              v-if="searchQuery"
              class="clear-btn"
              @click="searchQuery = ''"
              title="清除"
            >
              ×
            </button>
          </div>

          <!-- Search Options -->
          <div class="search-options">
            <label class="search-option" title="区分大小写">
              <input
                v-model="caseSensitive"
                type="checkbox"
              />
              <span class="option-label">Aa</span>
            </label>
            <label class="search-option" title="正则表达式">
              <input
                v-model="regexMode"
                type="checkbox"
              />
              <span class="option-label">. *</span>
            </label>
            <label class="search-option" title="搜索所有字段">
              <input
                v-model="searchAllFields"
                type="checkbox"
              />
              <span class="option-label">全部</span>
            </label>
          </div>
        </div>

        <!-- Results -->
        <div class="search-results">
          <!-- Loading State -->
          <div v-if="isSearching" class="search-loading">
            <div class="spinner"></div>
            <span>搜索中...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="errorMessage" class="search-error">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{{ errorMessage }}</span>
          </div>

          <!-- No Results -->
          <div v-else-if="searchQuery && results.length === 0" class="search-empty">
            <span class="empty-icon">🔍</span>
            <span class="empty-text">未找到匹配的 Agent</span>
          </div>

          <!-- Results List -->
          <div v-else-if="results.length > 0" class="results-list">
            <div class="results-header">
              <span class="results-count">{{ results.length }} 个结果</span>
              <div class="results-nav">
                <button
                  class="nav-btn"
                  @click="navigatePrev"
                  :disabled="currentIndex === null"
                  title="上一个 (Shift+Enter)"
                >
                  ↑
                </button>
                <span class="current-index">
                  {{ currentIndex !== null ? currentIndex + 1 : '-' }} / {{ results.length }}
                </span>
                <button
                  class="nav-btn"
                  @click="navigateNext"
                  :disabled="results.length === 0"
                  title="下一个 (Enter)"
                >
                  ↓
                </button>
              </div>
            </div>

            <div class="results-items">
              <div
                v-for="(result, index) in results"
                :key="result.agentId"
                :class="['result-item', { 'is-current': index === currentIndex }]"
                @click="selectAgent(result.agentId)"
                @mouseenter="currentIndex = index"
              >
                <div class="result-status">
                  <div :class="['status-dot', result.status]" :title="result.status"></div>
                </div>

                <div class="result-content">
                  <HighlightedText
                    :text="result.role || result.agentId"
                    :query="displayQuery"
                    :case-sensitive="caseSensitive"
                    :regex-mode="regexMode"
                  />
                  <div class="result-meta">
                    <span class="framework">{{ result.framework }}</span>
                    <span class="language">{{ result.language }}</span>
                  </div>
                  <div v-if="result.matchField" class="result-match-info">
                    <span class="match-field">匹配: {{ result.matchField }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Initial State -->
          <div v-else class="search-initial">
            <div class="initial-icon">🔍</div>
            <div class="initial-title">全局搜索</div>
            <div class="initial-hint">输入关键词搜索 Agent</div>
            <div class="initial-shortcuts">
              <span class="shortcut-item"><kbd>/</kbd> 打开搜索</span>
              <span class="shortcut-item"><kbd>Esc</kbd> 关闭</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="search-footer">
          <span class="footer-hint">支持正则表达式搜索</span>
          <button class="close-btn" @click="close" title="关闭 (Esc)">
            ✕
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import HighlightedText from './HighlightedText.vue'
import type { AgentState } from '../shared/types'

interface SearchResult {
  agentId: string
  role?: string
  framework?: string
  language?: string
  status: string
  matchField?: string
}

interface Props {
  agents: AgentState[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectAgent: [agentId: string]
}>()

// State
const isActive = ref(false)
const searchQuery = ref('')
const displayQuery = ref('')
const caseSensitive = ref(false)
const regexMode = ref(false)
const searchAllFields = ref(true)
const isSearching = ref(false)
const errorMessage = ref('')
const results = ref<SearchResult[]>([])
const currentIndex = ref<number | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Open search
const open = (): void => {
  isActive.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

// Close search
const close = (): void => {
  isActive.value = false
  searchQuery.value = ''
  results.value = []
  currentIndex.value = null
  errorMessage.value = ''
}

// Toggle search
const toggle = (): void => {
  if (isActive.value) {
    close()
  } else {
    open()
  }
}

// Perform search
const performSearch = async (): Promise<void> => {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  isSearching.value = true
  errorMessage.value = ''
  currentIndex.value = null

  // Simulate async search for UX
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    const searchResults: SearchResult[] = []

    for (const agent of props.agents) {
      const fieldsToSearch = searchAllFields.value
        ? [
            { name: 'agentId', value: agent.agentId },
            { name: 'role', value: agent.role || '' },
            { name: 'framework', value: agent.framework || '' },
            { name: 'language', value: agent.language || '' },
            { name: 'currentActivity', value: agent.currentActivity || '' },
            { name: 'currentTool', value: agent.currentTool || '' },
            { name: 'serverId', value: agent.serverId }
          ]
        : [
            { name: 'agentId', value: agent.agentId },
            { name: 'role', value: agent.role || '' }
          ]

      for (const field of fieldsToSearch) {
        if (matchesQuery(field.value)) {
          searchResults.push({
            agentId: agent.agentId,
            role: agent.role,
            framework: agent.framework,
            language: agent.language,
            status: agent.status,
            matchField: field.name
          })
          break
        }
      }
    }

    results.value = searchResults
    if (searchResults.length > 0) {
      currentIndex.value = 0
    }
  } catch (error) {
    if (regexMode.value) {
      errorMessage.value = '无效的正则表达式'
    } else {
      errorMessage.value = '搜索失败'
    }
  } finally {
    isSearching.value = false
  }
}

// Check if value matches search query
const matchesQuery = (text: string): boolean => {
  if (!text) return false

  try {
    if (regexMode.value) {
      const flags = caseSensitive.value ? 'g' : 'gi'
      const regex = new RegExp(searchQuery.value, flags)
      return regex.test(text)
    } else {
      const query = caseSensitive.value ? searchQuery.value : searchQuery.value.toLowerCase()
      const target = caseSensitive.value ? text : text.toLowerCase()
      return target.includes(query)
    }
  } catch {
    return false
  }
}

// Navigate to next result
const navigateNext = (): void => {
  if (results.value.length === 0) return
  if (currentIndex.value === null || currentIndex.value >= results.value.length - 1) {
    currentIndex.value = 0
  } else {
    currentIndex.value = currentIndex.value + 1
  }
}

// Navigate to previous result
const navigatePrev = (): void => {
  if (results.value.length === 0) return
  if (currentIndex.value === null || currentIndex.value <= 0) {
    currentIndex.value = results.value.length - 1
  } else {
    currentIndex.value = currentIndex.value - 1
  }
}

// Select agent
const selectAgent = (agentId: string): void => {
  emit('selectAgent', agentId)
  close()
}

// Handle keydown
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      navigatePrev()
    } else {
      navigateNext()
    }
    event.preventDefault()
  } else if (event.key === 'Escape') {
    close()
    event.preventDefault()
  } else if (event.key === 'ArrowDown') {
    navigateNext()
    event.preventDefault()
  } else if (event.key === 'ArrowUp') {
    navigatePrev()
    event.preventDefault()
  }
}

// Watch for search query changes
watch(searchQuery, () => {
  displayQuery.value = searchQuery.value
  performSearch()
})

// Global keyboard shortcut
const handleGlobalKeydown = (event: KeyboardEvent): void => {
  // Ignore if typing in input
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  if (event.key === '/' && !isActive.value) {
    event.preventDefault()
    open()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Expose methods
defineExpose({
  open,
  close,
  toggle
})
</script>

<style scoped>
.global-search {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  pointer-events: none;
}

.global-search.is-active {
  pointer-events: auto;
}

.search-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
}

.search-panel {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  max-height: 70vh;
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-header {
  padding: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  margin-bottom: 12px;
}

.search-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  font-size: 18px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 16px;
}

.search-input::placeholder {
  color: #64748b;
}

.clear-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.2);
  border: none;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

.search-options {
  display: flex;
  gap: 8px;
}

.search-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.search-option:hover {
  background: rgba(51, 65, 85, 0.5);
}

.option-label {
  color: #94a3b8;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.search-loading,
.search-error,
.search-empty,
.search-initial {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(100, 116, 139, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon,
.initial-icon {
  font-size: 48px;
  opacity: 0.7;
}

.error-text,
.empty-text {
  font-size: 14px;
  color: #94a3b8;
}

.initial-title {
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.initial-hint {
  font-size: 13px;
  color: #64748b;
}

.initial-shortcuts {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.shortcut-item kbd {
  padding: 4px 8px;
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 11px;
}

.results-list {
  display: flex;
  flex-direction: column;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.results-count {
  font-size: 12px;
  color: #94a3b8;
}

.results-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-index {
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  color: #94a3b8;
}

.results-items {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover,
.result-item.is-current {
  background: rgba(51, 65, 85, 0.5);
}

.result-item.is-current {
  border-left: 2px solid #3b82f6;
}

.result-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online,
.status-dot.ready {
  background: #22c55e;
}

.status-dot.offline {
  background: #64748b;
}

.status-dot.paused {
  background: #f59e0b;
}

.status-dot.error {
  background: #ef4444;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.framework,
.language {
  font-size: 11px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.result-match-info {
  margin-top: 4px;
}

.match-field {
  font-size: 10px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.search-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-hint {
  font-size: 11px;
  color: #475569;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* Scrollbar */
.search-results::-webkit-scrollbar,
.results-items::-webkit-scrollbar {
  width: 8px;
}

.search-results::-webkit-scrollbar-track,
.results-items::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.search-results::-webkit-scrollbar-thumb,
.results-items::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.search-results::-webkit-scrollbar-thumb:hover,
.results-items::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
