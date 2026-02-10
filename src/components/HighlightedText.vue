<template>
  <span class="highlighted-text">
    <template v-for="(part, index) in parts" :key="index">
      <span
        v-if="part.isMatch"
        class="highlight-match"
        :class="{ 'is-current': part.startIndex === currentMatchIndex }"
      >
        {{ part.text }}
      </span>
      <span v-else class="highlight-normal">{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HighlightMatch } from '../composables/useSearchHighlight'

interface Props {
  text: string
  query: string
  caseSensitive?: boolean
  regexMode?: boolean
  currentMatchIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  caseSensitive: false,
  regexMode: false,
  currentMatchIndex: -1
})

// Get highlighted parts
const parts = computed((): HighlightMatch[] => {
  if (!props.query) {
    return [{ text: props.text, isMatch: false }]
  }

  try {
    if (props.regexMode) {
      return getRegexHighlightedParts()
    } else {
      return getPlainTextHighlightedParts()
    }
  } catch {
    return [{ text: props.text, isMatch: false }]
  }
})

// Plain text highlighting
const getPlainTextHighlightedParts = (): HighlightMatch[] => {
  const query = props.caseSensitive ? props.query : props.query.toLowerCase()
  const target = props.caseSensitive ? props.text : props.text.toLowerCase()

  const result: HighlightMatch[] = []
  let lastIndex = 0
  let index = target.indexOf(query)

  while (index !== -1) {
    if (index > lastIndex) {
      result.push({
        text: props.text.substring(lastIndex, index),
        isMatch: false
      })
    }

    result.push({
      text: props.text.substring(index, index + query.length),
      isMatch: true,
      startIndex: index,
      endIndex: index + query.length
    })

    lastIndex = index + query.length
    index = target.indexOf(query, lastIndex)
  }

  if (lastIndex < props.text.length) {
    result.push({
      text: props.text.substring(lastIndex),
      isMatch: false
    })
  }

  return result.length > 0 ? result : [{ text: props.text, isMatch: false }]
}

// Regex highlighting
const getRegexHighlightedParts = (): HighlightMatch[] => {
  const flags = props.caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(props.query, flags)

  const result: HighlightMatch[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(props.text)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        text: props.text.substring(lastIndex, match.index),
        isMatch: false
      })
    }

    result.push({
      text: match[0],
      isMatch: true,
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < props.text.length) {
    result.push({
      text: props.text.substring(lastIndex),
      isMatch: false
    })
  }

  return result.length > 0 ? result : [{ text: props.text, isMatch: false }]
}
</script>

<style scoped>
.highlighted-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.highlight-match {
  background: rgba(250, 204, 21, 0.3);
  border-radius: 2px;
  padding: 0 2px;
  color: #fef08a;
  font-weight: 600;
}

.highlight-match.is-current {
  background: rgba(250, 204, 21, 0.5);
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.3);
}

.highlight-normal {
  color: inherit;
}
</style>
