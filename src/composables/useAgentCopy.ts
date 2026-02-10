/**
 * Agent Copy Composable
 *
 * Handles copying agent data in various formats
 */

import { ref } from 'vue'
import type { AgentState } from '../../shared/types'

export type CopyFormat = 'json' | 'markdown' | 'csv' | 'plain'

export interface CopyFormatOption {
  id: CopyFormat
  label: string
  description: string
  extension: string
}

// Available copy formats
export const COPY_FORMATS: CopyFormatOption[] = [
  {
    id: 'plain',
    label: '纯文本',
    description: '简单的纯文本格式',
    extension: 'txt'
  },
  {
    id: 'json',
    label: 'JSON',
    description: '结构化 JSON 格式',
    extension: 'json'
  },
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'Markdown 表格格式',
    extension: 'md'
  },
  {
    id: 'csv',
    label: 'CSV',
    description: '逗号分隔值格式',
    extension: 'csv'
  }
]

/**
 * Format agent data as plain text
 */
const formatAsPlain = (agent: AgentState): string => {
  const lines: string[] = []

  lines.push('Agent ID: ' + agent.agentId)
  lines.push('Role: ' + (agent.role || 'N/A'))
  lines.push('Status: ' + agent.status)
  lines.push('Framework: ' + (agent.framework || 'N/A'))
  lines.push('Language: ' + (agent.language || 'N/A'))
  lines.push('Server ID: ' + (agent.serverId || 'N/A'))
  lines.push('Last Activity: ' + (agent.lastActivity || 'N/A'))
  lines.push('Created At: ' + agent.createdAt)
  lines.push('')

  if (agent.currentTaskId) {
    lines.push('Current Task ID: ' + agent.currentTaskId)
  }

  if (agent.currentTool) {
    lines.push('Current Tool: ' + agent.currentTool)
  }

  if (agent.currentActivity) {
    lines.push('Current Activity: ' + agent.currentActivity)
  }

  if (agent.memoryId) {
    lines.push('Memory ID: ' + agent.memoryId)
  }

  if (agent.tags) {
    lines.push('Tags: ' + agent.tags)
  }

  return lines.join('\n')
}

/**
 * Format agent data as JSON
 */
