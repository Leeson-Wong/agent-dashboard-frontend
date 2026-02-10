<template>
  <div :class="['agent-list-panel', getCollapseClass()]">
    <div class="panel-header">
      <div class="header-title">
        <h2>Agent 状态</h2>
        <span class="agent-count">{{ filteredCount }}/{{ totalCount }}</span>
      </div>
      <button
        class="collapse-btn"
        @click="toggleCollapse"
        :title="isCollapsed ? '展开面板 (Ctrl+])' : '折叠面板 (Ctrl+['"
        :aria-label="isCollapsed ? '展开面板' : '折叠面板'"
        :aria-expanded="!isCollapsed"
      >
        <span class="collapse-icon" :class="{ rotated: !isCollapsed }">◀</span>
      </button>
    </div>

    <!-- Collapsed State - Quick Stats -->
    <div v-if="isCollapsed" class="panel-collapsed-view">
      <div class="collapsed-stats">
        <div class="collapsed-stat online" title="在线">
          <span class="stat-icon">🟢</span>
          <span class="stat-value">{{ stats.online }}</span>
        </div>
        <div class="collapsed-stat busy" title="忙碌">
          <span class="stat-icon">🟠</span>
          <span class="stat-value">{{ stats.busy }}</span>
        </div>
        <div class="collapsed-stat thinking" title="思考">
          <span class="stat-icon">🟣</span>
          <span class="stat-value">{{ stats.thinking }}</span>
        </div>
        <div class="collapsed-stat error" title="错误">
          <span class="stat-icon">🔴</span>
          <span class="stat-value">{{ stats.error }}</span>
        </div>
      </div>
      <div class="collapsed-count" title="总 Agent 数">
        <span class="count-label">总计</span>
        <span class="count-value">{{ totalCount }}</span>
      </div>
    </div>

    <!-- Expanded State - Full Content -->
    <template v-if="!isCollapsed">
    <div class="panel-header-stats">
      <div class="stats">
        <span class="stat online">在线: {{ stats.online }}</span>
        <span class="stat busy">忙碌: {{ stats.busy }}</span>
        <span class="stat thinking">思考: {{ stats.thinking }}</span>
        <span class="stat error">错误: {{ stats.error }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section" role="search" aria-label="Agent 筛选和搜索">
      <div class="search-box" :class="{ 'has-suggestions': searchSuggestions.length > 0 }">
        <label for="agent-search" class="sr-only">搜索 Agent</label>
        <input
          id="agent-search"
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索 Agent... (按 / 聚焦, ESC 清空)"
          class="search-input"
          :class="{ 'searching': isSearching }"
          aria-label="搜索 Agent"
          aria-describedby="search-hint"
          aria-busy="isSearching"
          @keydown="handleSearchKeydown"
          @focus="showSearchSuggestions = true"
          @blur="handleSearchBlur"
        />
        <span id="search-hint" class="sr-only">按斜杠键聚焦，按 ESC 键清空</span>
        <span v-if="isSearching" class="search-indicator" aria-hidden="true">⏳</span>
        <button
          v-if="searchQuery"
          class="clear-search-btn"
          @click="searchQuery = ''; showSearchSuggestions = false"
          title="清空搜索"
          aria-label="清空搜索"
        >
          ×
        </button>

        <!-- Search History Suggestions -->
        <Transition name="dropdown">
          <div
            v-if="showSearchSuggestions && searchSuggestions.length > 0"
            class="search-suggestions"
            role="listbox"
            aria-label="搜索历史"
          >
            <div class="suggestions-header">
              <span class="suggestions-title">搜索历史</span>
              <button
                class="clear-history-btn"
                @click="handleClearHistory"
                title="清空搜索历史"
                aria-label="清空搜索历史"
              >
                清空
              </button>
            </div>
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="suggestion"
              :class="['suggestion-item', { selected: index === searchSuggestionIndex }]"
              role="option"
              :aria-selected="index === searchSuggestionIndex"
              @click="selectSuggestion(suggestion)"
              @mouseenter="searchSuggestionIndex = index"
            >
              <span class="suggestion-icon">🕐</span>
              <span class="suggestion-text">{{ suggestion }}</span>
              <button
                class="suggestion-remove"
                @click.stop="removeFromHistory(suggestion)"
                title="移除此历史"
                aria-label="移除此历史"
              >
                ×
              </button>
            </div>
          </div>
        </Transition>
      </div>
      <div class="filter-dropdowns" role="group" aria-label="筛选器">
        <label for="status-filter" class="sr-only">按状态筛选</label>
        <select id="status-filter" v-model="statusFilter" class="filter-select" aria-label="按状态筛选">
          <option value="">所有状态</option>
          <option value="online">在线</option>
          <option value="ready">就绪</option>
          <option value="busy">忙碌</option>
          <option value="thinking">思考中</option>
          <option value="offline">离线</option>
          <option value="error">错误</option>
          <option value="paused">已暂停</option>
        </select>
        <label for="framework-filter" class="sr-only">按框架筛选</label>
        <select id="framework-filter" v-model="frameworkFilter" class="filter-select" aria-label="按框架筛选">
          <option value="">所有框架</option>
          <option value="crewai">CrewAI</option>
          <option value="langchain">LangChain</option>
          <option value="autogen">AutoGen</option>
          <option value="autogpt">AutoGPT</option>
        </select>
        <label for="time-filter" class="sr-only">按时间范围筛选</label>
        <select id="time-filter" v-model="timeRangeFilter" class="filter-select" aria-label="按时间范围筛选">
          <option value="">所有时间</option>
          <option value="5m">最近5分钟</option>
          <option value="1h">最近1小时</option>
          <option value="24h">最近24小时</option>
          <option value="7d">最近7天</option>
        </select>
        <label for="favorite-filter" class="sr-only">按收藏筛选</label>
        <select id="favorite-filter" v-model="favoriteFilter" class="filter-select" aria-label="按收藏筛选">
          <option value="">全部 Agent</option>
          <option value="true">⭐ 仅显示收藏</option>
        </select>
      </div>
      <!-- Active Filter Tags -->
      <div v-if="activeFilters.length > 0" class="active-filters" role="group" aria-label="活动过滤器">
        <span class="active-filters-label">活动过滤器:</span>
        <button
          v-for="filter in activeFilters"
          :key="filter.key"
          :class="['filter-tag', filter.type]"
          @click="removeFilter(filter)"
          :aria-label="`移除筛选: ${filter.label}`"
          type="button"
        >
          {{ filter.label }}
          <span class="filter-tag-remove" aria-hidden="true">×</span>
        </button>
        <button class="clear-all-filters-btn" @click="clearAllFilters" title="清除所有过滤器" aria-label="清除所有筛选条件">
          清除全部
        </button>
      </div>
      <div class="sort-controls" role="group" aria-label="排序和视图控制">
        <label for="sort-select" class="sr-only">排序方式</label>
        <select id="sort-select" v-model="sortBy" class="sort-select" aria-label="排序方式">
          <option value="status">按状态</option>
          <option value="name">按名称</option>
          <option value="lastActivity">按活动时间</option>
        </select>
        <button
          class="sort-order-btn"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? '升序' : '降序'"
          :aria-label="sortOrder === 'asc' ? '当前为升序，点击切换为降序' : '当前为降序，点击切换为升序'"
          :aria-pressed="sortOrder === 'asc'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
        <button
          class="view-mode-btn"
          @click="viewMode = viewMode === 'list' ? 'grid' : 'list'"
          :title="viewMode === 'list' ? '切换到网格视图' : '切换到列表视图'"
          :aria-label="viewMode === 'list' ? '当前为列表视图，点击切换为网格视图' : '当前为网格视图，点击切换为列表视图'"
          aria-pressed="false"
        >
          {{ viewMode === 'list' ? '▦' : '☰' }}
        </button>
        <ExportMenu
          :agents="filteredAgents"
          :selected-ids="Array.from(selectedAgentIds)"
        />
        <button
          class="compare-btn"
          :disabled="selectedAgentIds.size < 2"
          :title="selectedAgentIds.size < 2 ? '需要选择 2 个 Agent 进行对比' : '对比选中的 Agent'"
          :aria-label="selectedAgentIds.size < 2 ? '需要选择 2 个 Agent 进行对比' : '对比选中的 Agent'"
          @click="openComparison"
        >
          ⚖️ 对比 ({{ selectedAgentIds.size }})
        </button>
        <div class="preset-buttons" role="group" aria-label="过滤器预设">
          <button
            class="preset-btn preset-save-btn"
            @click="openSavePresetDialog"
            title="保存当前过滤器为预设"
            aria-label="保存当前过滤器为预设"
          >
            💾
          </button>
          <div class="preset-load-wrapper">
            <button
              class="preset-btn preset-load-btn"
              @click="showFilterPresetsMenu = !showFilterPresetsMenu"
              :class="{ active: showFilterPresetsMenu }"
              title="加载过滤器预设"
              aria-label="加载过滤器预设"
              aria-expanded="showFilterPresetsMenu"
            >
              📋
            </button>
            <Transition name="dropdown">
              <div
                v-if="showFilterPresetsMenu"
                class="preset-menu"
                @click.outside="showFilterPresetsMenu = false"
              >
                <div class="preset-menu-header">
                  <span class="preset-menu-title">过滤器预设</span>
                </div>
                <div v-if="filterPresets.length === 0" class="preset-empty">
                  <span class="preset-empty-icon">📁</span>
                  <span class="preset-empty-text">暂无预设</span>
                  <span class="preset-empty-hint">点击 💾 保存当前过滤器</span>
                </div>
                <div v-else class="preset-list">
                  <div
                    v-for="preset in filterPresets"
                    :key="preset.id"
                    class="preset-item"
                  >
                    <button
                      class="preset-load-item"
                      @click="loadPreset(preset)"
                      :title="`加载预设: ${preset.name}`"
                    >
                      <span class="preset-item-icon">📌</span>
                      <span class="preset-item-name">{{ preset.name }}</span>
                    </button>
                    <button
                      class="preset-delete-btn"
                      @click="deletePreset(preset.id)"
                      title="删除此预设"
                      aria-label="删除此预设"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Save Preset Dialog -->
      <Transition name="fade">
        <div v-if="showSavePresetDialog" class="preset-dialog-overlay" @click.self="closeSavePresetDialog">
          <div class="preset-dialog">
            <div class="preset-dialog-header">
              <h3>保存过滤器预设</h3>
              <button class="preset-dialog-close" @click="closeSavePresetDialog" aria-label="关闭对话框">×</button>
            </div>
            <div class="preset-dialog-body">
              <label for="preset-name-input" class="preset-dialog-label">预设名称</label>
              <input
                id="preset-name-input"
                ref="presetNameInputRef"
                v-model="presetNameInput"
                type="text"
                class="preset-dialog-input"
                placeholder="例如: 我的常用过滤器..."
                maxlength="50"
                @keydown.enter="confirmSavePreset"
                @keydown.escape="closeSavePresetDialog"
              />
              <div class="preset-dialog-info">
                <span class="preset-dialog-info-icon">ℹ️</span>
                <span class="preset-dialog-info-text">将保存当前所有过滤器设置</span>
              </div>
            </div>
            <div class="preset-dialog-footer">
              <button class="preset-dialog-btn preset-dialog-btn-cancel" @click="closeSavePresetDialog">
                取消
              </button>
              <button
                class="preset-dialog-btn preset-dialog-btn-save"
                @click="confirmSavePreset"
                :disabled="!presetNameInput.trim()"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Active filter tags -->
      <div v-if="hasActiveFilters" class="active-filters">
        <div v-if="searchQuery" class="filter-tag">
          <span class="tag-label">搜索:</span>
          <span class="tag-value">{{ searchQuery }}</span>
          <button class="tag-remove" @click="searchQuery = ''" title="清除搜索">×</button>
        </div>
        <div v-if="statusFilter" class="filter-tag">
          <span class="tag-label">状态:</span>
          <span class="tag-value">{{ getStatusLabel(statusFilter) }}</span>
          <button class="tag-remove" @click="statusFilter = ''" title="清除状态筛选">×</button>
        </div>
        <div v-if="frameworkFilter" class="filter-tag">
          <span class="tag-label">框架:</span>
          <span class="tag-value">{{ getFrameworkLabel(frameworkFilter) }}</span>
          <button class="tag-remove" @click="frameworkFilter = ''" title="清除框架筛选">×</button>
        </div>
        <div v-if="timeRangeFilter" class="filter-tag">
          <span class="tag-label">时间:</span>
          <span class="tag-value">{{ getTimeRangeLabel(timeRangeFilter) }}</span>
          <button class="tag-remove" @click="timeRangeFilter = ''" title="清除时间筛选">×</button>
        </div>
        <div v-if="favoriteFilter" class="filter-tag">
          <span class="tag-label">收藏:</span>
          <span class="tag-value">仅收藏</span>
          <button class="tag-remove" @click="favoriteFilter = ''" title="清除收藏筛选">×</button>
        </div>
      </div>

      <button
        v-if="hasActiveFilters"
        class="clear-filters-btn"
        @click="clearFilters"
        title="清除筛选"
      >
        重置筛选
      </button>
    </div>

    <!-- Batch operations toolbar -->
    <div v-if="selectedAgentIds.size > 0" class="batch-toolbar" role="region" aria-live="polite" :aria-label="`已选择 ${selectedAgentIds.size} 个 Agent 的批量操作工具栏`">
      <span class="batch-count">已选择 {{ selectedAgentIds.size }} 个 Agent</span>
      <div class="batch-actions" role="group" aria-label="批量操作">
        <button class="batch-btn batch-pause" @click="batchPause" title="批量暂停" aria-label="批量暂停选中的 Agent">
          ⏸ 暂停
        </button>
        <button class="batch-btn batch-resume" @click="batchResume" title="批量恢复" aria-label="批量恢复选中的 Agent">
          ▶️ 恢复
        </button>
        <button class="batch-btn batch-stop" @click="batchStop" title="批量停止" aria-label="批量停止选中的 Agent">
          ⏹ 停止
        </button>
        <button class="batch-btn batch-delete" @click="batchDelete" title="批量删除" aria-label="批量删除选中的 Agent">
          🗑️ 删除
        </button>
        <button class="batch-btn batch-cancel" @click="clearSelection" title="取消选择" aria-label="取消选择">
          ✕
        </button>
      </div>
    </div>

    <div :class="['agent-list', `agent-list-${viewMode}`, { 'has-selection': selectedAgentIds.size > 0 }]" role="list" aria-label="Agent 列表">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="skeleton-list" role="status" aria-live="polite" aria-label="正在加载 Agent 列表">
        <AgentSkeleton v-for="i in 6" :key="i" :mode="viewMode" />
      </div>

      <!-- Actual Agent List -->
      <template v-else>
      <div
        v-for="agent in filteredAgents"
        :key="agent.agentId"
        :data-agent-id="agent.agentId"
        :class="['agent-item', densityClass, {
          selected: selectedAgentId === agent.agentId,
          'batch-selected': selectedAgentIds.has(agent.agentId),
          focused: keyboardNav?.focusedItem?.agentId === agent.agentId
        }]"
        @click="selectAgent(agent.agentId)"
        @dblclick="handleDoubleClick(agent)"
        @contextmenu.prevent="handleContextMenu(agent, $event)"
        @keydown="handleAgentKeydown($event, agent.agentId)"
        role="listitem"
        :aria-label="getAgentAriaLabel(agent)"
        :aria-selected="selectedAgentId === agent.agentId"
        tabindex="0"
      >
        <label :for="`checkbox-${agent.agentId}`" class="sr-only">选择 {{ agent.agentId }}</label>
        <input
          v-if="isVisible('checkbox')"
          :id="`checkbox-${agent.agentId}`"
          type="checkbox"
          :class="['agent-checkbox', { visible: selectedAgentIds.size > 0 }]"
          :checked="selectedAgentIds.has(agent.agentId)"
          @click.stop="toggleAgentSelection(agent.agentId)"
          :aria-label="`选择 ${agent.agentId}`"
        />
        <div v-if="isVisible('status')" class="agent-status-indicator" :class="agent.status" :aria-label="`状态: ${getStatusText(agent.status)}`"></div>

        <button
          v-if="isVisible('favorite')"
          :class="['favorite-btn', { active: agent.isFavorite, animating: animatingFavorites.has(agent.agentId) }]"
          @click.stop="toggleFavorite(agent)"
          :title="agent.isFavorite ? '取消收藏' : '收藏'"
          :aria-label="agent.isFavorite ? `取消收藏 ${agent.agentId}` : `收藏 ${agent.agentId}`"
          :aria-pressed="agent.isFavorite"
        >
          <span class="favorite-icon" aria-hidden="true">{{ agent.isFavorite ? '⭐' : '☆' }}</span>
          <span v-if="animatingFavorites.has(agent.agentId)" class="favorite-particles" aria-hidden="true">
            <span class="particle"></span>
            <span class="particle"></span>
            <span class="particle"></span>
          </span>
        </button>

        <div class="agent-info">
          <div class="agent-name" v-html="highlightedAgentName(agent)"></div>
          <div class="agent-meta">
            <span v-if="isVisible('framework')" class="framework">{{ agent.framework }}</span>
            <span v-if="isVisible('language')" class="language">{{ agent.language }}</span>
          </div>
          <div v-if="isVisible('activity') && agent.currentActivity" class="agent-activity" v-html="highlightedActivity(agent)"></div>
          <div v-if="isVisible('tool') && agent.currentTool" class="agent-tool">
            工具: {{ agent.currentTool }}
          </div>
          <div v-if="isVisible('tags') && parsedAgentTags(agent).length > 0" class="agent-tags">
            <span
              v-for="tag in parsedAgentTags(agent)"
              :key="tag"
              :class="['agent-tag', getAgentTagColor(tag)]"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div v-if="isVisible('time')" class="agent-time">
          {{ formatTime(agent.lastActivity) }}
        </div>

        <button
          v-if="isVisible('actions')"
          class="quick-actions-btn"
          @click="toggleDropdown(agent.agentId, $event)"
          title="快捷操作"
        >
          ⋯
        </button>

        <div
          v-if="activeDropdownAgentId === agent.agentId"
          class="quick-actions-dropdown"
        >
          <div class="dropdown-item" @click="viewAgentDetails(agent.agentId, $event)">
            <span class="dropdown-icon">👁️</span>
            <span>查看详情</span>
          </div>
          <div class="dropdown-item" @click="copyAgentId(agent.agentId, $event)">
            <span class="dropdown-icon">📋</span>
            <span>复制 ID</span>
          </div>
          <div class="dropdown-item" @click="copyAgentName(agent, $event)">
            <span class="dropdown-icon">📝</span>
            <span>复制名称</span>
          </div>
        </div>
      </div>
      </template>

      <div v-if="!loading && filteredAgents.length === 0" class="empty-state" role="status" aria-live="polite">
        <div class="empty-state-content">
          <div class="empty-state-icon" aria-hidden="true">
            {{ getEmptyStateIcon() }}
          </div>
          <h3 class="empty-state-title" id="empty-state-title">{{ getEmptyStateTitle() }}</h3>
          <p class="empty-state-message" aria-describedby="empty-state-title">{{ getEmptyStateMessage() }}</p>
          <div v-if="shouldShowAction()" class="empty-state-action">
            <button v-if="searchQuery || statusFilter || frameworkFilter || timeRangeFilter || favoriteFilter"
                    class="empty-state-btn"
                    @click="clearAllFilters()"
                    aria-label="清除所有筛选条件">
              清除过滤器
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Operations Panel -->
    <BatchOperationsPanel
      :agents="filteredAgents"
      :selected-ids="selectedAgentIds"
      @clear-selection="selectedAgentIds.clear()"
      @operation-complete="handleBatchOperationComplete"
    />

    <!-- Agent Comparison Modal -->
    <AgentComparison
      :is-open="showComparison"
      :agent-a="comparisonAgents[0] || null"
      :agent-b="comparisonAgents[1] || null"
      @close="closeComparison"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, withDefaults } from 'vue'
