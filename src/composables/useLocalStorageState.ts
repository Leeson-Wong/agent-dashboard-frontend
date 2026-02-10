/**
 * LocalStorage State Persistence Composable
 *
 * Automatically saves and restores state to localStorage
 * Provides seamless state persistence across sessions
 */

import { ref, watch, onMounted, computed } from 'vue'

export interface LocalStorageStateOptions {
  searchQuery?: string
  statusFilter?: string
  frameworkFilter?: string
  selectedTags?: string[]
  viewMode?: 'list' | 'grid'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  collapsedPanels?: string[]
  favoriteAgents?: string[]
}

export interface LocalStorageConfig {
  key: string
  enabled: boolean
  throttle?: number // Throttle save operations (ms)
}

const DEFAULT_STATE: LocalStorageStateOptions = {
  searchQuery: '',
  statusFilter: '',
  frameworkFilter: '',
  selectedTags: [],
  viewMode: 'list',
  sortBy: 'name',
  sortOrder: 'asc',
  collapsedPanels: [],
  favoriteAgents: []
}

/**
 * Safely get item from localStorage
 */
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error)
    return defaultValue
  }
}

/**
 * Safely set item in localStorage
 */
const setToStorage = <T>(key: string, value: T): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error)
    return false
  }
}

/**
 * Create a throttled function
 */
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

export function useLocalStorageState(
  config: LocalStorageConfig = { key: 'agent_dashboard_state', enabled: true }
) {
  const storageKey = config.key
  const throttleMs = config.throttle || 500

  // Local state
  const localState = ref<LocalStorageStateOptions>({ ...DEFAULT_STATE })
  const isLoaded = ref(false)
  const saveError = ref<string | null>(null)

  /**
   * Load state from localStorage
   */
  const loadState = (): LocalStorageStateOptions => {
    if (!config.enabled) return { ...DEFAULT_STATE }

    const saved = getFromStorage<Partial<LocalStorageStateOptions>>(
      storageKey,
      {}
    )

    // Merge with defaults to handle new properties
    return { ...DEFAULT_STATE, ...saved }
  }

  /**
   * Save state to localStorage
   */
  const saveState = (state: LocalStorageStateOptions): void => {
    if (!config.enabled) return

    const success = setToStorage(storageKey, state)
    if (!success) {
      saveError.value = 'Failed to save to localStorage'
    } else {
      saveError.value = null
    }
  }

  /**
   * Create throttled save function
   */
  const throttledSave = throttle(saveState, throttleMs)

  /**
   * Clear state from localStorage
   */
  const clearState = (): void => {
    try {
      window.localStorage.removeItem(storageKey)
      localState.value = { ...DEFAULT_STATE }
      saveError.value = null
    } catch (error) {
      saveError.value = 'Failed to clear localStorage'
      console.warn('Failed to clear localStorage:', error)
    }
  }

  /**
   * Export state as JSON
   */
  const exportState = (): string => {
    return JSON.stringify(localState.value, null, 2)
  }

  /**
   * Import state from JSON
   */
  const importState = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      localState.value = { ...DEFAULT_STATE, ...parsed }
      saveState(localState.value)
      return true
    } catch (error) {
      console.error('Failed to import state:', error)
      saveError.value = 'Invalid JSON format'
      return false
    }
  }

  /**
   * Reset to defaults
   */
  const resetState = (): void => {
    localState.value = { ...DEFAULT_STATE }
    saveState(localState.value)
  }

  /**
   * Update a specific state key
   */
  const updateState = <K extends keyof LocalStorageStateOptions>(
    key: K,
    value: LocalStorageStateOptions[K]
  ): void => {
    localState.value[key] = value
  }

  /**
   * Update multiple state keys
   */
  const updateStates = (updates: Partial<LocalStorageStateOptions>): void => {
    localState.value = { ...localState.value, ...updates }
  }

  /**
   * Get current state
   */
  const getState = (): LocalStorageStateOptions => {
    return { ...localState.value }
  }

  /**
   * Check if state has changes from defaults
   */
  const hasChanges = computed(() => {
    const defaults = DEFAULT_STATE
    const current = localState.value

    return JSON.stringify(defaults) !== JSON.stringify(current)
  })

  // Watch for state changes and save to localStorage
  watch(
    localState,
    (newState) => {
      if (isLoaded.value) {
        throttledSave(newState)
      }
    },
    { deep: true }
  )

  // Load state from localStorage on mount
  onMounted(() => {
    if (config.enabled) {
      localState.value = loadState()
    }
    isLoaded.value = true
  })

  return {
    localState,
    isLoaded,
    saveError,
    hasChanges,
    loadState,
    saveState,
    clearState,
    exportState,
    importState,
    resetState,
    updateState,
    updateStates,
    getState
  }
}

/**
 * Composable for managing individual localStorage items
 */
export function useLocalStorageItem<T>(
  key: string,
  defaultValue: T,
  options: { enabled?: boolean; throttleMs?: number } = {}
) {
  const { enabled = true, throttleMs = 500 } = options

  const value = ref<T>(defaultValue)
  const isLoaded = ref(false)
  const error = ref<string | null>(null)

  // Load on mount
  onMounted(() => {
    if (enabled) {
      value.value = getFromStorage(key, defaultValue)
    }
    isLoaded.value = true
  })

  // Throttled save function
  const saveToStorage = throttle((newValue: T) => {
    if (enabled) {
      const success = setToStorage(key, newValue)
      if (!success) {
        error.value = 'Failed to save'
      } else {
        error.value = null
      }
    }
  }, throttleMs)

  // Watch for changes
  watch(value, (newValue) => {
    if (isLoaded.value) {
      saveToStorage(newValue)
    }
  }, { deep: true })

  const clear = () => {
    try {
      window.localStorage.removeItem(key)
      value.value = defaultValue
      error.value = null
    } catch {
      error.value = 'Failed to clear'
    }
  }

  return {
    value,
    isLoaded,
    error,
    clear
  }
}
