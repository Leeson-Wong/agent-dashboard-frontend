/**
 * Global Error Handler
 *
 * Captures and handles errors across the application:
 * - Vue component errors
 * - JavaScript runtime errors
 * - Unhandled Promise rejections
 */

import type { App } from 'vue'
import { useToast } from '@/composables/useToast'

// Error types
export enum ErrorType {
  VUE = 'VUE_ERROR',
  JAVASCRIPT = 'JS_ERROR',
  PROMISE = 'PROMISE_REJECTION',
  NETWORK = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// Error interface
export interface AppError {
  type: ErrorType
  message: string
  stack?: string
  timestamp: Date
  component?: string
  info?: any
}

// Error history for debugging
const errorHistory: AppError[] = []
const MAX_ERROR_HISTORY = 50

/**
 * Log error to console (with proper formatting)
 */
function logError(type: ErrorType, error: Error, component?: string): void {
  const logMessage = `[${type}] ${component ? `in ${component}` : ''}: ${error.message}`

  console.group(logMessage)
  console.error(error)
  if (error.stack) {
    console.trace('Stack trace:', error.stack)
  }
  console.groupEnd()
}

/**
 * Add error to history
 */
function addToHistory(errorType: ErrorType, error: Error, component?: string, info?: any): void {
  const appError: AppError = {
    type: errorType,
    message: error.message || String(error),
    stack: error.stack,
    timestamp: new Date(),
    component,
    info
  }

  errorHistory.push(appError)

  // Keep history size manageable
  if (errorHistory.length > MAX_ERROR_HISTORY) {
    errorHistory.shift()
  }
}

/**
 * Send error to remote logging service (optional)
 * This is prepared for future backend integration
 */
async function reportError(appError: AppError): Promise<void> {
  // Prepare error payload
  const payload = {
    type: appError.type,
    message: appError.message,
    stack: appError.stack,
    timestamp: appError.timestamp.toISOString(),
    component: appError.component,
    info: appError.info,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // Log for now - in production, send to backend
  console.log('Error Report:', payload)

  // Future implementation:
  // try {
  //   await fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload)
  //   })
  // } catch (e) {
  //   console.warn('Failed to report error:', e)
  // }
}

/**
 * Setup Vue error handler
 */
export function setupVueErrorHandler(app: App): void {
  app.config.errorHandler = (err, instance, info) => {
    // Convert unknown error to Error object
    let errorObj: Error
    if (err instanceof Error) {
      errorObj = err
    } else {
      const errStr = String(err)
      errorObj = new Error(errStr)
      errorObj.stack = errStr
    }

    // Log error
    logError(ErrorType.VUE, errorObj, instance?.$options?.name || 'Unknown')

    // Add to history
    addToHistory(ErrorType.VUE, errorObj, instance?.$options?.name, info)

    // Show user-friendly toast
    const { error: showError } = useToast()
    showError('应用发生错误，请刷新页面重试', {
      title: '错误提示',
      duration: 5000,
      closable: true
    })

    // Report error (async, non-blocking)
    const appError: AppError = {
      type: ErrorType.VUE,
      message: errorObj.message || String(err),
      stack: errorObj.stack,
      timestamp: new Date(),
      component: instance?.$options?.name,
      info
    }
    reportError(appError).catch((e: unknown) => {
      console.warn('Failed to report error:', e)
    })
  }

  console.log('✓ Vue error handler initialized')
}

/**
 * Setup global JavaScript error handler
 */
export function setupGlobalErrorHandler(): void {
  // Handle JavaScript runtime errors
  window.onerror = (message, source, lineno, colno, error) => {
    const errorObj = error || new Error(String(message))

    logError(ErrorType.JAVASCRIPT, errorObj, source || 'Unknown')

    addToHistory(ErrorType.JAVASCRIPT, errorObj, source, {
      source,
      lineno,
      colno
    })

    const { error: showError } = useToast()
    showError('页面出现错误，请刷新页面', {
      title: '错误提示',
      duration: 5000
    })

    const appError: AppError = {
      type: ErrorType.JAVASCRIPT,
      message: String(message),
      stack: errorObj.stack,
      timestamp: new Date(),
      info: { source, lineno, colno }
    }
    reportError(appError).catch(e => {
      console.warn('Failed to report error:', e)
    })

    // Prevent default browser error handling
    return true
  }

  console.log('✓ Global error handler initialized')
}

/**
 * Setup unhandled promise rejection handler
 */
export function setupPromiseRejectionHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason

    // Convert to Error object if not already
    let errorObj: Error
    if (error instanceof Error) {
      errorObj = error
    } else {
      const errorStr = String(error)
      errorObj = new Error(errorStr)
      errorObj.stack = errorStr // Use string as stack
    }

    logError(ErrorType.PROMISE, errorObj, 'Promise')

    addToHistory(ErrorType.PROMISE, errorObj, 'Promise', {
      promise: event.promise
    })

    const { error: showError } = useToast()
    showError('异步操作失败，请重试', {
      title: '操作失败',
      duration: 4000
    })

    const appError: AppError = {
      type: ErrorType.PROMISE,
      message: errorObj.message || String(error),
      stack: errorObj.stack,
      timestamp: new Date(),
      info: { promise: event.promise }
    }
    reportError(appError).catch((e: unknown) => {
      console.warn('Failed to report error:', e)
    })

    // Prevent default browser handling
    event.preventDefault()
  })

  console.log('✓ Promise rejection handler initialized')
}

/**
 * Setup all error handlers
 */
export function setupErrorHandling(app: App): void {
  setupVueErrorHandler(app)
  setupGlobalErrorHandler()
  setupPromiseRejectionHandler()

  console.log('✅ All error handlers initialized')
}

/**
 * Get error history (for debugging)
 */
export function getErrorHistory(): AppError[] {
  return [...errorHistory]
}

/**
 * Clear error history
 */
export function clearErrorHistory(): void {
  errorHistory.length = 0
  console.log('Error history cleared')
}

/**
 * Manual error reporting (for user-triggered actions)
 */
export function reportManualError(message: string, info?: any): void {
  const error = new Error(message)
  const appError: AppError = {
    type: ErrorType.UNKNOWN,
    message,
    stack: error.stack,
    timestamp: new Date(),
    info
  }

  addToHistory(ErrorType.UNKNOWN, error, 'Manual', info)
  reportError(appError)

  const { error: showError } = useToast()
  showError(message, {
    title: '已记录错误',
    duration: 3000
  })
}

/**
 * Handle async errors in components
 * Usage: tryCatchAsync(() => someAsyncOperation())
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    logError(ErrorType.UNKNOWN, errorObj, 'tryCatchAsync')
    addToHistory(ErrorType.UNKNOWN, errorObj, 'tryCatchAsync', { errorMessage })

    const { error: showError } = useToast()
    showError(errorMessage || '操作失败，请重试', {
      duration: 3000
    })

    return null
  }
}