import type { AgentState } from '../../shared/types'
import { getWebSocketConnection } from '../api/WebSocketConnection'
import { useToast } from '../composables/useToast'
import { useKeyboard } from '../composables/useKeyboard'
import { useSearchHistory } from '../composables/useSearchHistory'
import { useContextMenu, type ContextMenuItem } from '../composables/useContextMenu'
import { useAgentCopy, COPY_FORMATS, type CopyFormat } from '../composables/useAgentCopy'
import { useDisplayDensity } from '../composables/useDisplayDensity'
import { useColumnVisibility } from '../composables/useColumnVisibility'
import { useViewMode } from '../composables/useViewMode'
import { usePanelCollapse } from '../composables/usePanelCollapse'
import { useFilterPresets } from '../composables/useFilterPresets'
import type { FilterPreset } from '../composables/useFilterPresets'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'
import ExportMenu from './ExportMenu.vue'
import BatchOperationsPanel from './BatchOperationsPanel.vue'
import AgentComparison from './AgentComparison.vue'
import AgentSkeleton from './AgentSkeleton.vue'

// Toast notifications
const { success } = useToast()

// Keyboard shortcuts
const { registerShortcut } = useKeyboard()

// Search history
const {
  history: searchHistory,
  showSuggestions: showSearchSuggestions,
  selectedIndex: searchSuggestionIndex,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getSuggestions,
  navigateSuggestions,
  resetSelection
} = useSearchHistory()

