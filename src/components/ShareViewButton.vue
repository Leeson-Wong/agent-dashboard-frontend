<template>
  <div class="share-view-button">
    <button
      class="share-btn"
      @click="handleShare"
      :disabled="!hasState"
      :title="hasState ? '分享当前视图' : '当前视图为默认设置'"
    >
      <span class="share-icon">🔗</span>
      <span class="share-label">分享视图</span>
    </button>

    <!-- Toast notification -->
    <Transition name="fade">
      <div v-if="showToast" class="share-toast" :class="{ success: copySuccess, error: !copySuccess }">
        {{ copySuccess ? '✓ 链接已复制到剪贴板' : '✗ 复制失败，请手动复制' }}
      </div>
    </Transition>

    <!-- URL preview modal -->
    <Transition name="fade">
      <div v-if="showModal" class="share-modal" @click.self="showModal = false">
        <div class="share-modal-content">
          <div class="share-modal-header">
            <h3>分享当前视图</h3>
            <button class="close-btn" @click="showModal = false">×</button>
          </div>

          <div class="share-modal-body">
            <p class="share-desc">
              复制下面的链接，分享当前筛选和视图设置：
            </p>

            <div class="url-container">
              <input
                ref="urlInput"
                type="text"
                class="url-input"
                :value="shareableUrl"
                readonly
                @focus="selectUrl"
              />
              <button class="copy-btn" @click="copyUrl">复制</button>
            </div>

            <div class="state-summary">
              <h4>当前视图设置：</h4>
              <ul class="state-list">
                <li v-if="state.searchQuery">
                  <span class="state-key">搜索:</span>
                  <span class="state-value">"{{ state.searchQuery }}"</span>
                </li>
                <li v-if="state.statusFilter">
                  <span class="state-key">状态:</span>
                  <span class="state-value">{{ state.statusFilter }}</span>
                </li>
                <li v-if="state.frameworkFilter">
                  <span class="state-key">框架:</span>
                  <span class="state-value">{{ state.frameworkFilter }}</span>
                </li>
                <li v-if="state.selectedTags && state.selectedTags.length > 0">
                  <span class="state-key">标签:</span>
                  <span class="state-value">{{ state.selectedTags.join(', ') }}</span>
                </li>
                <li v-if="state.viewMode && state.viewMode !== 'list'">
                  <span class="state-key">视图:</span>
                  <span class="state-value">{{ state.viewMode === 'grid' ? '网格' : '列表' }}</span>
                </li>
                <li v-if="state.sortBy && state.sortBy !== 'name'">
                  <span class="state-key">排序:</span>
                  <span class="state-value">{{ state.sortBy }} ({{ state.sortOrder === 'asc' ? '升序' : '降序' }})</span>
                </li>
                <li v-if="!hasState">
                  <span class="state-value empty">默认视图设置</span>
                </li>
              </ul>
            </div>

            <div class="share-actions">
              <button class="action-btn secondary" @click="showModal = false">关闭</button>
              <button class="action-btn primary" @click="copyAndClose">复制并关闭</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUrlState } from '../composables/useUrlState'

const { localState: state, getShareableUrl, copyShareableUrl } = useUrlState()

// UI state
const showToast = ref(false)
const showModal = ref(false)
const copySuccess = ref(false)
const urlInput = ref<HTMLInputElement>()

// Computed
const shareableUrl = computed(() => getShareableUrl())

const hasState = computed(() => {
  return !!(
    state.value.searchQuery ||
    state.value.statusFilter ||
    state.value.frameworkFilter ||
    (state.value.selectedTags && state.value.selectedTags.length > 0) ||
    (state.value.viewMode && state.value.viewMode !== 'list') ||
    (state.value.sortBy && state.value.sortBy !== 'name')
  )
})

// Methods
const handleShare = async () => {
  showModal.value = true
}

const copyUrl = async () => {
  const success = await copyShareableUrl()
  copySuccess.value = success

  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)

  if (success && urlInput.value) {
    urlInput.value.select()
  }
}

const copyAndClose = async () => {
  await copyUrl()
  setTimeout(() => {
    showModal.value = false
  }, 500)
}

const selectUrl = () => {
  if (urlInput.value) {
    urlInput.value.select()
  }
}
</script>

<style scoped>
.share-view-button {
  position: relative;
  display: inline-block;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.share-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-icon {
  font-size: 14px;
}

.share-label {
  font-weight: 500;
}

/* Toast notification */
.share-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: #e2e8f0;
  font-size: 13px;
  z-index: 1000;
  white-space: nowrap;
}

.share-toast.success {
  border-color: rgba(34, 197, 94, 0.5);
  color: #22c55e;
}

.share-toast.error {
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

/* Modal */
.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.share-modal-content {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.share-modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
}

.share-modal-body {
  padding: 20px;
}

.share-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 16px 0;
}

.url-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  outline: none;
}

.url-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.copy-btn {
  padding: 10px 16px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

.state-summary {
  margin-bottom: 20px;
}

.state-summary h4 {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.state-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.state-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}

.state-key {
  color: #64748b;
  font-weight: 500;
  min-width: 50px;
}

.state-value {
  color: #e2e8f0;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.state-value.empty {
  color: #64748b;
  font-style: italic;
}

.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.action-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

.action-btn.secondary {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.action-btn.secondary:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
.share-modal-content::-webkit-scrollbar {
  width: 8px;
}

.share-modal-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.share-modal-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.share-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

/* Responsive */
@media (max-width: 640px) {
  .url-container {
    flex-direction: column;
  }

  .copy-btn {
    width: 100%;
  }

  .share-actions {
    flex-direction: column-reverse;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
