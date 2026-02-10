<template>
  <div class="view-mode-selector">
    <button
      :class="['mode-toggle-btn', { active: isOpen }]"
      @click="toggleMenu"
      :title="`视图模式: ${currentModeInfo?.label}`"
      aria-label="视图模式切换"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <span class="mode-icon">{{ currentModeInfo?.icon }}</span>
      <span class="mode-label">{{ currentModeInfo?.label }}</span>
      <span class="dropdown-arrow" :class="{ rotated: isOpen }">▾</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="mode-dropdown"
        @click.stop
      >
        <div class="dropdown-header">
          <h3>视图模式</h3>
        </div>

        <div class="mode-list">
          <div
            v-for="mode in viewModes"
            :key="mode.id"
            :class="['mode-item', { active: currentMode === mode.id }]"
            @click="selectMode(mode.id)"
          >
            <div class="mode-preview">
              <div
                v-for="(line, index) in mode.preview"
                :key="index"
                class="preview-line"
              >
                {{ line }}
              </div>
            </div>
            <div class="mode-info">
              <div class="mode-name">
                <span class="mode-icon-small">{{ mode.icon }}</span>
                <span class="mode-text">{{ mode.label }}</span>
              </div>
              <div class="mode-description">{{ mode.description }}</div>
            </div>
            <div v-if="currentMode === mode.id" class="active-indicator">
              ✓
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click outside detector -->
    <div
      v-if="isOpen"
      class="click-outside-overlay"
      @click="closeMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useViewMode, VIEW_MODES, type ViewMode } from '../composables/useViewMode'

const {
  currentMode,
  currentModeInfo,
  setMode
} = useViewMode()

const isOpen = ref(false)

// View modes
const viewModes = computed(() => VIEW_MODES)

/**
 * Toggle dropdown menu
 */
const toggleMenu = (): void => {
  isOpen.value = !isOpen.value
}

/**
 * Close dropdown menu
 */
const closeMenu = (): void => {
  isOpen.value = false
}

/**
 * Select mode
 */
const selectMode = (mode: ViewMode): void => {
  setMode(mode)
  closeMenu()
}

/**
 * Handle keyboard
 */
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.view-mode-selector {
  position: relative;
  display: inline-block;
}

.mode-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-medium);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.mode-toggle-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

.mode-toggle-btn.active {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mode-icon {
  font-size: 15px;
}

.mode-label {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.2s ease;
  color: var(--color-text-secondary);
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown */
.mode-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-medium);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.dropdown-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

/* Mode List */
.mode-list {
  padding: 8px;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
}

.mode-item:hover {
  background: var(--color-background-secondary);
}

.mode-item.active {
  background: var(--color-primary-dim);
  border: 1px solid var(--color-primary);
}

.mode-preview {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-small);
  min-width: 60px;
}

.preview-line {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-family: monospace;
  letter-spacing: 1px;
  line-height: 1.2;
}

.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.mode-icon-small {
  font-size: 14px;
}

.mode-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.mode-description {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.active-indicator {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

/* Click outside overlay */
.click-outside-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Dark Mode */
:global(.dark-mode) .mode-item:hover {
  background: var(--color-background-tertiary);
}

:global(.dark-mode) .mode-item.active {
  background: var(--color-primary-dim);
}
</style>