// Filter presets
const {
  presets: filterPresets,
  showPresetsMenu: showFilterPresetsMenu,
  savePreset: saveFilterPreset,
  deletePreset: deleteFilterPreset,
  updatePresetName: updateFilterPresetName
} = useFilterPresets()

// Context menu
const { openMenu } = useContextMenu()

// Display density
const { densityClass } = useDisplayDensity()

// Column visibility
const { isVisible } = useColumnVisibility()

// View mode
const { currentMode: viewMode } = useViewMode()

// Panel collapse
const { isCollapsed, toggle: toggleCollapse, getCollapseClass } = usePanelCollapse()

// Agent copy
const { copyAgent, getCopySummary } = useAgentCopy()

// Keyboard navigation for agent list (will be setup after computed properties)
let keyboardNav: ReturnType<typeof useKeyboardNavigation> | null = null

// Preset management state
const showSavePresetDialog = ref(false)
const presetNameInput = ref('')
const presetNameInputRef = ref<HTMLInputElement | null>(null)

// Props
interface Props {
  agents: AgentState[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  selectAgent: [agentId: string]
}>()

// State
const selectedAgentId = ref<string | null>(null)
const selectedAgentIds = ref<Set<string>>(new Set())
const showComparison = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const isSearching = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const animatingFavorites = ref<Set<string>>(new Set())
const statusFilter = ref('')
const frameworkFilter = ref('')
const activeDropdownAgentId = ref<string | null>(null)
const timeRangeFilter = ref('') // '' = all, '5m', '1h', '24h', '7d'
const favoriteFilter = ref('') // '' = all, 'true' = favorites only

// Sort state
const sortBy = ref('status') // status, name, lastActivity
const sortOrder = ref<'asc' | 'desc'>('desc')

// Watch sort preferences and save to localStorage
watch(sortBy, (newSortBy) => {
  localStorage.setItem('agentListSortBy', newSortBy)
})

watch(sortOrder, (newSortOrder) => {
  localStorage.setItem('agentListSortOrder', newSortOrder)
})

// Debounce utility function
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const debounceSearch = (query: string, delay: number = 300): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  isSearching.value = true

  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = query
    isSearching.value = false
    debounceTimer = null
  }, delay)
}

// Watch searchQuery and apply debouncing
watch(searchQuery, (newQuery) => {
  debounceSearch(newQuery, 300)
})

