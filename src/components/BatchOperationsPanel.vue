<template>
  <Transition name="slide-up">
    <div v-if="selectedCount > 0" class="batch-operations-panel">
      <div class="panel-content">
        <div class="panel-info">
          <span class="selection-count">{{ selectedCount }} 个 Agent 已选择</span>
          <button class="clear-selection-btn" @click="handleClearSelection" title="清除选择">
            ×
          </button>
        </div>

        <div class="panel-actions">
          <button
            v-for="action in availableActions"
            :key="action.id"
            class="action-btn"
            :class="{
              'is-destructive': action.destructive,
              'is-disabled': action.disabled
            }"
            :disabled="action.disabled || isProcessing"
            :title="action.description"
            @click="handleAction(action.id)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-label">{{ action.label }}</span>
          </button>
        </div>

        <!-- Progress Bar -->
        <Transition name="fade">
          <div v-if="isProcessing" class="progress-section">
            <div class="progress-info">
              <span class="progress-text">{{ progressText }}</span>
              <span class="progress-count">{{ progress.completed }}/{{ progress.total }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${progressPercentage}%` }"
                :class="{ 'has-errors': progress.failed > 0 }"
              ></div>
            </div>
          </div>
        </Transition>

        <!-- Results Summary -->
        <Transition name="fade">
          <div v-if="showResults && !isProcessing" class="results-summary">
            <div v-if="progress.failed === 0" class="results-success">
              ✅ 成功完成 {{ progress.completed }} 个操作
            </div>
            <div v-else class="results-partial">
              ⚠️ 完成 {{ progress.completed }} 个，失败 {{ progress.failed }} 个
              <button class="view-errors-btn" @click="showErrorsDetail = true">
                查看详情
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>

  <!-- Confirmation Dialog -->
  <Transition name="modal">
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click="cancelAction">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">确认操作</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">{{ confirmMessage }}</p>
          <div v-if="selectedAgentIds.length <= 10" class="dialog-agents">
            <div
              v-for="id in selectedAgentIds"
              :key="id"
              class="dialog-agent-item"
            >
              {{ getAgentName(id) }}
            </div>
          </div>
          <div v-else class="dialog-agents">
            <div class="dialog-agent-item">
              ... 以及其他 {{ selectedAgentIds.length - 10 }} 个 Agent
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="cancelAction">
            取消
          </button>
          <button
            class="btn-confirm"
            :class="{ 'is-destructive': isDestructive }"
            @click="confirmAction"
          >
            {{ isDestructive ? '确认删除' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Errors Detail Dialog -->
  <Transition name="modal">
    <div v-if="showErrorsDetail" class="errors-dialog-overlay" @click="showErrorsDetail = false">
      <div class="errors-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">操作详情</h3>
          <button class="dialog-close" @click="showErrorsDetail = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="errors-list">
            <div
              v-for="result in progress.results"
              :key="result.agentId"
              class="error-item"
              :class="{ 'is-error': !result.success }"
            >
              <span class="error-agent">{{ getAgentName(result.agentId) }}</span>
              <span v-if="result.success" class="error-status success">✓ 成功</span>
              <span v-else class="error-status failed">✗ {{ result.error }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-close" @click="showErrorsDetail = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  executeBatchOperation,
  getActionDisplayName,
  getActionIcon,
  isDestructiveAction,
  requiresConfirmation,
  getConfirmationMessage,
  type BatchAction
} from '../composables/useBatchOperations'
import type { AgentState } from '../../shared/types'

interface Props {
  agents: AgentState[]
  selectedIds: Set<string> | string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => []
})

const emit = defineEmits<{
  'clear-selection': []
  'operation-complete': [results: unknown]
}>()

// State
const isProcessing = ref(false)
const showResults = ref(false)
const showConfirmDialog = ref(false)
const showErrorsDetail = ref(false)
const pendingAction = ref<BatchAction | null>(null)
const progress = ref({
  total: 0,
  completed: 0,
  failed: 0,
  results: [] as { success: boolean; agentId: string; error?: string }[]
})

// Available batch actions
const availableActions = computed(() => {
  const selectedList = Array.from(props.selectedIds)
  const allOnline = selectedList.every(id => {
    const agent = props.agents.find(a => a.agentId === id)
    return agent?.status === 'online' || agent?.status === 'ready'
  })

  const allOffline = selectedList.every(id => {
    const agent = props.agents.find(a => a.agentId === id)
    return agent?.status === 'offline' || agent?.status === 'paused'
  })

  return [
    {
      id: 'pause' as BatchAction,
      label: '暂停',
      icon: '⏸️',
      description: '暂停选中的 Agent',
      destructive: false,
      disabled: !allOnline
    },
    {
      id: 'resume' as BatchAction,
      label: '恢复',
      icon: '▶️',
      description: '恢复选中的 Agent',
      destructive: false,
      disabled: !allOffline
    },
    {
      id: 'export' as BatchAction,
      label: '导出',
      icon: '📥',
      description: '导出选中的 Agent',
      destructive: false,
      disabled: false
    },
    {
      id: 'delete' as BatchAction,
      label: '删除',
      icon: '🗑️',
      description: '删除选中的 Agent',
      destructive: true,
      disabled: false
    }
  ]
})

const selectedCount = computed(() => props.selectedIds.length)
const selectedAgentIds = computed(() => Array.from(props.selectedIds))

const isDestructive = computed(() => {
  return pendingAction.value ? isDestructiveAction(pendingAction.value) : false
})

const confirmMessage = computed(() => {
  if (!pendingAction.value) return ''
  return getConfirmationMessage(pendingAction.value, selectedCount.value)
})

const progressText = computed(() => {
  if (!pendingAction.value) return '处理中...'
  return `${getActionDisplayName(pendingAction.value)}中...`
})

const progressPercentage = computed(() => {
  if (progress.value.total === 0) return 0
  return (progress.value.completed / progress.value.total) * 100
})

// Get agent name for display
const getAgentName = (id: string): string => {
  const agent = props.agents.find(a => a.agentId === id)
  return agent?.role || id
}

// Handle action button click
const handleAction = (action: BatchAction): void => {
  pendingAction.value = action

  if (requiresConfirmation(action, selectedCount.value)) {
    showConfirmDialog.value = true
  } else {
    executeAction()
  }
}

// Confirm and execute action
const confirmAction = (): void => {
  showConfirmDialog.value = false
  executeAction()
}

// Cancel pending action
const cancelAction = (): void => {
  showConfirmDialog.value = false
  pendingAction.value = null
}

// Execute the batch operation
const executeAction = async (): Promise<void> => {
  if (!pendingAction.value) return

  isProcessing.value = true
  showResults.value = false

  const operation = {
    action: pendingAction.value,
    agentIds: selectedAgentIds.value
  }

  try {
    const result = await executeBatchOperation(
      operation,
      props.agents,
      (p) => {
        progress.value = p
      }
    )

    progress.value = result
    showResults.value = true

    // Emit completion event
    emit('operation-complete', result)

    // Clear selection if operation was successful
    if (result.failed === 0 && isDestructiveAction(pendingAction.value)) {
      setTimeout(() => {
        emit('clear-selection')
      }, 1500)
    }
  } catch (error) {
    console.error('Batch operation failed:', error)
  } finally {
    isProcessing.value = false
    pendingAction.value = null
  }
}

// Clear selection
const handleClearSelection = (): void => {
  emit('clear-selection')
}

// Reset progress when selection changes
watch(() => props.selectedIds.length, () => {
  showResults.value = false
  progress.value = {
    total: 0,
    completed: 0,
    failed: 0,
    results: []
  }
})
</script>

<style scoped>
.batch-operations-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(30, 41, 59, 0.98);
  border-top: 1px solid rgba(100, 116, 139, 0.4);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  padding: 16px 24px;
}

.panel-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
}

.panel-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.selection-count {
  font-size: 14px;
  font-weight: 500;
  color: #f1f5f9;
}

.clear-selection-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: rgba(100, 116, 139, 0.3);
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-selection-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.panel-actions {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(51, 65, 85, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(.is-disabled) {
  background: rgba(51, 65, 85, 1);
  border-color: rgba(100, 116, 139, 0.5);
}

.action-btn.is-destructive:hover:not(.is-disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.action-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-icon {
  font-size: 16px;
}

.progress-section {
  flex: 1;
  max-width: 300px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-text {
  font-size: 12px;
  color: #94a3b8;
}

.progress-count {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.progress-bar {
  height: 6px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 1));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.has-errors {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.8), rgba(239, 68, 68, 0.8));
}

.results-summary {
  flex: 1;
  max-width: 300px;
}

.results-success {
  font-size: 13px;
  color: #22c55e;
  font-weight: 500;
}

.results-partial {
  font-size: 13px;
  color: #f59e0b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-errors-btn {
  padding: 2px 8px;
  background: rgba(251, 191, 36, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 4px;
  color: #fbbf24;
  font-size: 11px;
  cursor: pointer;
}

.view-errors-btn:hover {
  background: rgba(251, 191, 36, 0.3);
}

/* Confirmation Dialog */
.confirm-dialog-overlay,
.errors-dialog-overlay {
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

.confirm-dialog,
.errors-dialog {
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #f1f5f9;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.dialog-message {
  font-size: 14px;
  color: #cbd5e1;
  margin: 0 0 16px 0;
}

.dialog-agents {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.dialog-agent-item {
  font-size: 12px;
  color: #94a3b8;
  padding: 4px 0;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm,
.btn-close {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.btn-cancel:hover {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.5);
}

.btn-confirm {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.btn-confirm:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

.btn-confirm.is-destructive {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.btn-confirm.is-destructive:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.btn-close {
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #cbd5e1;
}

.btn-close:hover {
  background: rgba(100, 116, 139, 0.3);
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
}

.error-item.is-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.error-agent {
  font-size: 13px;
  color: #cbd5e1;
}

.error-status {
  font-size: 12px;
  font-weight: 500;
}

.error-status.success {
  color: #22c55e;
}

.error-status.failed {
  color: #ef4444;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog,
.modal-enter-active .errors-dialog,
.modal-leave-active .errors-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog,
.modal-enter-from .errors-dialog,
.modal-leave-to .errors-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
