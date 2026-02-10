<template>
  <div class="column-visibility-selector">
    <button
      :class="['visibility-toggle-btn', { active: isOpen }]"
      @click="toggleMenu"
      :title="`列显示设置 (${visibleCount}/${totalCount})`"
      aria-label="列显示设置"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <span class="visibility-icon">👁️</span>
      <span class="visibility-label">列</span>
      <span class="visibility-count">{{ visibleCount }}/{{ totalCount }}</span>
      <span class="dropdown-arrow" :class="{ rotated: isOpen }">▾</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="visibility-dropdown"
        @click.stop
      >
        <div class="dropdown-header">
          <h3>列显示设置</h3>
          <div class="header-actions">
            <button
              @click="showAll"
              class="header-action-btn"
              :disabled="isAllVisible"
              title="显示全部"
            >
              全部
            </button>
            <button
              @click="hideAll"
              class="header-action-btn"
              :disabled="isMinimal"
              title="仅显示必要列"
            >
              最少
            </button>
            <button
              @click="reset"
              class="header-action-btn"
              title="重置为默认"
            >
              重置
            </button>
          </div>
        </div>

        <div class="column-list">
          <div
            v-for="column in columnOptions"
            :key="column.key"
            :class="['column-item', { disabled: isEssential(column.key) }]"
            @click="!isEssential(column.key) && toggleVisibility(column.key)"
          >
            <div class="column-checkbox">
              <input
                type="checkbox"
                :id="`column-${column.key}`"
                :checked="isVisible(column.key)"
                :disabled="isEssential(column.key)"
                @change="toggleVisibility(column.key)"
                @click.stop
              />
              <label
                :for="`column-${column.key}`"
                class="checkbox-label"
              >
                <span class="checkbox-custom" :class="{ checked: isVisible(column.key) }"></span>
              </label>
            </div>
            <div class="column-info">
              <span class="column-icon">{{ column.icon }}</span>
              <div class="column-text">
                <div class="column-label">{{ column.label }}</div>
                <div class="column-description">{{ column.description }}</div>
              </div>
            </div>
            <div v-if="isEssential(column.key)" class="essential-badge">
              必要
            </div>
          </div>
        </div>

        <div class="dropdown-footer">
          <div class="visibility-summary">
            显示 {{ visibleCount }}/{{ totalCount }} 列 ({{ visibilityPercentage }}%)
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
import { useColumnVisibility, COLUMN_OPTIONS, type ColumnKey } from '../composables/useColumnVisibility'

const {
  visibility,
  isVisible,
  toggleVisibility,
  showAll,
  hideAll,
  reset,
  visibleCount,
  totalCount,
  visibilityPercentage,
  isAllVisible,
  isMinimal
} = useColumnVisibility()

const isOpen = ref(false)

// Column options
const columnOptions = computed(() => COLUMN_OPTIONS)

/**
 * Essential columns that cannot be hidden
 */
const isEssential = (key: ColumnKey): boolean => {
  // Name is always visible (not toggleable)
  // Status and time are recommended to stay visible
  return key === 'status'
}

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
.column-visibility-selector {
  position: relative;
  display: inline-block;
}

.visibility-toggle-btn {
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

.visibility-toggle-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

.visibility-toggle-btn.active {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.visibility-icon {
  font-size: 15px;
}

.visibility-label {
  font-weight: 500;
}

.visibility-count {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-background-tertiary);
  border-radius: var(--border-radius-small);
  color: var(--color-text-secondary);
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
.visibility-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 500px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.header-actions {
  display: flex;
  gap: 6px;
}

.header-action-btn {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-small);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-action-btn:hover:not(:disabled) {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

.header-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Column List */
.column-list {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
}

.column-item:hover:not(.disabled) {
  background: var(--color-background-secondary);
}

.column-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.column-checkbox {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.column-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-label {
  display: block;
  cursor: pointer;
}

.checkbox-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-small);
  background: var(--color-background);
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-custom.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-custom.checked::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-custom:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.column-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.column-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.column-text {
  flex: 1;
  min-width: 0;
}

.column-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.column-description {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.essential-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-small);
  font-weight: 600;
  flex-shrink: 0;
}

/* Footer */
.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  border-radius: 0 0 var(--border-radius-medium) var(--border-radius-medium);
}

.visibility-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
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

/* Scrollbar Styling */
.column-list::-webkit-scrollbar {
  width: 6px;
}

.column-list::-webkit-scrollbar-track {
  background: var(--color-background);
}

.column-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.column-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

/* Dark Mode */
:global(.dark-mode) .column-item:hover:not(.disabled) {
  background: var(--color-background-tertiary);
}

:global(.dark-mode) .checkbox-custom {
  border-color: var(--color-border);
}

:global(.dark-mode) .checkbox-custom.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
