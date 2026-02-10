/**
 * Agent Comparison Composable
 *
 * Manages side-by-side comparison of two agents
 */

import { ref, computed } from 'vue'
import type { AgentState } from '../../shared/types'

export interface ComparisonItem {
  label: string
  key: string
  valueA?: string | number | boolean
  valueB?: string | number | boolean
  type?: 'text' | 'boolean' | 'number' | 'array' | 'object'
  different?: boolean
}

const STORAGE_KEY = 'agentDashboard_agentComparison'

export function useAgentComparison() {
  const agentA = ref<AgentState | null>(null)
  const agentB = ref<AgentState | null>(null)
  const isComparing = ref(false)

  // Load comparison from localStorage
  const loadComparison = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        // Storage is for future use
      }
    } catch (e) {
      console.error('Failed to load comparison:', e)
    }
  }

  // Set agents for comparison
  const setAgents = (a: AgentState | null, b: AgentState | null): void => {
    agentA.value = a
    agentB.value = b
    isComparing.value = a !== null && b !== null
  }

  // Clear comparison
  const clearComparison = (): void => {
    agentA.value = null
    agentB.value = null
    isComparing.value = false
  }

  // Get comparison items
  const comparisonItems = computed((): ComparisonItem[] => {
    if (!agentA.value || !agentB.value) {
      return []
    }

    const a = agentA.value
    const b = agentB.value

    return [
      {
        label: 'Agent ID',
        key: 'agentId',
        valueA: a.agentId,
        valueB: b.agentId,
        type: 'text',
        different: a.agentId !== b.agentId
      },
      {
        label: '服务器 ID',
        key: 'serverId',
        valueA: a.serverId,
        valueB: b.serverId,
        type: 'text',
        different: a.serverId !== b.serverId
      },
      {
        label: '状态',
        key: 'status',
        valueA: a.status,
        valueB: b.status,
        type: 'text',
        different: a.status !== b.status
      },
      {
        label: '框架',
        key: 'framework',
        valueA: a.framework,
        valueB: b.framework,
        type: 'text',
        different: a.framework !== b.framework
      },
      {
        label: '语言',
        key: 'language',
        valueA: a.language,
        valueB: b.language,
        type: 'text',
        different: a.language !== b.language
      },
      {
        label: '角色',
        key: 'role',
        valueA: a.role || 'N/A',
        valueB: b.role || 'N/A',
        type: 'text',
        different: (a.role || 'N/A') !== (b.role || 'N/A')
      },
      {
        label: '当前活动',
        key: 'currentActivity',
        valueA: a.currentActivity || 'N/A',
        valueB: b.currentActivity || 'N/A',
        type: 'text',
        different: (a.currentActivity || 'N/A') !== (b.currentActivity || 'N/A')
      },
      {
        label: '当前工具',
        key: 'currentTool',
        valueA: a.currentTool || 'N/A',
        valueB: b.currentTool || 'N/A',
        type: 'text',
        different: (a.currentTool || 'N/A') !== (b.currentTool || 'N/A')
      },
      {
        label: '当前任务',
        key: 'currentTaskId',
        valueA: a.currentTaskId || 'N/A',
        valueB: b.currentTaskId || 'N/A',
        type: 'text',
        different: (a.currentTaskId || 'N/A') !== (b.currentTaskId || 'N/A')
      },
      {
        label: 'Memory ID',
        key: 'memoryId',
        valueA: a.memoryId || 'N/A',
        valueB: b.memoryId || 'N/A',
        type: 'text',
        different: (a.memoryId || 'N/A') !== (b.memoryId || 'N/A')
      },
      {
        label: '收藏',
        key: 'isFavorite',
        valueA: a.isFavorite || false,
        valueB: b.isFavorite || false,
        type: 'boolean',
        different: (a.isFavorite || false) !== (b.isFavorite || false)
      },
      {
        label: '创建时间',
        key: 'createdAt',
        valueA: a.createdAt ? new Date(a.createdAt).toLocaleString('zh-CN') : 'N/A',
        valueB: b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN') : 'N/A',
        type: 'text',
        different: a.createdAt !== b.createdAt
      },
      {
        label: '最后活动',
        key: 'lastActivity',
        valueA: a.lastActivity ? new Date(a.lastActivity).toLocaleString('zh-CN') : 'N/A',
        valueB: b.lastActivity ? new Date(b.lastActivity).toLocaleString('zh-CN') : 'N/A',
        type: 'text',
        different: a.lastActivity !== b.lastActivity
      }
    ]
  })

  // Get differences only
  const differences = computed((): ComparisonItem[] => {
    return comparisonItems.value.filter(item => item.different)
  })

  // Get difference count
  const differenceCount = computed((): number => {
    return differences.value.length
  })

  // Get similarity percentage
  const similarityPercentage = computed((): number => {
    if (comparisonItems.value.length === 0) return 0
    const sameCount = comparisonItems.value.filter(item => !item.different).length
    return Math.round((sameCount / comparisonItems.value.length) * 100)
  })

  // Format value for display
  const formatValue = (value: string | number | boolean | undefined, type?: string): string => {
    if (value === undefined || value === null) return 'N/A'
    if (type === 'boolean') return value ? '是' : '否'
    if (type === 'number') return String(value)
    return String(value)
  }

  // Get value display style
  const getValueStyle = (value: string | number | boolean | undefined, type?: string) => {
    if (type === 'boolean') {
      return value === true ? 'color: #22c55e;' : value === false ? 'color: #ef4444;' : ''
    }
    return ''
  }

  return {
    // State
    agentA,
    agentB,
    isComparing,

    // Computed
    comparisonItems,
    differences,
    differenceCount,
    similarityPercentage,

    // Methods
    setAgents,
    clearComparison,
    formatValue,
    getValueStyle,
    loadComparison
  }
}
