/**
 * API Client - REST API 通信
 *
 * 负责初始数据加载和定期全量同步
 */

import type { AgentState, AgentListResponse, AgentStatsResponse } from '@shared/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 获取所有 Agent（初始加载或全量同步）
   */
  async getAgents(): Promise<AgentState[]> {
    const response = await fetch(`${this.baseUrl}/api/agents`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    const data: AgentListResponse = await response.json()
    return data.agents
  }

  /**
   * 获取在线 Agent
   */
  async getOnlineAgents(): Promise<AgentState[]> {
    const response = await fetch(`${this.baseUrl}/api/agents/online`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 根据 serverId 获取 Agent
   */
  async getAgentsByServer(serverId: string): Promise<AgentState[]> {
    const response = await fetch(`${this.baseUrl}/api/agents/server/${encodeURIComponent(serverId)}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<AgentStatsResponse> {
    const response = await fetch(`${this.baseUrl}/api/agents/stats`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const apiClient = new ApiClient()
