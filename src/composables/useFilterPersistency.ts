/**
 * Filter Persistency Composable
 *
 * Manages persistence of filter settings across page reloads
 */

import { watch, onMounted } from 'vue'
import type { Ref } from 'vue'

export interface FilterState {
  quickFilter?: string
  selectedTags: string[]
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

const STORAGE_KEY = 'agent-dashboard-filter-state'

const defaultState: FilterState = {
  quickFilter: undefined,
  selectedTags: [],
  sortField: undefined,
  sortOrder: 'asc'
}

/**
 * Load filter state from localStorage
 */
export const loadFilterState = (): FilterState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FilterState>
      return { ...defaultState, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load filter state:', error)
  }
  return { ...defaultState }
}

/**
 * Save filter state to localStorage
 */
export const saveFilterState = (state: FilterState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save filter state:', error)
  }
}

/**
 * Clear filter state from localStorage
 */
export const clearFilterState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear filter state:', error)
  }
}

/**
 * Use filter persistency
 *
 * Automatically saves filter state when it changes
 */
export function useFilterPersistency(
  quickFilter: Ref<string | undefined>,
  selectedTags: Ref<string[]>,
  sortField: Ref<string | undefined>,
  sortOrder: Ref<'asc' | 'desc'>,
  options: {
    enabled?: boolean
    onSave?: (state: FilterState) => void
    onRestore?: (state: FilterState) => void
  } = {}
) {
  const { enabled = true, onSave, onRestore } = options

  /**
   * Get current filter state
   */
  const getCurrentState = (): FilterState => ({
    quickFilter: quickFilter.value,
    selectedTags: selectedTags.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value
  })

  /**
   * Restore filter state
   */
  const restoreState = (state?: FilterState): void => {
    if (!enabled) return

    const stateToRestore = state || loadFilterState()

    if (stateToRestore.quickFilter !== undefined) {
      quickFilter.value = stateToRestore.quickFilter
    }
    if (stateToRestore.selectedTags) {
      selectedTags.value = [...stateToRestore.selectedTags]
    }
    if (stateToRestore.sortField !== undefined) {
      sortField.value = stateToRestore.sortField
    }
    if (stateToRestore.sortOrder !== undefined) {
      sortOrder.value = stateToRestore.sortOrder
    }

    if (onRestore) {
      onRestore(stateToRestore)
    }
  }

  /**
   * Save current filter state
   */
  const saveState = (): void => {
    if (!enabled) return

    const state = getCurrentState()
    saveFilterState(state)

    if (onSave) {
      onSave(state)
    }
  }

  /**
   * Clear all persisted state
   */
  const clearPersistedState = (): void => {
    clearFilterState()

    // Reset to defaults
    quickFilter.value = undefined
    selectedTags.value = []
    sortField.value = undefined
    sortOrder.value = 'asc'
  }

  // Auto-save on changes
  if (enabled) {
    watch(
      [quickFilter, selectedTags, sortField, sortOrder],
      () => {
        saveState()
      },
      { deep: true }
    )
  }

  // Restore state on mount
  onMounted(() => {
    if (enabled) {
      restoreState()
    }
  })

  return {
    restoreState,
    saveState,
    clearPersistedState,
    getCurrentState
  }
}

/**
 * Export individual functions for non-composable usage
 */
export default useFilterPersistency
