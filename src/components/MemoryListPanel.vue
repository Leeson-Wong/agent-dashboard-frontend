<template>
  <div class="memory-list-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2>Memory 管理</h2>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <span class="stat">总数: {{ stats.total }}</span>
      <span class="stat active">活跃: {{ stats.active }}</span>
      <span class="stat inactive">离线: {{ stats.inactive }}</span>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        :class="['tab', { active: filter === 'all' }]"
        @click="filter = 'all'"
      >
        全部
      </button>
      <button
        :class="['tab', { active: filter === 'active' }]"
        @click="filter = 'active'"
      >
        活跃
      </button>
      <button
        :class="['tab', { active: filter === 'inactive' }]"
        @click="filter = 'inactive'"
      >
        离线
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <div>加载中...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button class="btn-small" @click="loadMemories">重试</button>
    </div>

    <!-- Memory List -->
    <div v-else class="memory-list">
      <div
        v-for="memory in filteredMemories"
        :key="memory.memoryId"
        :class="['memory-item', { active: memory.memoryId === selectedId }]"
        @click="$emit('select-memory', memory.memoryId)"
      >
        <div class="memory-header">
          <span class="memory-name">{{ memory.name || '未命名' }}</span>
          <span :class="['status-badge', memory.status]">
            {{ statusLabels[memory.status] || memory.status }}
          </span>
        </div>
        <div class="memory-info">
          <span class="memory-id">{{ memory.memoryId.slice(0, 12) }}...</span>
          <span v-if="memory.role" class="memory-role">{{ memory.role }}</span>
        </div>
        <div v-if="memory.goal" class="memory-goal">{{ memory.goal }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import type { Memory } from '../../shared/types'

interface Props {
  selectedId?: string | null
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  selectMemory: [memoryId: string]
}>()

const memories = ref<Memory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filter = ref<'all' | 'active' | 'inactive'>('all')

const stats = computed(() => {
  return {
    total: memories.value.length,
    active: memories.value.filter(m => m.status === 'active').length,
    inactive: memories.value.filter(m => m.status === 'inactive').length,
  }
})

const filteredMemories = computed(() => {
  if (filter.value === 'all') return memories.value
  return memories.value.filter(m => m.status === filter.value)
})

const statusLabels: Record<string, string> = {
  active: '活跃',
  inactive: '离线',
  archived: '归档',
}

const loadMemories = async () => {
  loading.value = true
  error.value = null

  try {
    memories.value = await memoryApiClient.getAllMemories()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMemories()
})
</script>

<style scoped>
.memory-list-panel {
  width: 320px;
  height: 100%;
  background: rgba(15, 23, 42, 0.95);
  border-right: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.stats-bar {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(30, 41, 59, 0.4);
}

.stat {
  font-size: 12px;
  color: #64748b;
}

.stat.active {
  color: #22c55e;
}

.stat.inactive {
  color: #64748b;
}

.filter-tabs {
  display: flex;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #94a3b8;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.memory-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.memory-item {
  padding: 12px;
  margin-bottom: 4px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.memory-item:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(100, 116, 139, 0.3);
}

.memory-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.memory-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.inactive {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.status-badge.archived {
  background: rgba(100, 116, 139, 0.2);
  color: #64748b;
}

.memory-info {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.memory-id {
  font-size: 10px;
  color: #64748b;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.memory-role {
  font-size: 10px;
  color: #94a3b8;
}

.memory-goal {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(100, 116, 139, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.error-message {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.8);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  background: rgba(59, 130, 246, 1);
}
</style>
