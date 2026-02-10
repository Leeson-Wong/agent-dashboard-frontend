/**
 * Favorite Agents Composable
 *
 * Manages user's favorite/starred agents
 */

import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'favorite_agents'

// Global favorites store
const favoritesStore = ref<Set<string>>(new Set())
const isLoaded = ref(false)

/**
 * Load favorites from localStorage
 */
const loadFavorites = (): void => {
  if (isLoaded.value) return

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const favorites = JSON.parse(saved) as string[]
      favoritesStore.value = new Set(favorites)
    }
  } catch (error) {
    console.warn('Failed to load favorite agents:', error)
  }
  isLoaded.value = true
}

/**
 * Save favorites to localStorage
 */
const saveFavorites = (): void => {
  try {
    const favorites = Array.from(favoritesStore.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch (error) {
    console.warn('Failed to save favorite agents:', error)
  }
}

/**
 * Watch for changes and auto-save
 */
watch(favoritesStore, () => {
  if (isLoaded.value) {
    saveFavorites()
  }
}, { deep: true })

export function useFavoriteAgents() {
  // Initialize on first use
  if (!isLoaded.value) {
    loadFavorites()
  }

  /**
   * Check if agent is favorited
   */
  const isFavorite = (agentId: string): boolean => {
    return favoritesStore.value.has(agentId)
  }

  /**
   * Toggle favorite status
   */
  const toggleFavorite = (agentId: string): void => {
    if (favoritesStore.value.has(agentId)) {
      favoritesStore.value.delete(agentId)
    } else {
      favoritesStore.value.add(agentId)
    }
  }

  /**
   * Add to favorites
   */
  const addFavorite = (agentId: string): void => {
    favoritesStore.value.add(agentId)
  }

  /**
   * Remove from favorites
   */
  const removeFavorite = (agentId: string): void => {
    favoritesStore.value.delete(agentId)
  }

  /**
   * Clear all favorites
   */
  const clearFavorites = (): void => {
    favoritesStore.value.clear()
    saveFavorites()
  }

  /**
   * Get all favorite agent IDs
   */
  const getFavoriteIds = (): string[] => {
    return Array.from(favoritesStore.value)
  }

  /**
   * Get favorite agents from a list
   */
  const getFavoriteAgents = (allAgents: any[]): any[] => {
    return allAgents.filter(agent => favoritesStore.value.has(agent.agentId))
  }

  /**
   * Get non-favorite agents from a list
   */
  const getNonFavoriteAgents = (allAgents: any[]): any[] => {
    return allAgents.filter(agent => !favoritesStore.value.has(agent.agentId))
  }

  /**
   * Export favorites to JSON
   */
  const exportFavorites = (): string => {
    const favorites = getFavoriteIds()
    return JSON.stringify(favorites, null, 2)
  }

  /**
   * Import favorites from JSON
   */
  const importFavorites = (json: string): boolean => {
    try {
      const favorites = JSON.parse(json) as string[]
      if (!Array.isArray(favorites)) {
        throw new Error('Invalid favorites format')
      }

      favorites.forEach(agentId => {
        if (typeof agentId === 'string') {
          favoritesStore.value.add(agentId)
        }
      })

      saveFavorites()
      return true
    } catch (error) {
      console.error('Failed to import favorites:', error)
      return false
    }
  }

  // Computed
  const favoritesCount = computed(() => favoritesStore.value.size)

  return {
    // State
    isLoaded,
    favoritesCount,

    // Methods
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    getFavoriteIds,
    getFavoriteAgents,
    getNonFavoriteAgents,
    exportFavorites,
    importFavorites
  }
}
