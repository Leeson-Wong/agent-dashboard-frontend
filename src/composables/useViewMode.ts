/**
 * View Mode Composable
 *
 * Manages view mode for agent list (list vs grid)
 */

import { ref, computed, watch } from 'vue'

export type ViewMode = 'list' | 'grid'

export interface ViewModeOption {
  id: ViewMode
  label: string
  description: string
  icon: string
  preview: string[]
}

// Available view modes
export const VIEW_MODES: ViewModeOption[] = [
  {
    id: 'list',
    label: '列表',
    description: '垂直列表视图',
    icon: '☰',
    preview: ['▢▢▢', '▢▢▢', '▢▢▢']
  },
  {
    id: 'grid',
    label: '网格',
    description: '网格卡片视图',
    icon: '▦',
    preview: ['▢▢ ▢▢', '▢▢ ▢▢']
  }
]

const STORAGE_KEY = 'agent-dashboard-view-mode'

/**
 * Load view mode from localStorage
 */
const loadViewMode = (): ViewMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (stored === 'list' || stored === 'grid')) {
      return stored as ViewMode
    }
  } catch (error) {
    console.error('Failed to load view mode:', error)
  }
  return 'list' // Default to list view
}

/**
 * Save view mode to localStorage
 */
const saveViewMode = (mode: ViewMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch (error) {
    console.error('Failed to save view mode:', error)
  }
}

/**
 * View mode composable
 */
export function useViewMode() {
  const currentMode = ref<ViewMode>(loadViewMode())

  // Save to localStorage when mode changes
  watch(currentMode, (newMode) => {
    saveViewMode(newMode)
  })

  /**
   * Check if current mode is list
   */
  const isList = computed(() => currentMode.value === 'list')

  /**
   * Check if current mode is grid
   */
  const isGrid = computed(() => currentMode.value === 'grid')

  /**
   * Set view mode
   */
  const setMode = (mode: ViewMode): void => {
    currentMode.value = mode
  }

  /**
   * Toggle between list and grid
   */
  const toggleMode = (): void => {
    currentMode.value = currentMode.value === 'list' ? 'grid' : 'list'
  }

  /**
   * Get CSS class for view mode
   */
  const getModeClass = (): string => {
    return `view-${currentMode.value}`
  }

  /**
   * Get current mode info
   */
  const currentModeInfo = computed(() => {
    return VIEW_MODES.find((mode) => mode.id === currentMode.value)
  })

  return {
    // State
    currentMode,

    // Computed
    isList,
    isGrid,
    currentModeInfo,

    // Methods
    setMode,
    toggleMode,
    getModeClass
  }
}

export default useViewMode
