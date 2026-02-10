<template>
  <div class="stats-visibility-selector">
    <button
      :class="['visibility-toggle-btn', { active: isOpen }]"
      @click="toggleMenu"
      :title="`统计显示设置 (${visibleCount}/${totalCount})`"
      aria-label="统计显示设置"
      aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <span class="visibility-icon">⚙️</span>
      <span class="visibility-label">设置</span>
      <span class="dropdown-arrow" :class="{ rotated: isOpen }">▾</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="visibility-dropdown"
        @click.stop
      >
        <div class="dropdown-header">
          <h3>统计显示设置</h3>
          <div class="header-actions">
            <button
              @click="showAll"
              class="header-action-btn"
              :disabled="visibleCount === totalCount"
              title="显示全部"
            >
              全部
            </button>
            <button
              @click="hideAll"
              class="header-action-btn"
              :disabled="visibleCount === 1"
              title="仅显示概览"
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

        <div class="category-list">
          <div
            v-for="category in statCategories"
            :key="category.id"
            :class="['category-item', { disabled: category.id === 'overview' }]"
            @click="category.id !== 'overview' && toggleVisibility(category.id)"
          >
            <div class="category-checkbox">
              <input
                type="checkbox"
                :id="`category-${category.id}`"
                :checked="isVisible(category.id)"
                :disabled="category.id === 'overview'"
                @change="toggleVisibility(category.id)"
                @click.stop
              />
              <label
                :for="`category-${category.id}`"
                class="checkbox-label"
              >
                <span class="checkbox-custom" :class="{ checked: isVisible(category.id) }"></span>
              </label>
            </div>
            <div class="category-info">
              <span class="category-icon">{{ category.icon }}</span>
              <div class="category-text">
                <div class="category-label">{{ category.label }}</div>
                <div class="category-description">{{ category.description }}</div>
              </div>
            </div>
            <div v-if="category.id === 'overview'" class="essential-badge">
              必要
            </div>
          </div>
        </div>

        <div class="dropdown-footer">
          <div class="visibility-summary">
            显示 {{ visibleCount }}/{{ totalCount }} 个类别
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
import { useStatsVisibility, STAT_CATEGORIES, type StatCategoryId } from '../composables/useStatsVisibility'

const {
  visibility,
  isVisible,
  toggleVisibility,
  showAll,
  hideAll,
  reset,
  visibleCount,
  totalCount
} = useStatsVisibility()

const isOpen = ref(false)

// Stat categories
const statCategories = computed(() => STAT_CATEGORIES)

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
.stats-visibility-selector {
  position: relative;
  display: inline-block;
}

.visibility-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.visibility-toggle-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.visibility-toggle-btn.active {
  background: rgba(71, 85, 105, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.visibility-icon {
  font-size: 13px;
}

.visibility-label {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 9px;
  transition: transform 0.2s ease;
  color: #94a3b8;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown */
.visibility-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  padding: 12px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-action-btn {
  padding: 3px 8px;
  font-size: 10px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-action-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.header-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Category List */
.category-list {
  padding: 6px;
  overflow-y: auto;
  max-height: 300px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.category-item:hover:not(.disabled) {
  background: rgba(51, 65, 85, 0.5);
}

.category-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.category-checkbox {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.category-checkbox input[type="checkbox"] {
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
  width: 16px;
  height: 16px;
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 4px;
  background: rgba(30, 41, 59, 0.6);
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-custom.checked {
  background: rgba(59, 130, 246, 0.8);
  border-color: rgba(59, 130, 246, 0.8);
}

.checkbox-custom.checked::after {
  content: '✓';
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.checkbox-custom:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.category-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.category-text {
  flex: 1;
  min-width: 0;
}

.category-label {
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
}

.category-description {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 1px;
}

.essential-badge {
  font-size: 9px;
  padding: 2px 5px;
  background: rgba(59, 130, 246, 0.8);
  color: white;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}

/* Footer */
.dropdown-footer {
  padding: 8px 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0 0 8px 8px;
}

.visibility-summary {
  font-size: 10px;
  color: #94a3b8;
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

/* Scrollbar */
.category-list::-webkit-scrollbar {
  width: 4px;
}

.category-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.category-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
