/**
 * Context Menu Composable
 *
 * Manages context menu state and behavior
 */

import { ref, computed } from 'vue'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  action: () => void
}

export interface ContextMenuPosition {
  x: number
  y: number
}

const isOpen = ref(false)
const position = ref<ContextMenuPosition>({ x: 0, y: 0 })
const items = ref<ContextMenuItem[]>([])
const targetData = ref<any>(null)

/**
 * Use context menu composable
 */
export function useContextMenu() {
  /**
   * Open context menu at position
   */
  const openMenu = (
    x: number,
    y: number,
    menuItems: ContextMenuItem[],
    data?: any
  ): void => {
    position.value = { x, y }
    items.value = menuItems
    targetData.value = data
    isOpen.value = true
  }

  /**
   * Close context menu
   */
  const closeMenu = (): void => {
    isOpen.value = false
    items.value = []
    targetData.value = null
  }

  /**
   * Execute menu item action
   */
  const executeAction = (itemId: string): void => {
    const item = items.value.find(i => i.id === itemId)
    if (item && !item.disabled) {
      item.action()
      closeMenu()
    }
  }

  /**
   * Check if menu is open
   */
  const menuOpen = computed(() => isOpen.value)

  /**
   * Get menu position
   */
  const menuPosition = computed(() => position.value)

  /**
   * Get menu items
   */
  const menuItems = computed(() => items.value)

  /**
   * Get target data
   */
  const target = computed(() => targetData.value)

  return {
    // State
    menuOpen,
    menuPosition,
    menuItems,
    target,

    // Methods
    openMenu,
    closeMenu,
    executeAction
  }
}

/**
 * Global context menu state for single menu instance
 */
let globalCloseMenu: (() => void) | null = null

export const registerCloseMenu = (closeFn: () => void): void => {
  globalCloseMenu = closeFn
}

export const closeGlobalContextMenu = (): void => {
  if (globalCloseMenu) {
    globalCloseMenu()
  }
}

export default useContextMenu