// Clear debounce on unmount
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return debouncedSearchQuery.value !== '' || statusFilter.value !== '' || frameworkFilter.value !== '' || timeRangeFilter.value !== '' || favoriteFilter.value !== ''
})

// Active filter tags for display
interface ActiveFilter {
  key: string
  label: string
  type: 'search' | 'status' | 'framework' | 'time' | 'favorite'
  value: string
}

const activeFilters = computed<ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = []

  // Search query filter (debounced)
  if (debouncedSearchQuery.value) {
    filters.push({
      key: 'search',
      label: `"${debouncedSearchQuery.value}"`,
      type: 'search',
      value: debouncedSearchQuery.value,
    })
  }

  // Status filter
  if (statusFilter.value) {
    const statusLabels: Record<string, string> = {
      online: '在线',
      ready: '就绪',
      busy: '忙碌',
      thinking: '思考中',
      offline: '离线',
      error: '错误',
      paused: '已暂停',
    }
    filters.push({
      key: 'status',
      label: statusLabels[statusFilter.value] || statusFilter.value,
      type: 'status',
      value: statusFilter.value,
    })
  }

  // Framework filter
  if (frameworkFilter.value) {
    const frameworkLabels: Record<string, string> = {
      crewai: 'CrewAI',
      langchain: 'LangChain',
      autogen: 'AutoGen',
      autogpt: 'AutoGPT',
    }
    filters.push({
      key: 'framework',
      label: frameworkLabels[frameworkFilter.value] || frameworkFilter.value,
      type: 'framework',
      value: frameworkFilter.value,
    })
  }

  // Time range filter
  if (timeRangeFilter.value) {
    const timeLabels: Record<string, string> = {
      '5m': '最近5分钟',
      '1h': '最近1小时',
      '24h': '最近24小时',
      '7d': '最近7天',
    }
    filters.push({
      key: 'time',
      label: timeLabels[timeRangeFilter.value] || timeRangeFilter.value,
      type: 'time',
      value: timeRangeFilter.value,
    })
  }

  // Favorite filter
  if (favoriteFilter.value === 'true') {
    filters.push({
      key: 'favorite',
      label: '⭐ 收藏',
      type: 'favorite',
      value: favoriteFilter.value,
    })
  }

  return filters
})

// Remove individual filter
const removeFilter = (filter: ActiveFilter): void => {
  switch (filter.key) {
    case 'search':
      searchQuery.value = ''
      break
    case 'status':
      statusFilter.value = ''
      break
    case 'framework':
      frameworkFilter.value = ''
      break
    case 'time':
      timeRangeFilter.value = ''
      break
    case 'favorite':
      favoriteFilter.value = ''
      break
  }
}

// Clear all filters
const clearAllFilters = (): void => {
  searchQuery.value = ''
  statusFilter.value = ''
  frameworkFilter.value = ''
  timeRangeFilter.value = ''
  favoriteFilter.value = ''
}

// 统计数据
const stats = computed(() => {
  const online = props.agents.filter(a => a.status === 'online' || a.status === 'ready').length
  const busy = props.agents.filter(a => a.status === 'busy').length
  const thinking = props.agents.filter(a => a.status === 'thinking').length
  const error = props.agents.filter(a => a.status === 'error').length
  return { online, busy, thinking, error }
})

// Search suggestions based on current input
const searchSuggestions = computed(() => {
  return getSuggestions(searchQuery.value)
})

// 过滤后的 Agent 列表
const filteredAgents = computed(() => {
  let filtered = props.agents

  // Apply search query filter (debounced)
  if (debouncedSearchQuery.value) {
    const query = debouncedSearchQuery.value.toLowerCase()
    filtered = filtered.filter(agent =>
      agent.agentId.toLowerCase().includes(query) ||
      (agent.role && agent.role.toLowerCase().includes(query)) ||
      (agent.currentActivity && agent.currentActivity.toLowerCase().includes(query))
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(agent => agent.status === statusFilter.value)
  }

  // Apply framework filter
  if (frameworkFilter.value) {
    filtered = filtered.filter(agent =>
      agent.framework && agent.framework.toLowerCase() === frameworkFilter.value.toLowerCase()
    )
  }

  // Apply time range filter
  if (timeRangeFilter.value) {
    const now = Date.now()
    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,      // 5 minutes
      '1h': 60 * 60 * 1000,     // 1 hour
      '24h': 24 * 60 * 60 * 1000, // 24 hours
      '7d': 7 * 24 * 60 * 60 * 1000, // 7 days
    }
    const cutoffTime = ranges[timeRangeFilter.value] || 0
    filtered = filtered.filter(agent => {
      const activityTime = new Date(agent.lastActivity).getTime()
      return now - activityTime <= cutoffTime
    })
  }

  // Apply favorite filter
  if (favoriteFilter.value === 'true') {
    filtered = filtered.filter(agent => agent.isFavorite === true)
  }

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'status':
        // Status priority: online > ready > busy > thinking > other
        const statusPriority: Record<string, number> = {
          online: 5,
          ready: 4,
          busy: 3,
          thinking: 2,
          error: 1,
          offline: 0,
          paused: -1,
          stopped: -1,
          initializing: 0,
        }
        comparison = (statusPriority[a.status] || 0) - (statusPriority[b.status] || 0)
        break

      case 'name':
        // Sort by role or agentId
        const nameA = (a.role || a.agentId).toLowerCase()
        const nameB = (b.role || b.agentId).toLowerCase()
        comparison = nameA.localeCompare(nameB)
        break

      case 'lastActivity':
        // Sort by last activity time
        const timeA = new Date(a.lastActivity).getTime()
        const timeB = new Date(b.lastActivity).getTime()
        comparison = timeA - timeB
        break
    }

    // Apply sort order
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return filtered
})

// Agent counts
const totalCount = computed(() => props.agents.length)
const filteredCount = computed(() => filteredAgents.value.length)

