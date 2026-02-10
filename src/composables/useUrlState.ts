/**
 * URL State Composable
 *
 * Manages URL query parameter state persistence
 * Allows users to bookmark or share specific filtered views
 */

import { ref, watch, onMounted } from 'vue'

export interface UrlStateOptions {
  searchQuery?: string
  statusFilter?: string
  frameworkFilter?: string
  selectedTags?: string[]
  viewMode?: 'list' | 'grid'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UrlStateConfig {
  enabled: boolean
  persistKeys: (keyof UrlStateOptions)[]
}

const DEFAULT_STATE: UrlStateOptions = {
  searchQuery: '',
  statusFilter: '',
  frameworkFilter: '',
  selectedTags: [],
  viewMode: 'list',
  sortBy: 'name',
  sortOrder: 'asc'
}

/**
 * Parse URL query params to object
 */
const parseQueryParams = (): Record<string, string> => {
  const params: Record<string, string> = {}
  const queryString = window.location.search.slice(1) // Remove '?'

  if (!queryString) return params

  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })

  return params
}

/**
 * Build URL query string from object
 */
const buildQueryString = (params: Record<string, string>): string => {
  const pairs = Object.entries(params)
    .filter(([_, value]) => value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  return pairs.length > 0 ? `?${pairs.join('&')}` : ''
}

/**
 * Update URL without page reload
 */
const updateUrl = (params: Record<string, string>): void => {
  const queryString = buildQueryString(params)
  const newUrl = `${window.location.pathname}${queryString}`

  // Use replaceState to avoid filling browser history
  window.history.replaceState({}, '', newUrl)
}

export function useUrlState(config: UrlStateConfig = { enabled: true, persistKeys: [] }) {
  // Local state
  const localState = ref<UrlStateOptions>({ ...DEFAULT_STATE })
  const isInitialized = ref(false)

  /**
   * Convert URL query params to state object
   */
  const urlToState = (query: Record<string, string>): UrlStateOptions => {
    const state: UrlStateOptions = { ...DEFAULT_STATE }

    if (query.search) state.searchQuery = query.search
    if (query.status) state.statusFilter = query.status
    if (query.framework) state.frameworkFilter = query.framework
    if (query.tags) state.selectedTags = query.tags.split(',').filter(Boolean)
    if (query.view) state.viewMode = query.view as 'list' | 'grid'
    if (query.sort) state.sortBy = query.sort
    if (query.order) state.sortOrder = query.order as 'asc' | 'desc'

    return state
  }

  /**
   * Convert state object to URL query params
   */
  const stateToUrlParams = (state: UrlStateOptions): Record<string, string> => {
    const params: Record<string, string> = {}

    if (state.searchQuery) params.search = state.searchQuery
    if (state.statusFilter) params.status = state.statusFilter
    if (state.frameworkFilter) params.framework = state.frameworkFilter
    if (state.selectedTags && state.selectedTags.length > 0) params.tags = state.selectedTags.join(',')
    if (state.viewMode && state.viewMode !== 'list') params.view = state.viewMode
    if (state.sortBy && state.sortBy !== 'name') params.sort = state.sortBy
    if (state.sortOrder && state.sortOrder !== 'asc') params.order = state.sortOrder

    return params
  }

  /**
   * Update URL with current state
   */
  const syncUrl = (state: UrlStateOptions): void => {
    if (!config.enabled) return

    const params = stateToUrlParams(state)
    updateUrl(params)
  }

  /**
   * Load state from URL
   */
  const loadStateFromUrl = (): UrlStateOptions => {
    if (!config.enabled) return { ...DEFAULT_STATE }

    const query = parseQueryParams()
    return urlToState(query)
  }

  /**
   * Get shareable URL
   */
  const getShareableUrl = (): string => {
    const baseUrl = window.location.origin + window.location.pathname
    const params = stateToUrlParams(localState.value)
    const queryString = buildQueryString(params)

    return queryString ? `${baseUrl}${queryString}` : baseUrl
  }

  /**
   * Copy shareable URL to clipboard
   */
  const copyShareableUrl = async (): Promise<boolean> => {
    const url = getShareableUrl()

    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch {
        document.body.removeChild(textArea)
        return false
      }
    }
  }

  /**
   * Clear URL state (reset to default view)
   */
  const clearUrlState = (): void => {
    if (!config.enabled) return

    window.history.replaceState({}, '', window.location.pathname)
    localState.value = { ...DEFAULT_STATE }
  }

  /**
   * Update a specific state key
   */
  const updateState = <K extends keyof UrlStateOptions>(
    key: K,
    value: UrlStateOptions[K]
  ): void => {
    localState.value[key] = value
  }

  /**
   * Update multiple state keys
   */
  const updateStates = (updates: Partial<UrlStateOptions>): void => {
    localState.value = { ...localState.value, ...updates }
  }

  /**
   * Get current state
   */
  const getState = (): UrlStateOptions => {
    return { ...localState.value }
  }

  /**
   * Reset state to defaults
   */
  const resetState = (): void => {
    localState.value = { ...DEFAULT_STATE }
    clearUrlState()
  }

  // Watch for state changes and update URL
  watch(
    localState,
    (newState) => {
      if (isInitialized.value) {
        syncUrl(newState)
      }
    },
    { deep: true }
  )

  // Initialize from URL on mount
  onMounted(() => {
    if (config.enabled) {
      const urlState = loadStateFromUrl()
      localState.value = urlState
    }
    isInitialized.value = true
  })

  return {
    localState,
    isInitialized,
    getShareableUrl,
    copyShareableUrl,
    clearUrlState,
    updateState,
    updateStates,
    getState,
    resetState
  }
}
