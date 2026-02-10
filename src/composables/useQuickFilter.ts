/**
 * Quick Filter Composable
 *
 * Manages quick filter state for Agent list
 */

import { ref, computed, type Ref } from 'vue'
import type { AgentState } from '../../shared/types'

export type QuickFilterType = 'all' | 'favorites' | 'recent' | 'online' | 'offline' | 'thinking' | 'errors' | 'paused'

export interface QuickFilterDefinition {
  id: QuickFilterType
  label: string
  icon: string
  description: string
  predicate: (agent: AgentState) => boolean
}

// Built-in filter definitions
const BUILTIN_FILTERS: QuickFilterDefinition[] = [
  {
    id: 'all',
    label: '全部',
    icon: '📋',
    description: '显示所有 Agent',
    predicate: () => true
  },
  {
    id: 'recent',
    label: '最近访问',
    icon: '🕐',
    description: '只显示最近访问的 Agent',
    predicate: (_agent) => false // Will be handled by QuickFilterButtons component
  },
  {
    id: 'favorites',
    label: '收藏',
    icon: '⭐',
    description: '只显示收藏的 Agent',
    predicate: (agent) => agent.isFavorite === true
  },
  {
    id: 'online',
    label: '在线',
    icon: '🟢',
    description: '只显示在线 Agent',
    predicate: (agent) => agent.status === 'online' || agent.status === 'ready'
  },
  {
    id: 'offline',
    label: '离线',
    icon: '⚫',
    description: '只显示离线 Agent',
    predicate: (agent) => agent.status === 'offline' || agent.status === 'stopped'
  },
  {
    id: 'thinking',
    label: '运行中',
    icon: '🔄',
    description: '只显示运行中的 Agent',
    predicate: (agent) => agent.status === 'thinking' || agent.status === 'busy'
  },
  {
    id: 'errors',
    label: '有错误',
    icon: '❌',
    description: '只显示有错误的 Agent',
    predicate: (agent) => agent.status === 'error'
  },
  {
    id: 'paused',
    label: '已暂停',
    icon: '⏸️',
    description: '只显示已暂停的 Agent',
    predicate: (agent) => agent.status === 'paused'
  }
]

export function useQuickFilter(agents: Ref<AgentState[]>) {
  // State
  const activeFilter = ref<QuickFilterType | undefined>(undefined)
  const customFilter = ref<((agent: AgentState) => boolean) | undefined>(undefined)

  // Computed
  const hasActiveFilter = computed(() => {
    return activeFilter.value !== undefined || customFilter.value !== undefined
  })

  const activeFilterDefinition = computed(() => {
    if (!activeFilter.value) return undefined
    return BUILTIN_FILTERS.find(f => f.id === activeFilter.value)
  })

  // Filter predicate
  const filterPredicate = computed(() => {
    if (customFilter.value) return customFilter.value
    if (activeFilter.value) {
      const filter = BUILTIN_FILTERS.find(f => f.id === activeFilter.value)
      return filter?.predicate
    }
    return undefined
  })

  // Filtered agents
  const filteredAgents = computed(() => {
    if (!filterPredicate.value) return agents.value
    return agents.value.filter(filterPredicate.value)
  })

  // Filter counts
  const filterCounts = computed(() => {
    return BUILTIN_FILTERS.reduce((counts, filter) => {
      counts[filter.id] = agents.value.filter(filter.predicate).length
      return counts
    }, {} as Record<QuickFilterType, number>)
  })

  // Methods
  const setFilter = (filterId: QuickFilterType): void => {
    // If clicking the same filter, clear it
    if (activeFilter.value === filterId) {
      clearFilter()
      return
    }
    activeFilter.value = filterId
    customFilter.value = undefined
  }

  const setCustomFilter = (predicate: (agent: AgentState) => boolean): void => {
    customFilter.value = predicate
    activeFilter.value = undefined
  }

  const clearFilter = (): void => {
    activeFilter.value = undefined
    customFilter.value = undefined
  }

  const toggleFilter = (filterId: QuickFilterType): void => {
    if (activeFilter.value === filterId) {
      clearFilter()
    } else {
      setFilter(filterId)
    }
  }

  // Get filter by ID
  const getFilter = (filterId: QuickFilterType): QuickFilterDefinition | undefined => {
    return BUILTIN_FILTERS.find(f => f.id === filterId)
  }

  // Get all filters
  const getAllFilters = (): QuickFilterDefinition[] => {
    return BUILTIN_FILTERS
  }

  // Check if specific filter is active
  const isFilterActive = (filterId: QuickFilterType): boolean => {
    return activeFilter.value === filterId
  }

  return {
    // State
    activeFilter,
    customFilter,
    hasActiveFilter,
    activeFilterDefinition,

    // Computed
    filterPredicate,
    filteredAgents,
    filterCounts,

    // Methods
    setFilter,
    setCustomFilter,
    clearFilter,
    toggleFilter,
    getFilter,
    getAllFilters,
    isFilterActive
  }
}
