<template>
  <div class="experience-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>经验管理</h3>
      <button class="icon-btn" @click="refreshExperiences" title="刷新">
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
      <button class="btn-small" @click="refreshExperiences">重试</button>
    </div>

    <!-- Empty -->
    <div v-else-if="experiences.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <div class="empty-text">暂无经验记录</div>
    </div>

    <!-- Experience List -->
    <div v-else class="experience-list">
      <div
        v-for="exp in experiences"
        :key="exp.experienceId"
        class="experience-card"
      >
        <div class="exp-header">
          <span class="exp-type">{{ exp.taskType }}</span>
          <span :class="['exp-badge', exp.type]">{{ exp.type }}</span>
        </div>
        <div class="exp-description">{{ exp.taskDescription }}</div>
        <div class="exp-details">
          <span class="exp-complexity" title="复杂度">
            难度: {{ '█'.repeat(Math.round(exp.taskComplexity)) }}{{ '░'.repeat(5 - Math.round(exp.taskComplexity)) }}
          </span>
          <span class="exp-date">{{ formatDate(exp.createdAt) }}</span>
        </div>
        <div v-if="exp.approach" class="exp-section">
          <span class="exp-label">方法:</span>
          <span class="exp-text">{{ exp.approach }}</span>
        </div>
        <div v-if="exp.learning" class="exp-section">
          <span class="exp-label">学习:</span>
          <span class="exp-text">{{ exp.learning }}</span>
        </div>
        <div v-if="exp.outcome" class="exp-section">
          <span class="exp-label">结果:</span>
          <span class="exp-text">{{ exp.outcome }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import type { ExperienceDTO } from '../../shared/types'

interface Props {
  memoryId: string
}

const props = defineProps<Props>()

const experiences = ref<ExperienceDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const loadExperiences = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await memoryApiClient.getExperiences(props.memoryId)
    if (response.success && response.data) {
      experiences.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const refreshExperiences = () => {
  loadExperiences()
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
  loadExperiences()
})
</script>

<style scoped>
.experience-panel {
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

.experience-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.experience-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exp-type {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.exp-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.exp-badge.success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.exp-badge.failure {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.exp-badge.partial {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.exp-description {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 8px;
  line-height: 1.4;
}

.exp-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exp-complexity {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 1px;
}

.exp-date {
  font-size: 11px;
  color: #64748b;
}

.exp-section {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.exp-label {
  font-size: 11px;
  color: #64748b;
  flex-shrink: 0;
}

.exp-text {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
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
