<template>
  <div class="export-menu" :class="{ 'is-open': isOpen }">
    <button
      class="export-toggle"
      @click="toggleMenu"
      title="导出数据"
    >
      <span class="export-icon">📥</span>
      <span class="export-label">导出</span>
      <span class="export-arrow" :class="{ 'is-open': isOpen }">▼</span>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="export-dropdown">
        <div class="dropdown-header">
          <span class="header-title">导出数据</span>
          <span class="header-count">{{ agentCount }} 个 Agent</span>
        </div>

        <div class="dropdown-section">
          <div class="section-label">导出格式</div>
          <div class="format-grid">
            <button
              v-for="format in formats"
              :key="format.id"
              class="format-button"
              :class="{ 'is-active': selectedFormat === format.id }"
              @click="selectedFormat = format.id"
              :title="format.description"
            >
              <span class="format-icon">{{ format.icon }}</span>
              <span class="format-name">{{ format.name }}</span>
            </button>
          </div>
        </div>

        <div class="dropdown-section">
          <div class="section-label">导出选项</div>
          <label class="option-checkbox">
            <input
              type="checkbox"
              v-model="options.useCustomFields"
              @change="handleCustomFieldsChange"
            />
            <span>自定义字段</span>
          </label>

          <div v-if="options.useCustomFields" class="fields-selector">
            <div class="fields-header">
              <label class="select-all-checkbox">
                <input
                  type="checkbox"
                  :checked="allFieldsSelected"
                  @change="toggleAllFields"
                />
                <span>全选</span>
              </label>
              <span class="fields-count">{{ selectedFields.length }}/{{ availableFields.length }}</span>
            </div>

            <div class="fields-list">
              <label
                v-for="field in availableFields"
                :key="field"
                class="field-checkbox"
              >
                <input
                  type="checkbox"
                  :value="field"
                  v-model="selectedFields"
                />
                <span>{{ field }}</span>
              </label>
            </div>
          </div>

          <label class="option-checkbox">
            <input type="checkbox" v-model="options.customFilename" />
            <span>自定义文件名</span>
          </label>

          <div v-if="options.customFilename" class="filename-input">
            <input
              type="text"
              v-model="options.filename"
              placeholder="输入文件名（不含扩展名）"
            />
          </div>
        </div>

        <div class="dropdown-footer">
          <button class="btn-cancel" @click="closeMenu">
            取消
          </button>
          <button class="btn-export" @click="handleExport" :disabled="isExporting">
            {{ isExporting ? '导出中...' : '导出数据' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDataExport, type ExportFormat } from '../composables/useDataExport'
import type { AgentState } from '../../shared/types'

interface Props {
  agents: AgentState[]
  selectedIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => []
})

const isOpen = ref(false)
const isExporting = ref(false)
const selectedFormat = ref<ExportFormat>('json')
const { exportData, exportSelectedAgents, getDefaultFields } = useDataExport()

const options = ref({
  useCustomFields: false,
  customFilename: false,
  filename: ''
})

const availableFields = ref(getDefaultFields())
const selectedFields = ref<string[]>([...availableFields.value])

const formats = [
  { id: 'json' as ExportFormat, name: 'JSON', icon: '📋', description: 'JSON 格式，适合程序处理' },
  { id: 'csv' as ExportFormat, name: 'CSV', icon: '📊', description: 'CSV 格式，适合 Excel 打开' },
  { id: 'excel' as ExportFormat, name: 'Excel', icon: '📈', description: 'Excel HTML 表格' },
  { id: 'markdown' as ExportFormat, name: 'Markdown', icon: '📝', description: 'Markdown 表格' }
]

const agentCount = computed(() => {
  return props.selectedIds.length > 0 ? props.selectedIds.length : props.agents.length
})

const allFieldsSelected = computed(() => {
  return selectedFields.value.length === availableFields.value.length
})

const toggleMenu = (): void => {
  isOpen.value = !isOpen.value
}

const closeMenu = (): void => {
  isOpen.value = false
}

const handleCustomFieldsChange = (): void => {
  if (options.value.useCustomFields) {
    selectedFields.value = [...availableFields.value]
  }
}

const toggleAllFields = (): void => {
  if (allFieldsSelected.value) {
    selectedFields.value = []
  } else {
    selectedFields.value = [...availableFields.value]
  }
}

const handleExport = async (): Promise<void> => {
  isExporting.value = true

  try {
    const exportOptions = {
      format: selectedFormat.value,
      includeFields: options.value.useCustomFields ? selectedFields.value : undefined,
      filename: options.value.customFilename ? options.value.filename : undefined,
      dateFormat: 'iso' as const
    }

    // Wait a bit to show loading state
    await new Promise(resolve => setTimeout(resolve, 500))

    if (props.selectedIds.length > 0) {
      exportSelectedAgents(props.agents, props.selectedIds, exportOptions)
    } else {
      exportData(props.agents, exportOptions)
    }

    closeMenu()
  } finally {
    isExporting.value = false
  }
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  const menu = document.querySelector('.export-menu')
  if (menu && !menu.contains(target)) {
    closeMenu()
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.export-menu {
  position: relative;
  display: inline-block;
}

.export-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-toggle:hover {
  background: rgba(51, 65, 85, 0.95);
  border-color: rgba(100, 116, 139, 0.5);
}

.export-icon {
  font-size: 16px;
}

.export-label {
  font-weight: 500;
}

.export-arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.export-arrow.is-open {
  transform: rotate(180deg);
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 320px;
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.header-count {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
}

.dropdown-section {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.dropdown-section:last-of-type {
  border-bottom: none;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.format-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-button:hover {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(100, 116, 139, 0.5);
}

.format-button.is-active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.format-icon {
  font-size: 20px;
}

.format-name {
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
}

.option-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.fields-selector {
  margin-top: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
}

.fields-count {
  font-size: 11px;
  color: #64748b;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.field-checkbox:hover {
  background: rgba(100, 116, 139, 0.1);
}

.filename-input {
  margin-top: 8px;
}

.filename-input input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.filename-input input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.dropdown-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.btn-cancel,
.btn-export {
  flex: 1;
  padding: 10px 16px;
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

.btn-export {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.btn-export:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Scrollbar styling */
.fields-list::-webkit-scrollbar {
  width: 6px;
}

.fields-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

.fields-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.fields-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
