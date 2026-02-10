/**
 * Display Density Composable
 *
 * Manages display density modes for UI components
 */

import { ref, computed, watch } from 'vue'

export type DisplayDensity = 'comfortable' | 'compact' | 'spacious'

const STORAGE_KEY = 'agent-dashboard-display-density'

// Default density
const DEFAULT_DENSITY: DisplayDensity = 'comfortable'

// Density descriptions
export const DENSITY_DESCRIPTIONS: Record<DisplayDensity, string> = {
  comfortable: '舒适模式 - 适合大多数情况',
  compact: '紧凑模式 - 显示更多内容',
  spacious: '宽松模式 - 更舒适的视觉体验'
}

// Density icons
export const DENSITY_ICONS: Record<DisplayDensity, string> = {
  comfortable: '📏',
  compact: '📐',
  spacious: '📏'
}

// Load density from localStorage
const loadDensity = (): DisplayDensity => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ['comfortable', 'compact', 'spacious'].includes(stored)) {
      return stored as DisplayDensity
    }
  } catch (error) {
    console.warn('Failed to load display density:', error)
  }
  return DEFAULT_DENSITY
}

// Save density to localStorage
const saveDensity = (density: DisplayDensity): void => {
  try {
    localStorage.setItem(STORAGE_KEY, density)
  } catch (error) {
    console.warn('Failed to save display density:', error)
  }
}

// Current density state
const currentDensity = ref<DisplayDensity>(loadDensity())

// Watch for changes and save to localStorage
watch(currentDensity, (newDensity) => {
  saveDensity(newDensity)
}, { immediate: false })

/**
 * Use display density composable
 */
export function useDisplayDensity() {
  // Computed properties for density checks
  const isComfortable = computed(() => currentDensity.value === 'comfortable')
  const isCompact = computed(() => currentDensity.value === 'compact')
  const isSpacious = computed(() => currentDensity.value === 'spacious')

  // Get density class name for CSS
  const densityClass = computed(() => {
    return `density-${currentDensity.value}`
  })

  // Get density description
  const densityDescription = computed(() => {
    return DENSITY_DESCRIPTIONS[currentDensity.value]
  })

  // Get density icon
  const densityIcon = computed(() => {
    return DENSITY_ICONS[currentDensity.value]
  })

  // Set density
  const setDensity = (density: DisplayDensity): void => {
    currentDensity.value = density
  }

  // Cycle through densities
  const cycleDensity = (): void => {
    const densities: DisplayDensity[] = ['comfortable', 'compact', 'spacious']
    const currentIndex = densities.indexOf(currentDensity.value)
    const nextIndex = (currentIndex + 1) % densities.length
    setDensity(densities[nextIndex])
  }

  // Reset to default
  const resetDensity = (): void => {
    setDensity(DEFAULT_DENSITY)
  }

  return {
    // State
    currentDensity,
    isComfortable,
    isCompact,
    isSpacious,

    // Computed
    densityClass,
    densityDescription,
    densityIcon,

    // Methods
    setDensity,
    cycleDensity,
    resetDensity
  }
}

/**
 * Export individual functions for non-composable usage
 */
export const getDensity = (): DisplayDensity => {
  return currentDensity.value
}

export default useDisplayDensity
