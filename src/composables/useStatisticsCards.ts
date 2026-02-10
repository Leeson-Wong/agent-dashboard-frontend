/**
 * Statistics Cards Composable
 *
 * Manages system statistics and key metrics display
 */

import { ref, computed } from 'vue'

export interface StatCard {
  id: string
  title: string
  value: number | string
  unit?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  description?: string
  color?: string
  type?: 'number' | 'percentage' | 'duration'
  clickAction?: string
}

export interface StatCategory {
  id: string
  name: string
  cards: StatCard[]
}

export function useStatisticsCards() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const categories = ref<StatCategory[]>([])

  // Default statistics cards
  const defaultCategories: StatCategory[] = [
    {
      id: 'agents',
      name: 'Agent 统计',
      cards: [
        {
          id: 'total-agents',
          title: '总 Agent 数',
          value: 0,
          icon: '🤖',
          trend: 'neutral',
          description: '系统中所有 Agent'
        },
        {
          id: 'online-agents',
          title: '在线 Agent',
          value: 0,
          icon: '🟢',
          trend: 'up',
          description: '当前在线的 Agent'
        },
        {
          id: 'offline-agents',
          title: '离线 Agent',
          value: 0,
          icon: '⚫',
          trend: 'down',
          description: '当前离线的 Agent'
        },
        {
          id: 'error-agents',
          title: '错误 Agent',
          value: 0,
          icon: '❌',
          trend: 'neutral',
          description: '处于错误状态的 Agent'
        }
      ]
    },
    {
      id: 'performance',
      name: '性能指标',
      cards: [
        {
          id: 'avg-response-time',
          title: '平均响应时间',
          value: 0,
          unit: 'ms',
          icon: '⚡',
          trend: 'neutral',
          description: 'API 平均响应时间'
        },
        {
          id: 'requests-per-second',
          title: '每秒请求数',
          value: 0,
          unit: 'req/s',
          icon: '📈',
          trend: 'up',
          description: '当前系统吞吐量'
        },
        {
          id: 'error-rate',
          title: '错误率',
          value: 0,
          unit: '%',
          icon: '⚠️',
          trend: 'neutral',
          description: '请求错误率'
        }
      ]
    },
    {
      id: 'memory',
      name: '内存使用',
      cards: [
        {
          id: 'total-memories',
          title: 'Memory 总数',
          value: 0,
          icon: '🧠',
          trend: 'neutral',
          description: '系统中的 Memory 总数'
        },
        {
          id: 'active-memories',
          title: '活跃 Memory',
          value: 0,
          icon: '✅',
          trend: 'up',
          description: '当前活跃的 Memory'
        },
        {
          id: 'total-experiences',
          title: '经验总数',
          value: 0,
          icon: '📚',
          trend: 'up',
          description: '所有 Memory 的经验总和'
        }
      ]
    },
    {
      id: 'framework',
      name: '框架分布',
      cards: []  // Will be dynamically populated
    }
  ]

  // Initialize categories
  categories.value = defaultCategories

  // Update statistics from API data
  const updateFromAgentsData = (agents: { total: number; online: number; offline: number; error: number }): void => {
    const agentCategory = categories.value.find(c => c.id === 'agents')
    if (agentCategory) {
      agentCategory.cards[0].value = agents.total
      agentCategory.cards[1].value = agents.online
      agentCategory.cards[2].value = agents.offline
      agentCategory.cards[3].value = agents.error
    }
  }

  // Update statistics from backend stats
  const updateFromStatsData = (stats: {
    totalAgents?: number
    onlineAgents?: number
    offlineAgents?: number
    errorAgents?: number
    totalMemories?: number
    activeMemories?: number
    totalExperiences?: number
  }): void => {
    // Update agent stats
    if (stats.totalAgents !== undefined) {
      const agentCategory = categories.value.find(c => c.id === 'agents')
      if (agentCategory) {
        agentCategory.cards[0].value = stats.totalAgents
      }
    }
    if (stats.onlineAgents !== undefined) {
      const agentCategory = categories.value.find(c => c.id === 'agents')
      if (agentCategory) {
        agentCategory.cards[1].value = stats.onlineAgents
      }
    }
    if (stats.offlineAgents !== undefined) {
      const agentCategory = categories.value.find(c => c.id === 'agents')
      if (agentCategory) {
        agentCategory.cards[2].value = stats.offlineAgents
      }
    }
    if (stats.errorAgents !== undefined) {
      const agentCategory = categories.value.find(c => c.id === 'agents')
      if (agentCategory) {
        agentCategory.cards[3].value = stats.errorAgents
      }
    }

    // Update memory stats
    if (stats.totalMemories !== undefined) {
      const memCategory = categories.value.find(c => c.id === 'memory')
      if (memCategory && memCategory.cards[0]) {
        memCategory.cards[0].value = stats.totalMemories
      }
    }
    if (stats.activeMemories !== undefined) {
      const memCategory = categories.value.find(c => c.id === 'memory')
      if (memCategory && memCategory.cards[1]) {
        memCategory.cards[1].value = stats.activeMemories
      }
    }
    if (stats.totalExperiences !== undefined) {
      const memCategory = categories.value.find(c => c.id === 'memory')
      if (memCategory && memCategory.cards[2]) {
        memCategory.cards[2].value = stats.totalExperiences
      }
    }
  }

  // Update framework distribution
  const updateFrameworkDistribution = (agents: Array<{ framework?: string }>): void => {
    const frameworkCounts: Record<string, number> = {}

    agents.forEach(agent => {
      if (agent.framework) {
        frameworkCounts[agent.framework] = (frameworkCounts[agent.framework] || 0) + 1
      }
    })

    const frameworkCategory = categories.value.find(c => c.id === 'framework')
    if (frameworkCategory) {
      frameworkCategory.cards = Object.entries(frameworkCounts).map(([framework, count], index) => ({
        id: `framework-${index}`,
        title: framework,
        value: count,
        icon: getFrameworkIcon(framework),
        description: `${framework} 框架的 Agent 数量`
      }))
    }
  }

  // Get framework icon
  const getFrameworkIcon = (framework: string): string => {
    const icons: Record<string, string> = {
      'LangChain': '🦜',
      'LangGraph': '🕸️',
      'AutoGen': '🤖',
      'CrewAI': '👥',
      'OpenAI': '🔵'
    }
    return icons[framework] || '📦'
  }

  // Update performance metrics
  const updatePerformanceMetrics = (metrics: {
    avgResponseTime?: number
    requestsPerSecond?: number
    errorRate?: number
  }): void => {
    const perfCategory = categories.value.find(c => c.id === 'performance')
    if (!perfCategory) return

    if (metrics.avgResponseTime !== undefined && perfCategory.cards[0]) {
      perfCategory.cards[0].value = metrics.avgResponseTime
    }
    if (metrics.requestsPerSecond !== undefined && perfCategory.cards[1]) {
      perfCategory.cards[1].value = metrics.requestsPerSecond
    }
    if (metrics.errorRate !== undefined && perfCategory.cards[2]) {
      perfCategory.cards[2].value = metrics.errorRate
    }
  }

  // Format value for display
  const formatValue = (card: StatCard): string => {
    const value = card.value

    if (card.type === 'duration') {
      // Format as duration
      const seconds = Number(value)
      if (seconds < 60) return `${seconds}秒`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}分`
      return `${Math.floor(seconds / 3600)}小时`
    }

    if (card.type === 'number') {
      // Format with thousands separator
      return Number(value).toLocaleString()
    }

    if (card.unit) {
      return `${value}${card.unit}`
    }

    return String(value)
  }

  // Get trend icon
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral'): string => {
    if (trend === 'up') return '📈'
    if (trend === 'down') return '📉'
    return '➡️'
  }

  // Get trend class
  const getTrendClass = (trend?: 'up' | 'down' | 'neutral'): string => {
    if (trend === 'up') return 'up'
    if (trend === 'down') return 'down'
    return 'neutral'
  }

  // Fetch statistics from backend
  const fetchStatistics = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const response = await fetch(`${apiUrl}/api/stats`)

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      updateFromStatsData(data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  // Calculate total cards count
  const totalCards = computed(() => {
    return categories.value.reduce((sum, cat) => sum + cat.cards.length, 0)
  })

  return {
    // State
    isLoading,
    error,
    categories,
    totalCards,

    // Methods
    updateFromAgentsData,
    updateFromStatsData,
    updateFrameworkDistribution,
    updatePerformanceMetrics,
    fetchStatistics,
    formatValue,
    getTrendIcon,
    getTrendClass
  }
}
