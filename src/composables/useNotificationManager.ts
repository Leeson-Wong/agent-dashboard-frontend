import { ref, type Ref } from 'vue'
import type { UserSettings as UserSettingsType } from '../types/userSettings'
import { useToast } from './useToast'

// Audio context for sound notifications
let audioContext: AudioContext | null = null

/**
 * Notification Manager Composable
 *
 * Handles notifications based on user settings:
 * - Status change notifications
 * - Error notifications
 * - Sound alerts
 */
export function useNotificationManager(userSettings: Ref<UserSettingsType | null>) {
  const { error, info } = useToast()
  const lastAgentStates = ref<Map<string, string>>(new Map())

  /**
   * Play notification sound
   * Uses Web Audio API to generate a simple beep sound
   */
  const playNotificationSound = (): void => {
    if (!userSettings.value?.soundEnabled) return

    try {
      // Create audio context on first use
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure sound: 800Hz sine wave
      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      // Configure envelope: short beep
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)

      // Play sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      console.warn('Failed to play notification sound:', e)
    }
  }

  /**
   * Show notification for agent status change
   */
  const notifyStatusChange = (agentId: string, oldStatus: string, newStatus: string): void => {
    if (!userSettings.value?.notifyStatusChange) return

    const statusEmoji = getStatusEmoji(newStatus)
    const message = `${statusEmoji} Agent ${agentId.slice(0, 8)}: ${oldStatus} → ${newStatus}`

    info(message, { duration: 3000 })

    playNotificationSound()
  }

  /**
   * Show notification for agent error
   */
  const notifyError = (agentId: string, errorMessage: string): void => {
    if (!userSettings.value?.notifyErrors) return

    const message = `❌ Agent ${agentId.slice(0, 8)}: ${errorMessage}`

    error(message, { duration: 5000 })

    playNotificationSound()
  }

  /**
   * Handle agent update event from WebSocket
   * Checks for status changes and shows notification
   */
  const handleAgentUpdate = (agentId: string, data: Record<string, unknown>): void => {
    if (!userSettings.value) return

    const newStatus = data.status as string
    const oldStatus = lastAgentStates.value.get(agentId)

    // Check if status changed
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      // Filter out certain transitions that are too noisy
      if (!isNoisyTransition(oldStatus, newStatus)) {
        notifyStatusChange(agentId, oldStatus, newStatus)
      }
    }

    // Update stored state
    if (newStatus) {
      lastAgentStates.value.set(agentId, newStatus)
    }

    // Check for error status
    if (newStatus === 'error' || newStatus === 'failed') {
      const errorMessage = (data.error || data.lastError || 'Unknown error') as string
      notifyError(agentId, errorMessage)
    }
  }

  /**
   * Initialize agent states (call this when loading agents)
   */
  const initializeAgentStates = (agents: Array<{ agentId: string; status: string }>): void => {
    agents.forEach(agent => {
      lastAgentStates.value.set(agent.agentId, agent.status)
    })
  }

  /**
   * Clear stored agent states
   */
  const clearAgentStates = (): void => {
    lastAgentStates.value.clear()
  }

  return {
    notifyStatusChange,
    notifyError,
    handleAgentUpdate,
    initializeAgentStates,
    clearAgentStates,
    playNotificationSound,
  }
}

/**
 * Get emoji for agent status
 */
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    online: '🟢',
    ready: '✅',
    offline: '⚫',
    busy: '🔄',
    error: '❌',
    failed: '❌',
    idle: '💤',
    processing: '⚙️',
  }
  return emojis[status] || '📊'
}

/**
 * Check if status transition is too noisy (should not trigger notification)
 */
function isNoisyTransition(oldStatus: string, newStatus: string): string {
  // Skip transitions that happen frequently during normal operation
  const noisyTransitions: Array<[string, string]> = [
    ['idle', 'processing'],
    ['processing', 'idle'],
    // Add more as needed
  ]

  return noisyTransitions.some(([from, to]) => oldStatus === from && newStatus === to) ? 'true' : 'false'
}
