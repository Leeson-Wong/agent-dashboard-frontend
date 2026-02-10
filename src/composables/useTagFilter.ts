/**
 * Tag Filter Composable
 *
 * Manages filtering agents by tags
 */

import { ref, computed } from 'vue'

export interface TagWithCount {
  tag: string
  count: number
  color: string
}

export function useTagFilter() {
  const selectedTags = ref<Set<string>>(new Set())
  const allTags = ref<TagWithCount[]>([])

  // Check if filter is active
  const isFilterActive = computed(() => selectedTags.value.size > 0)

  // Count of selected filters
  const selectedCount = computed(() => selectedTags.value.size)

  // Update all tags from agents
  const updateTags = (agents: Array<{ tags?: string }>): void => {
    const tagCounts: Record<string, number> = {}

    agents.forEach(agent => {
      if (!agent.tags) return

      try {
        const tags = typeof agent.tags === 'string' ? JSON.parse(agent.tags) : agent.tags
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      } catch {
        // Invalid JSON, skip
      }
    })

    allTags.value = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        color: getTagColor(tag)
      }))
      .sort((a, b) => b.count - a.count)
  }

  // Get color for tag based on its content
  const getTagColor = (tag: string): string => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'red', 'yellow']
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Toggle tag selection
  const toggleTag = (tag: string): void => {
    if (selectedTags.value.has(tag)) {
      selectedTags.value.delete(tag)
    } else {
      selectedTags.value.add(tag)
    }
    // Convert to array for reactivity
    selectedTags.value = new Set(selectedTags.value)
  }

  // Check if tag is selected
  const isTagSelected = (tag: string): boolean => {
    return selectedTags.value.has(tag)
  }

  // Clear all filters
  const clearFilters = (): void => {
    selectedTags.value.clear()
    selectedTags.value = new Set(selectedTags.value)
  }

  // Filter agents by selected tags
  const filterAgents = <T extends { tags?: string }>(agents: T[]): T[] => {
    if (selectedTags.value.size === 0) return agents

    return agents.filter(agent => {
      if (!agent.tags) return false

      try {
        const tags = typeof agent.tags === 'string' ? JSON.parse(agent.tags) : agent.tags
        if (!Array.isArray(tags)) return false

        // Check if agent has any of the selected tags
        return tags.some(tag => selectedTags.value.has(tag))
      } catch {
        return false
      }
    })
  }

  // Get selected tags as array
  const getSelectedTagsArray = computed(() => {
    return Array.from(selectedTags.value)
  })

  return {
    // State
    selectedTags,
    allTags,
    isFilterActive,
    selectedCount,
    selectedTagsArray: getSelectedTagsArray,

    // Methods
    updateTags,
    toggleTag,
    isTagSelected,
    clearFilters,
    filterAgents,
    getTagColor
  }
}
