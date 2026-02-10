/**
 * Pulse Animation Composable
 *
 * Manages pulse animation states for attention-grabbing effects
 */

import { ref, computed } from 'vue'

export type PulseType =
  | 'attention'  // Gentle pulse for attention
  | 'highlight'  // Strong highlight effect
  | 'alert'       // Urgent alert pulse
  | 'success'     // Success confirmation
  | 'error'       // Error indication

export interface PulseOptions {
  type?: PulseType
  duration?: number // Pulse duration in ms
  intensity?: number // 1-10 scale
  auto?: boolean // Auto-start on mount
  count?: number // Number of pulses (0 = infinite)
}

const PULSE_CONFIGS: Record<PulseType, {
  duration: number
  intensity: number
  keyframes: string[]
}> = {
  attention: {
    duration: 2000,
    intensity: 3,
    keyframes: ['scale(1)', 'scale(1.05)', 'scale(1)']
  },
  highlight: {
    duration: 1000,
    intensity: 5,
    keyframes: ['box-shadow: 0 0 0 0 rgba(59, 130, 246, 0)',
                'box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.5)',
                'box-shadow: 0 0 0 0 rgba(59, 130, 246, 0)']
  },
  alert: {
    duration: 800,
    intensity: 8,
    keyframes: ['background: rgba(239, 68, 68, 0)',
                'background: rgba(239, 68, 68, 0.2)',
                'background: rgba(239, 68, 68, 0)']
  },
  success: {
    duration: 1500,
    intensity: 5,
    keyframes: ['background: rgba(34, 197, 94, 0)',
                'background: rgba(34, 197, 94, 0.3)',
                'background: rgba(34, 197, 94, 0)']
  },
  error: {
    duration: 800,
    intensity: 7,
    keyframes: ['background: rgba(239, 68, 68, 0)',
                'background: rgba(239, 68, 68, 0.2)',
                'background: rgba(239, 68, 68, 0)']
  }
}

/**
 * Get CSS class for pulse type
 */
const getPulseClass = (type: PulseType): string => {
  return `pulse-${type}`
}

/**
 * Pulse animation composable
 */
export function usePulse(options: PulseOptions = {}) {
  const {
    type = 'attention',
    duration: _duration, // Reserved for future use
    intensity: _intensity, // Reserved for future use
    auto = false,
    count = 1
  } = options

  const isPulsing = ref(false)
  const pulseCount = ref(0)

  // Get pulse config
  const config = computed(() => PULSE_CONFIGS[type as PulseType])

  // Get CSS class
  const pulseClass = computed(() => getPulseClass(type))

  /**
   * Start pulse animation
   */
  const start = (): void => {
    isPulsing.value = true
    pulseCount.value = 0
  }

  /**
   * Stop pulse animation
   */
  const stop = (): void => {
    isPulsing.value = false
    pulseCount.value = 0
  }

  /**
   * Toggle pulse animation
   */
  const toggle = (): void => {
    if (isPulsing.value) {
      stop()
    } else {
      start()
    }
  }

  /**
   * Pulse for a specific duration
   */
  const pulse = (ms?: number): void => {
    start()
    const duration = ms || config.value.duration
    setTimeout(() => {
      if (count === 0 || pulseCount.value < count - 1) {
        stop()
      } else {
        pulseCount.value++
      }
    }, duration)
  }

  /**
   * Pulse once (single animation cycle)
   */
  const pulseOnce = (): void => {
    pulse(config.value.duration)
  }

  /**
   * Get animation style
   */
  const getAnimationStyle = (): { duration: string; animationIterationCount: string } => {
    return {
      duration: `${config.value.duration}ms`,
      animationIterationCount: count === 0 ? 'infinite' : count.toString()
    }
  }

  /**
   * Get intensity scale
   */
  const getIntensityScale = computed(() => {
    const baseIntensity = config.value.intensity
    return 1 + (baseIntensity / 10)
  })

  // Auto-start if requested
  if (auto) {
    start()
  }

  return {
    isPulsing,
    pulseClass,
    pulseCount,
    start,
    stop,
    toggle,
    pulse,
    pulseOnce,
    getAnimationStyle,
    getIntensityScale
  }
}

export default usePulse
