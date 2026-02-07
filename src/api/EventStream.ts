/**
 * Event Stream - WebSocket 实时通信
 *
 * 负责接收服务端的实时状态更新
 */

import type { ServerMessage, ClientMessage, AgentEvent, AgentState } from '@shared/types'

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

      // 请求初始数据
      this.send({ type: 'get_agents' })

      this.onConnect?.()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)
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

  /**
   * 获取连接状态
   */
  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }
}