const formatAsJSON = (agent: AgentState): string => {
  const data = {
    agentId: agent.agentId,
    serverId: agent.serverId,
    role: agent.role,
    status: agent.status,
    framework: agent.framework,
    language: agent.language,
    lastActivity: agent.lastActivity,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    currentActivity: agent.currentActivity,
    currentTool: agent.currentTool,
    currentTaskId: agent.currentTaskId,
    memoryId: agent.memoryId,
    tags: agent.tags,
    isFavorite: agent.isFavorite
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Format agent data as Markdown
 */
const formatAsMarkdown = (agent: AgentState): string => {
  const lines: string[] = []

  lines.push('# ' + (agent.role || agent.agentId))
  lines.push('')
  lines.push('| Property | Value |')
  lines.push('|----------|-------|')
  lines.push('| **Agent ID** | `' + agent.agentId + '` |')
  lines.push('| **Server ID** | `' + (agent.serverId || 'N/A') + '` |')
  lines.push('| **Status** | ' + getStatusEmoji(agent.status) + ' ' + agent.status + ' |')
  lines.push('| **Role** | ' + (agent.role || 'N/A') + ' |')
  lines.push('| **Framework** | ' + (agent.framework || 'N/A') + ' |')
  lines.push('| **Language** | ' + (agent.language || 'N/A') + ' |')
  lines.push('| **Last Activity** | ' + (agent.lastActivity || 'N/A') + ' |')
  lines.push('')

  if (agent.currentActivity) {
    lines.push('## Current Activity')
    lines.push('```')
    lines.push(agent.currentActivity)
    lines.push('```')
    lines.push('')
  }

  if (agent.currentTaskId) {
    lines.push('**Current Task ID:** `' + agent.currentTaskId + '`')
    lines.push('')
  }

  if (agent.currentTool) {
    lines.push('**Current Tool:** ' + agent.currentTool)
    lines.push('')
  }

  if (agent.tags) {
    lines.push('## Tags')
    lines.push(agent.tags)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Format agent data as CSV
 */
const formatAsCSV = (agent: AgentState): string => {
  const fields = ['agentId', 'serverId', 'role', 'status', 'framework', 'language', 'lastActivity', 'createdAt']

  const values = [
    agent.agentId,
    agent.serverId || '',
    agent.role || '',
    agent.status,
    agent.framework || '',
    agent.language || '',
    agent.lastActivity || '',
    agent.createdAt || ''
  ]

  const header = fields.join(',')
  const row = values.map(v => {
    const escaped = String(v).replace(/"/g, '""')
    return '"' + escaped + '"'
  }).join(',')

  return header + '\n' + row
}

/**
 * Get status emoji
 */
const getStatusEmoji = (status: string): string => {
  const emojis: Record<string, string> = {
    online: '🟢',
    offline: '⚫',
    error: '🔴',
    busy: '🟠',
    thinking: '🟣',
    ready: '🔵',
    waiting: '🟡',
    paused: '⏸️',
    stopped: '⏹️',
    initializing: '⏳'
  }
  return emojis[status] || status
}

/**
 * Format agent data based on format type
 */
export const formatAgentData = (agent: AgentState, format: CopyFormat): string => {
  switch (format) {
    case 'json':
      return formatAsJSON(agent)
    case 'markdown':
      return formatAsMarkdown(agent)
    case 'csv':
      return formatAsCSV(agent)
    case 'plain':
    default:
      return formatAsPlain(agent)
  }
}

/**
 * Copy agent data to clipboard
 */
export const copyAgentData = async (
  agent: AgentState,
  format: CopyFormat
): Promise<boolean> => {
  try {
    const data = formatAgentData(agent, format)

    // Use Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(data)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = data
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        return successful
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Copy multiple agents data
 */
export const copyMultipleAgents = async (
  agents: AgentState[],
  format: CopyFormat
): Promise<boolean> => {
  try {
    if (format === 'csv') {
      // For CSV, include header only once
      const header = ['agentId,serverId,role,status,framework,language,lastActivity,createdAt']
      const rows = agents.map(agent => {
        const values = [
          agent.agentId,
          agent.serverId || '',
          agent.role || '',
          agent.status,
          agent.framework || '',
          agent.language || '',
          agent.lastActivity || '',
          agent.createdAt || ''
        ]
        return values.map(v => {
          const escaped = String(v).replace(/"/g, '""')
          return '"' + escaped + '"'
        }).join(',')
      })
      const data = [header.join(','), ...rows].join('\n')

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(data)
        return true
      }
    } else {
      // For other formats, concatenate with separator
      const separator = format === 'json' ? ',\n' : '\n\n---\n\n'
      const data = agents.map(agent => formatAgentData(agent, format)).join(separator)

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(data)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Failed to copy multiple agents:', error)
    return false
  }
}

/**
 * Use agent copy composable
 */
export function useAgentCopy() {
  const lastCopyFormat = ref<CopyFormat>('plain')
  const lastCopyTime = ref<number>(0)

  /**
   * Copy single agent
   */
  const copyAgent = async (
    agent: AgentState,
    format: CopyFormat = 'plain'
  ): Promise<boolean> => {
    const success = await copyAgentData(agent, format)
    if (success) {
      lastCopyFormat.value = format
      lastCopyTime.value = Date.now()
    }
    return success
  }

  /**
   * Copy multiple agents
   */
  const copyAgents = async (
    agents: AgentState[],
    format: CopyFormat = 'plain'
  ): Promise<boolean> => {
    const success = await copyMultipleAgents(agents, format)
    if (success) {
      lastCopyFormat.value = format
      lastCopyTime.value = Date.now()
    }
    return success
  }

  /**
   * Get copy summary for toast notification
   */
  const getCopySummary = (agentCount: number, format: CopyFormat): string => {
    const formatLabel = COPY_FORMATS.find(f => f.id === format)?.label || format
    if (agentCount === 1) {
      return '已复制 Agent 数据 (' + formatLabel + ')'
    } else {
      return '已复制 ' + agentCount + ' 个 Agent (' + formatLabel + ')'
    }
  }

  return {
    // State
    lastCopyFormat,
    lastCopyTime,

    // Methods
    copyAgent,
    copyAgents,
    getCopySummary,
    formatAgentData
  }
}

export default useAgentCopy
