<template>
  <div class="quick-filter-buttons">
    <button
      v-for="filter in filters"
      :key="filter.id"
      class="filter-btn"
      :class="{ active: activeFilter === filter.id }"
      @click="selectFilter(filter.id)"
      :title="filter.description"
    >
      <span class="filter-icon">{{ filter.icon }}</span>
      <span class="filter-label">{{ filter.label }}</span>
      <span v-if="filter.count !== undefined" class="filter-count">
        {{ filter.count }}
      </span>
    </button>

    <!-- Clear filter button -->
    <Transition name="fade">
      <button
        v-if="hasActiveFilter"
        class="clear-btn"
        @click="clearFilter"
        title="清除过滤器"
      >
        ✕
      </button>
    </Transition>

    <!-- Clear all filters button -->
    <Transition name="fade">
      <button
        v-if="hasActiveFilter || hasTagFilter || hasQuickFilter"
        class="clear-all-btn"
        @click="clearAllFilters"
        title="清除所有过滤"
      >
        🗑️
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AgentState } from '../../shared/types'
import { useFavoriteAgents } from '../composables/useFavoriteAgents'
import { useRecentAgents } from '../composables/useRecentAgents'

export interface QuickFilter {
  id: string
  label: string
  icon: string
  description: string
  count?: number
  predicate: (agent: AgentState) => boolean
}

const props = defineProps<{
  agents: AgentState[]
  modelValue?: string // Active filter ID (v-model)
  hasTagFilter?: boolean // Whether tag filter is active
  hasQuickFilter?: boolean // Whether quick filter is active
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'filter-change': [filter: QuickFilter | undefined]
  'clear-all': [] // Event to clear all filters
}>()

// Get favorites and recent composables
const { getFavoriteIds } = useFavoriteAgents()
const { recentAgents, isRecent } = useRecentAgents()

// Built-in filters
const filters = computed<QuickFilter[]>(() => {
  const agents = props.agents
  const favoriteIds = getFavoriteIds()

  return [
    {
      id: 'all',
      label: '全部',
      icon: '📋',
      description: '显示所有 Agent',
      count: agents.length,
      predicate: () => true
    },
    {
      id: 'recent',
      label: '最近访问',
      icon: '🕐',
      description: '只显示最近访问的 Agent',
      count: agents.filter(a => isRecent(a.agentId)).length,
      predicate: (agent) => isRecent(agent.agentId)
    },
    {
      id: 'favorites',
      label: '收藏',
      icon: '⭐',
      description: '只显示收藏的 Agent',
      count: agents.filter(a => favoriteIds.includes(a.agentId) || a.isFavorite).length,
      predicate: (agent) => favoriteIds.includes(agent.agentId) || agent.isFavorite
    },
    {
      id: 'online',
      label: '在线',
      icon: '🟢',
      description: '只显示在线 Agent',
      count: agents.filter(a => a.status === 'online' || a.status === 'ready').length,
      predicate: (agent) => agent.status === 'online' || agent.status === 'ready'
    },
    {
      id: 'offline',
      label: '离线',
      icon: '⚫',
      description: '只显示离线 Agent',
      count: agents.filter(a => a.status === 'offline' || a.status === 'stopped').length,
      predicate: (agent) => agent.status === 'offline' || agent.status === 'stopped'
    },
    {
      id: 'thinking',
      label: '运行中',
      icon: '🔄',
      description: '只显示运行中的 Agent',
      count: agents.filter(a => a.status === 'thinking' || a.status === 'busy').length,
      predicate: (agent) => agent.status === 'thinking' || agent.status === 'busy'
    },
    {
      id: 'errors',
      label: '有错误',
      icon: '❌',
      description: '只显示有错误的 Agent',
      count: agents.filter(a => a.status === 'error').length,
      predicate: (agent) => agent.status === 'error'
    },
    {
      id: 'paused',
      label: '已暂停',
      icon: '⏸️',
      description: '只显示已暂停的 Agent',
      count: agents.filter(a => a.status === 'paused').length,
      predicate: (agent) => agent.status === 'paused'
    }
  ]
})

// Active filter state
const activeFilter = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// Check if any filter is active
const hasActiveFilter = computed(() => {
  return activeFilter.value !== undefined && activeFilter.value !== 'all'
})

// Get filter predicate function
const getFilterPredicate = (): ((agent: AgentState) => boolean) | undefined => {
  if (!activeFilter.value) return undefined
  const filter = filters.value.find(f => f.id === activeFilter.value)
  return filter?.predicate
}

// Select a filter
const selectFilter = (filterId: string): void => {
  // If clicking the same filter, clear it
  if (activeFilter.value === filterId) {
    clearFilter()
    return
  }

  activeFilter.value = filterId
  const filter = filters.value.find(f => f.id === filterId)
  emit('filter-change', filter)
}

// Clear active filter
const clearFilter = (): void => {
  activeFilter.value = undefined
  emit('filter-change', undefined)
}

// Clear all filters (including tag filter and quick filter)
const clearAllFilters = (): void => {
  clearFilter()
  emit('clear-all')
}

// Expose filter function for external use
const applyFilter = (agents: AgentState[]): AgentState[] => {
  const predicate = getFilterPredicate()
  if (!predicate) return agents
  return agents.filter(predicate)
}

// Define expose
defineExpose({
  applyFilter,
  clearFilter,
  clearAllFilters,
  filters,
  activeFilter,
  hasActiveFilter
})
</script>

<style scoped>
.quick-filter-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #3b82f6;
}

.filter-btn.active:hover {
  background: rgba(59, 130, 246, 0.3);
}

.filter-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.filter-label {
  flex-shrink: 0;
}

.filter-count {
  font-size: 10px;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 5px;
  border-radius: 8px;
  min-width: 18px;
  text-align: center;
}

.filter-btn.active .filter-count {
  background: rgba(59, 130, 246, 0.2);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  color: #fbbf24;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: rgba(245, 158, 11, 0.3);
  border-color: rgba(245, 158, 11, 0.5);
  color: #fde047;
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

/* Responsive */
@media (max-width: 768px) {
  .quick-filter-buttons {
    gap: 4px;
  }

  .filter-btn {
    padding: 5px 8px;
    font-size: 11px;
  }

  .filter-icon {
    font-size: 12px;
  }

  .filter-label {
    display: none; /* Hide label on mobile, show only icon and count */
  }

  .filter-count {
    font-size: 9px;
    padding: 1px 4px;
    min-width: 16px;
  }
}
</style>
