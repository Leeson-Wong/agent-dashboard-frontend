/**
 * Panel Collapse Composable
 *
 * Manages collapse state for the agent list panel
 */

import { ref, watch } from 'vue'

const STORAGE_KEY = 'agent-dashboard-panel-collapsed'

/**
 * Load collapse state from localStorage
 */
const loadCollapsed = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
  } catch (error) {
    console.error('Failed to load panel collapse state:', error)
  }
  return false // Default to expanded
}

/**
 * Save collapse state to localStorage
 */
const saveCollapsed = (collapsed: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch (error) {
    console.error('Failed to save panel collapse state:', error)
  }
}

/**
 * Panel collapse composable
 */
export function usePanelCollapse() {
  const isCollapsed = ref<boolean>(loadCollapsed())

  // Save to localStorage when state changes
  watch(isCollapsed, (newState) => {
    saveCollapsed(newState)
  })

  /**
   * Toggle collapse state
   */
  const toggle = (): void => {
    isCollapsed.value = !isCollapsed.value
  }

  /**
   * Collapse panel
   */
  const collapse = (): void => {
    isCollapsed.value = true
  }

  /**
   * Expand panel
   */
  const expand = (): void => {
    isCollapsed.value = false
  }

  /**
   * Get CSS class for collapse state
   */
  const getCollapseClass = (): string => {
    return isCollapsed.value ? 'panel-collapsed' : 'panel-expanded'
  }

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    getCollapseClass
  }
}

export default usePanelCollapse
