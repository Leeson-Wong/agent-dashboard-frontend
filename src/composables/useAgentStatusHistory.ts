/**
 * Agent Status History Composable
 *
 * Tracks and manages agent status change history
 */

import { ref, computed } from 'vue'
import type { AgentStatus } from '../../shared/types'

export interface StatusHistoryEntry {
  timestamp: Date
  status: AgentStatus
  previousStatus?: AgentStatus
  duration?: number // Duration in milliseconds since previous status
  metadata?: {
    reason?: string
    source?: string
  }
}

const MAX_HISTORY_ENTRIES = 100

/**
 * Store status history for all agents
 * Key: agentId, Value: StatusHistoryEntry[]
 */
const statusHistoryStore = ref<Map<string, StatusHistoryEntry[]>>(new Map())

/**
 * Get status history for an agent
 */
export const getAgentStatusHistory = (agentId: string): StatusHistoryEntry[] => {
  return statusHistoryStore.value.get(agentId) || []
}

/**
 * Add status change entry to history
 */
export const addStatusChange = (
  agentId: string,
  newStatus: AgentStatus,
  previousStatus?: AgentStatus,
  metadata?: StatusHistoryEntry['metadata']
): void => {
  const history = statusHistoryStore.value.get(agentId) || []
  const lastEntry = history[history.length - 1]

  const entry: StatusHistoryEntry = {
    timestamp: new Date(),
    status: newStatus,
    previousStatus,
    metadata
  }

  // Calculate duration if there's a previous entry
  if (lastEntry && lastEntry.timestamp) {
    entry.duration = Date.now() - lastEntry.timestamp.getTime()
  }

  history.push(entry)

  // Keep only MAX_HISTORY_ENTRIES
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.shift()
  }

  statusHistoryStore.value.set(agentId, history)
}

/**
 * Clear status history for an agent
 */
export const clearAgentStatusHistory = (agentId: string): void => {
  statusHistoryStore.value.delete(agentId)
}

/**
 * Clear all status history
 */
export const clearAllStatusHistory = (): void => {
  statusHistoryStore.value.clear()
}

/**
 * Use agent status history
 */
export function useAgentStatusHistory(agentId: string) {
  // Status history for this agent
  const history = computed<StatusHistoryEntry[]>(() => {
    return getAgentStatusHistory(agentId)
  })

  // Status change statistics
  const statistics = computed(() => {
    const entries = history.value
    if (entries.length === 0) {
      return {
        totalChanges: 0,
        statusCounts: {} as Record<AgentStatus, number>,
        averageDuration: undefined,
        firstStatus: undefined,
        lastStatus: undefined,
        timeRange: undefined
      }
    }

    const statusCounts: Record<string, number> = {}
    let totalDuration = 0
    let durationCount = 0

    entries.forEach(entry => {
      statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1
      if (entry.duration !== undefined) {
        totalDuration += entry.duration
        durationCount++
      }
    })

    return {
      totalChanges: entries.length,
      statusCounts: statusCounts as Record<AgentStatus, number>,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
      firstStatus: entries[0].status,
      lastStatus: entries[entries.length - 1].status,
      timeRange: {
        start: entries[0].timestamp,
        end: entries[entries.length - 1].timestamp
      }
    }
  })

  // Get history within time range
  const getHistoryInRange = (startDate: Date, endDate: Date): StatusHistoryEntry[] => {
    return history.value.filter(entry => {
      const timestamp = entry.timestamp
      return timestamp >= startDate && timestamp <= endDate
    })
  }

  // Get history for specific status
  const getHistoryForStatus = (status: AgentStatus): StatusHistoryEntry[] => {
    return history.value.filter(entry => entry.status === status)
  }

  // Get recent history (last N entries)
  const getRecentHistory = (count: number = 10): StatusHistoryEntry[] => {
    return history.value.slice(-count)
  }

  // Format duration for display
  const formatDuration = (ms?: number): string => {
    if (ms === undefined) return '-'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  return {
    // State
    history,
    statistics,

    // Methods
    getHistoryInRange,
    getHistoryForStatus,
    getRecentHistory,
    formatDuration
  }
}

export default useAgentStatusHistory
