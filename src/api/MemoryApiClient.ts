/**
 * Memory API Client - Memory 管理 API 通信
 *
 * Design Document: 04-memory-management.md
 */

import type {
  Memory,
  ExperienceDTO,
  KnowledgeDTO,
  SkillDTO,
  PatchDTO,
  ApiResponse,
  MemoryStats,
} from '../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export class MemoryApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // ========================================================================
  // Memory CRUD
  // ========================================================================

  /**
   * 获取所有 Memory
   */
  async getAllMemories(): Promise<Memory[]> {
    const response = await fetch(`${this.baseUrl}/api/memories`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 获取 Memory
   */
  async getMemory(memoryId: string): Promise<Memory | null> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 创建 Memory
   */
  async createMemory(memory: Partial<Memory>): Promise<Memory> {
    const response = await fetch(`${this.baseUrl}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 更新 Memory
   */
  async updateMemory(memoryId: string, memory: Partial<Memory>): Promise<Memory> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...memory, memoryId }),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 删除 Memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * 根据状态获取 Memory
   */
  async getMemoriesByStatus(status: string): Promise<Memory[]> {
    const response = await fetch(`${this.baseUrl}/api/memories/status/${status}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 激活 Memory
   */
  async activateMemory(memoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/activate`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * 停用 Memory
   */
  async deactivateMemory(memoryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/deactivate`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<MemoryStats> {
    const response = await fetch(`${this.baseUrl}/api/memories/stats`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  // ========================================================================
  // Experiences (经验管理)
  // ========================================================================

  /**
   * 获取相关经验
   */
  async getExperiences(
    memoryId: string,
    taskType?: string,
    limit = 10
  ): Promise<ApiResponse<ExperienceDTO[]>> {
    const url = new URL(`${this.baseUrl}/api/memories/${memoryId}/experiences`)
    if (taskType) url.searchParams.set('taskType', taskType)
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 提取经验
   */
  async extractExperience(
    memoryId: string,
    taskType: string,
    taskDescription: string,
    complexity: number,
    success: boolean,
    output?: string,
    error?: string
  ): Promise<ApiResponse<ExperienceDTO>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/experiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskType,
        taskDescription,
        complexity,
        success,
        output,
        error,
      }),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  // ========================================================================
  // Knowledge (知识管理)
  // ========================================================================

  /**
   * 获取知识
   */
  async getKnowledge(memoryId: string): Promise<ApiResponse<KnowledgeDTO[]>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/knowledge`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 添加知识
   */
  async addKnowledge(
    memoryId: string,
    type: string,
    content: string,
    sourceType: string,
    sourceDetails?: string,
    confidence = 0.8
  ): Promise<ApiResponse<KnowledgeDTO>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        content,
        sourceType,
        sourceDetails,
        confidence,
      }),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 验证知识
   */
  async verifyKnowledge(knowledgeId: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/api/memories/knowledge/${knowledgeId}/verify`, {
      method: 'PUT',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  // ========================================================================
  // Skills (技能管理)
  // ========================================================================

  /**
   * 获取技能
   */
  async getSkills(memoryId: string): Promise<ApiResponse<SkillDTO[]>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/skills`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 获取最熟练技能
   */
  async getTopSkills(memoryId: string, limit = 5): Promise<ApiResponse<SkillDTO[]>> {
    const response = await fetch(
      `${this.baseUrl}/api/memories/${memoryId}/skills/top?limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 记录技能使用
   */
  async recordSkillUsage(
    memoryId: string,
    skillName: string,
    category: string,
    success: boolean,
    durationSeconds?: number
  ): Promise<ApiResponse<SkillDTO>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/skills/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillName,
        category,
        success,
        durationSeconds,
      }),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  // ========================================================================
  // Temporal Patches (时间补丁管理)
  // ========================================================================

  /**
   * 获取补丁
   */
  async getPatches(memoryId: string): Promise<ApiResponse<PatchDTO[]>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/patches`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 应用时间补丁
   */
  async applyPatches(memoryId: string, sessionId?: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/api/memories/${memoryId}/patches/apply`)
    if (sessionId) url.searchParams.set('sessionId', sessionId)

    const response = await fetch(url, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  /**
   * 创建时间补丁
   */
  async createPatch(
    memoryId: string,
    type: string,
    description: string,
    eventDate: string,
    affectedDomains: string[],
    patchData: string,
    confidence = 0.8,
    sourceType = 'manual',
    providedBy = 'admin'
  ): Promise<ApiResponse<PatchDTO>> {
    const response = await fetch(`${this.baseUrl}/api/memories/${memoryId}/patches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        description,
        eventDate,
        affectedDomains,
        patchData,
        confidence,
        sourceType,
        providedBy,
      }),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }
}

export const memoryApiClient = new MemoryApiClient()
