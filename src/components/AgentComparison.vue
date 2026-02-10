<template>
  <Transition name="modal">
    <div v-if="isOpen && (agentA || agentB)" class="comparison-overlay" @click="close">
      <div class="comparison-container" @click.stop>
        <div class="comparison-header">
          <h2 class="comparison-title">Agent 对比</h2>
          <div class="header-stats">
            <span v-if="similarityPercentage >= 0" class="similarity-badge" :class="getSimilarityClass()">
              相似度: {{ similarityPercentage }}%
            </span>
            <span v-if="differenceCount > 0" class="difference-count">
              {{ differenceCount }} 项差异
            </span>
          </div>
          <button class="close-btn" @click="close" title="关闭">
            ×
          </button>
        </div>

        <div class="comparison-content">
          <!-- Agent Selection -->
          <div class="selection-bar">
            <div class="selection-side">
              <span class="selection-label">Agent A:</span>
              <span v-if="agentA" class="selection-name">{{ agentA.role || agentA.agentId }}</span>
              <span v-else class="selection-empty">未选择</span>
            </div>
            <div class="selection-divider">
              <span class="vs-badge">VS</span>
            </div>
            <div class="selection-side">
              <span class="selection-label">Agent B:</span>
              <span v-if="agentB" class="selection-name">{{ agentB.role || agentB.agentId }}</span>
              <span v-else class="selection-empty">未选择</span>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button
              class="tab-btn"
              :class="{ active: viewMode === 'all' }"
              @click="viewMode = 'all'"
            >
              全部 ({{ comparisonItems.length }})
            </button>
            <button
              class="tab-btn"
              :class="{ active: viewMode === 'differences' }"
              @click="viewMode = 'differences'"
            >
              仅差异 ({{ differenceCount }})
            </button>
          </div>

          <!-- Comparison Table -->
          <div class="comparison-table-wrapper">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="col-label">属性</th>
                  <th class="col-value">
                    <span v-if="agentA">{{ agentA.role || agentA.agentId }}</span>
                  </th>
                  <th class="col-divider"></th>
                  <th class="col-value">
                    <span v-if="agentB">{{ agentB.role || agentB.agentId }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in displayItems"
                  :key="item.key"
                  :class="{ 'is-different': item.different }"
                >
                  <td class="col-label">
                    {{ item.label }}
                  </td>
                  <td class="col-value">
                    <span
                      class="value-text"
                      :style="getValueStyle(item.valueA, item.type)"
                      v-html="formatValue(item.valueA, item.type)"
                    ></span>
                  </td>
                  <td class="col-divider">
                    <span v-if="item.different" class="diff-indicator" title="不同">≠</span>
                    <span v-else class="same-indicator" title="相同">=</span>
                  </td>
                  <td class="col-value">
                    <span
                      class="value-text"
                      :style="getValueStyle(item.valueB, item.type)"
                      v-html="formatValue(item.valueB, item.type)"
                    ></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-if="displayItems.length === 0" class="comparison-empty">
            <span class="empty-icon">📊</span>
            <span class="empty-text">
              {{ viewMode === 'differences' ? '两个 Agent 完全相同' : '请选择两个 Agent 进行对比' }}
            </span>
          </div>
        </div>

        <div class="comparison-footer">
          <button class="footer-btn secondary" @click="close">
            关闭
          </button>
          <button v-if="differenceCount > 0" class="footer-btn primary" @click="exportComparison">
            导出对比报告
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useAgentComparison
} from '../composables/useAgentComparison'
import type { AgentState } from '../../shared/types'

interface Props {
  isOpen: boolean
  agentA?: AgentState | null
  agentB?: AgentState | null
}

const props = withDefaults(defineProps<Props>(), {
  agentA: null,
  agentB: null
})

const emit = defineEmits<{
  close: []
}>()

// View mode: 'all' or 'differences'
const viewMode = ref<'all' | 'differences'>('all')

// Comparison
const {
  agentA: compAgentA,
  agentB: compAgentB,
  comparisonItems,
  differences,
  differenceCount,
  similarityPercentage,
  setAgents,
  clearComparison,
  formatValue,
  getValueStyle
} = useAgentComparison()

// Update agents when props change
const agentA = computed(() => props.agentA || compAgentA.value)
const agentB = computed(() => props.agentB || compAgentB.value)

// Display items based on view mode
const displayItems = computed(() => {
  return viewMode.value === 'all' ? comparisonItems.value : differences.value
})

// Close modal
const close = (): void => {
  emit('close')
}

// Get similarity class
const getSimilarityClass = (): string => {
  const pct = similarityPercentage.value
  if (pct >= 80) return 'high'
  if (pct >= 50) return 'medium'
  return 'low'
}

// Export comparison
const exportComparison = (): void => {
  const report = {
    timestamp: new Date().toISOString(),
    agentA: agentA.value?.agentId,
    agentB: agentB.value?.agentId,
    similarityPercentage: similarityPercentage.value,
    differenceCount: differenceCount.value,
    differences: differences.value.map(item => ({
      property: item.label,
      valueA: item.valueA,
      valueB: item.valueB
    }))
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `agent-comparison-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.comparison-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.comparison-container {
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 1000px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.comparison-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.similarity-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.similarity-badge.high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.similarity-badge.medium {
  background: rgba(251, 191, 36, 0.2);
  color: #f59e0b;
}

.similarity-badge.low {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.difference-count {
  font-size: 12px;
  color: #94a3b8;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.comparison-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  margin-bottom: 16px;
}

.selection-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.selection-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selection-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.selection-empty {
  font-size: 13px;
  color: #64748b;
  font-style: italic;
}

.selection-divider {
  padding: 0 20px;
}

.vs-badge {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(100, 116, 139, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.5);
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.comparison-table-wrapper {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.comparison-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(15, 23, 42, 0.3);
}

.comparison-table tbody tr {
  transition: background 0.2s;
}

.comparison-table tbody tr:hover {
  background: rgba(100, 116, 139, 0.05);
}

.comparison-table tbody tr.is-different {
  background: rgba(251, 191, 36, 0.05);
}

.comparison-table tbody tr.is-different:hover {
  background: rgba(251, 191, 36, 0.1);
}

.col-label {
  width: 150px;
  font-weight: 500;
  color: #cbd5e1;
}

.col-value {
  width: calc(50% - 75px);
}

.col-divider {
  width: 50px;
  text-align: center;
}

.value-text {
  font-size: 13px;
  color: #e2e8f0;
  word-break: break-word;
}

.diff-indicator {
  font-size: 16px;
  color: #f59e0b;
  font-weight: bold;
}

.same-indicator {
  font-size: 16px;
  color: #22c55e;
  opacity: 0.5;
}

.comparison-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.comparison-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.footer-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn.secondary {
  background: transparent;
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.footer-btn.secondary:hover {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.5);
}

.footer-btn.primary {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.footer-btn.primary:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .comparison-container,
.modal-leave-active .comparison-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .comparison-container,
.modal-leave-to .comparison-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Scrollbar styling */
.comparison-content::-webkit-scrollbar {
  width: 8px;
}

.comparison-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.comparison-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.comparison-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
