/**
 * Activity Feed Composable
 *
 * Manages real-time activity feed for agent events
 */

import { ref, computed } from 'vue'

export interface ActivityEvent {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  agentId?: string
  agentName?: string
  title: string
  message: string
  timestamp: number
  icon?: string
  category?: string
}

export type ActivityFilter = 'all' | 'info' | 'success' | 'warning' | 'error'

const MAX_EVENTS = 100
const STORAGE_KEY = 'agentDashboard_activityFeed'

export function useActivityFeed() {
  const events = ref<ActivityEvent[]>([])
  const filter = ref<ActivityFilter>('all')
  const maxEvents = ref(MAX_EVENTS)

  // Load events from localStorage
  const loadEvents = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        events.value = parsed.events || []
        filter.value = parsed.filter || 'all'
      }
    } catch (e) {
      console.error('Failed to load activity feed:', e)
    }
  }

  // Save events to localStorage
  const saveEvents = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events: events.value,
        filter: filter.value
      }))
    } catch (e) {
      console.error('Failed to save activity feed:', e)
    }
  }

  // Add new event
  const addEvent = (event: Omit<ActivityEvent, 'id' | 'timestamp'>): void => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      icon: event.icon || getDefaultIcon(event.type)
    }

    events.value.unshift(newEvent)

    // Keep only max events
    if (events.value.length > maxEvents.value) {
      events.value = events.value.slice(0, maxEvents.value)
    }

    saveEvents()
  }

  // Add multiple events
  const addEvents = (newEvents: Omit<ActivityEvent, 'id' | 'timestamp'>[]): void => {
    const eventsWithId = newEvents.map(event => ({
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      icon: event.icon || getDefaultIcon(event.type)
    }))

    events.value = [...eventsWithId, ...events.value].slice(0, maxEvents.value)
    saveEvents()
  }

  // Remove event
  const removeEvent = (eventId: string): void => {
    events.value = events.value.filter(e => e.id !== eventId)
    saveEvents()
  }

  // Clear all events
  const clearEvents = (): void => {
    events.value = []
    saveEvents()
  }

  // Clear old events (older than specified milliseconds)
  const clearOldEvents = (olderThan: number): void => {
    const cutoff = Date.now() - olderThan
    events.value = events.value.filter(e => e.timestamp > cutoff)
    saveEvents()
  }

  // Get default icon for event type
  const getDefaultIcon = (type: ActivityEvent['type']): string => {
    const icons: Record<ActivityEvent['type'], string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }
    return icons[type]
  }

  // Get category-specific icon
  const getCategoryIcon = (category?: string): string => {
    if (!category) return ''

    const icons: Record<string, string> = {
      'agent-created': '🎉',
      'agent-deleted': '🗑️',
      'agent-started': '▶️',
      'agent-stopped': '⏹️',
      'agent-paused': '⏸️',
      'agent-resumed': '▶️',
      'task-completed': '✅',
      'task-failed': '❌',
      'memory-created': '🧠',
      'memory-updated': '📝',
      'error': '⚠️',
      'connection': '🔌',
      'system': '⚙️'
    }
    return icons[category] || ''
  }

  // Filtered events
  const filteredEvents = computed(() => {
    if (filter.value === 'all') {
      return events.value
    }
    return events.value.filter(e => e.type === filter.value)
  })

  // Events grouped by date
  const groupedEvents = computed(() => {
    const groups: Record<string, ActivityEvent[]> = {}

    filteredEvents.value.forEach(event => {
      const date = new Date(event.timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let groupKey = ''

      if (date.toDateString() === today.toDateString()) {
        groupKey = '今天'
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = '昨天'
      } else {
        groupKey = date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric'
        })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(event)
    })

    return groups
  })

  // Event counts by type
  const eventCounts = computed(() => {
    return {
      all: events.value.length,
      info: events.value.filter(e => e.type === 'info').length,
      success: events.value.filter(e => e.type === 'success').length,
      warning: events.value.filter(e => e.type === 'warning').length,
      error: events.value.filter(e => e.type === 'error').length
    }
  })

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Add predefined event types
  const addInfoEvent = (title: string, message: string, agentId?: string, agentName?: string, category?: string): void => {
    addEvent({ type: 'info', title, message, agentId, agentName, category })
  }

  const addSuccessEvent = (title: string, message: string, agentId?: string, agentName?: string, category?: string): void => {
    addEvent({ type: 'success', title, message, agentId, agentName, category })
  }

  const addWarningEvent = (title: string, message: string, agentId?: string, agentName?: string, category?: string): void => {
    addEvent({ type: 'warning', title, message, agentId, agentName, category })
  }

  const addErrorEvent = (title: string, message: string, agentId?: string, agentName?: string, category?: string): void => {
    addEvent({ type: 'error', title, message, agentId, agentName, category })
  }

  // Auto-clear old events (older than 7 days)
  const autoClearOldEvents = (): void => {
    clearOldEvents(7 * 24 * 60 * 60 * 1000) // 7 days
  }

  // Initialize
  loadEvents()

  return {
    // State
    events,
    filter,
    maxEvents,

    // Computed
    filteredEvents,
    groupedEvents,
    eventCounts,

    // Methods
    addEvent,
    addEvents,
    removeEvent,
    clearEvents,
    clearOldEvents,
    addInfoEvent,
    addSuccessEvent,
    addWarningEvent,
    addErrorEvent,
    autoClearOldEvents,
    formatTimestamp,
    getCategoryIcon
  }
}
