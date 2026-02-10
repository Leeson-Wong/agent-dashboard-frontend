<template>
  <div class="patch-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>时间补丁</h3>
      <button class="icon-btn" @click="refreshPatches" title="刷新">
        🔄
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
      <button class="btn-small" @click="refreshPatches">重试</button>
    </div>

    <!-- Empty -->
    <div v-else-if="patches.length === 0" class="empty-state">
      <div class="empty-icon">🔧</div>
      <div class="empty-text">暂无时间补丁</div>
    </div>

    <!-- Patches List -->
    <div v-else>
      <div class="patches-list">
        <div
          v-for="patch in patches"
          :key="patch.patchId"
          :class="['patch-card', { applied: patch.applied }]"
        >
          <div class="patch-header">
            <span :class="['patch-type', patch.type]">{{ typeLabels[patch.type] || patch.type }}</span>
            <div class="patch-status">
              <span v-if="patch.applied" class="applied-badge">✓ 已应用</span>
              <span v-else class="pending-badge">待应用</span>
            </div>
          </div>
          <div class="patch-description">{{ patch.description }}</div>
          <div class="patch-meta">
            <span class="patch-date">事件日期: {{ formatDate(patch.eventDate) }}</span>
            <span class="confidence" title="置信度">
              可信度: {{ Math.round(patch.confidence * 100) }}%
            </span>
          </div>
          <div v-if="patch.affectedDomains && patch.affectedDomains.length > 0" class="affected-domains">
            <span class="domains-label">影响范围:</span>
            <span v-for="domain in patch.affectedDomains" :key="domain" class="domain-tag">
              {{ domainLabels[domain] || domain }}
            </span>
          </div>
          <div class="patch-footer">
            <span class="patch-source">{{ patch.sourceType }} - {{ patch.providedBy }}</span>
            <span class="patch-created">{{ formatCreatedDate(patch.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Apply Button -->
      <div class="apply-section">
        <button
          class="apply-btn"
          :disabled="applying || allApplied"
          @click="applyPatches"
        >
          {{ applying ? '应用中...' : allApplied ? '已全部应用' : '应用所有补丁' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import type { PatchDTO } from '../../shared/types'

interface Props {
  memoryId: string
}

const props = defineProps<Props>()

const patches = ref<PatchDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const applying = ref(false)

const allApplied = computed(() => {
  return patches.value.length > 0 && patches.value.every(p => p.applied)
})

const typeLabels: Record<string, string> = {
  knowledge_update: '知识更新',
  behavior_change: '行为变更',
  rule_modification: '规则修正',
  context_adjustment: '上下文调整',
  capability_upgrade: '能力升级',
  other: '其他',
}

const domainLabels: Record<string, string> = {
  reasoning: '推理',
  planning: '规划',
  execution: '执行',
  communication: '沟通',
  learning: '学习',
  decision: '决策',
}

const loadPatches = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await memoryApiClient.getPatches(props.memoryId)
    if (response.success && response.data) {
      patches.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const refreshPatches = () => {
  loadPatches()
}

const applyPatches = async () => {
  applying.value = true
  try {
    const sessionId = `session_${Date.now()}`
    await memoryApiClient.applyPatches(props.memoryId, sessionId)
    // 刷新列表
    await loadPatches()
  } catch (e) {
    console.error('应用补丁失败:', e)
  } finally {
    applying.value = false
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const formatCreatedDate = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadPatches()
})
</script>

<style scoped>
.patch-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(71, 85, 105, 0.8);
}

.patches-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patch-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  transition: all 0.2s;
}

.patch-card.applied {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(34, 197, 94, 0.3);
  opacity: 0.8;
}

.patch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.patch-type {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.patch-type.knowledge_update { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.patch-type.behavior_change { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
.patch-type.rule_modification { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.patch-type.context_adjustment { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.patch-type.capability_upgrade { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.patch-type.other { background: rgba(100, 116, 139, 0.2); color: #64748b; }

.patch-status {
  display: flex;
  align-items: center;
}

.applied-badge {
  font-size: 10px;
  color: #22c55e;
}

.pending-badge {
  font-size: 10px;
  color: #f59e0b;
}

.patch-description {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 8px;
  line-height: 1.4;
}

.patch-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.patch-date,
.confidence {
  font-size: 11px;
  color: #64748b;
}

.affected-domains {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.domains-label {
  font-size: 11px;
  color: #64748b;
}

.domain-tag {
  padding: 2px 8px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  font-size: 10px;
  color: #94a3b8;
}

.patch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #64748b;
}

.apply-section {
  padding: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.apply-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.8);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 1);
}

.apply-btn:disabled {
  background: rgba(100, 116, 139, 0.3);
  color: #64748b;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
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

.error-icon,
.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.error-message,
.empty-text {
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
