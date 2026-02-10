/**
 * Compact Mode Composable
 *
 * Manages compact UI mode state for displaying more content on screen
 */

import { ref, watch, onMounted, computed } from 'vue'

export type CompactLevel = 'normal' | 'compact' | 'ultra'

export interface CompactModeConfig {
  key: string
  enabled: boolean
  defaultLevel: CompactLevel
}

const LEVEL_STYLES = {
  normal: {
    scale: 1,
    spacing: 1,
    fontSize: 1,
    padding: 1
  },
  compact: {
    scale: 0.9,
    spacing: 0.75,
    fontSize: 0.9,
    padding: 0.8
  },
  ultra: {
    scale: 0.8,
    spacing: 0.6,
    fontSize: 0.85,
    padding: 0.65
  }
}

export function useCompactMode(
  config: CompactModeConfig = {
    key: 'compact_mode',
    enabled: true,
    defaultLevel: 'normal'
  }
) {
  const storageKey = config.key

  // State
  const compactLevel = ref<CompactLevel>(config.defaultLevel)
  const isLoaded = ref(false)

  /**
   * Get CSS variables for current compact level
   */
  const getCssVars = (): Record<string, string> => {
    const styles = LEVEL_STYLES[compactLevel.value]
    return {
      '--compact-scale': styles.scale.toString(),
      '--compact-spacing': styles.spacing.toString(),
      '--compact-font-size': styles.fontSize.toString(),
      '--compact-padding': styles.padding.toString()
    }
  }

  /**
   * Apply compact mode styles to root element
   */
  const applyCompactMode = (): void => {
    const root = document.documentElement
    const vars = getCssVars()

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Update data attribute for CSS selectors
    root.setAttribute('data-compact-mode', compactLevel.value)
  }

  /**
   * Load from localStorage
   */
  const loadFromStorage = (): CompactLevel => {
    if (!config.enabled) return config.defaultLevel

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved && ['normal', 'compact', 'ultra'].includes(saved)) {
        return saved as CompactLevel
      }
    } catch (error) {
      console.warn('Failed to load compact mode from storage:', error)
    }

    return config.defaultLevel
  }

  /**
   * Save to localStorage
   */
  const saveToStorage = (level: CompactLevel): void => {
    if (!config.enabled) return

    try {
      localStorage.setItem(storageKey, level)
    } catch (error) {
      console.warn('Failed to save compact mode to storage:', error)
    }
  }

  /**
   * Set compact level
   */
  const setCompactLevel = (level: CompactLevel): void => {
    compactLevel.value = level
    applyCompactMode()
    saveToStorage(level)
  }

  /**
   * Toggle between normal and compact
   */
  const toggleCompact = (): void => {
    const newLevel: CompactLevel = compactLevel.value === 'normal' ? 'compact' : 'normal'
    setCompactLevel(newLevel)
  }

  /**
   * Cycle through levels
   */
  const cycleLevel = (): void => {
    const levels: CompactLevel[] = ['normal', 'compact', 'ultra']
    const currentIndex = levels.indexOf(compactLevel.value)
    const nextIndex = (currentIndex + 1) % levels.length
    setCompactLevel(levels[nextIndex])
  }

  /**
   * Reset to normal
   */
  const reset = (): void => {
    setCompactLevel('normal')
  }

  /**
   * Check if currently in compact mode
   */
  const isCompact = computed(() => compactLevel.value !== 'normal')

  /**
   * Check if currently in ultra compact mode
   */
  const isUltraCompact = computed(() => compactLevel.value === 'ultra')

  /**
   * Get current scale factor
   */
  const scaleFactor = computed(() => LEVEL_STYLES[compactLevel.value].scale)

  // Watch for changes and apply
  watch(compactLevel, () => {
    if (isLoaded.value) {
      applyCompactMode()
    }
  })

  // Initialize on mount
  onMounted(() => {
    compactLevel.value = loadFromStorage()
    applyCompactMode()
    isLoaded.value = true
  })

  return {
    compactLevel,
    isLoaded,
    isCompact,
    isUltraCompact,
    scaleFactor,
    setCompactLevel,
    toggleCompact,
    cycleLevel,
    reset,
    getCssVars
  }
}
