/**
 * Resource Monitor Composable
 *
 * Monitors frontend application resource usage
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ResourceMetrics {
  // Memory
  usedMemory: number
  totalMemory: number
  memoryLimit: number
  memoryUsagePercent: number

  // Performance
  fps: number
  pageLoadTime: number

  // DOM
  domNodes: number
  eventListeners: number

  // Network
  networkType: string
  online: boolean

  // Screen
  screenWidth: number
  screenHeight: number
  pixelRatio: number
}

export function useResourceMonitor() {
  const metrics = ref<ResourceMetrics>({
    usedMemory: 0,
    totalMemory: 0,
    memoryLimit: 0,
    memoryUsagePercent: 0,
    fps: 0,
    pageLoadTime: 0,
    domNodes: 0,
    eventListeners: 0,
    networkType: 'unknown',
    online: true,
    screenWidth: 0,
    screenHeight: 0,
    pixelRatio: 1
  })

  const isLoading = ref(true)
  let updateTimer: ReturnType<typeof setInterval> | null = null

  // Format bytes to readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  // Get memory info (if supported)
  const updateMemoryInfo = (): void => {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory
      metrics.value.usedMemory = memory.usedJSHeapSize
      metrics.value.totalMemory = memory.totalJSHeapSize
      metrics.value.memoryLimit = memory.jsHeapSizeLimit
      metrics.value.memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }

  // Get page load time
  const getPageLoadTime = (): number => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      return navigation.loadEventEnd - navigation.fetchStart
    }
    return 0
  }

  // Count DOM nodes
  const countDomNodes = (): number => {
    return document.querySelectorAll('*').length
  }

  // Estimate event listeners (rough approximation)
  const estimateEventListeners = (): number => {
    // This is a rough estimate based on DOM elements
    // Not accurate but gives an idea
    return countDomNodes() * 2
  }

  // Get network info
  const updateNetworkInfo = (): void => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      metrics.value.networkType = connection.effectiveType || 'unknown'
    }
    metrics.value.online = navigator.onLine
  }

  // Get screen info
  const updateScreenInfo = (): void => {
    metrics.value.screenWidth = window.screen.width
    metrics.value.screenHeight = window.screen.height
    metrics.value.pixelRatio = window.devicePixelRatio
  }

  // Update all metrics
  const updateMetrics = (): void => {
    updateMemoryInfo()
    updateNetworkInfo()
    updateScreenInfo()
    metrics.value.domNodes = countDomNodes()
    metrics.value.eventListeners = estimateEventListeners()
    isLoading.value = false
  }

  // Memory usage status
  const memoryStatus = computed(() => {
    const percent = metrics.value.memoryUsagePercent
    if (percent < 50) return 'good'
    if (percent < 80) return 'warning'
    return 'critical'
  })

  // Start monitoring
  const startMonitoring = (interval = 5000): void => {
    stopMonitoring()
    updateMetrics()
    updateTimer = setInterval(updateMetrics, interval)
  }

  // Stop monitoring
  const stopMonitoring = (): void => {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  }

  // Lifecycle
  onMounted(() => {
    // Get page load time once
    metrics.value.pageLoadTime = getPageLoadTime()

    // Start monitoring
    startMonitoring()

    // Listen for network changes
    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)
  })

  onUnmounted(() => {
    stopMonitoring()
    window.removeEventListener('online', updateNetworkInfo)
    window.removeEventListener('offline', updateNetworkInfo)
  })

  return {
    metrics,
    isLoading,
    memoryStatus,
    formatBytes,
    updateMetrics,
    startMonitoring,
    stopMonitoring
  }
}
