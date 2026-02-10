/**
 * Data Export/Import Composable
 *
 * Handles exporting and importing application data
 */

import { ref, computed } from 'vue'

export type ExportFormat = 'json' | 'csv' | 'markdown'

export interface ExportOptions {
  format: ExportFormat
  includeAgents?: boolean
  includeSettings?: boolean
  includeFilters?: boolean
  includeTimestamp?: boolean
}

export interface ExportData {
  version: string
  timestamp: string
  agents?: any[]
  settings?: Record<string, any>
  filters?: Record<string, any>
}

const EXPORT_VERSION = '1.0.0'

export function useDataExport() {
  const isExporting = ref(false)
  const isImporting = ref(false)
  const lastExportTime = ref<Date | null>(null)

  const exportToFile = (
    data: ExportData,
    format: ExportFormat,
    filename?: string
  ): void => {
    isExporting.value = true

    try {
      let content: string
      let mimeType: string
      let extension: string

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          extension = 'json'
          break

        case 'csv':
          content = convertToCSV(data)
          mimeType = 'text/csv'
          extension = 'csv'
          break

        case 'markdown':
          content = convertToMarkdown(data)
          mimeType = 'text/markdown'
          extension = 'md'
          break

        default:
          throw new Error(`Unsupported format: ${format}`)
      }

      const defaultFilename = `agent-dashboard-export-${new Date().toISOString().split('T')[0]}.${extension}`
      const finalFilename = filename || defaultFilename

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFilename
      link.click()
      URL.revokeObjectURL(url)

      lastExportTime.value = new Date()
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    } finally {
      isExporting.value = false
    }
  }

  const convertToCSV = (data: ExportData): string => {
    const lines: string[] = []

    lines.push('# Agent Dashboard Export')
    lines.push(`# Version: ${data.version}`)
    lines.push(`# Date: ${data.timestamp}`)
    lines.push('')

    if (data.agents && data.agents.length > 0) {
      lines.push('## Agents')
      const headers = Object.keys(data.agents[0])
      lines.push(headers.join(','))
      data.agents.forEach(agent => {
        const values = headers.map(h => {
          const val = agent[h]
          if (val === null || val === undefined) return ''
          if (typeof val === 'object') return JSON.stringify(val)
          return String(val).replace(/,/g, ';')
        })
        lines.push(values.join(','))
      })
      lines.push('')
    }

    if (data.settings) {
      lines.push('## Settings')
      Object.entries(data.settings).forEach(([key, value]) => {
        lines.push(`${key},${JSON.stringify(value)}`)
      })
      lines.push('')
    }

    return lines.join('\n')
  }

  const convertToMarkdown = (data: ExportData): string => {
    const lines: string[] = []

    lines.push('# Agent Dashboard Export')
    lines.push('')
    lines.push(`**Version:** ${data.version}`)
    lines.push(`**Date:** ${data.timestamp}`)
    lines.push('')

    if (data.agents && data.agents.length > 0) {
      lines.push('## Agents')
      lines.push('')
      lines.push('| Agent ID | Name | Status | Framework | Tasks | Errors |')
      lines.push('|----------|------|--------|-----------|-------|--------|')

      data.agents.forEach(agent => {
        lines.push(
          `| ${agent.agentId || ''} | ${agent.name || ''} | ${agent.status || ''} | ` +
          `${agent.framework || ''} | ${agent.taskCount || 0} | ${agent.errorCount || 0} |`
        )
      })
      lines.push('')
    }

    if (data.settings) {
      lines.push('## Settings')
      lines.push('')
      Object.entries(data.settings).forEach(([key, value]) => {
        lines.push(`- **${key}:** \`${JSON.stringify(value)}\``)
      })
      lines.push('')
    }

    if (data.filters) {
      lines.push('## Current Filters')
      lines.push('')
      Object.entries(data.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          lines.push(`- **${key}:** ${JSON.stringify(value)}`)
        }
      })
      lines.push('')
    }

    return lines.join('\n')
  }

  const importFromFile = (): Promise<ExportData> => {
    return new Promise((resolve, reject) => {
      isImporting.value = true

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,.csv,.md'

      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          isImporting.value = false
          reject(new Error('No file selected'))
          return
        }

        const reader = new FileReader()

        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            const extension = file.name.split('.').pop()?.toLowerCase()

            if (extension === 'json') {
              const data = JSON.parse(content) as ExportData
              validateImportData(data)
              resolve(data)
            } else if (extension === 'csv') {
              const data = parseCSV(content)
              resolve(data)
            } else if (extension === 'md') {
              const data = parseMarkdown(content)
              resolve(data)
            } else {
              reject(new Error('Unsupported file format'))
            }
          } catch (error) {
            console.error('Import failed:', error)
            reject(error)
          } finally {
            isImporting.value = false
          }
        }

        reader.onerror = () => {
          isImporting.value = false
          reject(new Error('Failed to read file'))
        }

        reader.readAsText(file)
      }

      input.oncancel = () => {
        isImporting.value = false
        reject(new Error('Import cancelled'))
      }

      input.click()
    })
  }

  const validateImportData = (data: ExportData): void => {
    if (!data.version) {
      throw new Error('Invalid data: missing version')
    }

    if (!data.timestamp) {
      throw new Error('Invalid data: missing timestamp')
    }

    const [major] = data.version.split('.')
    const [currentMajor] = EXPORT_VERSION.split('.')

    if (parseInt(major) > parseInt(currentMajor)) {
      throw new Error(`Unsupported version: ${data.version}`)
    }
  }

  const parseCSV = (content: string): ExportData => {
    const lines = content.split('\n').filter(l => !l.startsWith('#'))
    const data: ExportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString()
    }

    const headers = lines[0]?.split(',') || []
    if (headers.length > 0) {
      data.agents = []
    }

    return data
  }

  const parseMarkdown = (content: string): ExportData => {
    const data: ExportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString()
    }

    const versionMatch = content.match(/\*\*Version:\*\* ([\d.]+)/)
    if (versionMatch) {
      data.version = versionMatch[1]
    }

    return data
  }

  const exportAppState = (
    agents: any[],
    settings: Record<string, any>,
    filters: Record<string, any>,
    options: ExportOptions
  ): void => {
    const data: ExportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString()
    }

    if (options.includeAgents) {
      data.agents = agents
    }

    if (options.includeSettings) {
      data.settings = settings
    }

    if (options.includeFilters) {
      data.filters = filters
    }

    exportToFile(data, options.format)
  }

  const exportSelectedAgents = (
    agents: any[],
    selectedIds: string[],
    format: ExportFormat = 'json'
  ): void => {
    const selectedAgents = agents.filter(a => selectedIds.includes(a.agentId))

    const data: ExportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString(),
      agents: selectedAgents
    }

    exportToFile(data, format, `selected-agents-${new Date().toISOString().split('T')[0]}.${format}`)
  }

  const exportSettings = (settings: Record<string, any>): void => {
    const data: ExportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString(),
      settings
    }

    exportToFile(data, 'json', `settings-${new Date().toISOString().split('T')[0]}.json`)
  }

  const importSettings = async (): Promise<Record<string, any> | null> => {
    try {
      const data = await importFromFile()
      return data.settings || null
    } catch {
      return null
    }
  }

  const copyToClipboard = async (
    agents: any[],
    settings: Record<string, any>,
    format: 'json' | 'csv' = 'json'
  ): Promise<boolean> => {
    try {
      const data: ExportData = {
        version: EXPORT_VERSION,
        timestamp: new Date().toISOString(),
        agents,
        settings
      }

      let content: string
      if (format === 'json') {
        content = JSON.stringify(data, null, 2)
      } else {
        content = convertToCSV(data)
      }

      await navigator.clipboard.writeText(content)
      return true
    } catch {
      return false
    }
  }

  const getExportStats = computed(() => {
    return {
      lastExportTime: lastExportTime.value,
      isExporting: isExporting.value,
      isImporting: isImporting.value
    }
  })

  return {
    isExporting,
    isImporting,
    lastExportTime,
    exportToFile,
    importFromFile,
    exportAppState,
    exportSelectedAgents,
    exportSettings,
    importSettings,
    copyToClipboard,
    getExportStats
  }
}
