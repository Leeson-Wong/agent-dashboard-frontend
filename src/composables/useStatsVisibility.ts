/**
 * Stats Visibility Composable
 *
 * Manages visibility of statistics card categories
 */

import { ref, computed, watch } from 'vue'

export type StatCategoryId =
  | 'overview'
  | 'agents'
  | 'performance'
  | 'memory'
  | 'frameworks'

export interface StatCategoryOption {
  id: StatCategoryId
  label: string
  description: string
  icon: string
  defaultVisible: boolean
}

// Available stat categories
export const STAT_CATEGORIES: StatCategoryOption[] = [
  {
    id: 'overview',
    label: '概览',
    description: '总体统计信息',
    icon: '📊',
    defaultVisible: true
  },
  {
    id: 'agents',
    label: 'Agent',
    description: 'Agent 相关统计',
    icon: '🤖',
    defaultVisible: true
  },
  {
    id: 'performance',
    label: '性能',
    description: '性能指标',
    icon: '⚡',
    defaultVisible: true
  },
  {
    id: 'memory',
    label: '内存',
    description: '内存使用情况',
    icon: '🧠',
    defaultVisible: true
  },
  {
    id: 'frameworks',
    label: '框架',
    description: '框架分布统计',
    icon: '🏗️',
    defaultVisible: true
  }
]

const STORAGE_KEY = 'agent-dashboard-stats-visibility'

/**
 * Load visibility from localStorage
 */
const loadVisibility = (): Record<StatCategoryId, boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults
      const defaults: Record<StatCategoryId, boolean> = {
        overview: true,
        agents: true,
        performance: true,
        memory: true,
        frameworks: true
      }
      return { ...defaults, ...parsed }
    }
  } catch (error) {
    console.error('Failed to load stats visibility:', error)
  }
  return {
    overview: true,
    agents: true,
    performance: true,
    memory: true,
    frameworks: true
  }
}

/**
 * Save visibility to localStorage
 */
const saveVisibility = (visibility: Record<StatCategoryId, boolean>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
  } catch (error) {
    console.error('Failed to save stats visibility:', error)
  }
}

/**
 * Stats visibility composable
 */
export function useStatsVisibility() {
  const visibility = ref<Record<StatCategoryId, boolean>>(loadVisibility())

  // Save to localStorage when visibility changes
  watch(
    visibility,
    (newVisibility) => {
      saveVisibility(newVisibility)
    },
    { deep: true }
  )

  /**
   * Check if a category is visible
   */
  const isVisible = computed(() => {
    return (categoryId: StatCategoryId): boolean => {
      return visibility.value[categoryId] ?? true
    }
  })

  /**
   * Set visibility for a specific category
   */
  const setVisibility = (categoryId: StatCategoryId, visible: boolean): void => {
    visibility.value[categoryId] = visible
  }

  /**
   * Toggle visibility for a specific category
   */
  const toggleVisibility = (categoryId: StatCategoryId): void => {
    visibility.value[categoryId] = !visibility.value[categoryId]
  }

  /**
   * Show all categories
   */
  const showAll = (): void => {
    Object.keys(visibility.value).forEach((key) => {
      visibility.value[key as StatCategoryId] = true
    })
  }

  /**
   * Hide all categories (except overview)
   */
  const hideAll = (): void => {
    Object.keys(visibility.value).forEach((key) => {
      const k = key as StatCategoryId
      if (k !== 'overview') {
        visibility.value[k] = false
      }
    })
  }

  /**
   * Reset to default visibility
   */
  const reset = (): void => {
    visibility.value = {
      overview: true,
      agents: true,
      performance: true,
      memory: true,
      frameworks: true
    }
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

  return {
    visibility,
    isVisible,
    visibleCount,
    totalCount,
    setVisibility,
    toggleVisibility,
    showAll,
    hideAll,
    reset
  }
}

export default useStatsVisibility
