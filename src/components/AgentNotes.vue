<template>
  <div class="agent-notes">
    <!-- Header -->
    <div class="notes-header">
      <div class="notes-title">
        <span class="notes-icon">📝</span>
        <span class="notes-label">Agent 笔记</span>
        <span v-if="hasNote" class="notes-badge">已保存</span>
      </div>
      <div class="notes-actions">
        <button
          v-if="hasNote"
          class="action-btn"
          @click="copyNote"
          title="复制笔记"
        >
          📋
        </button>
        <button
          v-if="hasNote"
          class="action-btn delete-btn"
          @click="confirmDelete"
          title="删除笔记"
        >
          🗑️
        </button>
        <button
          class="action-btn"
          @click="toggleExpanded"
          :title="isExpanded ? '收起' : '展开'"
        >
          {{ isExpanded ? '▲' : '▼' }}
        </button>
      </div>
    </div>

    <!-- Notes Content (collapsible) -->
    <Transition name="slide">
      <div v-if="isExpanded" class="notes-content">
        <!-- Edit Mode -->
        <div v-if="isEditing" class="notes-edit">
          <!-- Template Selector -->
          <div class="template-selector">
            <select
              v-model="selectedTemplateId"
              class="template-select"
              @change="applyTemplate"
            >
              <option value="">选择模板...</option>
              <optgroup
                v-for="(templates, category) in templatesByCategory"
                :key="category"
                :label="category"
              >
                <option
                  v-for="template in templates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <textarea
            ref="textareaRef"
            v-model="editingNote"
            class="notes-textarea"
            placeholder="在此添加关于此 Agent 的笔记..."
            rows="6"
            @keydown.ctrl.enter="saveNote"
          ></textarea>
          <div class="notes-edit-footer">
            <span class="notes-hint">Ctrl+Enter 保存</span>
            <div class="notes-edit-buttons">
              <button
                class="btn-cancel"
                @click="cancelEdit"
                :disabled="isSaving"
              >
                取消
              </button>
              <button
                class="btn-save"
                @click="saveNote"
                :disabled="isSaving || !editingNote.trim()"
              >
                {{ isSaving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>

        <!-- View Mode -->
        <div v-else class="notes-view">
          <div v-if="currentNote" class="notes-text">
            {{ currentNote }}
          </div>
          <div v-else class="notes-empty">
            <p>暂无笔记</p>
            <p class="empty-hint">点击下方按钮添加笔记</p>
          </div>
          <button
            class="btn-edit"
            @click="startEdit"
          >
            {{ currentNote ? '编辑笔记' : '添加笔记' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div class="modal-content">
            <h3>确认删除</h3>
            <p>确定要删除这条笔记吗？此操作无法撤销。</p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="cancelDelete">取消</button>
              <button class="btn-delete" @click="deleteNote">删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAgentNotes } from '../composables/useAgentNotes'
import { useNoteTemplates } from '../composables/useNoteTemplates'
import type { AgentState } from '../../shared/types'

const props = defineProps<{
  agent: AgentState | null
}>()

const {
  getNoteText,
  setNote,
  deleteNote: removeNote,
  hasNote: checkHasNote
} = useAgentNotes()

// State
const isExpanded = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const editingNote = ref('')
const showDeleteConfirm = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Note templates
const {
  templatesByCategory,
  getTemplateById,
  apply: applyTemplateContent
} = useNoteTemplates()
const selectedTemplateId = ref<string>('')

// Computed
const currentNote = computed(() => {
  if (!props.agent) return ''
  return getNoteText(props.agent.agentId)
})

const hasNote = computed(() => {
  if (!props.agent) return false
  return checkHasNote(props.agent.agentId)
})

// Methods
const toggleExpanded = (): void => {
  isExpanded.value = !isExpanded.value
}

const startEdit = async (): Promise<void> => {
  editingNote.value = currentNote.value
  isEditing.value = true
  isExpanded.value = true

  // Focus textarea after transition
  await nextTick()
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

const cancelEdit = (): void => {
  editingNote.value = ''
  isEditing.value = false
  selectedTemplateId.value = ''
}

const applyTemplate = (): void => {
  if (!selectedTemplateId.value) return

  const template = getTemplateById(selectedTemplateId.value)
  if (template) {
    const content = applyTemplateContent(template)
    // Append or replace based on current note content
    if (editingNote.value.trim()) {
      editingNote.value = editingNote.value + '\n\n' + content
    } else {
      editingNote.value = content
    }
  }

  // Reset template selection
  selectedTemplateId.value = ''
}

const saveNote = (): void => {
  if (!props.agent || isSaving.value) return

  isSaving.value = true

  try {
    setNote(props.agent.agentId, editingNote.value)
    isEditing.value = false
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (): void => {
  showDeleteConfirm.value = true
}

const cancelDelete = (): void => {
  showDeleteConfirm.value = false
}

const deleteNote = (): void => {
  if (!props.agent) return

  removeNote(props.agent.agentId)
  showDeleteConfirm.value = false
}

const copyNote = async (): Promise<void> => {
  if (!currentNote.value) return

  try {
    await navigator.clipboard.writeText(currentNote.value)
    // Could show a toast here
  } catch (error) {
    console.error('Failed to copy note:', error)
  }
}

// Watch for agent changes
watch(() => props.agent?.agentId, () => {
  // Reset edit state when agent changes
  isEditing.value = false
  editingNote.value = ''
})
</script>

<style scoped>
.agent-notes {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.notes-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notes-icon {
  font-size: 16px;
}

.notes-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.notes-badge {
  font-size: 10px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.notes-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Content */
.notes-content {
  padding: 16px;
}

/* Edit Mode */
.notes-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-select {
  flex: 1;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-select:hover {
  border-color: rgba(100, 116, 139, 0.5);
}

.template-select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
}

.template-select option {
  background: #1e293b;
  color: #e2e8f0;
  padding: 8px;
}

.template-select optgroup {
  background: #0f172a;
  color: #94a3b8;
  font-weight: 600;
}

.notes-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
}

.notes-textarea:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.notes-textarea::placeholder {
  color: #64748b;
}

.notes-edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notes-hint {
  font-size: 11px;
  color: #64748b;
}

.notes-edit-buttons {
  display: flex;
  gap: 8px;
}

/* View Mode */
.notes-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-text {
  padding: 12px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.notes-empty {
  padding: 24px 12px;
  text-align: center;
  color: #64748b;
}

.notes-empty p {
  margin: 0;
  font-size: 13px;
}

.empty-hint {
  font-size: 11px !important;
  margin-top: 4px !important;
}

/* Buttons */
.btn-edit,
.btn-save,
.btn-cancel,
.btn-delete {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.btn-edit:hover {
  background: rgba(59, 130, 246, 0.3);
}

.btn-save {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.btn-save:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(100, 116, 139, 0.3);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: calc(100vw - 40px);
}

.modal-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.modal-content p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #94a3b8;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
}

/* Responsive */
@media (max-width: 640px) {
  .notes-header {
    padding: 10px 12px;
  }

  .notes-content {
    padding: 12px;
  }

  .modal-content {
    padding: 20px;
  }
}
</style>
