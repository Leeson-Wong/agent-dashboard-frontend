import { ref } from 'vue'

const STORAGE_KEY = 'agentDashboard_searchHistory'
const MAX_HISTORY = 10

/**
 * Search history composable
 * Stores and manages recent search queries
 */
export function useSearchHistory() {
  const history = ref<string[]>([])
  const showSuggestions = ref(false)
  const selectedIndex = ref(-1)

  // Load history from localStorage
  const loadHistory = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        history.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
      history.value = []
    }
  }

  // Save history to localStorage
  const saveHistory = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  // Add a query to history
  const addToHistory = (query: string): void => {
    if (!query || query.trim().length === 0) {
      return
    }

    const trimmedQuery = query.trim()

    // Remove if already exists (to move it to top)
    const index = history.value.indexOf(trimmedQuery)
    if (index !== -1) {
      history.value.splice(index, 1)
    }

    // Add to beginning
    history.value.unshift(trimmedQuery)

    // Keep only MAX_HISTORY items
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY)
    }

    saveHistory()
  }

  // Remove a query from history
  const removeFromHistory = (query: string): void => {
    const index = history.value.indexOf(query)
    if (index !== -1) {
      history.value.splice(index, 1)
      saveHistory()
    }
  }

  // Clear all history
  const clearHistory = (): void => {
    history.value = []
    saveHistory()
  }

  // Get filtered suggestions based on input
  const getSuggestions = (input: string): string[] => {
    if (!input || input.trim().length === 0) {
      return history.value
    }

    const trimmedInput = input.trim().toLowerCase()
    return history.value.filter(q =>
      q.toLowerCase().includes(trimmedInput)
    )
  }

  // Navigate through suggestions
  const navigateSuggestions = (direction: 'up' | 'down', suggestions: string[]): void => {
    if (suggestions.length === 0) return

    if (direction === 'down') {
      selectedIndex.value = (selectedIndex.value + 1) % suggestions.length
    } else {
      selectedIndex.value = selectedIndex.value <= 0
        ? suggestions.length - 1
        : selectedIndex.value - 1
    }
  }

  // Reset selection
  const resetSelection = (): void => {
    selectedIndex.value = -1
  }

  // Load history on mount
  loadHistory()

  return {
    history,
    showSuggestions,
    selectedIndex,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSuggestions,
    navigateSuggestions,
    resetSelection
  }
}
