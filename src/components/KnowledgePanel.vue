<template>
  <div class="knowledge-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>知识库</h3>
      <button class="icon-btn" @click="refreshKnowledge" title="刷新">
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
      <button class="btn-small" @click="refreshKnowledge">重试</button>
    </div>

    <!-- Empty -->
    <div v-else-if="knowledgeList.length === 0" class="empty-state">
      <div class="empty-icon">📖</div>
      <div class="empty-text">暂无知识记录</div>
    </div>

    <!-- Knowledge List -->
    <div v-else class="knowledge-list">
      <div
        v-for="item in knowledgeList"
        :key="item.id"
        class="knowledge-card"
      >
        <div class="knowledge-header">
          <span :class="['knowledge-type', item.type]">{{ typeLabels[item.type] || item.type }}</span>
          <div class="knowledge-actions">
            <span :class="['verified-badge', { verified: item.verified }]">
              {{ item.verified ? '✓ 已验证' : '未验证' }}
            </span>
            <button
              v-if="!item.verified"
              class="verify-btn"
              @click="verifyKnowledge(item.id)"
              title="验证知识"
            >
              ✓
            </button>
          </div>
        </div>
        <div class="knowledge-content">{{ item.content }}</div>
        <div class="knowledge-meta">
          <span class="confidence" title="置信度">
            可信度: {{ Math.round(item.confidence * 100) }}%
          </span>
          <span class="source">{{ item.sourceType }}</span>
          <span class="date">{{ formatDate(item.createdAt) }}</span>
        </div>
        <div v-if="item.sourceDetails" class="source-details">
          来源: {{ item.sourceDetails }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import type { KnowledgeDTO } from '../../shared/types'

interface Props {
  memoryId: string
}

const props = defineProps<Props>()

const knowledgeList = ref<KnowledgeDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const typeLabels: Record<string, string> = {
  fact: '事实',
  concept: '概念',
  procedure: '流程',
  rule: '规则',
  pattern: '模式',
  other: '其他',
}

const loadKnowledge = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await memoryApiClient.getKnowledge(props.memoryId)
    if (response.success && response.data) {
      knowledgeList.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const refreshKnowledge = () => {
  loadKnowledge()
}

const verifyKnowledge = async (id: number) => {
  try {
    await memoryApiClient.verifyKnowledge(id)
    // 刷新列表
    await loadKnowledge()
  } catch (e) {
    console.error('验证失败:', e)
  }
}

const formatDate = (timestamp: string): string => {
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
  loadKnowledge()
})
</script>

<style scoped>
.knowledge-panel {
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

.knowledge-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.knowledge-type {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.knowledge-type.fact { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.knowledge-type.concept { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.knowledge-type.procedure { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.knowledge-type.rule { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.knowledge-type.pattern { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
.knowledge-type.other { background: rgba(100, 116, 139, 0.2); color: #64748b; }

.knowledge-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.verified-badge {
  font-size: 10px;
  color: #64748b;
}

.verified-badge.verified {
  color: #22c55e;
}

.verify-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.verify-btn:hover {
  background: rgba(34, 197, 94, 0.4);
}

.knowledge-content {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 8px;
  line-height: 1.5;
}

.knowledge-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.confidence,
.source,
.date {
  font-size: 11px;
  color: #64748b;
}

.source-details {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  font-style: italic;
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
