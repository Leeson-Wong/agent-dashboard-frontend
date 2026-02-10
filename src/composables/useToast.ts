import { ref } from 'vue'
import type { ToastItem } from '../types/toast'

const toasts = ref<ToastItem[]>([])
let toastIdCounter = 0
const MAX_TOASTS = 5 // Maximum number of toasts to display

export function useToast() {
  const addToast = (toast: Omit<ToastItem, 'id'>): string => {
    // Check if toast queue is full, remove oldest toast
    if (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift() // Remove first (oldest) toast
    }

    const id = `toast-${++toastIdCounter}`
    const newToast: ToastItem = {
      id,
      ...toast,
    }

    toasts.value.push(newToast)
    return id
  }

  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAll = (): void => {
    toasts.value = []
  }

  // Convenience methods
  const success = (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'success', message, ...options })
  }

  const error = (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'error', message, ...options })
  }

  const info = (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'info', message, ...options })
  }

  const warning = (message: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'message'>>) => {
    return addToast({ type: 'warning', message, ...options })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    info,
    warning,
  }
}

// Export ref for use in ToastContainer
export const toastList = toasts
