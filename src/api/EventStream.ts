/**
 * Event Stream - WebSocket 实时通信
 *
 * 负责接收服务端的实时状态更新
 * 支持快照+增量同步和断线重连
 */

import type { ServerMessage, ClientMessage, AgentEvent, AgentState, SequencedEvent, SnapshotAgentData } from '@shared/types'
import { getAPIClient } from './ApiClientNew'

export type EventHandler = (event: AgentEvent) => void
export type AgentUpdateHandler = (agents: AgentState[]) => void
export type StatsHandler = (stats: AgentState[]) => void
export type ConnectHandler = () => void
export type DisconnectHandler = () => void
export type ErrorHandler = (error: string) => void

export interface EventStreamOptions {
  reconnectInterval?: number    // 重连间隔（毫秒）
  maxReconnectAttempts?: number // 最大重连次数
  onEvent?: EventHandler
  onAgentUpdate?: AgentUpdateHandler
  onConnect?: ConnectHandler
  onDisconnect?: DisconnectHandler
  onError?: ErrorHandler
}

export class EventStream {
  private ws: WebSocket | null = null
  private url: string
  private reconnectInterval: number
  private maxReconnectAttempts: number
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isConnected = false

  // Sequence number tracking
  private lastSeq: number = 0

  // Event handlers
  private onEvent?: EventHandler
  private onAgentUpdate?: AgentUpdateHandler
  private onConnect?: ConnectHandler
  private onDisconnect?: DisconnectHandler
  private onError?: ErrorHandler

  constructor(url: string, options: EventStreamOptions = {}) {
    this.url = url
    this.reconnectInterval = options.reconnectInterval ?? 3000
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? Infinity

    this.onEvent = options.onEvent
    this.onAgentUpdate = options.onAgentUpdate
    this.onConnect = options.onConnect
    this.onDisconnect = options.onDisconnect
    this.onError = options.onError
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[EventStream] Already connected')
      return
    }

    console.log(`[EventStream] Connecting to ${this.url}...`)

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[EventStream] Failed to create WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[EventStream] Disconnecting...')
    this.clearReconnectTimer()
    this.isConnected = false

    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }

    this.onDisconnect?.()
  }

  /**
   * 发送消息到服务端
   */
  send(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[EventStream] Cannot send message: not connected')
      return
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * 设置 WebSocket 事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('[EventStream] Connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.clearReconnectTimer()

      // 订阅事件
      this.send({ type: 'subscribe' })

      // 请求初始数据（第一次连接使用全量同步）
      this.send({ type: 'get_agents' })

      this.onConnect?.()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)

        // Extract sequence number if present
        if (message.type === 'event' && 'seq' in message.payload) {
          this.lastSeq = (message.payload as any).seq
        }

        this.handleMessage(message)
      } catch (error) {
        console.error('[EventStream] Failed to parse message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[EventStream] WebSocket error:', error)
      this.onError?.('WebSocket connection error')
    }

    this.ws.onclose = (event) => {
      console.log(`[EventStream] Disconnected (code: ${event.code})`)
      this.isConnected = false

      if (!event.wasClean) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * 处理服务端消息
   */
  private handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'event':
        this.onEvent?.(message.payload)
        break

      case 'agents':
        console.log(`[EventStream] Received ${message.payload.length} agents`)
        this.onAgentUpdate?.(message.payload)
        break

      case 'stats':
        // Stats are derived from agents, so we handle them in onAgentUpdate
        break

      case 'connected':
        console.log('[EventStream] Server acknowledged connection')
        break

      case 'error':
        console.error('[EventStream] Server error:', message.payload.message)
        this.onError?.(message.payload.message)
        break
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[EventStream] Max reconnect attempts reached')
      this.onError?.('Failed to reconnect after maximum attempts')
      return
    }

    this.reconnectAttempts++

    console.log(
      `[EventStream] Reconnecting in ${this.reconnectInterval}ms...` +
      ` (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // ========================================================================
  // Sequence Number & Delta Recovery
  // ========================================================================

  /**
   * 获取最后收到的序列号
   */
  getLastSeq(): number {
    return this.lastSeq
  }

  /**
   * 增量恢复（重连时使用）
   *
   * 1. 尝试获取增量事件 /api/events?since=<seq>
   * 2. 如果 seq 过期（返回 404），则获取新快照
   * 3. 应用增量事件或快照
   */
  async performDeltaRecovery(): Promise<boolean> {
    const api = getAPIClient()
    console.log(`[EventStream] Performing delta recovery since seq ${this.lastSeq}`)

    try {
      // Step 1: 尝试获取增量事件
      const deltaResponse = await api.getEventsSince(this.lastSeq)

      if (deltaResponse && deltaResponse.events.length > 0) {
        // 成功获取增量事件
        console.log(`[EventStream] Delta recovery: got ${deltaResponse.events.length} events`)
        this.onDeltaEvents?.(deltaResponse.events)

        // 更新序列号
        if (deltaResponse.events.length > 0) {
          const lastEvent = deltaResponse.events[deltaResponse.events.length - 1]
          this.lastSeq = lastEvent.seq
        }

        return true
      } else if (deltaResponse && deltaResponse.events.length === 0) {
        // 没有新事件，不需要恢复
        console.log('[EventStream] Delta recovery: no new events')
        return true
      }
    } catch (error) {
      console.warn('[EventStream] Delta recovery failed:', error)
    }

    // Step 2: seq 过期或获取失败，回退到快照恢复
    console.log('[EventStream] Falling back to snapshot recovery')

    try {
      const snapshot = await api.getLatestSnapshot()

      if (snapshot) {
        console.log(`[EventStream] Snapshot recovery: got snapshot with ${snapshot.data.agents.length} agents`)
        // Convert SnapshotAgentData[] to AgentState[]
        const snapshotAgents: SnapshotAgentData[] = snapshot.data.agents
        const agents: AgentState[] = snapshotAgents.map(agent => ({
          agentId: agent.agentId,
          serverId: agent.serverId,
          framework: agent.framework,
          language: agent.language,
          status: agent.status as any, // Cast to AgentStatus
          currentActivity: agent.currentActivity,
          currentTool: agent.currentTool,
          currentTaskId: agent.currentTaskId,
          memoryId: agent.memoryId,
          role: agent.role,
          lastActivity: agent.lastActivity,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        }))
        this.onSnapshot?.(agents, snapshot.seq)
        this.lastSeq = snapshot.seq
        return true
      } else {
        console.warn('[EventStream] No snapshot available')
        return false
      }
    } catch (error) {
      console.error('[EventStream] Snapshot recovery failed:', error)
      return false
    }
  }

  /**
   * Delta events handler (set by caller)
   */
  private onDeltaEvents?: (events: SequencedEvent[]) => void

  /**
   * Snapshot handler (set by caller)
   */
  private onSnapshot?: (agents: AgentState[], seq: number) => void

  /**
   * Set handlers for delta recovery
   */
  setRecoveryHandlers(handlers: {
    onDeltaEvents: (events: SequencedEvent[]) => void
    onSnapshot: (agents: AgentState[], seq: number) => void
  }): void {
    this.onDeltaEvents = handlers.onDeltaEvents
    this.onSnapshot = handlers.onSnapshot
  }

  /**
   * 获取连接状态
   */
  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }
}
