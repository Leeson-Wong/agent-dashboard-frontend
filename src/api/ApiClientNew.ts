/**
 * API Client
 *
 * 封装所有后端 API 调用
 */

import type { AgentState, AgentListResponse, AgentStatsResponse, SnapshotResponse, DeltaEventsResponse } from '../../shared/types'
import { config } from '../config/env'
import { logRequest, logResponse, logError, setLogLevel, LogLevel } from '../utils/apiLogger'

export interface AgentTemplate {
  templateId: string
  name: string
  description: string
  type: string
  category: string
  role: string
  goal: string
  backstory: string
  persona: string
  skills: string
  tools: string
  enabled: boolean
}

export interface Memory {
  memoryId: string
  name: string
  type: string
  status: string
  role: string
  persona: string
  goal: string
  backstory: string
  experiences: string
  knowledge: string
  skills: string
}

export interface Task {
  taskId: string
  name: string
  description: string
  type: string
  status: string
  priority: number
  agentId: string
  memoryId: string
  input: string
  output: string
  error: string
  progress: number
}

export interface AgentOperationResponse {
  agentId: string
  operation: string
  status: string
  message: string
  currentAgentStatus: string
  timestamp: number
}

/**
 * 后端 API 统一响应格式
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

/**
 * API 错误
 */
export class APIError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code || 'UNKNOWN_ERROR'
  }
}

/**
 * API Client 配置
 */
interface APIConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
}

/**
 * API Client
 */
export class APIClient {
  private config: APIConfig
  private logEnabled: boolean

  constructor(customConfig?: Partial<APIConfig>) {
    this.config = {
      baseURL: config.api.baseURL,
      timeout: 10000,
      ...customConfig,
    }

    // Enable logging in development, disable in production
    this.logEnabled = import.meta.env.DEV

    // Set log level based on environment
    if (this.logEnabled) {
      setLogLevel(LogLevel.DEBUG)
    } else {
      setLogLevel(LogLevel.ERROR)
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`
    const method = options.method || 'GET'

    // Parse body for logging
    let requestBody: unknown = undefined
    if (options.body) {
      try {
        requestBody = JSON.parse(options.body as string)
      } catch {
        requestBody = options.body
      }
    }

    // Log request
    const logId = this.logEnabled
      ? logRequest(method, url, options.headers as Record<string, string>, requestBody)
      : ''

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers,
      },
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const duration = Date.now() - startTime

      // Get response headers
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // Parse response body
      let responseBody: unknown = undefined
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          responseBody = await response.json()
        } catch {
          // Failed to parse JSON
        }
      }

      if (!response.ok) {
        // Log error response
        if (this.logEnabled) {
          logResponse(logId, response.status, response.statusText, duration, responseHeaders, responseBody)
          logError(logId, `HTTP ${response.status}: ${response.statusText}`, duration, response.status)
        }

        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      // Log successful response
      if (this.logEnabled) {
        logResponse(logId, response.status, response.statusText, duration, responseHeaders, responseBody)
      }

      return responseBody as T
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof APIError) {
        if (this.logEnabled) {
          logError(logId, error.message, duration, error.status, error.code)
        }
        throw error
      }

      if (error instanceof TypeError) {
        const networkError = new APIError('网络连接失败，请检查后端服务是否启动', 0)
        if (this.logEnabled) {
          logError(logId, networkError.message, duration, 0, 'NETWORK_ERROR')
        }
        throw networkError
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new APIError(`请求超时 (${this.config.timeout}ms)`, 0, 'TIMEOUT')
        if (this.logEnabled) {
          logError(logId, timeoutError.message, duration, 0, 'TIMEOUT')
        }
        throw timeoutError
      }

      throw error
    }
  }

  // ========================================================================
  // Agent API
  // ========================================================================

  /**
   * 获取所有 Agent
   */
  async getAgents(): Promise<AgentState[]> {
    const response = await this.request<AgentListResponse>('/api/agents')
    return response.agents
  }

  /**
   * 获取在线 Agent
   */
  async getOnlineAgents(): Promise<AgentState[]> {
    return this.request<AgentState[]>('/api/agents/online')
  }

  /**
   * 根据 ID 获取 Agent
   */
  async getAgent(agentId: string): Promise<AgentState> {
    return this.request<AgentState>(`/api/agents/${agentId}`)
  }

  /**
   * 根据 Server ID 获取 Agent
   */
  async getAgentsByServer(serverId: string): Promise<AgentState[]> {
    return this.request<AgentState[]>(`/api/agents/server/${serverId}`)
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<AgentStatsResponse> {
    return this.request<AgentStatsResponse>('/api/agents/stats')
  }

  // ========================================================================
  // Agent Operations API
  // ========================================================================

  /**
   * 暂停 Agent
   */
  async pauseAgent(agentId: string): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}/pause`, {
      method: 'POST',
    })
  }

