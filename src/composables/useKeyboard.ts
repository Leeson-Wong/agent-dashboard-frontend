/**
 * Keyboard Shortcuts Composable
 *
 * 管理全局键盘快捷键
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean // Command key on Mac
  description: string
  handler: () => void
}

type ShortcutMap = Map<string, KeyboardShortcut>

// Global shortcuts registry
let globalShortcuts: ShortcutMap = new Map()

export function useKeyboard() {
  // Format key combination for display
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push(isMac() ? '⌘' : 'Ctrl')
    if (shortcut.shift) parts.push('Shift')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.meta) parts.push('⌘')

    parts.push(formatKey(shortcut.key))

    return parts.join(' + ')
  }

  // Format individual key
  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'escape': 'Esc',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'enter': 'Enter',
      'tab': 'Tab',
      'backspace': 'Backspace',
      'delete': 'Delete',
    }

    return keyMap[key.toLowerCase()] || key.toUpperCase()
  }

  // Check if running on Mac
  const isMac = (): boolean => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }

  // Generate shortcut key for map lookup
  const generateShortcutKey = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    if (shortcut.meta) parts.push('meta')

    parts.push(shortcut.key.toLowerCase())

    return parts.join('+')
  }

  // Register a keyboard shortcut
  const registerShortcut = (shortcut: KeyboardShortcut): string => {
    const key = generateShortcutKey(shortcut)
    globalShortcuts.set(key, shortcut)
    return key
  }

  // Unregister a keyboard shortcut
  const unregisterShortcut = (shortcut: KeyboardShortcut): void => {
    const key = generateShortcutKey(shortcut)
    globalShortcuts.delete(key)
  }

  // Handle keyboard event
  const handleKeydown = (event: KeyboardEvent): void => {
    // Ignore shortcuts when typing in input, textarea, or contenteditable
    const target = event.target as HTMLElement
    const tagName = target.tagName
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable

    // Allow shortcuts with Ctrl/Cmd (Meta) even in inputs
    const hasModifier = event.ctrlKey || event.metaKey

    if (isInput && !hasModifier) {
      return // Skip shortcut handling
    }

    const parts: string[] = []

    if (event.ctrlKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    if (event.metaKey) parts.push('meta')

    // Handle special keys
    let key = event.key.toLowerCase()

    // Map space to ' ' for consistency
    if (key === ' ') key = ' '

    parts.push(key)

    const shortcutKey = parts.join('+')
    const shortcut = globalShortcuts.get(shortcutKey)

    if (shortcut) {
      event.preventDefault()
      shortcut.handler()
    }
  }

  // Get all registered shortcuts
  const getShortcuts = (): KeyboardShortcut[] => {
    return Array.from(globalShortcuts.values())
  }

  return {
    registerShortcut,
    unregisterShortcut,
    formatShortcut,
    formatKey,
    isMac,
    getShortcuts,
    handleKeydown,
  }
}

// Global keyboard handler instance
let setup = false

export function setupGlobalKeyboard(handleKeydown: (e: KeyboardEvent) => void) {
  if (setup) return

  window.addEventListener('keydown', handleKeydown)
  setup = true
}

export function teardownGlobalKeyboard(handleKeydown: (e: KeyboardEvent) => void) {
  window.removeEventListener('keydown', handleKeydown)
  setup = false
}
