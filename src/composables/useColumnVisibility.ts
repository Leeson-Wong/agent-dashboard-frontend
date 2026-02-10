/**
 * Column Visibility Composable
 *
 * Manages visibility of columns/elements in the agent list
 */

import { ref, computed, watch } from 'vue'

export type ColumnKey =
  | 'checkbox'
  | 'status'
  | 'favorite'
  | 'framework'
  | 'language'
  | 'activity'
  | 'tool'
  | 'tags'
  | 'time'
  | 'actions'

export interface ColumnOption {
  key: ColumnKey
  label: string
  description: string
  defaultVisible: boolean
  icon?: string
}

// Available column options
export const COLUMN_OPTIONS: ColumnOption[] = [
  {
    key: 'checkbox',
    label: '选择框',
    description: '批量选择复选框',
    defaultVisible: true,
    icon: '☑️'
  },
  {
    key: 'status',
    label: '状态指示器',
    description: 'Agent 状态指示点',
    defaultVisible: true,
    icon: '🔵'
  },
  {
    key: 'favorite',
    label: '收藏按钮',
    description: '收藏/取消收藏按钮',
    defaultVisible: true,
    icon: '⭐'
  },
  {
    key: 'framework',
    label: '框架',
    description: 'Agent 框架信息',
    defaultVisible: true,
    icon: '🏗️'
  },
  {
    key: 'language',
    label: '语言',
    description: 'Agent 编程语言',
    defaultVisible: true,
    icon: '💻'
  },
  {
    key: 'activity',
    label: '当前活动',
    description: 'Agent 当前活动描述',
    defaultVisible: true,
    icon: '⚡'
  },
  {
    key: 'tool',
    label: '当前工具',
    description: 'Agent 正在使用的工具',
    defaultVisible: true,
    icon: '🔧'
  },
  {
    key: 'tags',
    label: '标签',
    description: 'Agent 标签显示',
    defaultVisible: true,
    icon: '🏷️'
  },
  {
    key: 'time',
    label: '活动时间',
    description: '最后活动时间',
    defaultVisible: true,
    icon: '🕐'
  },
  {
    key: 'actions',
    label: '快捷操作',
    description: '快捷操作按钮',
    defaultVisible: true,
    icon: '⋯'
  }
]

const STORAGE_KEY = 'agent-dashboard-column-visibility'

// Default visibility state
const getDefaultVisibility = (): Record<ColumnKey, boolean> => ({
  checkbox: true,
  status: true,
  favorite: true,
  framework: true,
  language: true,
  activity: true,
  tool: true,
  tags: true,
  time: true,
  actions: true
})

/**
 * Load visibility from localStorage
 */
const loadVisibility = (): Record<ColumnKey, boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle new columns
      return { ...getDefaultVisibility(), ...parsed }
    }
  } catch (error) {
    console.error('Failed to load column visibility:', error)
  }
  return getDefaultVisibility()
}

/**
 * Save visibility to localStorage
 */
const saveVisibility = (visibility: Record<ColumnKey, boolean>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
  } catch (error) {
    console.error('Failed to save column visibility:', error)
  }
}

/**
 * Column visibility composable
 */
export function useColumnVisibility() {
  const visibility = ref<Record<ColumnKey, boolean>>(loadVisibility())

  // Save to localStorage when visibility changes
  watch(
    visibility,
    (newVisibility) => {
      saveVisibility(newVisibility)
    },
    { deep: true }
  )

  /**
   * Check if a column is visible
   */
  const isVisible = computed(() => {
    return (key: ColumnKey): boolean => {
      return visibility.value[key] ?? true
    }
  })

  /**
   * Set visibility for a specific column
   */
  const setVisibility = (key: ColumnKey, visible: boolean): void => {
    visibility.value[key] = visible
  }

  /**
   * Toggle visibility for a specific column
   */
  const toggleVisibility = (key: ColumnKey): void => {
    visibility.value[key] = !visibility.value[key]
  }

  /**
   * Show all columns
   */
  const showAll = (): void => {
    Object.keys(visibility.value).forEach((key) => {
      visibility.value[key as ColumnKey] = true
    })
  }

  /**
   * Hide all columns (except essential ones)
   */
  const hideAll = (): void => {
    Object.keys(visibility.value).forEach((key) => {
      // Keep status, name (always visible), and time visible
      const k = key as ColumnKey
      if (k !== 'status' && k !== 'time') {
        visibility.value[k] = false
      }
    })
  }

  /**
   * Reset to default visibility
   */
  const reset = (): void => {
    visibility.value = getDefaultVisibility()
  }

  /**
   * Get CSS class for column visibility
   */
  const getColumnClass = (key: ColumnKey): string => {
    return isVisible.value(key) ? '' : 'column-hidden'
  }

  /**
   * Get visible count
   */
  const visibleCount = computed(() => {
    return Object.values(visibility.value).filter((v) => v).length
  })

  /**
   * Get total count
   */
  const totalCount = computed(() => {
    return Object.keys(visibility.value).length
  })

  /**
   * Get visibility percentage
   */
  const visibilityPercentage = computed(() => {
    return Math.round((visibleCount.value / totalCount.value) * 100)
  })

  /**
   * Check if all columns are visible
   */
  const isAllVisible = computed(() => {
    return visibleCount.value === totalCount.value
  })

  /**
   * Check if only essential columns are visible
   */
  const isMinimal = computed(() => {
    const essential: ColumnKey[] = ['status', 'time']
    const visibleKeys = Object.entries(visibility.value)
      .filter(([_, visible]) => visible)
      .map(([key]) => key as ColumnKey)

    return (
      visibleKeys.length === essential.length &&
      essential.every((key) => visibleKeys.includes(key))
    )
  })

  return {
    // State
    visibility,

    // Computed
    isVisible,
    visibleCount,
    totalCount,
    visibilityPercentage,
    isAllVisible,
    isMinimal,

    // Methods
    setVisibility,
    toggleVisibility,
    showAll,
    hideAll,
    reset,
    getColumnClass
  }
}

export default useColumnVisibility
