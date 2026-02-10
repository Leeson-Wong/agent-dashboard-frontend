<template>
  <div class="tag-filter-panel" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button
      class="filter-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开标签过滤' : '收起标签过滤'"
    >
      <span class="toggle-icon">🏷️</span>
      <span v-if="isCollapsed" class="toggle-count">{{ selectedCount }}</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="filter-container">
        <!-- Header -->
        <div class="filter-header">
          <span class="filter-title">标签过滤</span>
          <button
            v-if="isFilterActive"
            class="clear-btn"
            @click="handleClearFilters"
            title="清除所有过滤"
          >
            清除 ({{ selectedCount }})
          </button>
        </div>

        <!-- Tags List -->
        <div v-if="allTags.length > 0" class="tags-list">
          <div
            v-for="item in allTags"
            :key="item.tag"
            :class="['tag-item', `color-${item.color}`, { 'is-selected': isTagSelected(item.tag) }]"
            @click="handleTagClick(item.tag)"
          >
            <span class="tag-name">{{ item.tag }}</span>
            <span class="tag-count">{{ item.count }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">🏷️</span>
          <span class="empty-text">暂无标签</span>
          <span class="empty-hint">给 Agent 添加标签后即可在此过滤</span>
        </div>

        <!-- Selected Tags Summary -->
        <div v-if="isFilterActive" class="selected-summary">
          <span class="summary-text">已选: </span>
          <span
            v-for="tag in selectedTagsArray"
            :key="tag"
            class="selected-tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useTagFilter, type TagWithCount } from '../composables/useTagFilter'

interface Props {
  agents?: Array<{ tags?: string }>
  selectedTags?: Set<string>
  allTags?: TagWithCount[]
  selectedCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  agents: () => [],
  selectedTags: () => new Set(),
  allTags: () => [],
  selectedCount: 0
})

const emit = defineEmits<{
  toggleTag: [tag: string]
  clearFilters: []
}>()

// Local tag filter for internal use (to get color, etc.)
const { getTagColor } = useTagFilter()

// UI state
const isCollapsed = ref(false)

// Check if filter is active
const isFilterActive = computed(() => props.selectedCount > 0)

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Check if tag is selected
const isTagSelected = (tag: string): boolean => {
  return props.selectedTags.has(tag)
}

// Get selected tags as array
const selectedTagsArray = computed(() => {
  return Array.from(props.selectedTags)
})

// Handle tag click
const handleTagClick = (tag: string): void => {
  emit('toggleTag', tag)
}

// Handle clear filters
const handleClearFilters = (): void => {
  emit('clearFilters')
}

// Expose methods
defineExpose({
  toggleCollapsed,
  clearFilters: handleClearFilters
})
</script>

<style scoped>
.tag-filter-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 850;
  font-size: 12px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 16px;
}

.toggle-count {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #60a5fa;
}

.filter-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 220px;
  max-width: 320px;
  overflow: hidden;
  margin-top: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.filter-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.clear-btn {
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  color: #f87171;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

.tags-list {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.tags-list::-webkit-scrollbar {
  width: 6px;
}

.tags-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.tags-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.tags-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
}

.tag-item:hover {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(100, 116, 139, 0.4);
}

.tag-item.is-selected {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

/* Tag colors */
.tag-item.color-blue.is-selected {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.tag-item.color-green.is-selected {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
}

.tag-item.color-purple.is-selected {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.4);
}

.tag-item.color-orange.is-selected {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.4);
}

.tag-item.color-pink.is-selected {
  background: rgba(236, 72, 153, 0.2);
  border-color: rgba(236, 72, 153, 0.4);
}

.tag-item.color-cyan.is-selected {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.4);
}

.tag-item.color-red.is-selected {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.tag-item.color-yellow.is-selected {
  background: rgba(234, 179, 8, 0.2);
  border-color: rgba(234, 179, 8, 0.4);
}

.tag-name {
  color: #e2e8f0;
  font-weight: 500;
}

.tag-count {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 10px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.2);
  padding: 1px 4px;
  border-radius: 3px;
}

.empty-state {
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.empty-hint {
  font-size: 11px;
  color: #475569;
  line-height: 1.4;
}

.selected-summary {
  padding: 10px 14px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.summary-text {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.selected-tag {
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  color: #60a5fa;
  font-size: 10px;
  font-weight: 500;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .tag-filter-panel {
    bottom: 140px;
    right: 10px;
    left: 10px;
  }

  .filter-container {
    max-width: none;
  }

  .tags-list {
    max-height: 200px;
  }
}
</style>
