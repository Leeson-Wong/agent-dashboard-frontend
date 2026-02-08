/**
 * Agent Dashboard - Type Definitions
 *
 * Core types for Agent monitoring and 3D visualization
 */

// ============================================================================
// Agent Types
// ============================================================================

/** Agent status - 扩展支持更多状态 */
export type AgentStatus =
  | 'online'
  | 'offline'
  | 'error'
  | 'busy'
  | 'thinking'      // 思考中（调用 LLM）
  | 'ready'         // 就绪（等待任务）
  | 'waiting'       // 等待中（等待资源或输入）
  | 'paused'        // 已暂停
  | 'stopped'       // 已停止
  | 'initializing'  // 初始化中

/** Programming language */
export type AgentLanguage = 'Python' | 'JavaScript' | 'TypeScript' | 'Java' | 'Go' | 'Rust' | string

/** Agent framework */
export type AgentFramework = 'LangChain' | 'LangGraph' | 'AutoGen' | 'CrewAI' | 'OpenAI' | string

/** Agent state entity */
export interface AgentState {
  /** Unique agent ID */
  agentId: string
  /** Server ID */
  serverId: string
  /** Framework name */
  framework: AgentFramework
  /** Programming language */
  language: AgentLanguage
  /** Current status */
  status: AgentStatus
  /** Current activity description */
  currentActivity?: string
  /** Current tool being used */
  currentTool?: string
  /** Current task ID */
  currentTaskId?: string
  /** Associated Memory ID */
  memoryId?: string
  /** Agent role */
  role?: string
  /** Last activity timestamp */
  lastActivity: string
  /** Creation timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
}

/** API response for agent list */
export interface AgentListResponse {
  agents: AgentState[]
  total: number
  online: number
  offline: number
  error: number
}

/** Statistics response */
export interface AgentStatsResponse {
  totalAgents: number
  onlineAgents: number
  offlineAgents: number
  errorAgents: number
  byFramework: Record<string, number>
  byLanguage: Record<string, number>
}

// ============================================================================
// Event Types (from backend)
// ============================================================================

export type EventType = 'agent_status' | 'agent_activity' | 'agent_error'

export interface BaseEvent {
  id: string
  timestamp: number
  type: EventType
  agentId: string
}

export interface AgentStatusEvent extends BaseEvent {
  type: 'agent_status'
  status: AgentStatus
  previousStatus?: AgentStatus
}

export interface AgentActivityEvent extends BaseEvent {
  type: 'agent_activity'
  activity: string
  tool?: string
  details?: Record<string, unknown>
}

export interface AgentErrorEvent extends BaseEvent {
  type: 'agent_error'
  error: string
  stackTrace?: string
}

export type AgentEvent = AgentStatusEvent | AgentActivityEvent | AgentErrorEvent

// ============================================================================
// 3D Visualization Types
// ============================================================================

/** Station type for agent positioning */
export type StationType =
  | 'center'       // Default/idle position
  | 'terminal'     // Executing commands
  | 'workbench'    // Processing/working
  | 'database'     // Database operations
  | 'network'      // API calls/network
  | 'analyzer'     // Analysis tasks

/** Zone color palette */
export const ZONE_COLORS = [
  0x4ade80, // green
  0x60a5fa, // blue
  0xf472b6, // pink
  0xa78bfa, // purple
  0xfbbf24, // amber
  0x2dd4bf, // teal
] as const

/** Agent zone in 3D scene */
export interface AgentZone {
  id: string
  agentId: string
  position: { x: number; y: number; z: number }
  color: number
  status: AgentStatus
  label?: string
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type ServerMessage =
  | { type: 'event'; payload: AgentEvent }
  | { type: 'agents'; payload: AgentState[] }
  | { type: 'stats'; payload: AgentStatsResponse }
  | { type: 'connected' }
  | { type: 'error'; payload: { message: string } }

export type ClientMessage =
  | { type: 'subscribe' }
  | { type: 'get_agents' }
  | { type: 'get_stats' }
  | { type: 'ping' }

// ============================================================================
// Snapshot + Delta Sync Types
// ============================================================================

/** Event with sequence number */
export interface SequencedEvent {
  seq: number // Global sequence number
  type: EventType
  agentId: string
  timestamp: number
  data: {
    status?: AgentStatus
    previousStatus?: AgentStatus
    activity?: string
    tool?: string
    details?: Record<string, unknown>
    error?: string
    stackTrace?: string
  }
}

/** Snapshot response from backend */
export interface SnapshotResponse {
  snapshotId: string
  seq: number // Sequence number at snapshot time
  data: {
    agents: AgentState[]
  }
  createdAt: string
}

/** Delta events response from backend */
export interface DeltaEventsResponse {
  since: number
  events: SequencedEvent[]
}

/** Error response when seq is expired */
export interface DeltaEventsError {
  error: string
  suggestion: string
}
