/**
 * Search Highlight Composable
 *
 * Manages search text highlighting in agent lists
 */

import { ref } from 'vue'

export interface HighlightMatch {
  text: string
  isMatch: boolean
  startIndex?: number
  endIndex?: number
}

export function useSearchHighlight() {
  const searchQuery = ref('')
  const isCaseSensitive = ref(false)
  const isRegexMode = ref(false)

  // Check if text matches search query
  const matchesQuery = (text: string): boolean => {
    if (!searchQuery.value) return true

    try {
      if (isRegexMode.value) {
        const flags = isCaseSensitive.value ? 'g' : 'gi'
        const regex = new RegExp(searchQuery.value, flags)
        return regex.test(text)
      } else {
        const query = isCaseSensitive.value ? searchQuery.value : searchQuery.value.toLowerCase()
        const target = isCaseSensitive.value ? text : text.toLowerCase()
        return target.includes(query)
      }
    } catch {
      // Invalid regex, fall back to plain text
      const query = isCaseSensitive.value ? searchQuery.value : searchQuery.value.toLowerCase()
      const target = isCaseSensitive.value ? text : text.toLowerCase()
      return target.includes(query)
    }
  }

  // Get highlighted text parts
  const getHighlightedParts = (text: string): HighlightMatch[] => {
    if (!searchQuery.value) {
      return [{ text, isMatch: false }]
    }

    try {
      if (isRegexMode.value) {
        return getRegexHighlightedParts(text)
      } else {
        return getPlainTextHighlightedParts(text)
      }
    } catch {
      return [{ text, isMatch: false }]
    }
  }

  // Highlight using plain text search
  const getPlainTextHighlightedParts = (text: string): HighlightMatch[] => {
    const query = isCaseSensitive.value ? searchQuery.value : searchQuery.value.toLowerCase()
    const target = isCaseSensitive.value ? text : text.toLowerCase()

    const parts: HighlightMatch[] = []
    let lastIndex = 0
    let index = target.indexOf(query)

    while (index !== -1) {
      // Add non-matching part before match
      if (index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, index),
          isMatch: false
        })
      }

      // Add matching part
      parts.push({
        text: text.substring(index, index + query.length),
        isMatch: true,
        startIndex: index,
        endIndex: index + query.length
      })

      lastIndex = index + query.length
      index = target.indexOf(query, lastIndex)
    }

    // Add remaining non-matching part
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isMatch: false
      })
    }

    return parts.length > 0 ? parts : [{ text, isMatch: false }]
  }

  // Highlight using regex
  const getRegexHighlightedParts = (text: string): HighlightMatch[] => {
    const flags = isCaseSensitive.value ? 'g' : 'gi'
    const regex = new RegExp(searchQuery.value, flags)

    const parts: HighlightMatch[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      // Add non-matching part before match
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isMatch: false
        })
      }

      // Add matching part
      parts.push({
        text: match[0],
        isMatch: true,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })

      lastIndex = regex.lastIndex
    }

    // Add remaining non-matching part
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isMatch: false
      })
    }

    return parts.length > 0 ? parts : [{ text, isMatch: false }]
  }

  // Count matches in text
  const countMatches = (text: string): number => {
    if (!searchQuery.value) return 0

    try {
      if (isRegexMode.value) {
        const flags = isCaseSensitive.value ? 'g' : 'gi'
        const regex = new RegExp(searchQuery.value, flags)
        const matches = text.match(regex)
        return matches ? matches.length : 0
      } else {
        const query = isCaseSensitive.value ? searchQuery.value : searchQuery.value.toLowerCase()
        const target = isCaseSensitive.value ? text : text.toLowerCase()
        let count = 0
        let index = 0

        while ((index = target.indexOf(query, index)) !== -1) {
          count++
          index += query.length
        }

        return count
      }
    } catch {
      return 0
    }
  }

  // Clear search
  const clearSearch = (): void => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    isCaseSensitive,
    isRegexMode,
    matchesQuery,
    getHighlightedParts,
    countMatches,
    clearSearch
  }
}