// Keyboard navigation setup
keyboardNav = useKeyboardNavigation({
  items: filteredAgents,
  onSelect: (item) => {
    selectAgent((item as AgentState).agentId)
  },
  onNavigate: (item) => {
    // Scroll to item when navigating
    const element = document.querySelector(`[data-agent-id="${(item as AgentState).agentId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  },
  enabled: computed(() => !showSavePresetDialog.value),
  loop: true
})

// 选择 Agent
const selectAgent = (agentId: string): void => {
  selectedAgentId.value = agentId
  emit('selectAgent', agentId)
}

// 处理 Agent 项的键盘事件
const handleAgentKeydown = (event: KeyboardEvent, agentId: string): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectAgent(agentId)
  }
}

// 清除所有筛选
const clearFilters = (): void => {
  searchQuery.value = ''
  statusFilter.value = ''
  frameworkFilter.value = ''
  timeRangeFilter.value = ''
  favoriteFilter.value = ''
}

// 格式化时间
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

// Handle double click on agent item
const handleDoubleClick = async (agent: AgentState): Promise<void> => {
  await toggleFavorite(agent)
  // Also select the agent
  selectAgent(agent.agentId)
}

// Handle right-click context menu
const handleContextMenu = (agent: AgentState, event: MouseEvent): void => {
  const menuItems: ContextMenuItem[] = [
    {
      id: 'view-details',
      label: '查看详情',
      icon: '👁️',
      action: () => selectAgent(agent.agentId)
    },
    {
      id: 'toggle-favorite',
      label: agent.isFavorite ? '取消收藏' : '收藏',
      icon: agent.isFavorite ? '⭐' : '☆',
      action: () => toggleFavorite(agent)
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      action: () => {}
    },
    {
      id: 'copy-quick',
      label: '快速复制 (纯文本)',
      icon: '📋',
      shortcut: 'Ctrl+C',
      action: async () => {
        const success = await copyAgent(agent, 'plain')
        if (success) success(getCopySummary(1, 'plain'))
      }
    },
    {
      id: 'copy-json',
      label: '复制为 JSON',
      icon: '{ }',
      action: async () => {
        const success = await copyAgent(agent, 'json')
        if (success) success(getCopySummary(1, 'json'))
      }
    },
    {
      id: 'copy-markdown',
      label: '复制为 Markdown',
      icon: '📝',
      action: async () => {
        const success = await copyAgent(agent, 'markdown')
        if (success) success(getCopySummary(1, 'markdown'))
      }
    },
    {
      id: 'copy-csv',
      label: '复制为 CSV',
      icon: '📊',
      action: async () => {
        const success = await copyAgent(agent, 'csv')
        if (success) success(getCopySummary(1, 'csv'))
      }
    },
    {
      id: 'separator-2',
      label: '',
      separator: true,
      action: () => {}
    },
    {
      id: 'pause-resume',
      label: agent.status === 'paused' ? '恢复' : '暂停',
      icon: agent.status === 'paused' ? '▶️' : '⏸️',
      action: () => {
        if (agent.status === 'paused') {
          emit('selectAgent', agent.agentId)
          success(`已恢复 ${agent.agentId}`)
        } else {
          emit('selectAgent', agent.agentId)
          success(`已暂停 ${agent.agentId}`)
        }
      }
    }
  ]

  openMenu(event.clientX, event.clientY, menuItems, agent)
}

// Get status label
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    online: '在线',
    ready: '就绪',
    busy: '忙碌',
    thinking: '思考中',
    offline: '离线',
    error: '错误',
    paused: '已暂停',
    stopped: '已停止',
    initializing: '初始化中',
  }
  return labels[status] || status
}

// Get framework label
const getFrameworkLabel = (framework: string): string => {
  const labels: Record<string, string> = {
    crewai: 'CrewAI',
    langchain: 'LangChain',
    autogen: 'AutoGen',
    autogpt: 'AutoGPT',
  }
  return labels[framework] || framework
}

// Get time range label
const getTimeRangeLabel = (timeRange: string): string => {
  const labels: Record<string, string> = {
    '5m': '最近5分钟',
    '1h': '最近1小时',
    '24h': '最近24小时',
    '7d': '最近7天',
  }
  return labels[timeRange] || timeRange
}

// Get status text for ARIA labels
const getStatusText = (status: string): string => {
  return getStatusLabel(status)
}

// Get ARIA label for agent item
const getAgentAriaLabel = (agent: AgentState): string => {
  const parts = [
    `Agent ${agent.agentId}`,
    `状态: ${getStatusText(agent.status)}`,
  ]

  if (agent.role) {
    parts.push(`角色: ${agent.role}`)
  }

  if (agent.framework) {
    parts.push(`框架: ${agent.framework}`)
  }

  if (agent.currentActivity) {
    parts.push(`活动: ${agent.currentActivity}`)
  }

  if (agent.isFavorite) {
    parts.push('已收藏')
  }

  if (selectedAgentId.value === agent.agentId) {
    parts.push('已选中')
  }

  return parts.join(', ')
}

// Focus search input
const focusSearchInput = (): void => {
  // Don't focus if user is typing in another input
  const activeElement = document.activeElement as HTMLElement
  if (activeElement && activeElement.tagName === 'INPUT' && activeElement !== searchInputRef.value) {
    return
  }

  if (searchInputRef.value) {
    searchInputRef.value.focus()
    searchInputRef.value.select()
  }
}

// Handle keyboard events for search input
const handleSearchKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    if (showSearchSuggestions.value && searchSuggestions.value.length > 0) {
      showSearchSuggestions.value = false
      resetSelection()
    } else if (searchQuery.value) {
      searchQuery.value = ''
    } else {
      (event.target as HTMLElement).blur()
    }
  } else if (event.key === 'ArrowDown') {
    if (showSearchSuggestions.value && searchSuggestions.value.length > 0) {
      event.preventDefault()
      navigateSuggestions('down', searchSuggestions.value)
    }
  } else if (event.key === 'ArrowUp') {
    if (showSearchSuggestions.value && searchSuggestions.value.length > 0) {
      event.preventDefault()
      navigateSuggestions('up', searchSuggestions.value)
    }
  } else if (event.key === 'Enter') {
    if (searchSuggestionIndex.value >= 0 && searchSuggestionIndex.value < searchSuggestions.value.length) {
      event.preventDefault()
      selectSuggestion(searchSuggestions.value[searchSuggestionIndex.value])
    } else if (searchQuery.value.trim()) {
      // Add to history on search
      addToHistory(searchQuery.value.trim())
      showSearchSuggestions.value = false
    }
  }
}

// Handle search input blur
const handleSearchBlur = (): void => {
  // Delay hiding suggestions to allow clicking on them
  setTimeout(() => {
    if (document.activeElement?.closest('.search-suggestions')) {
      // Still focused on suggestions, don't hide
      return
    }
    showSearchSuggestions.value = false
    resetSelection()
  }, 150)
}

// Select a suggestion from history
const selectSuggestion = (suggestion: string): void => {
  searchQuery.value = suggestion
  showSearchSuggestions.value = false
  resetSelection()
  // Re-trigger search
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

// Clear search history
const handleClearHistory = (): void => {
  clearHistory()
  showSearchSuggestions.value = false
}

// Filter Presets Management
// Open save preset dialog
const openSavePresetDialog = (): void => {
  presetNameInput.value = ''
  showSavePresetDialog.value = true
  // Focus input after dialog is shown
  setTimeout(() => {
    if (presetNameInputRef.value) {
      presetNameInputRef.value.focus()
    }
  }, 50)
}

// Close save preset dialog
const closeSavePresetDialog = (): void => {
  showSavePresetDialog.value = false
  presetNameInput.value = ''
}

// Confirm and save preset
const confirmSavePreset = (): void => {
  const name = presetNameInput.value.trim()
  if (!name) return

  saveFilterPreset(name, {
    searchQuery: searchQuery.value,
    statusFilter: statusFilter.value,
    frameworkFilter: frameworkFilter.value,
    timeRangeFilter: timeRangeFilter.value,
    favoriteFilter: favoriteFilter.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    viewMode: viewMode.value
  })

  success(`已保存过滤器预设: ${name}`)
  closeSavePresetDialog()
}

// Load a preset
const loadPreset = (preset: FilterPreset): void => {
  searchQuery.value = preset.searchQuery
  statusFilter.value = preset.statusFilter
  frameworkFilter.value = preset.frameworkFilter
  timeRangeFilter.value = preset.timeRangeFilter
  favoriteFilter.value = preset.favoriteFilter
  sortBy.value = preset.sortBy
  sortOrder.value = preset.sortOrder
  viewMode.value = preset.viewMode

  // Trigger debounced search immediately
  debouncedSearchQuery.value = preset.searchQuery

  showFilterPresetsMenu.value = false
  success(`已加载过滤器预设: ${preset.name}`)
}

// Delete a preset
const deletePreset = (id: string): void => {
  deleteFilterPreset(id)
}

// Highlight search matches in text
const highlightText = (text: string): string => {
  if (!searchQuery.value || !text) return text

  const query = searchQuery.value.toLowerCase()
  const index = text.toLowerCase().indexOf(query)

  if (index === -1) return text

  const before = text.substring(0, index)
  const match = text.substring(index, index + query.length)
  const after = text.substring(index + query.length)

  return `${before}<mark class="search-highlight">${match}</mark>${after}`
}

// Get highlighted agent name
const highlightedAgentName = (agent: AgentState): string => {
  const text = agent.role || agent.agentId
  return highlightText(text)
}

// Get highlighted activity text
const highlightedActivity = (agent: AgentState): string => {
  if (!agent.currentActivity) return ''
  return highlightText(agent.currentActivity)
}

// Empty state helpers
const getEmptyStateIcon = (): string => {
  if (searchQuery.value) return '🔍'
  if (statusFilter.value || frameworkFilter.value || timeRangeFilter.value || favoriteFilter.value) return '🏷️'
  return '🤖'
}

const getEmptyStateTitle = (): string => {
  if (searchQuery.value) return '未找到匹配结果'
  if (statusFilter.value || frameworkFilter.value || timeRangeFilter.value || favoriteFilter.value) return '没有符合条件的 Agent'
  return '暂无 Agent 在线'
}

const getEmptyStateMessage = (): string => {
  if (searchQuery.value) {
    return `尝试搜索 "${searchQuery.value}" 但没有找到匹配的 Agent。试试其他关键词？`
  }
  if (statusFilter.value || frameworkFilter.value || timeRangeFilter.value || favoriteFilter.value) {
    const filters: string[] = []
    if (statusFilter.value) filters.push('状态')
    if (frameworkFilter.value) filters.push('框架')
    if (timeRangeFilter.value) filters.push('时间范围')
    if (favoriteFilter.value) filters.push('收藏')
    return `当前应用的 ${filters.join('、')} 筛选没有匹配任何 Agent。`
  }
  return '等待 Agent 连接... 当有 Agent 上线时，它们会自动显示在这里。'
}

const shouldShowAction = (): boolean => {
  return !!(searchQuery.value || statusFilter.value || frameworkFilter.value || timeRangeFilter.value || favoriteFilter.value)
}

// Quick actions
const toggleDropdown = (agentId: string, event: Event): void => {
  event.stopPropagation()
  if (activeDropdownAgentId.value === agentId) {
    activeDropdownAgentId.value = null
  } else {
    activeDropdownAgentId.value = agentId
  }
}

const closeDropdown = (): void => {
  activeDropdownAgentId.value = null
}

const copyAgentId = (agentId: string, event: Event): void => {
  event.stopPropagation()
  navigator.clipboard.writeText(agentId).then(() => {
    success(`已复制 Agent ID: ${agentId}`)
  }).catch(() => {
    console.error('Failed to copy Agent ID')
  })
  closeDropdown()
}

const copyAgentName = (agent: AgentState, event: Event): void => {
  event.stopPropagation()
  const name = agent.role || agent.agentId
  navigator.clipboard.writeText(name).then(() => {
    success(`已复制名称: ${name}`)
  }).catch(() => {
    console.error('Failed to copy Agent name')
  })
  closeDropdown()
}

const viewAgentDetails = (agentId: string, event: Event): void => {
  event.stopPropagation()
  selectAgent(agentId)
  closeDropdown()
}

// Toggle agent favorite status
const toggleFavorite = async (agent: AgentState): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const newFavoriteStatus = !agent.isFavorite

    const response = await fetch(`${apiUrl}/api/agents/${agent.agentId}/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: newFavoriteStatus })
    })

    if (!response.ok) {
      throw new Error('更新收藏状态失败')
    }

    // Trigger animation
    animatingFavorites.value.add(agent.agentId)
    setTimeout(() => {
      animatingFavorites.value.delete(agent.agentId)
      animatingFavorites.value = new Set(animatingFavorites.value)
    }, 600)

    // Update local state immediately for responsiveness
    agent.isFavorite = newFavoriteStatus

    // Force reactivity update by emitting to parent
    success(newFavoriteStatus ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    console.error('Toggle favorite failed:', error)
  }
}

