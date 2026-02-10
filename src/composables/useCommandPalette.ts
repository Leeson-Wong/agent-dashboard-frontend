import { ref, computed } from 'vue'

export interface Command {
  id: string
  label: string
  description?: string
  icon?: string
  category: string
  shortcut?: string
  keywords?: string[]
  action: () => void
  disabled?: boolean
}

/**
 * Command Palette composable
 * Provides command palette functionality with search and categories
 */
export function useCommandPalette(commands: Command[]) {
  const isOpen = ref(false)
  const searchQuery = ref('')
  const selectedIndex = ref(0)

  // Filter commands based on search query
  const filteredCommands = computed(() => {
    if (!searchQuery.value.trim()) {
      return commands.filter(cmd => !cmd.disabled)
    }

    const query = searchQuery.value.toLowerCase().trim()
    const terms = query.split(/\s+/)

    return commands
      .filter(cmd => !cmd.disabled)
      .filter(cmd => {
        // Search in label, description, keywords
        const searchableText = [
          cmd.label,
          cmd.description || '',
          ...(cmd.keywords || [])
        ].join(' ').toLowerCase()

        // All terms must match
        return terms.every(term => searchableText.includes(term))
      })
  })

  // Group filtered commands by category
  const groupedCommands = computed(() => {
    const groups: Record<string, Command[]> = {}

    filteredCommands.value.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })

    return Object.entries(groups).map(([category, cmds]) => ({
      category,
      commands: cmds
    }))
  })

  // Open command palette
  const open = (): void => {
    isOpen.value = true
    searchQuery.value = ''
    selectedIndex.value = 0
  }

  // Close command palette
  const close = (): void => {
    isOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
  }

  // Execute selected command
  const executeSelected = (): void => {
    const commands = filteredCommands.value
    if (selectedIndex.value >= 0 && selectedIndex.value < commands.length) {
      const command = commands[selectedIndex.value]
      if (!command.disabled) {
        command.action()
        close()
      }
    }
  }

  // Navigate through commands
  const navigate = (direction: 'up' | 'down'): void => {
    const commands = filteredCommands.value
    if (commands.length === 0) return

    if (direction === 'down') {
      selectedIndex.value = (selectedIndex.value + 1) % commands.length
    } else {
      selectedIndex.value = selectedIndex.value <= 0
        ? commands.length - 1
        : selectedIndex.value - 1
    }
  }

  // Get total command count for display
  const totalCommands = computed(() => filteredCommands.value.length)

  // Get selected command
  const selectedCommand = computed(() => {
    const commands = filteredCommands.value
    if (selectedIndex.value >= 0 && selectedIndex.value < commands.length) {
      return commands[selectedIndex.value]
    }
    return null
  })

  return {
    isOpen,
    searchQuery,
    selectedIndex,
    filteredCommands,
    groupedCommands,
    totalCommands,
    selectedCommand,
    open,
    close,
    executeSelected,
    navigate
  }
}
