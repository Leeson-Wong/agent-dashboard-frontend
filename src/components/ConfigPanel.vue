<template>
  <div class="config-panel">
    <div class="config-header">
      <h3>运行时配置</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div v-if="loading" class="config-loading">
      <div class="spinner"></div>
      <p>正在加载配置...</p>
    </div>

    <div v-else-if="error" class="config-error">
      <div class="error-icon">⚠️</div>
      <p>无法加载配置</p>
      <p class="error-message">{{ error }}</p>
      <button @click="loadConfig" class="retry-btn">重试</button>
    </div>

    <div v-else class="config-content">
      <!-- Server Configuration -->
      <section class="config-section">
        <h4>服务器配置</h4>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">端口</span>
            <span class="config-value">{{ config.server?.port }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">上下文路径</span>
            <span class="config-value">{{ config.server?.contextPath || '/' }}</span>
          </div>
        </div>
      </section>

      <!-- Application Configuration -->
      <section class="config-section">
        <h4>应用配置</h4>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">应用名称</span>
            <span class="config-value">{{ config.application?.name }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">环境</span>
            <span class="config-value">{{ config.application?.activeProfiles?.join(', ') || 'default' }}</span>
          </div>
        </div>
      </section>

      <!-- Database Configuration -->
      <section class="config-section">
        <h4>数据库配置</h4>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">连接字符串</span>
            <span class="config-value config-url">{{ config.database?.url }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">用户名</span>
            <span class="config-value">{{ config.database?.username }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">连接池</span>
            <span class="config-value">
              最小: {{ config.database?.pool?.minIdle }},
              最大: {{ config.database?.pool?.maxActive }}
            </span>
          </div>
        </div>
      </section>

      <!-- Logging Configuration -->
      <section class="config-section">
        <h4>日志配置</h4>
        <div class="config-items">
          <div class="config-item">
            <span class="config-label">Root 级别</span>
            <span class="config-value">{{ config.logging?.level?.root }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">应用级别</span>
            <span class="config-value">{{ config.logging?.level?.app }}</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="config-actions">
        <button @click="refreshConfig" class="action-btn" :disabled="loading">
          🔄 刷新
        </button>
        <button @click="$emit('close')" class="action-btn">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ConfigData {
  server: {
    port?: string
    contextPath?: string
  }
  application: {
    name?: string
    activeProfiles?: string[]
  }
  database: {
    url?: string
    username?: string
    driver?: string
    pool?: {
      minIdle?: string
      maxActive?: string
    }
  }
}

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const config = ref<ConfigData>({
  server: {},
  application: {},
  database: {}
})

// Load configuration from backend
const loadConfig = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('http://localhost:8080/api/config/public')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    config.value = data.data
  } catch (e) {
    console.error('Failed to load config:', e)
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

const refreshConfig = () => {
  loadConfig()
}

// Load config on mount
onMounted(() => {
  loadConfig()
})

defineExpose({ refreshConfig })
</script>

<style scoped>
.config-panel {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 116, 139, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.config-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f5f9;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(71, 85, 105, 0.8);
  color: #e2e8f0;
}

.config-loading,
.config-error {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(148, 163, 184, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #fca5a5;
  font-size: 14px;
  margin: 8px 0 20px;
}

.retry-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(59, 130, 246, 0.4);
}

.config-content {
  padding: 20px;
}

.config-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.config-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
}

.config-label {
  color: #64748b;
  font-size: 13px;
}

.config-value {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  flex: 1;
  margin-left: 20px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.config-url {
  word-break: break-all;
  font-size: 11px;
}

.config-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
}

.action-btn {
  padding: 10px 20px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.8);
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.8);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Scrollbar */
.config-panel::-webkit-scrollbar {
  width: 8px;
}

.config-panel::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.config-panel::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.5);
  border-radius: 4px;
}

.config-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}
</style>
