<template>
  <div class="sort-selector">
    <button
      class="sort-btn"
      @click="toggleDropdown"
      :class="{ active: isOpen }"
      title="排序选项"
    >
      <span class="sort-icon">🔀</span>
      <span class="sort-label">{{ currentSortLabel }}</span>
      <span class="sort-arrow">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <!-- Dropdown menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="sort-dropdown" @click.self="closeDropdown">
        <div class="sort-dropdown-content">
          <!-- Sort fields -->
          <div class="sort-section">
            <div class="sort-section-title">排序字段</div>
            <div
              v-for="field in sortFields"
              :key="field.value"
              class="sort-option"
              :class="{ active: sortField === field.value }"
              @click="selectField(field.value)"
            >
              <span class="sort-option-icon">{{ field.icon }}</span>
              <span class="sort-option-label">{{ field.label }}</span>
            </div>
          </div>

          <!-- Sort order -->
          <div class="sort-section">
            <div class="sort-section-title">排序顺序</div>
            <div
              class="sort-option"
              :class="{ active: sortOrder === 'asc' }"
              @click="selectOrder('asc')"
            >
              <span class="sort-option-icon">↑</span>
              <span class="sort-option-label">升序 (A-Z)</span>
            </div>
            <div
              class="sort-option"
              :class="{ active: sortOrder === 'desc' }"
              @click="selectOrder('desc')"
            >
              <span class="sort-option-icon">↓</span>
              <span class="sort-option-label">降序 (Z-A)</span>
            </div>
          </div>

          <!-- Reset button -->
          <div class="sort-footer">
            <button class="reset-btn" @click="reset">
              🔄 重置排序
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click outside to close -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="click-outside"
        @click="closeDropdown"
      ></div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAgentSort, type SortField, type SortOrder } from '../composables/useAgentSort'

const {
  sortField,
  sortOrder,
  sortOption,
  sortFields,
  setSortField,
  setSortOrder,
  resetSort
} = useAgentSort()

// UI state
const isOpen = ref(false)

// Computed
const currentSortLabel = computed(() => {
  const field = sortFields.value.find(f => f.value === sortField.value)
  return `${field?.label || sortField.value} ${sortOrder.value === 'asc' ? '↑' : '↓'}`
})

// Methods
const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (): void => {
  isOpen.value = false
}

const selectField = (field: SortField): void => {
  setSortField(field)
  closeDropdown()
}

const selectOrder = (order: SortOrder): void => {
  setSortOrder(order)
}

const reset = (): void => {
  resetSort()
  closeDropdown()
}

// Handle click outside
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  if (!target.closest('.sort-selector')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose
defineExpose({
  sortField,
  sortOrder,
  sortOption
})
</script>

<style scoped>
.sort-selector {
  position: relative;
  display: inline-block;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.sort-btn.active {
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.sort-icon {
  font-size: 14px;
}

.sort-label {
  flex: 1;
  text-align: left;
}

.sort-arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

/* Dropdown */
.sort-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 200px;
}

.sort-dropdown-content {
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.sort-section {
  padding: 8px 0;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.sort-section:last-child {
  border-bottom: none;
}

.sort-section-title {
  padding: 4px 12px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-option:hover {
  background: rgba(51, 65, 85, 0.5);
}

.sort-option.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.sort-option-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.sort-option-label {
  font-size: 13px;
  color: #e2e8f0;
}

.sort-footer {
  padding: 8px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.reset-btn {
  width: 100%;
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

/* Click outside overlay */
.click-outside {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 640px) {
  .sort-dropdown {
    right: auto;
    left: 0;
    min-width: 180px;
  }
}
</style>
