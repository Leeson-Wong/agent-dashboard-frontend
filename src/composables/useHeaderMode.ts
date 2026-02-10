/**
 * Header Mode Composable
 *
 * Manages header display mode (normal vs compact)
 */

import { ref, watch } from 'vue'

export type HeaderMode = 'normal' | 'compact'

const STORAGE_KEY = 'agent-dashboard-header-mode'

/**
 * Load header mode from localStorage
 */
const loadHeaderMode = (): HeaderMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (stored === 'normal' || stored === 'compact')) {
      return stored as HeaderMode
    }
  } catch (error) {
    console.error('Failed to load header mode:', error)
  }
  return 'normal' // Default to normal
}

/**
 * Save header mode to localStorage
 */
const saveHeaderMode = (mode: HeaderMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch (error) {
    console.error('Failed to save header mode:', error)
  }
}

/**
 * Header mode composable
 */
export function useHeaderMode() {
  const currentMode = ref<HeaderMode>(loadHeaderMode())

  // Save to localStorage when mode changes
  watch(currentMode, (newMode) => {
    saveHeaderMode(newMode)
  })

  /**
   * Check if current mode is normal
   */
  const isNormal = ref(() => currentMode.value === 'normal')

  /**
   * Check if current mode is compact
   */
  const isCompact = ref(() => currentMode.value === 'compact')

  /**
   * Set header mode
   */
  const setMode = (mode: HeaderMode): void => {
    currentMode.value = mode
  }

  /**
   * Toggle between normal and compact
   */
  const toggleMode = (): void => {
    currentMode.value = currentMode.value === 'normal' ? 'compact' : 'normal'
  }

  /**
   * Get CSS class for header mode
   */
  const getModeClass = (): string => {
    return `header-${currentMode.value}`
  }

  return {
    currentMode,
    isNormal,
    isCompact,
    setMode,
    toggleMode,
    getModeClass
  }
}

export default useHeaderMode
