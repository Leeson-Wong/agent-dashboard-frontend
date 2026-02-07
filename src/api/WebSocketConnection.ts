/**
 * WebSocket 连接管理
 *
 * 使用 STOMP 协议连接后端 WebSocket，接收实时 Agent 状态更新
 */

import SockJS from 'sockjs-client'
import { Client, StompSubscription } from '@stomp/stompjs'
import type { ServerMessage } from '@shared/types'
import { config } from '../config/env'

export type WebSocketMessageHandler = (message: ServerMessage) => void

export class WebSocketConnection {
  private client: Client | null = null
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts: number
  private baseReconnectDelay: number
  private currentReconnectDelay: number
  private url: string

  // 心跳相关
  private heartbeatInterval: number
  private heartbeatTimer: number | null = null
  private missedHeartbeats = 0
  private maxMissedHeartbeats = 3
  private lastHeartbeatTime = 0

  // 订阅管理
  private subscriptions: Map<string, StompSubscription> = new Map()

  // 消息处理器
  private messageHandlers: Set<WebSocketMessageHandler> = new Set()

  constructor(url?: string) {
    this.url = url ?? config.websocket.baseURL
    this.maxReconnectAttempts = config.websocket.maxReconnectAttempts
    this.baseReconnectDelay = config.websocket.reconnectDelay
    this.currentReconnectDelay = this.baseReconnectDelay
    this.heartbeatInterval = config.websocket.heartbeatInterval
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      try {
        this.client = new Client({
          webSocketFactory: () => new SockJS(this.url) as any,
          debug: () => {},
          reconnectDelay: this.baseReconnectDelay,
          heartbeatIncoming: config.websocket.heartbeatInterval,
          heartbeatOutgoing: config.websocket.heartbeatInterval,
        })

        if (this.client) {
          this.client.onConnect = () => {
            this.connected = true
            this.reconnectAttempts = 0
            this.currentReconnectDelay = this.baseReconnectDelay
            this.missedHeartbeats = 0
            this.lastHeartbeatTime = Date.now()
            console.log('WebSocket connected')

            // 订阅默认频道
            this.subscribeToAgents()
            this.subscribeToNotifications()

            // 启动心跳检测
            this.startHeartbeat()

            resolve()
          }

          this.client.onStompError = (frame: any) => {
            console.error('WebSocket STOMP error:', frame)
            this.connected = false
            reject(new Error(frame.headers?.message || 'STOMP error'))
          }

          this.client.onWebSocketClose = () => {
            this.connected = false
            console.log('WebSocket disconnected')
            this.handleReconnect()
          }

          this.client.onWebSocketError = (error: any) => {
            console.error('WebSocket connection error:', error)
            this.handleReconnect()
            reject(error)
          }

          // 激活客户端
          this.client.activate()
        }
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        this.handleReconnect()
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    // 停止心跳
    this.stopHeartbeat()

    if (this.client) {
      // 取消所有订阅
      this.subscriptions.forEach(sub => sub.unsubscribe())
      this.subscriptions.clear()

      this.client.deactivate()
      this.client = null
      this.connected = false
    }
  }

  /**
   * 处理重连（使用指数退避）
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      // 指数退避：每次重连延迟翻倍，最大30秒
      this.currentReconnectDelay = Math.min(
        this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000
      )

      console.log(
        `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) ` +
        `in ${this.currentReconnectDelay}ms`
      )

      setTimeout(() => {
        this.connect().catch((err: unknown) => {
          console.error('Reconnect failed:', err)
          // 继续尝试重连
          this.handleReconnect()
        })
      }, this.currentReconnectDelay)
    } else {
      console.error('Max reconnect attempts reached')
      this.currentReconnectDelay = this.baseReconnectDelay
    }
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat() // 清除之前的定时器

    this.heartbeatTimer = window.setInterval(() => {
      const now = Date.now()
      const timeSinceLastHeartbeat = now - this.lastHeartbeatTime

      // 检查是否超过心跳间隔的2.5倍未收到心跳
      if (timeSinceLastHeartbeat > this.heartbeatInterval * 2.5) {
        this.missedHeartbeats++
        console.warn(
          `Missed heartbeat (${this.missedHeartbeats}/${this.maxMissedHeartbeats})`
        )

        if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
          console.error('Too many missed heartbeats, reconnecting...')
          this.missedHeartbeats = 0
          this.disconnect()
          this.handleReconnect()
          return
        }
      } else {
        this.missedHeartbeats = 0
      }

      // 发送 PING
      if (this.client && this.connected) {
        try {
          this.client.publish({
            destination: '/app/ping',
            body: JSON.stringify({ timestamp: now }),
          })
        } catch (error) {
          console.error('Failed to send ping:', error)
        }
      }
    }, this.heartbeatInterval)

    console.log(`Heartbeat started (interval: ${this.heartbeatInterval}ms)`)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
      console.log('Heartbeat stopped')
    }
  }

  /**
   * 订阅 Agent 更新
   */
  private subscribeToAgents(): void {
    if (!this.client || !this.connected) return

    const subscription = this.client.subscribe('/topic/agents', (message: any) => {
      try {
        const data = JSON.parse(message.body)
        this.notifyHandlers(data)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })

    this.subscriptions.set('/topic/agents', subscription)
  }

  /**
   * 订阅特定 Agent 的更新
   */
  subscribeToAgent(agentId: string): void {
    if (!this.client || !this.connected) {
      console.warn('Cannot subscribe: not connected')
      return
    }

    const destination = `/topic/agents/${agentId}`

    // 取消旧订阅
    const existing = this.subscriptions.get(destination)
    if (existing) {
      existing.unsubscribe()
    }

    const subscription = this.client.subscribe(destination, (message: any) => {
      try {
        const data = JSON.parse(message.body)
        this.notifyHandlers(data)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })

    this.subscriptions.set(destination, subscription)
  }

  /**
   * 订阅系统通知
   */
  private subscribeToNotifications(): void {
    if (!this.client || !this.connected) return

    const subscription = this.client.subscribe('/topic/notifications', (message: any) => {
      try {
        const data = JSON.parse(message.body)
        this.notifyHandlers(data)
      } catch (error) {
        console.error('Failed to parse notification:', error)
      }
    })

    this.subscriptions.set('/topic/notifications', subscription)
  }

  /**
   * 发送消息到服务器
   */
  send(destination: string, data: Record<string, unknown>): void {
    if (!this.client || !this.connected) {
      console.warn('Cannot send: not connected')
      return
    }

    this.client.publish({
      destination: `/app${destination}`,
      body: JSON.stringify(data),
    })
  }

  /**
   * 添加消息处理器
   */
  onMessage(handler: WebSocketMessageHandler): () => void {
    this.messageHandlers.add(handler)

    // 返回取消订阅函数
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * 通知所有处理器
   */
  private notifyHandlers(message: ServerMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('Error in message handler:', error)
      }
    })
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected
  }
}

// 创建全局 WebSocket 连接实例
let wsConnection: WebSocketConnection | null = null

export function getWebSocketConnection(): WebSocketConnection {
  if (!wsConnection) {
    wsConnection = new WebSocketConnection()
  }
  return wsConnection
}
