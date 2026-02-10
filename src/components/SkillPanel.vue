<template>
  <div class="skill-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>技能管理</h3>
      <button class="icon-btn" @click="refreshSkills" title="刷新">
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
      <button class="btn-small" @click="refreshSkills">重试</button>
    </div>

    <!-- Empty -->
    <div v-else-if="skills.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <div class="empty-text">暂无技能记录</div>
    </div>

    <!-- Top Skills -->
    <div v-else>
      <div class="section-title">最熟练技能</div>
      <div class="top-skills">
        <div
          v-for="skill in topSkills"
          :key="skill.id"
          class="top-skill-card"
        >
          <div class="skill-header">
            <span class="skill-name">{{ skill.skillName }}</span>
            <span :class="['proficiency-badge', getProficiencyLevel(skill.proficiencyLevel)]">
              {{ getProficiencyLabel(skill.proficiencyLevel) }}
            </span>
          </div>
          <div class="skill-bar-container">
            <div class="skill-bar">
              <div
                class="skill-bar-fill"
                :style="{ width: `${skill.proficiencyLevel * 20}%` }"
              ></div>
            </div>
            <span class="skill-percent">{{ Math.round(skill.proficiencyLevel * 20) }}%</span>
          </div>
          <div class="skill-meta">
            <span class="skill-category">{{ skill.category }}</span>
            <span class="skill-practice">练习 {{ formatPracticeTime(skill.totalPracticeTime) }}</span>
          </div>
        </div>
      </div>

      <div class="section-title">所有技能</div>
      <div class="skill-list">
        <div
          v-for="skill in skills"
          :key="skill.id"
          class="skill-item"
        >
          <div class="skill-info">
            <div class="skill-name-row">
              <span class="skill-name">{{ skill.skillName }}</span>
              <span class="skill-level">{{ skill.proficiencyLevel.toFixed(1) }}/5</span>
            </div>
            <div class="skill-bar">
              <div
                class="skill-bar-fill"
                :style="{ width: `${skill.proficiencyLevel * 20}%` }"
              ></div>
            </div>
          </div>
          <div class="skill-meta">
            <span class="skill-category">{{ skill.category }}</span>
            <span class="skill-date">{{ formatDate(skill.lastPracticedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import type { SkillDTO } from '../../shared/types'

interface Props {
  memoryId: string
}

const props = defineProps<Props>()

const skills = ref<SkillDTO[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const topSkills = computed(() => {
  return [...skills.value]
    .sort((a, b) => b.proficiencyLevel - a.proficiencyLevel)
    .slice(0, 5)
})

const loadSkills = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await memoryApiClient.getSkills(props.memoryId)
    if (response.success && response.data) {
      skills.value = response.data
    } else {
      error.value = response.error || '加载失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const refreshSkills = () => {
  loadSkills()
}

const getProficiencyLevel = (level: number): string => {
  if (level >= 4.5) return 'expert'
  if (level >= 3.5) return 'advanced'
  if (level >= 2.5) return 'intermediate'
  if (level >= 1.5) return 'beginner'
  return 'novice'
}

const getProficiencyLabel = (level: number): string => {
  const l = getProficiencyLevel(level)
  const labels: Record<string, string> = {
    expert: '专家',
    advanced: '高级',
    intermediate: '中级',
    beginner: '初级',
    novice: '新手',
  }
  return labels[l] || '未知'
}

const formatPracticeTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}小时`
  return `${Math.round(seconds / 86400)}天`
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
  loadSkills()
})
</script>

<style scoped>
.skill-panel {
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

.section-title {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.top-skills {
  padding: 0 12px 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.top-skill-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skill-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.proficiency-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.proficiency-badge.expert { background: rgba(234, 179, 8, 0.2); color: #eab308; }
.proficiency-badge.advanced { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.proficiency-badge.intermediate { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.proficiency-badge.beginner { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.proficiency-badge.novice { background: rgba(100, 116, 139, 0.2); color: #64748b; }

.skill-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skill-bar {
  flex: 1;
  height: 6px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.skill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.skill-percent {
  font-size: 10px;
  color: #64748b;
  min-width: 35px;
  text-align: right;
}

.skill-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.skill-category {
  color: #64748b;
}

.skill-practice {
  color: #94a3b8;
}

.skill-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.15);
  border-radius: 6px;
}

.skill-info {
  margin-bottom: 6px;
}

.skill-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.skill-name {
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
}

.skill-level {
  font-size: 11px;
  color: #64748b;
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
