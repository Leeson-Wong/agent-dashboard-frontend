import { ref } from 'vue'

const STORAGE_KEY = 'agentDashboard_filterPresets'
const MAX_PRESETS = 10

export interface FilterPreset {
  id: string
  name: string
  searchQuery: string
  statusFilter: string
  frameworkFilter: string
  timeRangeFilter: string
  favoriteFilter: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  viewMode: 'list' | 'grid'
  createdAt: number
}

/**
 * Filter presets composable
 * Manages saving and loading filter combinations
 */
export function useFilterPresets() {
  const presets = ref<FilterPreset[]>([])
  const showPresetsMenu = ref(false)

  // Load presets from localStorage
  const loadPresets = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        presets.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
      presets.value = []
    }
  }

  // Save presets to localStorage
  const savePresets = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value))
    } catch (error) {
      console.error('Failed to save filter presets:', error)
    }
  }

  // Generate unique ID
  const generateId = (): string => {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Save current filters as a preset
  const savePreset = (
    name: string,
    filters: {
      searchQuery: string
      statusFilter: string
      frameworkFilter: string
      timeRangeFilter: string
      favoriteFilter: string
      sortBy: string
      sortOrder: 'asc' | 'desc'
      viewMode: 'list' | 'grid'
    }
  ): FilterPreset => {
    const preset: FilterPreset = {
      id: generateId(),
      name,
      ...filters,
      createdAt: Date.now()
    }

    presets.value.unshift(preset)

    // Keep only MAX_PRESETS
    if (presets.value.length > MAX_PRESETS) {
      presets.value = presets.value.slice(0, MAX_PRESETS)
    }

    savePresets()
    return preset
  }

  // Delete a preset
  const deletePreset = (id: string): void => {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value.splice(index, 1)
      savePresets()
    }
  }

  // Update preset name
  const updatePresetName = (id: string, newName: string): void => {
    const preset = presets.value.find(p => p.id === id)
    if (preset) {
      preset.name = newName
      savePresets()
    }
  }

  // Load presets on mount
  loadPresets()

  return {
    presets,
    showPresetsMenu,
    savePreset,
    deletePreset,
    updatePresetName
  }
}
