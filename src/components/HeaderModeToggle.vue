<template>
  <button
    :class="['header-mode-toggle', { active: isCompact }]"
    @click="toggleMode"
    :title="isCompact ? '正常头部模式' : '紧凑头部模式'"
    :aria-label="isCompact ? '切换到正常头部模式' : '切换到紧凑头部模式'"
    :aria-pressed="isCompact"
  >
    <span class="toggle-icon">{{ isCompact ? '⊟' : '⊞' }}</span>
  </button>
</template>

<script setup lang="ts">
import { useHeaderMode } from '../composables/useHeaderMode'

const { currentMode, toggleMode } = useHeaderMode()

const isCompact = currentMode.value === 'compact'
</script>

<style scoped>
.header-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-small);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-mode-toggle:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
  color: var(--color-text);
}

.toggle-icon {
  font-size: 16px;
  font-weight: bold;
}
</style>
