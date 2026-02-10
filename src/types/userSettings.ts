/**
 * User Settings Type
 *
 * This type is shared between UserSettings component and other composables
 */
export interface UserSettings {
  theme: 'dark' | 'light' | 'auto'
  compactMode: boolean
  autoRefresh: boolean
  refreshInterval: number
  notifyStatusChange: boolean
  notifyErrors: boolean
  soundEnabled: boolean
  defaultView: 'list' | 'grid'
  showFullAgentId: boolean
  timeFormat: 'relative' | 'absolute'
  debugMode: boolean
  wsLogging: boolean
}