// Export agents data
const exportAgents = async (format: 'json' | 'csv'): Promise<void> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const url = `${apiUrl}/api/agents/export?format=${format}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('导出失败')
    }

    // Get filename from Content-Disposition header or generate default
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `agents_${format}_${Date.now()}.${format}`

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '')
      }
    }

    // Create blob and download
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    success(`已导出 ${format.toUpperCase()} 文件`)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

// Toggle agent selection for batch operations
const toggleAgentSelection = (agentId: string): void => {
  if (selectedAgentIds.value.has(agentId)) {
    selectedAgentIds.value.delete(agentId)
  } else {
    selectedAgentIds.value.add(agentId)
  }
  // Force reactivity update
  selectedAgentIds.value = new Set(selectedAgentIds.value)
}

// Clear all selections
const clearSelection = (): void => {
  selectedAgentIds.value.clear()
  selectedAgentIds.value = new Set(selectedAgentIds.value)
}

// Batch operation API call
const batchOperation = async (operation: string): Promise<void> => {
  if (selectedAgentIds.value.size === 0) return

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const response = await fetch(`${apiUrl}/api/agents/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        agentIds: Array.from(selectedAgentIds.value)
      })
    })

    if (!response.ok) {
      throw new Error(`批量${operation}失败`)
    }

    const result = await response.json()
    success(`批量${operation}成功: ${selectedAgentIds.value.size} 个 Agent`)
    clearSelection()
  } catch (error) {
    console.error('Batch operation failed:', error)
  }
}

// Handle batch operation complete
const handleBatchOperationComplete = (results: unknown): void => {
  const result = results as { completed: number; failed: number; results?: Array<{ agentId: string; success: boolean }> }
  if (result.failed === 0) {
    success(`成功完成 ${result.completed} 个操作`)
    // Refresh data to see changes
    // Note: In real implementation, you might want to emit an event or call a refresh function
  } else {
    success(`完成 ${result.completed} 个，失败 ${result.failed} 个`)
  }
}

// Comparison functions
const comparisonAgents = computed(() => {
  const ids = Array.from(selectedAgentIds.value).slice(0, 2)
  return ids.map(id => props.agents.find(a => a.agentId === id)).filter((a): a is AgentState => a !== undefined)
})

const openComparison = (): void => {
  if (selectedAgentIds.value.size < 2) {
    success('请选择至少 2 个 Agent 进行对比')
    return
  }
  showComparison.value = true
}

const closeComparison = (): void => {
  showComparison.value = false
}

// Batch operations
const batchPause = (): Promise<void> => batchOperation('pause')
const batchResume = (): Promise<void> => batchOperation('resume')
const batchStop = (): Promise<void> => batchOperation('stop')
const batchDelete = async (): Promise<void> => {
  if (selectedAgentIds.value.size === 0) return
  // Confirm delete
  if (confirm(`确定要删除 ${selectedAgentIds.value.size} 个 Agent 吗?`)) {
    await batchOperation('delete')
  }
}

// Parse agent tags from JSON string
const parsedAgentTags = (agent: AgentState): string[] => {
  if (!agent.tags) return []
  try {
    return JSON.parse(agent.tags)
  } catch {
    return []
  }
}

// Get color for agent tag
const getAgentTagColor = (tag: string): string => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan']
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Close dropdown when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.quick-actions-dropdown') && !target.closest('.quick-actions-btn')) {
      closeDropdown()
    }
  })
})

// WebSocket 连接
let wsUnsubscribe: (() => void) | null = null

onMounted(() => {
  // Load view mode preference from localStorage
  const savedViewMode = localStorage.getItem('agentListViewMode')
  if (savedViewMode === 'list' || savedViewMode === 'grid') {
    viewMode.value = savedViewMode
  }

  // Load sort preferences from localStorage
  const savedSortBy = localStorage.getItem('agentListSortBy')
  if (savedSortBy && ['status', 'name', 'lastActivity'].includes(savedSortBy)) {
    sortBy.value = savedSortBy
  }

  const savedSortOrder = localStorage.getItem('agentListSortOrder')
  if (savedSortOrder && (savedSortOrder === 'asc' || savedSortOrder === 'desc')) {
    sortOrder.value = savedSortOrder
  }

  // Register keyboard shortcuts
  registerShortcut({
    key: '/',
    description: '聚焦搜索框',
    handler: () => {
      focusSearchInput()
    },
  })

  registerShortcut({
    key: 'g',
    description: '切换视图模式',
    handler: () => {
      viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
    },
  })

  const ws = getWebSocketConnection()
  wsUnsubscribe = ws.onMessage((message) => {
    // 处理 WebSocket 消息，更新 agents 会在父组件处理
    console.log('WebSocket message:', message)
  })

  // 连接 WebSocket
  ws.connect().catch(err => {
    console.error('WebSocket connection failed:', err)
  })
})

onUnmounted(() => {
  if (wsUnsubscribe) {
    wsUnsubscribe()
  }
})
</script>

