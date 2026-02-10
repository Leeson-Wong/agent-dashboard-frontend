/**
 * Keyboard Shortcuts Composable
 *
 * Manages keyboard shortcuts registry and execution
 */

import { ref } from 'vue'

export interface KeyboardShortcut {
  id: string
  keys: string[]
  description: string
  action: () => void
  category: ShortcutCategory
  enabled?: () => boolean
  context?: string
}

export type ShortcutCategory =
  | 'navigation'
  | 'actions'
  | 'panels'
  | 'agents'
  | 'search'
  | 'view'
  | 'other'

/**
 * Normalize key combination for display
 */
const normalizeKeys = (keys: string[]): string => {
  return keys.join(' + ')
}

/**
 * Keyboard shortcuts composable
 */
export function useKeyboardShortcuts() {
  const shortcuts = ref<KeyboardShortcut[]>([])
  const activeContext = ref<string | null>(null)
  const lastPressedKeys = ref<string[]>([])
  const showHelp = ref(false)

  /**
   * Register a keyboard shortcut
   */
  const registerShortcut = (shortcut: KeyboardShortcut): void => {
    const existing = shortcuts.value.findIndex(s => s.id === shortcut.id)
    if (existing >= 0) {
      shortcuts.value[existing] = shortcut
    } else {
      shortcuts.value.push(shortcut)
    }
  }

  /**
   * Unregister a keyboard shortcut
   */
  const unregisterShortcut = (id: string): void => {
    const index = shortcuts.value.findIndex(s => s.id === id)
    if (index >= 0) {
      shortcuts.value.splice(index, 1)
    }
  }

  /**
   * Get all shortcuts
   */
  const getAllShortcuts = (): KeyboardShortcut[] => {
    return shortcuts.value
  }

  /**
   * Get shortcuts by category
   */
  const getShortcutsByCategory = (category: ShortcutCategory): KeyboardShortcut[] => {
    return shortcuts.value.filter(s => s.category === category)
  }

  /**
   * Get enabled shortcuts in current context
   */
  const getEnabledShortcuts = (): KeyboardShortcut[] => {
    return shortcuts.value.filter(s => {
      if (s.context && activeContext.value !== s.context) {
        return false
      }
      if (s.enabled && !s.enabled()) {
        return false
      }
      return true
    })
  }

  /**
   * Execute shortcut by keys
   */
  const executeByKeys = (keys: string[]): boolean => {
    const normalized = normalizeKeys(keys).toLowerCase()
    const shortcut = getEnabledShortcuts().find(s => {
      const sKeys = s.keys.map(k => k.toLowerCase()).join('+')
      return sKeys === normalized
    })

    if (shortcut) {
      shortcut.action()
      return true
    }
    return false
  }

  /**
   * Get shortcuts as display format
   */
  const getDisplayShortcuts = (): Array<{
    category: string
    shortcuts: Array<{
      keys: string[]
      description: string
    }>
  }> => {
    const categories: Record<string, Array<{ keys: string[]; description: string }>> = {}

    for (const shortcut of getEnabledShortcuts()) {
      const category = shortcut.category
      if (!categories[category]) {
        categories[category] = []
      }

      categories[category].push({
        keys: shortcut.keys,
        description: shortcut.description
      })
    }

    return Object.entries(categories).map(([category, shortcuts]) => ({
      category,
      shortcuts
    }))
  }

  /**
   * Format shortcut keys for display
   */
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    return shortcut.keys.join(' + ')
  }

  /**
   * Toggle help panel
   */
  const toggleHelp = (): void => {
    showHelp.value = !showHelp.value
  }

  return {
    shortcuts,
    activeContext,
    lastPressedKeys,
    showHelp,
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts,
    getShortcutsByCategory,
    getEnabledShortcuts,
    executeByKeys,
    getDisplayShortcuts,
    formatShortcut,
    toggleHelp
  }
}

export default useKeyboardShortcuts
