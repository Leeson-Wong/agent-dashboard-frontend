/**
 * API Logger - HTTP Request/Response Logging
 *
 * Logs all API requests and responses for debugging and monitoring
 */

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export interface APIRequestLog {
  id: string
  timestamp: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: unknown
}

export interface APIResponseLog {
  id: string
  timestamp: string
  status: number
  statusText: string
  duration: number
  headers?: Record<string, string>
  body?: unknown
  size: number
}

export interface APIErrorLog {
  id: string
  timestamp: string
  message: string
  status?: number
  code?: string
  duration: number
}

export interface APILogEntry {
  request: APIRequestLog
  response?: APIResponseLog
  error?: APIErrorLog
}

// Log storage
const logHistory: APILogEntry[] = []
const MAX_LOG_HISTORY = 100

// Current log level (can be configured)
let currentLogLevel = LogLevel.DEBUG

// Enable/disable logging
let loggingEnabled = true

// Stats tracking
const stats = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  totalDuration: 0,
}

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel
}

/**
 * Enable or disable logging
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
}

/**
 * Check if logging is enabled
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled
}

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate response body size (approximate)
 */
function calculateSize(data: unknown): number {
  if (!data) return 0
  return JSON.stringify(data).length
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format body for logging (truncate large bodies)
 */
function formatBody(body: unknown, maxSize = 500): string {
  if (!body) return ''
  const str = JSON.stringify(body)
  if (str.length <= maxSize) return str
  return str.substring(0, maxSize) + `... (+${str.length - maxSize} chars)`
}

/**
 * Log API request
 */
export function logRequest(
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: unknown
): string {
  if (!loggingEnabled || currentLogLevel < LogLevel.DEBUG) {
    return generateLogId()
  }

  const logId = generateLogId()
  const timestamp = new Date().toISOString()

  const requestLog: APIRequestLog = {
    id: logId,
    timestamp,
    method,
    url,
    headers,
    body,
  }

  // Create log entry
  const entry: APILogEntry = { request: requestLog }
  logHistory.push(entry)

  // Keep history size manageable
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift()
  }

  // Console log
  console.group(`🚀 [API Request] ${method} ${url}`)
  console.log('ID:', logId)
  console.log('Timestamp:', timestamp)
  if (headers) console.log('Headers:', headers)
  if (body) console.log('Body:', formatBody(body))
  console.groupEnd()

  return logId
}

/**
 * Log API response
 */
export function logResponse(
  logId: string,
  status: number,
  statusText: string,
  duration: number,
  headers?: Record<string, string>,
  body?: unknown
): void {
  if (!loggingEnabled || currentLogLevel < LogLevel.DEBUG) {
    return
  }

  const timestamp = new Date().toISOString()
  const size = calculateSize(body)

  const responseLog: APIResponseLog = {
    id: logId,
    timestamp,
    status,
    statusText,
    duration,
    headers,
    body,
    size,
  }

  // Find and update existing entry
  const entry = logHistory.find(e => e.request.id === logId)
  if (entry) {
    entry.response = responseLog
  }

  // Update stats
  stats.totalRequests++
  stats.totalDuration += duration
  if (status >= 200 && status < 300) {
    stats.successRequests++
  } else {
    stats.errorRequests++
  }

  // Console log with color coding
  const statusColor = status >= 200 && status < 300 ? '#22c55e' : status >= 400 ? '#ef4444' : '#f59e0b'
  const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️'

  console.group(
    `%c${statusIcon} [API Response] ${status} ${statusText} (${formatDuration(duration)})`,
    `color: ${statusColor}; font-weight: bold`
  )
  console.log('ID:', logId)
  console.log('Timestamp:', timestamp)
  console.log('Size:', `${size} bytes`)
  if (headers) console.log('Headers:', headers)
  if (body) console.log('Body:', formatBody(body))
  console.groupEnd()
}

/**
 * Log API error
 */
export function logError(
  logId: string,
  message: string,
  duration: number,
  status?: number,
  code?: string
): void {
  if (!loggingEnabled || currentLogLevel < LogLevel.ERROR) {
    return
  }

  const timestamp = new Date().toISOString()

  const errorLog: APIErrorLog = {
    id: logId,
    timestamp,
    message,
    status,
    code,
    duration,
  }

  // Find and update existing entry
  const entry = logHistory.find(e => e.request.id === logId)
  if (entry) {
    entry.error = errorLog
  }

  // Update stats
  stats.totalRequests++
  stats.errorRequests++
  stats.totalDuration += duration

  // Console log with error styling
  console.group(`%c❌ [API Error] ${message}`, 'color: #ef4444; font-weight: bold')
  console.log('ID:', logId)
  console.log('Timestamp:', timestamp)
  console.log('Duration:', formatDuration(duration))
  if (status) console.log('Status:', status)
  if (code) console.log('Code:', code)
  console.groupEnd()
}

/**
 * Get all log entries
 */
export function getLogHistory(): APILogEntry[] {
  return [...logHistory]
}

/**
 * Clear all log entries
 */
export function clearLogHistory(): void {
  logHistory.length = 0
  console.log('API log history cleared')
}

/**
 * Get statistics
 */
export function getStats(): typeof stats & { avgDuration: number } {
  const avgDuration = stats.totalRequests > 0 ? stats.totalDuration / stats.totalRequests : 0
  return {
    ...stats,
    avgDuration,
  }
}

/**
 * Reset statistics
 */
export function resetStats(): void {
  stats.totalRequests = 0
  stats.successRequests = 0
  stats.errorRequests = 0
  stats.totalDuration = 0
  console.log('API statistics reset')
}

/**
 * Export logs as JSON
 */
export function exportLogs(): string {
  const data = {
    exportDate: new Date().toISOString(),
    stats: getStats(),
    logs: logHistory,
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Get log summary for debugging panel
 */
export function getLogSummary(): {
  total: number
  success: number
  error: number
  avgDuration: number
  recentLogs: Array<{
    id: string
    method: string
    url: string
    status?: number
    duration?: number
    success: boolean
  }>
} {
  const recentLogs = logHistory.slice(-20).map(entry => ({
    id: entry.request.id,
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response?.status || entry.error?.status,
    duration: entry.response?.duration || entry.error?.duration,
    success: !!entry.response && !entry.error,
  }))

  return {
    total: stats.totalRequests,
    success: stats.successRequests,
    error: stats.errorRequests,
    avgDuration: stats.totalRequests > 0 ? stats.totalDuration / stats.totalRequests : 0,
    recentLogs,
  }
}