<style scoped>
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.agent-list-panel {
  width: 320px;
  height: 100%;
  background: rgba(15, 23, 42, 0.9);
  border-right: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

/* Collapsed State */
.agent-list-panel.panel-collapsed {
  width: 60px;
}

.agent-list-panel.panel-collapsed .panel-header {
  padding: 12px 8px;
}

.agent-list-panel.panel-collapsed .header-title h2 {
  font-size: 12px;
}

.agent-list-panel.panel-collapsed .agent-count {
  font-size: 10px;
  padding: 1px 4px;
}

/* Collapse Button */
.collapse-btn {
  position: absolute;
  top: 12px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

.collapse-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

/* Collapsed View */
.panel-collapsed-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  gap: 16px;
}

.collapsed-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.collapsed-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.collapsed-stat:hover {
  background: rgba(51, 65, 85, 0.8);
  transform: scale(1.05);
}

.collapsed-stat .stat-icon {
  font-size: 16px;
}

.collapsed-stat .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.collapsed-stat.online .stat-value {
  color: #22c55e;
}

.collapsed-stat.busy .stat-value {
  color: #f59e0b;
}

.collapsed-stat.thinking .stat-value {
  color: #8b5cf6;
}

.collapsed-stat.error .stat-value {
  color: #ef4444;
}

.collapsed-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  width: 100%;
}

.collapsed-count .count-label {
  font-size: 10px;
  color: #60a5fa;
}

.collapsed-count .count-value {
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
}

