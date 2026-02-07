/**
 * Environment Configuration
 *
 * Centralized access to environment variables with type safety and defaults
 */

/**
 * Get an environment variable or return a default value
 */
function getEnv(key: keyof ImportMetaEnv, defaultValue: string): string {
  return import.meta.env[key] || defaultValue
}

/**
 * Parse a boolean environment variable
 */
function getBooleanEnv(key: keyof ImportMetaEnv, defaultValue: boolean): boolean {
  const value = import.meta.env[key]
  if (value === undefined || value === '') return defaultValue
  return value === 'true' || value === '1'
}

/**
 * Parse a number environment variable
 */
function getNumberEnv(key: keyof ImportMetaEnv, defaultValue: number): number {
  const value = import.meta.env[key]
  if (value === undefined || value === '') return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Application Configuration
 */
export const config = {
  // API Configuration
  api: {
    baseURL: getEnv('VITE_API_BASE_URL', 'http://localhost:8080'),
  },

  // WebSocket Configuration
  websocket: {
    baseURL: getEnv('VITE_WS_BASE_URL', 'http://localhost:8080/ws'),
    reconnectDelay: getNumberEnv('VITE_WS_RECONNECT_DELAY', 3000),
    maxReconnectAttempts: getNumberEnv('VITE_WS_MAX_RECONNECT_ATTEMPTS', 5),
    heartbeatInterval: getNumberEnv('VITE_WS_HEARTBEAT_INTERVAL', 4000),
  },

  // Application Settings
  app: {
    title: getEnv('VITE_APP_TITLE', 'Agent Dashboard'),
    version: getEnv('VITE_APP_VERSION', '1.0.0'),
    enable3DScene: getBooleanEnv('VITE_ENABLE_3D_SCENE', true),
    debugMode: getBooleanEnv('VITE_DEBUG_MODE', false),
    autoRefreshInterval: getNumberEnv('VITE_AUTO_REFRESH_INTERVAL', 5000),
  },

  // Development Settings
  development: {
    useMockData: getBooleanEnv('VITE_USE_MOCK_DATA', false),
    mockAgentsCount: getNumberEnv('VITE_MOCK_AGENTS_COUNT', 4),
  },

  // Environment
  env: {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    ssr: import.meta.env.SSR,
    baseUrl: import.meta.env.BASE_URL,
  },
} as const

/**
 * Type exports for config values
 */
export type AppConfig = typeof config
