<template>
  <div class="memory-detail-panel">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <div>加载中...</div>
    </div>

    <!-- Empty -->
    <div v-else-if="!memory" class="empty-state">
      <div class="empty-icon">🧠</div>
      <div class="empty-text">选择一个 Memory 查看详情</div>
    </div>

    <!-- Content -->
    <div v-else class="panel-content">
      <!-- Header -->
      <div class="panel-header">
        <div class="memory-title">
          <h2>{{ memory.name || '未命名 Memory' }}</h2>
          <span :class="['status-badge', memory.status]">
            {{ statusLabels[memory.status] || memory.status }}
          </span>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Core Identity Tab -->
        <div v-if="activeTab === 'identity'" class="identity-tab">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Memory ID</div>
              <div class="value monospace">{{ memory.memoryId }}</div>
            </div>
            <div class="info-card">
              <div class="label">类型</div>
              <div class="value">{{ memory.type || '-' }}</div>
            </div>
            <div class="info-card">
              <div class="label">版本</div>
              <div class="value">v{{ memory.version || 1 }}</div>
            </div>
            <div class="info-card">
              <div class="label">交互次数</div>
              <div class="value">{{ memory.totalInteractions || 0 }}</div>
            </div>
          </div>

          <!-- Role & Goal -->
          <div v-if="memory.role" class="section">
            <h3>角色</h3>
            <div class="content-box">{{ memory.role }}</div>
          </div>

          <div v-if="memory.goal" class="section">
            <h3>目标</h3>
            <div class="content-box">{{ memory.goal }}</div>
          </div>

          <div v-if="memory.backstory" class="section">
            <h3>背景故事</h3>
            <div class="content-box">{{ memory.backstory }}</div>
          </div>

          <!-- Persona JSON Display -->
          <div v-if="memory.personaJson" class="section">
            <h3>Persona (JSON)</h3>
            <div class="json-box">{{ formatJson(memory.personaJson) }}</div>
          </div>

          <!-- Timeline -->
          <div class="section">
            <h3>时间线</h3>
            <div class="timeline">
              <div v-if="memory.lastActivatedAt" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-label">最后激活</div>
                  <div class="timeline-time">{{ formatDateTime(memory.lastActivatedAt) }}</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-label">创建时间</div>
                  <div class="timeline-time">{{ formatDateTime(memory.createdAt) }}</div>
                </div>
              </div>
              <div v-if="memory.updatedAt !== memory.createdAt" class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-label">更新时间</div>
                  <div class="timeline-time">{{ formatDateTime(memory.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Experiences Tab -->
        <div v-if="activeTab === 'experiences'" class="experiences-tab">
          <ExperiencePanel :memory-id="memory.memoryId" />
        </div>

        <!-- Knowledge Tab -->
        <div v-if="activeTab === 'knowledge'" class="knowledge-tab">
          <KnowledgePanel :memory-id="memory.memoryId" />
        </div>

        <!-- Skills Tab -->
        <div v-if="activeTab === 'skills'" class="skills-tab">
          <SkillPanel :memory-id="memory.memoryId" />
        </div>

        <!-- Patches Tab -->
        <div v-if="activeTab === 'patches'" class="patches-tab">
          <PatchPanel :memory-id="memory.memoryId" />
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button
          v-if="memory.status === 'inactive'"
          class="action-btn primary"
          @click="toggleStatus"
        >
          激活
        </button>
        <button
          v-if="memory.status === 'active'"
          class="action-btn"
          @click="toggleStatus"
        >
          停用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { memoryApiClient } from '../api/MemoryApiClient'
import ExperiencePanel from './ExperiencePanel.vue'
import KnowledgePanel from './KnowledgePanel.vue'
import SkillPanel from './SkillPanel.vue'
import PatchPanel from './PatchPanel.vue'
import type { Memory } from '../../shared/types'

interface Props {
  memoryId: string | null
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

const memory = ref<Memory | null>(null)
const loading = ref(false)
const activeTab = ref<'identity' | 'experiences' | 'knowledge' | 'skills' | 'patches'>('identity')

const tabs = [
  { key: 'identity', label: '核心身份' },
  { key: 'experiences', label: '经验' },
  { key: 'knowledge', label: '知识' },
  { key: 'skills', label: '技能' },
  { key: 'patches', label: '时间补丁' },
]

const statusLabels: Record<string, string> = {
  active: '活跃',
  inactive: '离线',
  archived: '归档',
}

const loadMemory = async () => {
  if (!props.memoryId) {
    memory.value = null
    return
  }

  loading.value = true
  try {
    memory.value = await memoryApiClient.getMemory(props.memoryId)
  } catch (e) {
    console.error('加载 Memory 失败:', e)
    memory.value = null
  } finally {
    loading.value = false
  }
}

const toggleStatus = async () => {
  if (!memory.value) return

  try {
    if (memory.value.status === 'active') {
      await memoryApiClient.deactivateMemory(memory.value.memoryId)
    } else {
      await memoryApiClient.activateMemory(memory.value.memoryId)
    }
    // 重新加载
    await loadMemory()
  } catch (e) {
    console.error('切换状态失败:', e)
  }
}

const formatJson = (jsonStr: string): string => {
  try {
    const parsed = JSON.parse(jsonStr)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return jsonStr
  }
}

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

watch(() => props.memoryId, loadMemory)

onMounted(() => {
  loadMemory()
})
</script>

<style scoped>
.memory-detail-panel {
  width: 420px;
  height: 100%;
  background: rgba(15, 23, 42, 0.95);
  border-left: 1px solid rgba(100, 116, 139, 0.2);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.memory-title h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
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

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  overflow-x: auto;
}

.tab {
  flex-shrink: 0;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
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

.tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.identity-tab {
  padding: 16px 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.info-card {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.info-card .label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.info-card .value {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.content-box,
.json-box {
  padding: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.json-box {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: rgba(100, 116, 139, 0.3);
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #0f172a;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}

.timeline-time {
  font-size: 13px;
  color: #94a3b8;
}

.experiences-tab,
.knowledge-tab,
.skills-tab,
.patches-tab {
  height: 100%;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.action-btn:hover {
  background: rgba(71, 85, 105, 1);
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.8);
  color: #fff;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 1);
}

.monospace {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
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

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #64748b;
}
</style>
