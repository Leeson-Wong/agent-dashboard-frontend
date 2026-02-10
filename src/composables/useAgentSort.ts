/**
 * Agent Sort Composable
 *
 * Manages sorting options for Agent list
 */

import { ref, computed } from 'vue'
import type { AgentState } from '../../shared/types'

export type SortField = 'agentId' | 'role' | 'status' | 'lastActivity' | 'framework' | 'language'
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  field: SortField
  order: SortOrder
  label: string
}

const STORAGE_KEY = 'agent_sort'

// Global sort state
const sortField = ref<SortField>('agentId')
const sortOrder = ref<SortOrder>('asc')

/**
 * Load sort preferences from localStorage
 */
const loadSortPreferences = (): void => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const prefs = JSON.parse(saved) as { field: SortField; order: SortOrder }
      sortField.value = prefs.field
      sortOrder.value = prefs.order
    }
  } catch (error) {
    console.warn('Failed to load sort preferences:', error)
  }
}

/**
 * Save sort preferences to localStorage
 */
const saveSortPreferences = (): void => {
  try {
    const prefs = { field: sortField.value, order: sortOrder.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.warn('Failed to save sort preferences:', error)
  }
}

export function useAgentSort() {
  // Initialize on first use
  loadSortPreferences()

  // Available sort fields
  const sortFields: { value: SortField; label: string; icon: string }[] = [
    { value: 'agentId', label: 'Agent ID', icon: '🏷️' },
    { value: 'role', label: '角色', icon: '👤' },
    { value: 'status', label: '状态', icon: '📊' },
    { value: 'lastActivity', label: '最后活动', icon: '🕐' },
    { value: 'framework', label: '框架', icon: '🔧' },
    { value: 'language', label: '语言', icon: '💻' }
  ]

  /**
   * Get sort option
   */
  const sortOption = computed<SortOption>(() => ({
    field: sortField.value,
    order: sortOrder.value,
    label: `${sortFields.find(f => f.value === sortField.value)?.label || sortField.value} ${sortOrder.value === 'asc' ? '↑' : '↓'}`
  }))

  /**
   * Set sort field
   */
  const setSortField = (field: SortField): void => {
    sortField.value = field
    saveSortPreferences()
  }

  /**
   * Set sort order
   */
  const setSortOrder = (order: SortOrder): void => {
    sortOrder.value = order
    saveSortPreferences()
  }

  /**
   * Set sort field and order
   */
  const setSort = (field: SortField, order?: SortOrder): void => {
    sortField.value = field
    if (order) {
      sortOrder.value = order
    }
    saveSortPreferences()
  }

  /**
   * Toggle sort order for current field
   */
  const toggleSortOrder = (): void => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    saveSortPreferences()
  }

  /**
   * Sort agents
   */
  const sortAgents = (agents: AgentState[]): AgentState[] => {
    return [...agents].sort((a, b) => {
      let comparison = 0

      switch (sortField.value) {
        case 'agentId':
          comparison = a.agentId.localeCompare(b.agentId)
          break
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '')
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'lastActivity':
          comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
          break
        case 'framework':
          comparison = (a.framework || '').localeCompare(b.framework || '')
          break
        case 'language':
          comparison = (a.language || '').localeCompare(b.language || '')
          break
        default:
          comparison = 0
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    })
  }

  /**
   * Reset to default sort
   */
  const resetSort = (): void => {
    sortField.value = 'agentId'
    sortOrder.value = 'asc'
    saveSortPreferences()
  }

  return {
    // State
    sortField,
    sortOrder,
    sortOption,
    sortFields,

    // Methods
    setSortField,
    setSortOrder,
    setSort,
    toggleSortOrder,
    sortAgents,
    resetSort
  }
}
