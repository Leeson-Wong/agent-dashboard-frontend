/**
 * Mini Map Composable
 *
 * Manages a compact visual overview of all agents
 */

import { ref, computed } from 'vue'

export interface MiniMapNode {
  id: string
  x: number
  y: number
  status: string
  framework?: string
  selected: boolean
}

export interface MiniMapViewport {
  x: number
  y: number
  width: number
  height: number
}

export function useMiniMap(options: {
  width: number
  height: number
  nodeCount: number
}) {
  const nodes = ref<MiniMapNode[]>([])
  const viewport = ref<MiniMapViewport>({
    x: 0,
    y: 0,
    width: options.width,
    height: options.height
  })

  // Calculate node positions in a grid pattern
  const calculatePositions = (agentCount: number): MiniMapNode[] => {
    const result: MiniMapNode[] = []
    const cols = Math.ceil(Math.sqrt(agentCount))
    const rows = Math.ceil(agentCount / cols)

    const nodeWidth = options.width / cols
    const nodeHeight = options.height / rows
    const padding = 4

    for (let i = 0; i < agentCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      result.push({
        id: `node-${i}`,
        x: col * nodeWidth + padding,
        y: row * nodeHeight + padding,
        status: 'unknown', // Will be updated by updateNodes
        selected: false
      })
    }

    return result
  }

  // Update nodes from agents
  const updateNodes = (agents: Array<{ agentId: string; status: string; framework?: string }>, selectedId?: string | null): void => {
    const calculatedPositions = calculatePositions(agents.length)

    nodes.value = agents.map((agent, index) => {
      const pos = calculatedPositions[index] || { x: 0, y: 0 }
      return {
        id: agent.agentId,
        x: pos.x,
        y: pos.y,
        status: agent.status,
        framework: agent.framework,
        selected: agent.agentId === selectedId
      }
    })
  }

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'online': '#22c55e',
      'ready': '#22c55e',
      'offline': '#64748b',
      'paused': '#f59e0b',
      'error': '#ef4444',
      'unknown': '#94a3b8'
    }
    return colors[status] || colors.unknown
  }

  // Get node size based on total nodes
  const getNodeSize = computed(() => {
    const count = nodes.value.length
    if (count > 100) return 2
    if (count > 50) return 3
    if (count > 20) return 4
    return 5
  })

  // Get stats by status
  const getStatusStats = computed(() => {
    const stats: Record<string, number> = {}
    nodes.value.forEach(node => {
      stats[node.status] = (stats[node.status] || 0) + 1
    })
    return stats
  })

  // Handle node click
  const handleNodeClick = (nodeId: string, callback?: (agentId: string) => void): void => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node && callback) {
      callback(nodeId)
    }
  }

  return {
    // State
    nodes,
    viewport,
    nodeSize: getNodeSize,
    statusStats: getStatusStats,

    // Methods
    updateNodes,
    getStatusColor,
    handleNodeClick
  }
}