/* Panel Header Stats (for expanded state) */
.panel-header-stats {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.panel-header-stats .stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.panel-header-stats .stat {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
}

.panel-header {
  padding: 16px;
  padding-right: 40px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  position: relative;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.agent-count {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-weight: 500;
}

.stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
}

.stat.online { color: #22c55e; }
.stat.busy { color: #f59e0b; }
.stat.thinking { color: #8b5cf6; }
.stat.error { color: #ef4444; }

.filters-section {
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.search-box {
  padding: 12px 16px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-right: 36px; /* Make room for clear button */
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-input.searching {
  padding-right: 60px; /* Make room for search indicator */
  border-color: rgba(251, 191, 36, 0.5);
}

.search-input::placeholder {
  color: #64748b;
}

.search-indicator {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.clear-search-btn {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.5);
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: rgba(148, 163, 184, 0.3);
  color: #e2e8f0;
}

.clear-search-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* Search Suggestions */
.search-box.has-suggestions {
  z-index: 100;
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 16px;
  right: 16px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1000;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.suggestions-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-history-btn {
  padding: 2px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-history-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: rgba(51, 65, 85, 0.6);
}

.suggestion-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  font-size: 13px;
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-remove {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: all 0.2s;
}

.suggestion-remove:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
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

.filter-dropdowns {
  padding: 8px 16px 12px;
  display: flex;
  gap: 8px;
}

.filter-select {
  flex: 1;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: rgba(100, 116, 139, 0.5);
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-select option {
  background: #1e293b;
  color: #e2e8f0;
}

/* Active Filter Tags */
.active-filters {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: rgba(30, 41, 59, 0.4);
  border-top: 1px solid rgba(100, 116, 139, 0.1);
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.active-filters-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.filter-tag.search {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.filter-tag.status {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.filter-tag.framework {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.filter-tag.time {
  background: rgba(249, 115, 22, 0.15);
  color: #fb923c;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.filter-tag.favorite {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.filter-tag:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.filter-tag:active {
  transform: scale(0.95);
}

.filter-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s;
}

.filter-tag:hover .filter-tag-remove {
  background: rgba(0, 0, 0, 0.3);
}

.clear-all-filters-btn {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-filters-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.clear-all-filters-btn:active {
  transform: scale(0.95);
}

.clear-filters-btn {
  margin: 0 16px 12px;
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  width: calc(100% - 32px);
}

.clear-filters-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.sort-controls {
  padding: 8px 16px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.sort-select {
  flex: 1;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.sort-select:hover {
  border-color: rgba(100, 116, 139, 0.5);
}

.sort-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.sort-select option {
  background: #1e293b;
  color: #e2e8f0;
}

.sort-order-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sort-order-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

.agent-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.agent-list::-webkit-scrollbar {
  width: 6px;
}

.agent-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.agent-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.agent-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.agent-item:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.3);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.agent-item.selected:hover {
  background: rgba(59, 130, 246, 0.2);
  border-left-color: #60a5fa;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
}

.agent-item.selected {
  background: rgba(59, 130, 246, 0.15);
  border-left: 3px solid #3b82f6;
  border-right: 1px solid rgba(59, 130, 246, 0.3);
  border-top: 1px solid rgba(59, 130, 246, 0.3);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  position: relative;
}

.agent-item.focused {
  outline: 2px solid rgba(168, 85, 247, 0.5);
  outline-offset: -2px;
  background: rgba(168, 85, 247, 0.05);
}

.agent-item.focused.selected {
  outline-color: rgba(59, 130, 246, 0.6);
}

/* Density Modes */
.agent-item.density-compact {
  padding: 6px 12px;
  gap: 8px;
  min-height: 40px;
}

.agent-item.density-compact .agent-info {
  gap: 4px;
}

.agent-item.density-compact .agent-name {
  font-size: 13px;
}

.agent-item.density-compact .agent-meta {
  font-size: 10px;
}

.agent-item.density-compact .agent-activity {
  font-size: 10px;
}

.agent-item.density-compact .agent-status-indicator {
  width: 8px;
  height: 8px;
}

.agent-item.density-comfortable {
  padding: 10px 16px;
  gap: 12px;
  min-height: 56px;
}

.agent-item.density-spacious {
  padding: 16px 20px;
  gap: 16px;
  min-height: 72px;
}

.agent-item.density-spacious .agent-info {
  gap: 8px;
}

.agent-item.density-spacious .agent-name {
  font-size: 15px;
}

.agent-item.density-spacious .agent-meta {
  font-size: 13px;
}

.agent-item.density-spacious .agent-status-indicator {
  width: 12px;
  height: 12px;
}

/* Grid View Mode */
.agent-list.agent-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 12px;
  align-content: start;
}

.agent-list.agent-list-grid .agent-item {
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0;
  min-height: auto;
  height: auto;
}

.agent-list.agent-list-grid .agent-item:hover {
  transform: translateY(-2px);
}

.agent-list.agent-list-grid .agent-info {
  width: 100%;
}

.agent-list.agent-list-grid .agent-time {
  align-self: flex-end;
}

.agent-list.agent-list-grid .quick-actions-btn {
  align-self: flex-end;
}

.agent-status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.agent-status-indicator.online {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse-glow 2s ease-in-out infinite;
}

.agent-status-indicator.online::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  transform: translate(-50%, -50%);
  animation: ripple 2s ease-out infinite;
  z-index: -1;
}

.agent-status-indicator.offline { background: #6b7280; }

.agent-status-indicator.error {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: pulse-error 1s ease-in-out infinite;
}

.agent-status-indicator.busy {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
  animation: pulse-busy 1.5s ease-in-out infinite;
}

.agent-status-indicator.thinking {
  background: #8b5cf6;
  box-shadow: 0 0 8px #8b5cf6;
  animation: pulse-thinking 1s ease-in-out infinite;
}

.agent-status-indicator.thinking::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  transform: translate(-50%, -50%);
  animation: ripple-fast 1s ease-out infinite;
  z-index: -1;
}

.agent-status-indicator.ready {
  background: #3b82f6;
  box-shadow: 0 0 6px #3b82f6;
  animation: pulse-ready 3s ease-in-out infinite;
}

.agent-status-indicator.waiting { background: #f97316; }
.agent-status-indicator.paused { background: #a855f7; }
.agent-status-indicator.stopped { background: #64748b; }
.agent-status-indicator.initializing {
  background: #0ea5e9;
  animation: pulse-init 0.8s ease-in-out infinite;
}

/* Pulse Animations */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px #22c55e, 0 0 16px rgba(34, 197, 94, 0.3); }
  50% { opacity: 0.9; box-shadow: 0 0 12px #22c55e, 0 0 24px rgba(34, 197, 94, 0.5); }
}

@keyframes pulse-error {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px #ef4444; }
  50% { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 16px #ef4444; }
}

@keyframes pulse-busy {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px #f59e0b; }
  50% { opacity: 0.85; transform: scale(1.08); box-shadow: 0 0 14px #f59e0b; }
}

@keyframes pulse-thinking {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px #8b5cf6; }
  50% { opacity: 0.75; transform: scale(1.15); box-shadow: 0 0 18px #8b5cf6; }
}

@keyframes pulse-ready {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #3b82f6; }
  50% { opacity: 0.95; box-shadow: 0 0 10px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.2); }
}

@keyframes pulse-init {
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  25% { opacity: 0.8; transform: scale(1.1) rotate(90deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
  75% { opacity: 0.8; transform: scale(1.1) rotate(270deg); }
}

/* Ripple Animations */
@keyframes ripple {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}

@keyframes ripple-fast {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}

.favorite-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.favorite-btn:hover {
  color: #fbbf24;
  transform: scale(1.1);
}

.favorite-btn:active {
  transform: scale(0.95);
}

.favorite-btn.active {
  color: #fbbf24;
}

.favorite-btn.animating {
  animation: favorite-bounce 0.6s ease-out;
}

.favorite-icon {
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.favorite-btn.animating .favorite-icon {
  animation: star-spin 0.5s ease-in-out;
}

.favorite-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #fbbf24;
  border-radius: 50%;
  opacity: 0;
}

.favorite-btn.animating .particle:nth-child(1) {
  animation: particle-explode-1 0.6s ease-out forwards;
}

.favorite-btn.animating .particle:nth-child(2) {
  animation: particle-explode-2 0.6s ease-out forwards;
}

.favorite-btn.animating .particle:nth-child(3) {
  animation: particle-explode-3 0.6s ease-out forwards;
}

@keyframes favorite-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes star-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.4); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes particle-explode-1 {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(-12px, -8px) scale(0); opacity: 0; }
}

@keyframes particle-explode-2 {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(0px, -14px) scale(0); opacity: 0; }
}

@keyframes particle-explode-3 {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(12px, -8px) scale(0); opacity: 0; }
}


.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.framework, .language {
  padding: 2px 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
}

.agent-activity {
  font-size: 12px;
  color: #cbd5e1;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-tool {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Search Highlight */
.search-highlight {
  background: rgba(250, 204, 21, 0.25);
  color: #fef08a;
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 600;
}

/* Agent tags */
.agent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.agent-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.agent-tag.blue {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.agent-tag.green {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.agent-tag.purple {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

.agent-tag.orange {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.agent-tag.pink {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.agent-tag.cyan {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

.agent-time {
  font-size: 11px;
  color: #64748b;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 300px;
}

.empty-state-content {
  max-width: 400px;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 12px 0;
}

.empty-state-message {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.empty-state-action {
  display: flex;
  justify-content: center;
}

.empty-state-btn {
  padding: 10px 20px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-state-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.empty-state-btn:active {
  transform: translateY(0);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Selected state pulse animation */
@keyframes selected-pulse {
  0% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15), 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15), 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  100% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15), 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* View mode button */
.view-mode-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-mode-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

/* Compare button */
.compare-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.compare-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.4);
}

.compare-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Export buttons */
.export-buttons {
  display: flex;
  gap: 4px;
}

.export-btn {
  padding: 6px 10px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.export-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.4);
}

/* Preset buttons */
.preset-buttons {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.preset-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preset-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
  transform: scale(1.05);
}

.preset-btn.active {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
}

/* Preset menu */
.preset-load-wrapper {
  position: relative;
}

.preset-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  max-width: 280px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1000;
}

.preset-menu-header {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.preset-menu-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preset-empty {
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.preset-empty-text {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.preset-empty-hint {
  font-size: 11px;
  color: #64748b;
}

.preset-list {
  max-height: 200px;
  overflow-y: auto;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

.preset-load-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #cbd5e1;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 0;
}

.preset-load-item:hover {
  background: rgba(51, 65, 85, 0.6);
}

.preset-item-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.preset-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: all 0.2s;
}

.preset-delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

/* Preset dialog */
.preset-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.preset-dialog {
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.preset-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.preset-dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.preset-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  transition: all 0.2s;
}

.preset-dialog-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.preset-dialog-body {
  padding: 20px;
}

.preset-dialog-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 8px;
}

.preset-dialog-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  transition: border-color 0.2s;
}

.preset-dialog-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.preset-dialog-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
}

.preset-dialog-info-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.preset-dialog-info-text {
  font-size: 12px;
  color: #94a3b8;
}

.preset-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.preset-dialog-btn {
  padding: 8px 16px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-dialog-btn-cancel {
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
}

.preset-dialog-btn-cancel:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.preset-dialog-btn-save {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.4);
}

.preset-dialog-btn-save:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

.preset-dialog-btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Batch operations toolbar */
.batch-toolbar {
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
}

.batch-count {
  font-size: 12px;
  color: #93c5fd;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  gap: 4px;
}

.batch-btn {
  padding: 4px 8px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.batch-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
  border-color: rgba(100, 116, 139, 0.5);
}

.batch-btn.batch-pause:hover { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: rgba(245, 158, 11, 0.4); }
.batch-btn.batch-resume:hover { background: rgba(34, 197, 94, 0.2); color: #22c55e; border-color: rgba(34, 197, 94, 0.4); }
.batch-btn.batch-stop:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: rgba(239, 68, 68, 0.4); }
.batch-btn.batch-delete:hover { background: rgba(220, 38, 38, 0.2); color: #dc2626; border-color: rgba(220, 38, 38, 0.4); }
.batch-btn.batch-cancel:hover { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }

/* Agent checkbox */
.agent-checkbox {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.agent-checkbox.visible {
  opacity: 1;
  pointer-events: auto;
}

.agent-item {
  position: relative;
  padding-left: 24px;
}

.agent-list.has-selection .agent-item {
  padding-left: 32px;
}

.agent-list.has-selection .agent-checkbox {
  left: 8px;
}

.agent-item.batch-selected {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

/* Grid view layout */
.agent-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  padding: 8px;
}

.agent-list-grid .agent-item {
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  text-align: left;
  min-height: 100px;
}

.agent-list-grid .agent-item:hover {
  transform: translateY(-2px);
}

.agent-list-grid .agent-status-indicator {
  align-self: flex-start;
  margin-bottom: 8px;
}

.agent-list-grid .agent-info {
  width: 100%;
}

.agent-list-grid .agent-name {
  font-size: 13px;
  margin-bottom: 6px;
}

.agent-list-grid .agent-meta {
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.agent-list-grid .agent-activity {
  font-size: 11px;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agent-list-grid .agent-tool {
  font-size: 10px;
  margin-top: 4px;
}

.agent-list-grid .agent-time {
  margin-top: auto;
  padding-top: 6px;
  font-size: 10px;
  align-self: flex-end;
}

/* Quick actions button */
.quick-actions-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  padding: 0;
  line-height: 1;
}

.agent-item:hover .quick-actions-btn {
  opacity: 1;
}

.quick-actions-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.agent-item {
  position: relative;
}

/* Quick actions dropdown */
.quick-actions-dropdown {
  position: absolute;
  top: 36px;
  right: 8px;
  min-width: 140px;
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 100;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.dropdown-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

/* Grid view adjustments */
.agent-list-grid .quick-actions-btn {
  top: 6px;
  right: 6px;
}

.agent-list-grid .quick-actions-dropdown {
  top: 32px;
  right: 6px;
}

/* Active filter tags */
.active-filters {
  padding: 8px 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  font-size: 12px;
  color: #93c5fd;
}

.tag-label {
  opacity: 0.8;
}

.tag-value {
  font-weight: 500;
  color: #e2e8f0;
}

.tag-remove {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s;
  padding: 0;
}

.tag-remove:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Skeleton Loading Container */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
</style>
