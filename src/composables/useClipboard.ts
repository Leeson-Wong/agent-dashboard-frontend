import { ref } from 'vue'

/**
 * Clipboard composable
 * Provides clipboard functionality with different formats
 */
export function useClipboard() {
  const copiedText = ref<string | null>(null)
  const showCopiedToast = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Use modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          if (!successful) {
            throw new Error('Copy command failed')
          }
        } catch (err) {
          document.body.removeChild(textArea)
          throw err
        }
      }

      copiedText.value = text
      showToast()
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  /**
   * Show temporary "copied" toast
   */
  const showToast = (): void => {
    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    showCopiedToast.value = true
    toastTimer = setTimeout(() => {
      showCopiedToast.value = false
      toastTimer = null
    }, 2000)
  }

  /**
   * Format agent data as plain text
   */
  const formatAsText = (agent: Record<string, unknown>): string => {
    return `Agent ID: ${agent.agentId}
Role: ${agent.role || 'N/A'}
Status: ${agent.status}
Current Activity: ${agent.currentActivity || 'N/A'}
Framework: ${agent.framework || 'N/A'}
Last Activity: ${agent.lastActivity ? new Date(agent.lastActivity as number).toLocaleString() : 'N/A'}
Created At: ${agent.createdAt ? new Date(agent.createdAt as number).toLocaleString() : 'N/A'}`
  }

  /**
   * Format agent data as JSON
   */
  const formatAsJSON = (agent: Record<string, unknown>): string => {
    return JSON.stringify(agent, null, 2)
  }

  /**
   * Format agent data as CSV
   */
  const formatAsCSV = (agent: Record<string, unknown>): string => {
    const fields = [
      'agentId',
      'role',
      'status',
      'currentActivity',
      'framework',
      'lastActivity',
      'createdAt'
    ]

    const values = fields.map(field => {
      const value = agent[field]
      if (value === undefined || value === null) return 'N/A'
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return String(value)
    })

    return fields.join(',') + '\n' + values.join(',')
  }

  /**
   * Format agent data as Markdown
   */
  const formatAsMarkdown = (agent: Record<string, unknown>): string => {
    return `## ${agent.role || 'Agent'} (${agent.agentId})

| Property | Value |
|----------|-------|
| **Status** | ${agent.status} |
| **Framework** | ${agent.framework || 'N/A'} |
| **Current Activity** | ${agent.currentActivity || 'N/A'} |
| **Last Activity** | ${agent.lastActivity ? new Date(agent.lastActivity as number).toLocaleString() : 'N/A'} |
| **Created At** | ${agent.createdAt ? new Date(agent.createdAt as number).toLocaleString() : 'N/A'} |
`
  }

  /**
   * Format multiple agents as table text
   */
  const formatAgentsAsTable = (agents: Record<string, unknown>[]): string => {
    if (agents.length === 0) return 'No agents'

    const headers = ['Agent ID', 'Role', 'Status', 'Framework']
    const rows = agents.map(agent => [
      String(agent.agentId || '').substring(0, 20),
      String(agent.role || 'N/A').substring(0, 20),
      String(agent.status || 'N/A'),
      String(agent.framework || 'N/A')
    ])

    // Calculate column widths
    const colWidths = headers.map((header, i) => {
      const maxRowWidth = Math.max(...rows.map(row => row[i].length))
      return Math.max(header.length, maxRowWidth) + 2
    })

    // Build table
    let result = ''

    // Header row
    result += headers.map((header, i) =>
      header.padEnd(colWidths[i])
    ).join('') + '\n'

    // Separator row
    result += colWidths.map(width => '-'.repeat(width)).join('') + '\n'

    // Data rows
    rows.forEach(row => {
      result += row.map((cell, i) =>
        cell.padEnd(colWidths[i])
      ).join('') + '\n'
    })

    return result
  }

  return {
    copiedText,
    showCopiedToast,
    copyToClipboard,
    formatAsText,
    formatAsJSON,
    formatAsCSV,
    formatAsMarkdown,
    formatAgentsAsTable
  }
}
