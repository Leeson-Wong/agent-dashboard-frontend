/**
 * System Info Composable
 *
 * Manages system and browser environment information
 */

import { ref } from 'vue'

export interface BrowserInfo {
  name: string
  version: string
  userAgent: string
  language: string
  languages: string[]
  platform: string
  cookieEnabled: boolean
  onLine: boolean
}

export interface ScreenInfo {
  width: number
  height: number
  availWidth: number
  availHeight: number
  colorDepth: number
  pixelDepth: number
  pixelRatio: number
  orientation: string
}

export interface PerformanceInfo {
  navigationStart: number
  loadTime: number
  domContentLoaded: number
  firstPaint: number | null
  firstContentfulPaint: number | null
}

export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export interface ConnectionInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

export function useSystemInfo() {
  const isLoading = ref(true)
  const browser = ref<BrowserInfo | null>(null)
  const screen = ref<ScreenInfo | null>(null)
  const performanceInfo = ref<PerformanceInfo | null>(null)
  const memory = ref<MemoryInfo | null>(null)
  const connection = ref<ConnectionInfo | null>(null)

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Detect browser info
  const detectBrowser = (): BrowserInfo => {
    const ua = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome'
      const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
      if (match) version = match[1]
    } else if (ua.includes('Firefox')) {
      name = 'Firefox'
      const match = ua.match(/Firefox\/(\d+\.\d+)/)
      if (match) version = match[1]
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari'
      const match = ua.match(/Version\/(\d+\.\d+\.\d+)/)
      if (match) version = match[1]
    } else if (ua.includes('Edg')) {
      name = 'Edge'
      const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/)
      if (match) version = match[1]
    }

    return {
      name,
      version,
      userAgent: ua,
      language: navigator.language,
      languages: Array.from(navigator.languages),
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    }
  }

  // Get screen info
  const getScreenInfo = (): ScreenInfo => {
    const scr = window.screen as Screen & { orientation?: { type: string } }
    return {
      width: scr.width,
      height: scr.height,
      availWidth: scr.availWidth,
      availHeight: scr.availHeight,
      colorDepth: scr.colorDepth,
      pixelDepth: scr.pixelDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: scr.orientation?.type || 'unknown'
    }
  }

  // Get performance info
  const getPerformanceInfo = (): PerformanceInfo | null => {
    try {
      const entries = performance.getEntriesByType('navigation')
      const timing = entries[0] as PerformanceNavigationTiming
      if (!timing) return null

      const paintEntries = performance.getEntriesByType('paint')
      const firstPaint = paintEntries.find((e: PerformanceEntry) => e.name === 'first-paint')?.startTime || null
      const firstContentfulPaint = paintEntries.find((e: PerformanceEntry) => e.name === 'first-contentful-paint')?.startTime || null

      return {
        navigationStart: timing.fetchStart,
        loadTime: timing.loadEventEnd - timing.fetchStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
        firstPaint,
        firstContentfulPaint
      }
    } catch {
      return null
    }
  }

  // Get memory info (Chrome only)
  const getMemoryInfo = (): MemoryInfo | null => {
    try {
      if ('memory' in performance && (performance as any).memory) {
        const mem = (performance as any).memory
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit
        }
      }
      return null
    } catch {
      return null
    }
  }

  // Get connection info
  const getConnectionInfo = (): ConnectionInfo | null => {
    try {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection
        return {
          effectiveType: conn.effectiveType || 'unknown',
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
          saveData: conn.saveData || false
        }
      }
      return null
    } catch {
      return null
    }
  }

  // Load all info
  const loadInfo = (): void => {
    browser.value = detectBrowser()
    screen.value = getScreenInfo()
    performanceInfo.value = getPerformanceInfo()
    memory.value = getMemoryInfo()
    connection.value = getConnectionInfo()
    isLoading.value = false
  }

  // Refresh info
  const refresh = (): void => {
    loadInfo()
  }

  return {
    isLoading,
    browser,
    screen,
    performance: performanceInfo,
    memory,
    connection,
    formatBytes,
    formatTime,
    loadInfo,
    refresh
  }
}
