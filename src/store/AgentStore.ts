/**
 * Agent Store - 客户端状态管理
 *
 * 负责合并来自 API、WebSocket 和快照的数据，保证一致性
 * 支持快照+增量同步机制
 */

import type { AgentState, AgentStatus, SequencedEvent } from '@shared/types'

/**
 * 状态合并策略：
 * 1. 服务端是唯一真实来源
 * 2. 使用 updatedAt 时间戳判断哪个更新
 * 3. 事件去重（使用事件ID）
 * 4. WebSocket 更新是增量的，API 更新是全量的
 */

export class AgentStore {
  private agents: Map<string, AgentState> = new Map()
  private eventIds = new Set<string>() // 用于事件去重
  private lastSeq: number = 0 // 最后收到的事件序列号

  /**
   * 全量同步（来自 API）
   */
  syncAll(agents: AgentState[]): void {
    console.log(`[AgentStore] Syncing ${agents.length} agents from API`)

    // 完全替换本地状态
    this.agents.clear()
    agents.forEach(agent => {
      this.agents.set(agent.agentId, agent)
    })

    this.logState()
  }

  /**
   * 增量更新（来自 WebSocket）
   *
   * @param agent 要更新的 agent 数据
   * @param eventId 事件ID（用于去重）
   * @returns 是否更新成功（false 表示事件已处理过或数据过期）
   */
  update(agent: AgentState, eventId?: string): boolean {
    // 事件去重
    if (eventId && this.eventIds.has(eventId)) {
      console.log(`[AgentStore] Event ${eventId} already processed, skipping`)
      return false
    }

    const existing = this.agents.get(agent.agentId)

    // 如果 agent 不存在，直接添加
    if (!existing) {
      this.agents.set(agent.agentId, agent)
      if (eventId) this.eventIds.add(eventId)
      console.log(`[AgentStore] Added new agent ${agent.agentId}`)
      this.logState()
      return true
    }

    // 使用 updatedAt 判断哪个更新
    const existingTime = new Date(existing.updatedAt).getTime()
    const newTime = new Date(agent.updatedAt).getTime()

    if (newTime <= existingTime) {
      console.log(
        `[AgentStore] Ignoring stale update for ${agent.agentId} ` +
        `(existing: ${existing.updatedAt}, new: ${agent.updatedAt})`
      )
      return false
    }

    // 更新 agent
    this.agents.set(agent.agentId, agent)
    if (eventId) this.eventIds.add(eventId)

    console.log(`[AgentStore] Updated agent ${agent.agentId}`)
    this.logState()
    return true
  }

  /**
   * 更新 agent 状态（用于处理事件）
   */
  updateStatus(agentId: string, status: AgentStatus, currentActivity?: string): boolean {
    const existing = this.agents.get(agentId)
    if (!existing) {
      console.warn(`[AgentStore] Agent ${agentId} not found for status update`)
      return false
    }

    const updated: AgentState = {
      ...existing,
      status,
      currentActivity,
      updatedAt: new Date().toISOString(),
    }

    return this.update(updated)
  }

  /**
   * 删除 agent
   */
  delete(agentId: string): boolean {
    const deleted = this.agents.delete(agentId)
    if (deleted) {
      console.log(`[AgentStore] Deleted agent ${agentId}`)
      this.logState()
    }
    return deleted
  }

  /**
   * 获取单个 agent
   */
  get(agentId: string): AgentState | undefined {
    return this.agents.get(agentId)
  }

  /**
   * 获取所有 agents
   */
  getAll(): AgentState[] {
    return Array.from(this.agents.values())
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const agents = this.getAll()
    return {
      total: agents.length,
      online: agents.filter(a => a.status === 'online').length,
      offline: agents.filter(a => a.status === 'offline').length,
      busy: agents.filter(a => a.status === 'busy').length,
      error: agents.filter(a => a.status === 'error').length,
    }
  }

  /**
   * 清理已处理的事件ID（防止内存泄漏）
   */
  cleanupEventIds(keepLastN = 1000): void {
    if (this.eventIds.size > keepLastN) {
      const idsToDelete = Array.from(this.eventIds).slice(0, this.eventIds.size - keepLastN)
      idsToDelete.forEach(id => this.eventIds.delete(id))
      console.log(`[AgentStore] Cleaned up ${idsToDelete.length} old event IDs`)
    }
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.agents.clear()
    this.eventIds.clear()
    this.lastSeq = 0
    console.log('[AgentStore] Cleared all state')
  }

  // ========================================================================
  // Snapshot + Delta Sync Methods
  // ========================================================================

  /**
   * 获取最后收到的序列号
   */
  getLastSeq(): number {
    return this.lastSeq
  }

  /**
   * 应用快照（完全替换当前状态）
   *
   * @param agents 快照中的所有 Agent 状态
   * @param seq 快照时的序列号
   */
  applySnapshot(agents: AgentState[], seq: number): void {
    console.log(`[AgentStore] Applying snapshot with ${agents.length} agents (seq: ${seq})`)

    // 完全替换本地状态
    this.agents.clear()
    this.eventIds.clear()

    agents.forEach(agent => {
      this.agents.set(agent.agentId, agent)
    })

    // 更新序列号
    this.lastSeq = seq

    this.logState()
  }

  /**
   * 应用增量事件
   *
   * @param events 增量事件列表
   * @returns 成功应用的事件数量
   */
  applyDeltaEvents(events: SequencedEvent[]): number {
    console.log(`[AgentStore] Applying ${events.length} delta events`)

    let appliedCount = 0

    for (const event of events) {
      // 检查序列号，确保事件是有序的
      if (event.seq <= this.lastSeq) {
        console.log(`[AgentStore] Skipping old event ${event.seq} (lastSeq: ${this.lastSeq})`)
        continue
      }

      // 处理事件
      const agent = this.agents.get(event.agentId)

      switch (event.type) {
        case 'agent_status':
          if (agent && event.data.status) {
            this.agents.set(event.agentId, {
              ...agent,
              status: event.data.status,
              currentActivity: event.data.activity || agent.currentActivity,
              updatedAt: new Date(event.timestamp).toISOString(),
            })
            appliedCount++
          }
          break

        case 'agent_activity':
          if (agent && event.data.activity) {
            this.agents.set(event.agentId, {
              ...agent,
              currentActivity: event.data.activity,
              currentTool: event.data.tool || agent.currentTool,
              updatedAt: new Date(event.timestamp).toISOString(),
            })
            appliedCount++
          }
          break

        case 'agent_error':
          if (agent && event.data.error) {
            this.agents.set(event.agentId, {
              ...agent,
              status: 'error',
              currentActivity: `错误: ${event.data.error}`,
              updatedAt: new Date(event.timestamp).toISOString(),
            })
            appliedCount++
          }
          break
      }

      // 更新序列号
      this.lastSeq = event.seq
    }

    console.log(`[AgentStore] Applied ${appliedCount}/${events.length} delta events`)
    this.logState()

    return appliedCount
  }

  /**
   * 日志当前状态（调试用）
   */
  private logState(): void {
    const stats = this.getStats()
    console.log(
      `[AgentStore] State: ${stats.total} total, ` +
      `${stats.online} online, ${stats.busy} busy, ` +
      `${stats.offline} offline, ${stats.error} error, ` +
      `lastSeq: ${this.lastSeq}`
    )
  }
}

export const agentStore = new AgentStore()
