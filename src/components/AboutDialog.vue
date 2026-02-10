<template>
  <Transition name="modal">
    <div v-if="show" class="about-overlay" @click.self="$emit('close')">
      <div class="about-dialog">
        <div class="dialog-header">
          <h2>关于 Agent Dashboard</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="dialog-content">
          <!-- Logo and Title -->
          <div class="app-info">
            <div class="app-logo">🤖</div>
            <h3>Agent Dashboard</h3>
            <p class="app-version">版本 1.0.0</p>
            <p class="app-description">分布式 AI Agent 监控平台</p>
          </div>

          <!-- Features -->
          <div class="section">
            <h4>核心功能</h4>
            <ul class="feature-list">
              <li>📊 实时监控 Agent 状态</li>
              <li>🔌 WebSocket 实时数据推送</li>
              <li>🎨 3D 可视化场景</li>
              <li>🧠 Memory 管理</li>
              <li>📝 任务历史追踪</li>
              <li>⌨️ 键盘快捷键支持</li>
            </ul>
          </div>

          <!-- Tech Stack -->
          <div class="section">
            <h4>技术栈</h4>
            <div class="tech-grid">
              <div class="tech-item">
                <span class="tech-label">前端</span>
                <span class="tech-value">Vue 3 + TypeScript + Three.js</span>
              </div>
              <div class="tech-item">
                <span class="tech-label">后端</span>
                <span class="tech-value">Spring Boot 3.2 + Java 17</span>
              </div>
              <div class="tech-item">
                <span class="tech-label">数据库</span>
                <span class="tech-value">MySQL 8.0 + Redis</span>
              </div>
              <div class="tech-item">
                <span class="tech-label">通信</span>
                <span class="tech-value">WebSocket (STOMP)</span>
              </div>
            </div>
          </div>

          <!-- Links -->
          <div class="section">
            <h4>相关链接</h4>
            <div class="links">
              <a href="#" class="link-item" @click.prevent>
                <span class="link-icon">📖</span>
                <span class="link-text">使用文档</span>
              </a>
              <a href="#" class="link-item" @click.prevent>
                <span class="link-icon">💻</span>
                <span class="link-text">GitHub 仓库</span>
              </a>
              <a href="#" class="link-item" @click.prevent>
                <span class="link-icon">🐛</span>
                <span class="link-text">问题反馈</span>
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="dialog-footer">
            <p class="copyright">
              © 2026 Agent Dashboard. Built with ❤️ by Claude Sonnet 4.5
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.about-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.about-dialog {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.dialog-content {
  padding: 24px;
  max-height: calc(80vh - 100px);
  overflow-y: auto;
}

.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.app-info {
  text-align: center;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.app-logo {
  font-size: 64px;
  margin-bottom: 12px;
}

.app-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-version {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #94a3b8;
}

.app-description {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
}

.section {
  margin-bottom: 24px;
}

.section:last-of-type {
  margin-bottom: 0;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.feature-list li {
  font-size: 13px;
  color: #cbd5e1;
  padding: 6px 12px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 4px;
}

.tech-grid {
  display: grid;
  gap: 12px;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 6px;
}

.tech-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.tech-value {
  font-size: 13px;
  color: #e2e8f0;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 6px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.link-item:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
}

.link-icon {
  font-size: 18px;
}

.link-text {
  font-size: 14px;
}

.dialog-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.copyright {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .about-dialog,
.modal-leave-active .about-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .about-dialog,
.modal-leave-to .about-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
