/**
 * Batch Operations Composable
 *
 * Provides functionality to perform batch operations on multiple agents
 */

import type { AgentState } from '../../shared/types'

export type BatchAction = 'pause' | 'resume' | 'delete' | 'export' | 'update'

export interface BatchOperation {
  action: BatchAction
  agentIds: string[]
  options?: Record<string, unknown>
}

export interface BatchResult {
  success: boolean
  agentId: string
  error?: string
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  results: BatchResult[]
}

/**
 * Execute batch operation with progress tracking
 */
export async function executeBatchOperation(
  operation: BatchOperation,
  agents: AgentState[],
  onProgress?: (progress: BatchProgress) => void
): Promise<BatchProgress> {
  const results: BatchResult[] = []
  let completed = 0
  let failed = 0
  const total = operation.agentIds.length

  // Process agents sequentially (can be made parallel with concurrency limit)
  for (const agentId of operation.agentIds) {
    try {
      const agent = agents.find(a => a.agentId === agentId)
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`)
      }

      await executeAction(operation.action, agent, operation.options)
      results.push({ success: true, agentId })
      completed++
    } catch (error) {
      results.push({
        success: false,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failed++
    }

    // Report progress
    if (onProgress) {
      onProgress({ total, completed, failed, results })
    }
  }

  return { total, completed, failed, results }
}

/**
 * Execute single action on an agent
 */
async function executeAction(
  action: BatchAction,
  agent: AgentState,
  options?: Record<string, unknown>
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  switch (action) {
    case 'pause':
      await fetch(`${apiUrl}/api/agents/${agent.agentId}/pause`, {
        method: 'POST'
      })
      break

    case 'resume':
      await fetch(`${apiUrl}/api/agents/${agent.agentId}/resume`, {
        method: 'POST'
      })
      break

    case 'delete':
      await fetch(`${apiUrl}/api/agents/${agent.agentId}`, {
        method: 'DELETE'
      })
      break

    case 'update':
      if (options?.updates) {
        await fetch(`${apiUrl}/api/agents/${agent.agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options.updates)
        })
      }
      break

    case 'export':
      // Export is handled separately by the export composable
      // This is a placeholder for future API-based export
      break

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

/**
 * Get display name for action
 */
export function getActionDisplayName(action: BatchAction): string {
  const names: Record<BatchAction, string> = {
    pause: '暂停',
    resume: '恢复',
    delete: '删除',
    export: '导出',
    update: '更新'
  }
  return names[action]
}

/**
 * Get action icon
 */
export function getActionIcon(action: BatchAction): string {
  const icons: Record<BatchAction, string> = {
    pause: '⏸️',
    resume: '▶️',
    delete: '🗑️',
    export: '📥',
    update: '✏️'
  }
  return icons[action]
}

/**
 * Check if action is destructive (cannot be undone)
 */
export function isDestructiveAction(action: BatchAction): boolean {
  return action === 'delete'
}

/**
 * Check if action requires confirmation
 */
export function requiresConfirmation(action: BatchAction, count: number): boolean {
  return isDestructiveAction(action) || count > 5
}

/**
 * Get confirmation message for action
 */
export function getConfirmationMessage(action: BatchAction, count: number): string {
  const actionName = getActionDisplayName(action)
  const suffix = count > 1 ? ` ${count} 个 Agent` : ''

  if (isDestructiveAction(action)) {
    return `⚠️ 确定要${actionName}${suffix}吗？此操作不可撤销！`
  }

  return `确定要${actionName}${suffix}吗？`
}
