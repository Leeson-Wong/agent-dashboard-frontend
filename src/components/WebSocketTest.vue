<template>
  <div class="websocket-test">
    <h3>WebSocket 连接测试</h3>
    <div class="status">
      <span :class="{ connected: isConnected, disconnected: !isConnected }">
        {{ isConnected ? '● 已连接' : '○ 未连接' }}
      </span>
    </div>
    <div class="controls">
      <button @click="connect" :disabled="isConnected">连接</button>
      <button @click="disconnect" :disabled="!isConnected">断开</button>
      <button @click="sendTestMessage" :disabled="!isConnected">发送测试消息</button>
    </div>
    <div class="messages">
      <h4>消息记录:</h4>
      <div class="message-list">
        <div v-for="(msg, index) in messages" :key="index" class="message">
          <span class="timestamp">{{ msg.timestamp }}</span>
          <span :class="['type', msg.type]">{{ msg.type }}</span>
          <span class="content">{{ msg.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { getWebSocketConnection, type WebSocketConnection } from '../api/WebSocketConnection'

const isConnected = ref(false)
const messages = ref<Array<{ timestamp: string; type: string; content: string }>>([])
let ws: WebSocketConnection | null = null
let unsubscribe: (() => void) | null = null

const addMessage = (type: string, content: string) => {
  messages.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type,
    content,
  })
  // Keep only last 50 messages
  if (messages.value.length > 50) {
    messages.value.pop()
  }
}

const connect = async () => {
  try {
    addMessage('info', '正在连接 WebSocket...')
    ws = getWebSocketConnection()

    unsubscribe = ws.onMessage((message) => {
      addMessage('received', JSON.stringify(message))
    })

    await ws.connect()
    isConnected.value = true
    addMessage('success', 'WebSocket 连接成功')
  } catch (error) {
    isConnected.value = false
    addMessage('error', `连接失败: ${error}`)
  }
}

const disconnect = () => {
  if (ws) {
    ws.disconnect()
    isConnected.value = false
    addMessage('info', 'WebSocket 已断开')
  }
}

const sendTestMessage = () => {
  if (ws && isConnected.value) {
    ws.send('/ping', { timestamp: Date.now() })
    addMessage('sent', '发送 ping 消息')
  }
}

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  disconnect()
})
</script>

<style scoped>
.websocket-test {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 300px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  padding: 16px;
  z-index: 1000;
  overflow-y: auto;
}

.websocket-test h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #e2e8f0;
}

.status {
  margin-bottom: 12px;
}

.status span {
  font-size: 14px;
  font-weight: 500;
}

.status .connected {
  color: #22c55e;
}

.status .disconnected {
  color: #ef4444;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.controls button {
  padding: 6px 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.controls button:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.7);
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.messages h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #94a3b8;
}

.message-list {
  max-height: 180px;
  overflow-y: auto;
}

.message {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.message .timestamp {
  color: #64748b;
  min-width: 80px;
}

.message .type {
  min-width: 60px;
  font-weight: 500;
}

.message .type.info {
  color: #3b82f6;
}

.message .type.success {
  color: #22c55e;
}

.message .type.error {
  color: #ef4444;
}

.message .type.sent {
  color: #a78bfa;
}

.message .type.received {
  color: #fbbf24;
}

.message .content {
  color: #cbd5e1;
  flex: 1;
  word-break: break-all;
}
</style>
