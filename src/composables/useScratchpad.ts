/**
 * Scratchpad Composable
 *
 * Manages a simple notepad for quick notes
 */

import { ref } from 'vue'

const STORAGE_KEY = 'agentDashboard_scratchpad'

export function useScratchpad() {
  const content = ref('')
  const isDirty = ref(false)

  // Load from localStorage
  const load = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        content.value = saved
      }
    } catch (error) {
      console.error('Failed to load scratchpad:', error)
    }
  }

  // Save to localStorage
  const save = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, content.value)
      isDirty.value = false
    } catch (error) {
      console.error('Failed to save scratchpad:', error)
    }
  }

  // Clear content
  const clear = (): void => {
    if (confirm('确定要清空便签板吗？')) {
      content.value = ''
      save()
    }
  }

  // Update content
  const update = (newContent: string): void => {
    content.value = newContent
    isDirty.value = true
  }

  // Word count
  const wordCount = ref(0)
  const lineCount = ref(0)

  const updateStats = (): void => {
    const lines = content.value.split('\n')
    lineCount.value = lines.length
    wordCount.value = content.value.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  // Export as text file
  const exportAsText = (): void => {
    const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scratchpad_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    content,
    isDirty,
    wordCount,
    lineCount,
    load,
    save,
    clear,
    update,
    updateStats,
    exportAsText
  }
}
