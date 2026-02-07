/// <reference types="vite/client" />

/**
 * Vite Environment Variables
 *
 * These variables are available at build time and are prefixed with VITE_
 * They can be accessed via import.meta.env
 */

interface ImportMetaEnv {
  /** API base URL */
  readonly VITE_API_BASE_URL: string

  /** WebSocket base URL */
  readonly VITE_WS_BASE_URL: string

  /** Application title */
  readonly VITE_APP_TITLE: string

  /** Application version */
  readonly VITE_APP_VERSION: string

  /** Enable 3D scene visualization */
  readonly VITE_ENABLE_3D_SCENE: string

  /** Debug mode enabled */
  readonly VITE_DEBUG_MODE: string

  /** Auto refresh interval in milliseconds */
  readonly VITE_AUTO_REFRESH_INTERVAL: string

  /** WebSocket reconnection delay */
  readonly VITE_WS_RECONNECT_DELAY: string

  /** Maximum WebSocket reconnection attempts */
  readonly VITE_WS_MAX_RECONNECT_ATTEMPTS: string

  /** WebSocket heartbeat interval */
  readonly VITE_WS_HEARTBEAT_INTERVAL: string

  /** Use mock data for development */
  readonly VITE_USE_MOCK_DATA: string

  /** Mock agents count for development */
  readonly VITE_MOCK_AGENTS_COUNT: string

  // Vite built-in environment variables
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
