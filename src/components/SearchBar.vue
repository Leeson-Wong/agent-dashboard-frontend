<template>
  <div class="search-bar" :class="{ 'is-expanded': isExpanded, 'has-query': searchQuery.length > 0 }">
    <!-- Search Input -->
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索 Agent..."
        @keydown="handleKeydown"
        @focus="isExpanded = true"
      />
      <button
        v-if="searchQuery"
        class="clear-btn"
        @click="clearSearch"
        title="清除搜索"
      >
        ×
      </button>
    </div>

    <!-- Search Options -->
    <Transition name="expand">
      <div v-if="isExpanded" class="search-options">
        <!-- Match Count -->
        <div v-if="matchCount !== null" class="match-info">
          <span class="match-count">{{ matchCount }}</span>
          <span class="match-label">个匹配</span>
          <button
            v-if="matchCount > 0"
            class="nav-btn"
            @click="navigateToNext"
            title="下一个匹配 (Enter)"
          >
            ↓
          </button>
          <button
            v-if="matchCount > 0"
            class="nav-btn"
            @click="navigateToPrev"
            title="上一个匹配 (Shift+Enter)"
          >
            ↑
          </button>
        </div>

        <!-- Options -->
        <div class="search-toggles">
          <label class="toggle-label" title="区分大小写">
            <input
              v-model="caseSensitive"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span class="toggle-text">Aa</span>
          </label>

          <label class="toggle-label" title="正则表达式模式">
            <input
              v-model="regexMode"
              type="checkbox"
              class="toggle-checkbox"
            />
            <span class="toggle-text">.*</span>
          </label>
        </div>
      </div>
    </Transition>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useSearchHighlight } from '../composables/useSearchHighlight'

interface Props {
  onSearch?: (query: string, caseSensitive: boolean, regexMode: boolean) => number | null
  onNextMatch?: () => void
  onPrevMatch?: () => void
}

const props = defineProps<Props>()

// Search highlight
const {
  searchQuery,
  isCaseSensitive,
  isRegexMode,
  countMatches,
  clearSearch
} = useSearchHighlight()

// Aliases for template
const caseSensitive = isCaseSensitive
const regexMode = isRegexMode

// UI state
const isExpanded = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const matchCount = ref<number | null>(null)
const errorMessage = ref('')

// Handle keydown
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      navigateToPrev()
    } else {
      navigateToNext()
    }
    event.preventDefault()
  } else if (event.key === 'Escape') {
    if (searchQuery.value) {
      clearSearchQuery()
    } else {
      isExpanded.value = false
    }
    event.preventDefault()
  }
}

// Navigate to next match
const navigateToNext = (): void => {
  if (props.onNextMatch) {
    props.onNextMatch()
  }
}

// Navigate to previous match
const navigateToPrev = (): void => {
  if (props.onPrevMatch) {
    props.onPrevMatch()
  }
}

// Clear search
const clearSearchQuery = (): void => {
  searchQuery.value = ''
  matchCount.value = null
  errorMessage.value = ''
}

// Watch for search changes
watch([searchQuery, caseSensitive, regexMode], () => {
  errorMessage.value = ''

  if (props.onSearch) {
    try {
      matchCount.value = props.onSearch(
        searchQuery.value,
        caseSensitive.value,
        regexMode.value
      )
    } catch (error) {
      if (regexMode.value) {
        errorMessage.value = '无效的正则表达式'
        matchCount.value = null
      }
    }
  }
})

// Focus search on mount
onMounted(() => {
  // Optional: Auto-focus on mount
  // searchInputRef.value?.focus()
})

// Expose methods
defineExpose({
  focus: () => searchInputRef.value?.focus(),
  clear: clearSearchQuery
})
</script>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 500px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  transition: all 0.2s;
}

.search-bar:focus-within .search-input-wrapper {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  font-size: 14px;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 14px;
}

.search-input::placeholder {
  color: #64748b;
}

.clear-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(100, 116, 139, 0.2);
  border: none;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

.search-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-count {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.match-label {
  font-size: 12px;
  color: #94a3b8;
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
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: rgba(100, 116, 139, 0.4);
  color: #e2e8f0;
}

.search-toggles {
  display: flex;
  gap: 4px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-label:hover {
  background: rgba(51, 65, 85, 0.5);
}

.toggle-checkbox {
  display: none;
}

.toggle-text {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.toggle-checkbox:checked + .toggle-text {
  color: #3b82f6;
}

.error-message {
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 12px;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Responsive */
@media (max-width: 768px) {
  .search-bar {
    max-width: none;
  }

  .search-options {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .match-info {
    justify-content: center;
  }

  .search-toggles {
    justify-content: center;
  }
}
</style>
