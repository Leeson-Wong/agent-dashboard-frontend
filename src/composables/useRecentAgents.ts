/**
 * Recent Agents Composable
 *
 * Manages recently viewed agents
 */

import { ref, computed } from 'vue'
import type { AgentState } from '../../shared/types'

const STORAGE_KEY = 'recent_agents'
const MAX_RECENT = 10

// Global recent agents store
const recentAgents = ref<string[]>([])

/**
 * Load recent agents from localStorage
 */
const loadRecentAgents = (): void => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const recent = JSON.parse(saved) as string[]
      recentAgents.value = recent
    }
  } catch (error) {
    console.warn('Failed to load recent agents:', error)
  }
}

/**
 * Save recent agents to localStorage
 */
const saveRecentAgents = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentAgents.value))
  } catch (error) {
    console.warn('Failed to save recent agents:', error)
  }
}

export function useRecentAgents() {
  // Initialize on first use
  if (recentAgents.value.length === 0) {
    loadRecentAgents()
  }

  /**
   * Add agent to recent list
   */
  const addRecent = (agentId: string): void => {
    // Remove if already exists
    const index = recentAgents.value.indexOf(agentId)
    if (index !== -1) {
      recentAgents.value.splice(index, 1)
    }

    // Add to front
    recentAgents.value.unshift(agentId)

    // Keep only MAX_RECENT
    if (recentAgents.value.length > MAX_RECENT) {
      recentAgents.value = recentAgents.value.slice(0, MAX_RECENT)
    }

    saveRecentAgents()
  }

  /**
   * Remove agent from recent list
   */
  const removeRecent = (agentId: string): void => {
    const index = recentAgents.value.indexOf(agentId)
    if (index !== -1) {
      recentAgents.value.splice(index, 1)
      saveRecentAgents()
    }
  }

  /**
   * Clear all recent agents
   */
  const clearRecent = (): void => {
    recentAgents.value = []
    saveRecentAgents()
  }

  /**
   * Get recent agents from a list
   */
  const getRecentAgents = (allAgents: AgentState[]): AgentState[] => {
    const recentIds = recentAgents.value
    return recentIds
      .map(id => allAgents.find(a => a.agentId === id))
      .filter((a): a is AgentState => a !== undefined)
  }

  /**
   * Check if agent is in recent list
   */
  const isRecent = (agentId: string): boolean => {
    return recentAgents.value.includes(agentId)
  }

  /**
   * Get count of recent agents
   */
  const recentCount = computed(() => recentAgents.value.length)

  return {
    // State
    recentAgents,
    recentCount,

    // Methods
    addRecent,
    removeRecent,
    clearRecent,
    getRecentAgents,
    isRecent
  }
}
