/**
 * Agent Notes Composable
 *
 * Manages user notes for Agents
 */

import { ref, computed, watch } from 'vue'

export interface AgentNote {
  agentId: string
  note: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'agent_notes'

// Global notes store
const notesStore = ref<Map<string, AgentNote>>(new Map())
const isLoaded = ref(false)

/**
 * Load notes from localStorage
 */
const loadNotes = (): void => {
  if (isLoaded.value) return

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const notesArray = JSON.parse(saved) as AgentNote[]
      notesStore.value = new Map(notesArray.map(note => [note.agentId, note]))
    }
  } catch (error) {
    console.warn('Failed to load agent notes:', error)
  }
  isLoaded.value = true
}

/**
 * Save notes to localStorage
 */
const saveNotes = (): void => {
  try {
    const notesArray = Array.from(notesStore.value.values())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArray))
  } catch (error) {
    console.warn('Failed to save agent notes:', error)
  }
}

/**
 * Watch for changes and auto-save
 */
watch(notesStore, () => {
  if (isLoaded.value) {
    saveNotes()
  }
}, { deep: true })

export function useAgentNotes() {
  // Initialize on first use
  if (!isLoaded.value) {
    loadNotes()
  }

  /**
   * Get note for a specific agent
   */
  const getNote = (agentId: string): AgentNote | undefined => {
    return notesStore.value.get(agentId)
  }

  /**
   * Check if agent has a note
   */
  const hasNote = (agentId: string): boolean => {
    const note = notesStore.value.get(agentId)
    return note !== undefined && note.note.trim() !== ''
  }

  /**
   * Get note text for a specific agent
   */
  const getNoteText = (agentId: string): string => {
    const note = notesStore.value.get(agentId)
    return note?.note || ''
  }

  /**
   * Set note for a specific agent
   */
  const setNote = (agentId: string, noteText: string): void => {
    const now = new Date().toISOString()
    const existingNote = notesStore.value.get(agentId)

    if (existingNote) {
      // Update existing note
      existingNote.note = noteText
      existingNote.updatedAt = now
    } else {
      // Create new note
      notesStore.value.set(agentId, {
        agentId,
        note: noteText,
        createdAt: now,
        updatedAt: now
      })
    }
  }

  /**
   * Delete note for a specific agent
   */
  const deleteNote = (agentId: string): void => {
    notesStore.value.delete(agentId)
  }

  /**
   * Clear all notes
   */
  const clearAllNotes = (): void => {
    notesStore.value.clear()
    saveNotes()
  }

  /**
   * Get all agents with notes
   */
  const getAgentsWithNotes = (): string[] => {
    return Array.from(notesStore.value.keys())
  }

  /**
   * Get all notes
   */
  const getAllNotes = (): AgentNote[] => {
    return Array.from(notesStore.value.values())
  }

  /**
   * Export notes to JSON
   */
  const exportNotes = (): string => {
    const notes = getAllNotes()
    return JSON.stringify(notes, null, 2)
  }

  /**
   * Import notes from JSON
   */
  const importNotes = (json: string): boolean => {
    try {
      const notes = JSON.parse(json) as AgentNote[]
      if (!Array.isArray(notes)) {
        throw new Error('Invalid notes format')
      }

      notes.forEach(note => {
        if (note.agentId && note.note) {
          notesStore.value.set(note.agentId, note)
        }
      })

      saveNotes()
      return true
    } catch (error) {
      console.error('Failed to import notes:', error)
      return false
    }
  }

  /**
   * Search notes by text
   */
  const searchNotes = (query: string): AgentNote[] => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    return getAllNotes().filter(note =>
      note.note.toLowerCase().includes(lowerQuery) ||
      note.agentId.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get note statistics
   */
  const getNoteStats = () => {
    const allNotes = getAllNotes()
    const withContent = allNotes.filter(n => n.note.trim() !== '')

    return {
      total: allNotes.length,
      withContent: withContent.length,
      empty: allNotes.length - withContent.length
    }
  }

  // Computed
  const notesCount = computed(() => notesStore.value.size)
  const notesWithContentCount = computed(() => {
    return Array.from(notesStore.value.values()).filter(n => n.note.trim() !== '').length
  })

  return {
    // State
    isLoaded,
    notesCount,
    notesWithContentCount,

    // Methods
    getNote,
    hasNote,
    getNoteText,
    setNote,
    deleteNote,
    clearAllNotes,
    getAgentsWithNotes,
    getAllNotes,
    exportNotes,
    importNotes,
    searchNotes,
    getNoteStats
  }
}
