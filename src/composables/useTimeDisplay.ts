/**
 * Time Display Composable
 *
 * Manages real-time clock and session timer
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useTimeDisplay() {
  const currentTime = ref(new Date())
  const sessionStart = ref<Date | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  // Format time as HH:MM:SS
  const formattedTime = computed(() => {
    return currentTime.value.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  })

  // Format date
  const formattedDate = computed(() => {
    return currentTime.value.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    })
  })

  // Session duration
  const sessionDuration = ref(0)

  // Format duration as HH:MM:SS
  const formattedDuration = computed(() => {
    const seconds = Math.floor(sessionDuration.value / 1000)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  // Start session timer
  const startSession = (): void => {
    sessionStart.value = new Date()
    sessionDuration.value = 0
  }

  // Get session duration in milliseconds
  const getSessionDurationMs = (): number => {
    if (!sessionStart.value) return 0
    return Date.now() - sessionStart.value.getTime()
  }

  // Update time
  const updateTime = (): void => {
    currentTime.value = new Date()
    if (sessionStart.value) {
      sessionDuration.value = getSessionDurationMs()
    }
  }

  // Start timer
  const startTimer = (): void => {
    stopTimer()
    timer = setInterval(updateTime, 1000)
    updateTime()
  }

  // Stop timer
  const stopTimer = (): void => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // Lifecycle
  onMounted(() => {
    startSession()
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    currentTime,
    sessionDuration,
    formattedTime,
    formattedDate,
    formattedDuration,
    startSession,
    startTimer,
    stopTimer
  }
}
