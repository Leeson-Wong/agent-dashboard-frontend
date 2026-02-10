import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  fps: number
  fpsTrend: number[]
  memory: {
    used: number
    total: number
    limit: number
  }
  timing: {
    domContentLoaded: number
    load: number
    firstPaint: number
    firstContentfulPaint: number
  }
  agents: number
  updateRate: number
}

/**
 * Performance Monitor composable
 * Monitors and reports frontend performance metrics
 */
export function usePerformanceMonitor(updateInterval = 2000) {
  const metrics = ref<PerformanceMetrics>({
    fps: 60,
    fpsTrend: [],
    memory: {
      used: 0,
      total: 0,
      limit: 0
    },
    timing: {
      domContentLoaded: 0,
      load: 0,
      firstPaint: 0,
      firstContentfulPaint: 0
    },
    agents: 0,
    updateRate: 0
  })

  const isEnabled = ref(true)
  let updateTimer: ReturnType<typeof setInterval> | null = null
  let frameCount = 0
  let fpsUpdateTime = performance.now()

  // Calculate FPS
  const calculateFPS = (): void => {
    frameCount++
    const now = performance.now()
    const elapsed = now - fpsUpdateTime

    if (elapsed >= 1000) {
      metrics.value.fps = Math.round((frameCount * 1000) / elapsed)
      frameCount = 0
      fpsUpdateTime = now

      // Keep last 10 FPS values for trend
      metrics.value.fpsTrend.push(metrics.value.fps)
      if (metrics.value.fpsTrend.length > 10) {
        metrics.value.fpsTrend.shift()
      }
    }

    requestAnimationFrame(calculateFPS)
  }

  // Get memory usage
  const updateMemory = (): void => {
    if ('memory' in performance) {
      const mem = (performance as any).memory
      metrics.value.memory = {
        used: Math.round(mem.usedJSHeapSize / 1048576), // Convert to MB
        total: Math.round(mem.totalJSHeapSize / 1048576),
        limit: Math.round(mem.jsHeapSizeLimit / 1048576)
      }
    }
  }

  // Get page timing
  const updateTiming = (): void => {
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint')
      const navEntries = performance.getEntriesByType('navigation')

      paintEntries.forEach((entry: any) => {
        if (entry.name === 'first-paint') {
          metrics.value.timing.firstPaint = Math.round(entry.startTime)
        }
        if (entry.name === 'first-contentful-paint') {
          metrics.value.timing.firstContentfulPaint = Math.round(entry.startTime)
        }
      })

      if (navEntries.length > 0) {
        const nav = navEntries[0] as any
        metrics.value.timing.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.fetchStart)
        metrics.value.timing.load = Math.round(nav.loadEventEnd - nav.fetchStart)
      }
    }
  }

  // Update all metrics
  const updateMetrics = (): void => {
    if (!isEnabled.value) return

    updateMemory()
    updateTiming()
  }

  // Set agent count
  const setAgentCount = (count: number): void => {
    const oldCount = metrics.value.agents
    metrics.value.agents = count
    // Calculate update rate (changes per second)
    if (oldCount > 0) {
      metrics.value.updateRate = Math.abs(count - oldCount)
    }
  }

  // Start monitoring
  const start = (): void => {
    isEnabled.value = true

    // Start FPS monitoring
    requestAnimationFrame(calculateFPS)

    // Set up periodic updates
    updateTimer = setInterval(updateMetrics, updateInterval)

    // Get timing once (don't change)
    updateTiming()
  }

  // Stop monitoring
  const stop = (): void => {
    isEnabled.value = false

    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  // Get formatted memory string
  const getMemoryString = computed(() => {
    const { used, limit } = metrics.value.memory
    const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0
    return `${used}MB / ${limit}MB (${percentage}%)`
  })

  // Get FPS status
  const getFPSStatus = computed(() => {
    const fps = metrics.value.fps
    if (fps >= 55) return 'good'
    if (fps >= 30) return 'warning'
    return 'poor'
  })

  // Get memory status
  const getMemoryStatus = computed(() => {
    const percentage = (metrics.value.memory.used / metrics.value.memory.limit) * 100
    if (percentage < 70) return 'good'
    if (percentage < 90) return 'warning'
    return 'poor'
  })

  // Auto-start on mount
  onMounted(() => {
    start()
  })

  // Clean up on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    metrics,
    isEnabled,
    getMemoryString,
    getFPSStatus,
    getMemoryStatus,
    setAgentCount,
    start,
    stop
  }
}
