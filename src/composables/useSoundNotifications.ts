/**
 * Sound Notifications Composable
 *
 * Manages sound notification preferences and playback
 */

import { ref, watch, onMounted } from 'vue'

export interface SoundConfig {
  key: string
  enabled: boolean
  volume: number
  sounds: SoundDefinitions
}

export interface SoundDefinitions {
  agentOnline?: string
  agentOffline?: string
  agentError?: string
  messageReceived?: string
  taskCompleted?: string
  notification?: string
}

const DEFAULT_SOUNDS: SoundDefinitions = {
  agentOnline: '🔔',
  agentOffline: '🔕',
  agentError: '🚨',
  messageReceived: '💬',
  taskCompleted: '✅',
  notification: '📢'
}

export function useSoundNotifications(
  config: SoundConfig = {
    key: 'sound_notifications',
    enabled: true,
    volume: 0.5,
    sounds: DEFAULT_SOUNDS
  }
) {
  const storageKey = config.key

  // State
  const isEnabled = ref(config.enabled)
  const volume = ref(config.volume)
  const soundDefinitions = ref<SoundDefinitions>({ ...config.sounds })
  const isLoaded = ref(false)

  /**
   * Load from localStorage
   */
  const loadFromStorage = (): void => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (typeof data.enabled === 'boolean') {
          isEnabled.value = data.enabled
        }
        if (typeof data.volume === 'number') {
          volume.value = Math.max(0, Math.min(1, data.volume))
        }
        if (data.sounds) {
          soundDefinitions.value = { ...DEFAULT_SOUNDS, ...data.sounds }
        }
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error)
    }
  }

  /**
   * Save to localStorage
   */
  const saveToStorage = (): void => {
    try {
      const data = {
        enabled: isEnabled.value,
        volume: volume.value,
        sounds: soundDefinitions.value
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save sound settings:', error)
    }
  }

  /**
   * Play notification sound (visual/simplified)
   */
  const playSound = (soundName: keyof SoundDefinitions): void => {
    if (!isEnabled.value) return

    const sound = soundDefinitions.value[soundName]
    if (!sound) return

    // Visual feedback - show toast or play actual sound
    // For now, we'll use the Web Audio API for a simple beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = getFrequency(soundName)
      oscillator.type = 'sine'

      gainNode.gain.value = volume.value * 0.3
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.1
      )

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Failed to play sound:', error)
    }
  }

  /**
   * Get frequency for sound type
   */
  const getFrequency = (soundName: string): number => {
    const frequencies: Record<string, number> = {
      agentOnline: 880,    // High pitch
      agentOffline: 440,   // Lower pitch
      agentError: 220,     // Low pitch
      messageReceived: 660,
      taskCompleted: 988,   // Highest pitch
      notification: 550
    }
    return frequencies[soundName] || 440
  }

  /**
   * Toggle sound on/off
   */
  const toggle = (): void => {
    isEnabled.value = !isEnabled.value
    saveToStorage()

    // Play a test sound when enabling
    if (isEnabled.value) {
      playSound('notification')
    }
  }

  /**
   * Set volume
   */
  const setVolume = (newVolume: number): void => {
    volume.value = Math.max(0, Math.min(1, newVolume))
    saveToStorage()
  }

  /**
   * Enable sounds
   */
  const enable = (): void => {
    isEnabled.value = true
    saveToStorage()
  }

  /**
   * Disable sounds
   */
  const disable = (): void => {
    isEnabled.value = false
    saveToStorage()
  }

  /**
   * Play specific notification sounds
   */
  const playAgentOnline = (): void => playSound('agentOnline')
  const playAgentOffline = (): void => playSound('agentOffline')
  const playAgentError = (): void => playSound('agentError')
  const playMessageReceived = (): void => playSound('messageReceived')
  const playTaskCompleted = (): void => playSound('taskCompleted')
  const playNotification = (): void => playSound('notification')

  /**
   * Test sound
   */
  const testSound = (soundName?: keyof SoundDefinitions): void => {
    if (soundName) {
      playSound(soundName)
    } else {
      playSound('notification')
    }
  }

  // Watch for changes and save
  watch([isEnabled, volume, soundDefinitions], () => {
    if (isLoaded.value) {
      saveToStorage()
    }
  }, { deep: true })

  // Initialize on mount
  onMounted(() => {
    loadFromStorage()
    isLoaded.value = true
  })

  return {
    isEnabled,
    volume,
    soundDefinitions,
    isLoaded,
    toggle,
    enable,
    disable,
    setVolume,
    playSound,
    playAgentOnline,
    playAgentOffline,
    playAgentError,
    playMessageReceived,
    playTaskCompleted,
    playNotification,
    testSound
  }
}

/**
 * Simple sound composable for individual sounds
 */
export function useSound(soundName: keyof SoundDefinitions) {
  const { isEnabled, playSound } = useSoundNotifications()

  const play = (): void => {
    if (isEnabled.value) {
      playSound(soundName)
    }
  }

  return {
    isEnabled,
    play
  }
}