  /**
   * 恢复 Agent
   */
  async resumeAgent(agentId: string): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}/resume`, {
      method: 'POST',
    })
  }

  /**
   * 停止 Agent
   */
  async stopAgent(agentId: string): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}/stop`, {
      method: 'POST',
    })
  }

  /**
   * 重启 Agent
   */
  async restartAgent(agentId: string): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}/restart`, {
      method: 'POST',
    })
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId: string): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 更新 Agent 配置
   */
  async updateAgentConfig(agentId: string, config: Record<string, unknown>): Promise<AgentOperationResponse> {
    return this.request<AgentOperationResponse>(`/api/agents/${agentId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    })
  }

  /**
   * 批量操作 Agent
   */
  async batchAgentOperation(operation: string, agentIds: string[]): Promise<{ total: number; success: number; failed: number; errors: Record<string, string> }> {
    return this.request('/api/agents/batch', {
      method: 'POST',
      body: JSON.stringify({ operation, agentIds }),
    })
  }

  // ========================================================================
  // Memory API
  // ========================================================================

  /**
   * 获取所有 Memory
   */
  async getAllMemories(): Promise<Memory[]> {
    return this.request<Memory[]>('/api/memories')
  }

  /**
   * 根据 ID 获取 Memory
   */
  async getMemory(memoryId: string): Promise<Memory> {
    return this.request<Memory>(`/api/memories/${memoryId}`)
  }

  /**
   * 创建 Memory
   */
  async createMemory(memory: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>('/api/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    })
  }

  /**
   * 更新 Memory
   */
  async updateMemory(memoryId: string, memory: Partial<Memory>): Promise<Memory> {
    return this.request<Memory>(`/api/memories/${memoryId}`, {
      method: 'PUT',
      body: JSON.stringify(memory),
    })
  }

  /**
   * 删除 Memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    return this.request<void>(`/api/memories/${memoryId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 激活 Memory
   */
  async activateMemory(memoryId: string): Promise<void> {
    return this.request<void>(`/api/memories/${memoryId}/activate`, {
      method: 'POST',
    })
  }

  /**
   * 停用 Memory
   */
  async deactivateMemory(memoryId: string): Promise<void> {
    return this.request<void>(`/api/memories/${memoryId}/deactivate`, {
      method: 'POST',
    })
  }

  // ========================================================================
  // Task API
  // ========================================================================

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/tasks')
  }

  /**
   * 获取待分配任务
   */
  async getPendingTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/tasks/pending')
  }

  /**
   * 创建任务
   */
  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  /**
   * 分配任务
   */
  async assignTask(taskId: string, agentId: string, memoryId?: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId, memoryId }),
    })
  }

  /**
   * 开始任务
   */
  async startTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/start`, {
      method: 'POST',
    })
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId: string, progress: number, output?: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress, output }),
    })
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, output: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ output }),
    })
  }

  /**
   * 任务失败
   */
  async failTask(taskId: string, error: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ error }),
    })
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${taskId}/cancel`, {
      method: 'POST',
    })
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void> {
    return this.request<void>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    })
  }

  // ========================================================================
  // Agent Template API
  // ========================================================================

  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<AgentTemplate[]> {
    return this.request<AgentTemplate[]>('/api/templates')
  }

  /**
   * 获取启用的模板
   */
  async getEnabledTemplates(): Promise<AgentTemplate[]> {
    return this.request<AgentTemplate[]>('/api/templates/enabled')
  }

  /**
   * 根据类型获取模板
   */
  async getTemplatesByType(type: string): Promise<AgentTemplate[]> {
    return this.request<AgentTemplate[]>(`/api/templates/type/${type}`)
  }

  /**
   * 搜索模板
   */
  async searchTemplates(keyword: string): Promise<AgentTemplate[]> {
    return this.request<AgentTemplate[]>(`/api/templates/search?keyword=${encodeURIComponent(keyword)}`)
  }

  /**
   * 创建模板
   */
  async createTemplate(template: Partial<AgentTemplate>): Promise<AgentTemplate> {
    return this.request<AgentTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
  }

  /**
   * 更新模板
   */
  async updateTemplate(templateId: string, template: Partial<AgentTemplate>): Promise<AgentTemplate> {
    return this.request<AgentTemplate>(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    })
  }

  /**
   * 删除模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return this.request<void>(`/api/templates/${templateId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 克隆模板
   */
  async cloneTemplate(templateId: string): Promise<AgentTemplate> {
    return this.request<AgentTemplate>(`/api/templates/${templateId}/clone`, {
      method: 'POST',
    })
  }

  /**
   * 启用/禁用模板
   */
  async setTemplateEnabled(templateId: string, enabled: boolean): Promise<void> {
    return this.request<void>(`/api/templates/${templateId}/enabled`, {
      method: 'PATCH',
      body: JSON.stringify(enabled),
    })
  }

  // ========================================================================
  // Snapshot & Delta Sync API
  // ========================================================================

  /**
   * 获取最新快照
   *
   * @returns Snapshot response or null if no snapshot available
   */
  async getLatestSnapshot(): Promise<SnapshotResponse | null> {
    try {
      return await this.request<SnapshotResponse>('/api/snapshot/latest')
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        // No snapshot available yet
        return null
      }
      throw error
    }
  }

  /**
   * 获取增量事件（快照之后的事件）
   *
   * @param seq Sequence number to fetch events after
   * @returns Delta events response or null if seq expired
   */
  async getEventsSince(seq: number): Promise<DeltaEventsResponse | null> {
    try {
      return await this.request<DeltaEventsResponse>(`/api/events?since=${seq}`)
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        // Seq expired, need to fetch new snapshot
        return null
      }
      throw error
    }
  }

  // ========================================================================
  // Server Health
  // ========================================================================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health')
  }
}

// 创建全局实例
let apiClient: APIClient | null = null

export function getAPIClient(customConfig?: Partial<APIConfig>): APIClient {
  if (!apiClient) {
    apiClient = new APIClient({ ...customConfig })
  }
  return apiClient
}
