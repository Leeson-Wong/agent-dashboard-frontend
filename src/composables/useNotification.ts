import { ref } from 'vue'

// Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'

export interface NotificationAction {
  label: string
  handler?: () => void | Promise<void>
  primary?: boolean
  color?: string
}

export interface NotificationOptions {
  type?: NotificationType
  title?: string
  duration?: number
  closable?: boolean
  showProgress?: boolean
  actions?: NotificationAction[]
  onClick?: () => void
  onClose?: () => void
}

export interface Notification {
  id: string | number
  type: NotificationType
  title?: string
  message: string
  duration?: number
  closable?: boolean
  showProgress?: boolean
  actions?: NotificationAction[]
  onClick?: () => void
  onClose?: () => void
}

const notifications = ref<Notification[]>([])
let nextId = 1

export function useNotification() {
  // Add notification
  const notify = (message: string, options: NotificationOptions = {}) => {
    const id = nextId++

    const notification: Notification = {
      id,
      type: options.type || 'info',
      message,
      title: options.title,
      duration: options.duration ?? 3000,
      closable: options.closable,
      showProgress: options.showProgress ?? true,
      actions: options.actions,
      onClick: options.onClick,
      onClose: options.onClose
    }

    notifications.value.push(notification)

    // Auto-dismiss
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, notification.duration)
    }

    return id
  }

  // Remove notification
  const remove = (id: string | number) => {
    const index = notifications.value.findIndex((n: Notification) => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      notifications.value.splice(index, 1)
      notification.onClose?.()
    }
  }

  // Clear all notifications
  const clear = () => {
    notifications.value.forEach((n: Notification) => n.onClose?.())
    notifications.value = []
  }

  // Convenience methods
  const info = (message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notify(message, { ...options, type: 'info' })
  }

  const success = (message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notify(message, { ...options, type: 'success' })
  }

  const warning = (message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notify(message, { ...options, type: 'warning' })
  }

  const error = (message: string, options?: Omit<NotificationOptions, 'type'>) => {
    return notify(message, { ...options, type: 'error', duration: 0 })
  }

  // Persistent notification (no auto-dismiss)
  const persistent = (message: string, options: Omit<NotificationOptions, 'duration'> = {}) => {
    return notify(message, { ...options, duration: 0 })
  }

  return {
    notifications,
    notify,
    remove,
    clear,
    info,
    success,
    warning,
    error,
    persistent
  }
}

// Singleton instance
const singleton = useNotification()

export default singleton
