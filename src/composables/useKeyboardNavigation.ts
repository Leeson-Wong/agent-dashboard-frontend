/**
 * Keyboard Navigation Composable
 *
 * Provides keyboard navigation support for lists
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

export interface NavigationItem {
  id: string
  [key: string]: unknown
}

export interface UseKeyboardNavigationOptions {
  items: Ref<NavigationItem[]>
  onSelect?: (item: NavigationItem) => void
  onNavigate?: (item: NavigationItem) => void
  enabled?: Ref<boolean>
  loop?: boolean
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    items,
    onSelect,
    onNavigate,
    enabled = ref(true),
    loop = true
  } = options

  const focusedIndex = ref(-1)
  const selectedIndex = ref<Set<string>>(new Set())

  // Get current focused item
  const focusedItem = computed(() => {
    if (focusedIndex.value < 0 || focusedIndex.value >= items.value.length) {
      return null
    }
    return items.value[focusedIndex.value]
  })

  // Check if item is selected
  const isItemSelected = (itemId: string): boolean => {
    return selectedIndex.value.has(itemId)
  }

  // Toggle item selection
  const toggleSelection = (itemId: string): void => {
    if (selectedIndex.value.has(itemId)) {
      selectedIndex.value.delete(itemId)
    } else {
      selectedIndex.value.add(itemId)
    }
    // Force reactivity update
    selectedIndex.value = new Set(selectedIndex.value)
  }

  // Select single item (clear others)
  const selectItem = (itemId: string): void => {
    selectedIndex.value.clear()
    selectedIndex.value.add(itemId)
    selectedIndex.value = new Set(selectedIndex.value)
  }

  // Clear all selections
  const clearSelection = (): void => {
    selectedIndex.value.clear()
    selectedIndex.value = new Set(selectedIndex.value)
  }

  // Select all items
  const selectAll = (): void => {
    items.value.forEach(item => selectedIndex.value.add(item.id))
    selectedIndex.value = new Set(selectedIndex.value)
  }

  // Navigation functions
  const navigateUp = (): void => {
    if (!enabled.value || items.value.length === 0) return

    if (focusedIndex.value <= 0) {
      focusedIndex.value = loop ? items.value.length - 1 : 0
    } else {
      focusedIndex.value--
    }

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  const navigateDown = (): void => {
    if (!enabled.value || items.value.length === 0) return

    if (focusedIndex.value >= items.value.length - 1) {
      focusedIndex.value = loop ? 0 : items.value.length - 1
    } else {
      focusedIndex.value++
    }

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  const navigateToPageUp = (): void => {
    if (!enabled.value || items.value.length === 0) return
    const pageSize = 10
    focusedIndex.value = Math.max(0, focusedIndex.value - pageSize)

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  const navigateToPageDown = (): void => {
    if (!enabled.value || items.value.length === 0) return
    const pageSize = 10
    focusedIndex.value = Math.min(items.value.length - 1, focusedIndex.value + pageSize)

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  const navigateToFirst = (): void => {
    if (!enabled.value || items.value.length === 0) return
    focusedIndex.value = 0

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  const navigateToLast = (): void => {
    if (!enabled.value || items.value.length === 0) return
    focusedIndex.value = items.value.length - 1

    if (onNavigate && focusedItem.value) {
      onNavigate(focusedItem.value)
    }
  }

  // Handle keyboard event
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!enabled.value) return

    // Ignore shortcuts when typing in input, textarea, or contenteditable
    const target = event.target as HTMLElement
    const tagName = target.tagName
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable

    if (isInput) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        navigateUp()
        break

      case 'ArrowDown':
        event.preventDefault()
        navigateDown()
        break

      case 'PageUp':
        event.preventDefault()
        navigateToPageUp()
        break

      case 'PageDown':
        event.preventDefault()
        navigateToPageDown()
        break

      case 'Home':
        event.preventDefault()
        navigateToFirst()
        break

      case 'End':
        event.preventDefault()
        navigateToLast()
        break

      case 'Enter':
      case ' ':
        if (focusedItem.value && focusedIndex.value >= 0) {
          event.preventDefault()
          if (event.key === ' ' || event.ctrlKey) {
            // Space or Ctrl+Enter: Toggle selection
            toggleSelection(focusedItem.value.id)
          } else {
            // Enter: Select and trigger callback
            selectItem(focusedItem.value.id)
            if (onSelect) {
              onSelect(focusedItem.value)
            }
          }
        }
        break

      case 'Escape':
        event.preventDefault()
        focusedIndex.value = -1
        clearSelection()
        break

      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          selectAll()
        }
        break
    }
  }

  // Focus management
  const focusIndex = (index: number): void => {
    if (index >= 0 && index < items.value.length) {
      focusedIndex.value = index
      if (onNavigate && focusedItem.value) {
        onNavigate(focusedItem.value)
      }
    }
  }

  const focusItem = (itemId: string): void => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index >= 0) {
      focusIndex(index)
    }
  }

  const blur = (): void => {
    focusedIndex.value = -1
  }

  // Lifecycle
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // State
    focusedIndex,
    focusedItem,
    selectedIndex,

    // Computed
    isItemSelected,

    // Navigation
    navigateUp,
    navigateDown,
    navigateToPageUp,
    navigateToPageDown,
    navigateToFirst,
    navigateToLast,

    // Selection
    toggleSelection,
    selectItem,
    clearSelection,
    selectAll,

    // Focus
    focusIndex,
    focusItem,
    blur
  }
}
