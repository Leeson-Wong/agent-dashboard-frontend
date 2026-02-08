# 前端快照+增量同步集成指南

**Date**: 2026-02-08
**Status**: ✅ Implemented

---

## 概述

前端已实现完整的快照+增量同步机制，支持：
1. ✅ 快照 API (`getLatestSnapshot()`)
2. ✅ 增量事件 API (`getEventsSince(seq)`)
3. ✅ AgentStore 序列号管理和增量应用
4. ✅ EventStream 序列号跟踪和增量恢复

---

## 集成步骤

### 1. 在 App.vue 中初始化

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { EventStream } from './api/EventStream'
import { getAPIClient } from './api/ApiClientNew'
import { agentStore } from './store/AgentStore'

const eventStream = ref<EventStream | null>(null)
const isConnected = ref(false)
const agents = ref<AgentState[]>([])

onMounted(async () => {
  await initializeDataStream()
})

onUnmounted(() => {
  eventStream.value?.disconnect()
})

async function initializeDataStream() {
  const api = getAPIClient()
  const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws'

  // 创建 EventStream
  eventStream.value = new EventStream(wsUrl, {
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,

    onEvent: (event) => {
      console.log('Received event:', event)
    },

    onAgentUpdate: (agentList) => {
      console.log(`Received ${agentList.length} agents`)
      agents.value = agentList
    },

    onConnect: () => {
      console.log('Connected to server')
      isConnected.value = true
    },

    onDisconnect: () => {
      console.log('Disconnected from server')
      isConnected.value = false
    },

    onError: (error) => {
      console.error('Stream error:', error)
    }
  })

  // 设置增量恢复处理器
  eventStream.value.setRecoveryHandlers({
    onDeltaEvents: (events) => {
      console.log(`Applying ${events.length} delta events`)
      agentStore.applyDeltaEvents(events)
      agents.value = agentStore.getAll()
    },

    onSnapshot: (snapshotAgents, seq) => {
      console.log(`Applying snapshot with ${snapshotAgents.length} agents (seq: ${seq})`)
      agentStore.applySnapshot(snapshotAgents, seq)
      agents.value = agentStore.getAll()
    }
  })

  // 步骤 1: 获取最新快照
  try {
    const snapshot = await api.getLatestSnapshot()

    if (snapshot) {
      console.log('Loaded snapshot:', snapshot)
      agentStore.applySnapshot(snapshot.data.agents, snapshot.seq)
      agents.value = agentStore.getAll()
    } else {
      // 没有快照，回退到全量 API
      console.log('No snapshot available, using full API')
      const agentList = await api.getAgents()
      agentStore.syncAll(agentList)
      agents.value = agentList
    }
  } catch (error) {
    console.error('Failed to load snapshot:', error)
  }

  // 步骤 2: 连接 WebSocket
  try {
    await eventStream.value.connect()
  } catch (error) {
    console.error('Failed to connect:', error)
  }
}
</script>
```

---

## 2. 断线重连时自动增量恢复

```typescript
// EventStream 内部已实现自动增量恢复
// 断线重连时会：
// 1. 尝试 GET /api/events?since=<lastSeq>
// 2. 如果 seq 过期，回退到 GET /api/snapshot/latest
// 3. 自动应用增量事件或快照

// 开发者无需额外处理，EventStream 会自动调用
// setRecoveryHandlers() 中设置的处理器
```

---

## 3. 手动触发增量恢复

```typescript
async function manualRecovery() {
  if (!eventStream.value) return

  const success = await eventStream.value.performDeltaRecovery()

  if (success) {
    console.log('Delta recovery successful')
    agents.value = agentStore.getAll()
  } else {
    console.error('Delta recovery failed')
  }
}
```

---

## 4. 获取当前序列号

```typescript
// 从 AgentStore 获取
const lastSeq = agentStore.getLastSeq()

// 从 EventStream 获取
const lastSeq = eventStream.value?.getLastSeq() || 0

console.log(`Current sequence number: ${lastSeq}`)
```

---

## API 参考

### ApiClientNew.ts

#### `getLatestSnapshot(): Promise<SnapshotResponse | null>`
获取最新快照。如果没有快照返回 null。

**返回值**:
```typescript
{
  snapshotId: string
  seq: number
  data: {
    agents: AgentState[]
  }
  createdAt: string
}
```

#### `getEventsSince(seq: number): Promise<DeltaEventsResponse | null>`
获取指定序列号之后的增量事件。如果 seq 过期返回 null。

**返回值**:
```typescript
{
  since: number
  events: SequencedEvent[]
}
```

---

### AgentStore.ts

#### `applySnapshot(agents: AgentState[], seq: number): void`
应用快照，完全替换当前状态。

#### `applyDeltaEvents(events: SequencedEvent[]): number`
应用增量事件，返回成功应用的事件数量。

#### `getLastSeq(): number`
获取最后收到的序列号。

---

### EventStream.ts

#### `setRecoveryHandlers(handlers): void`
设置增量恢复的处理器。

**参数**:
```typescript
{
  onDeltaEvents: (events: SequencedEvent[]) => void
  onSnapshot: (agents: AgentState[], seq: number) => void
}
```

#### `performDeltaRecovery(): Promise<boolean>`
执行增量恢复。成功返回 true，失败返回 false。

#### `getLastSeq(): number`
获取最后收到的序列号。

---

## 数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端应用                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 初始化流程                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  a) GET /api/snapshot/latest → 获取最新快照             │    │
│  │  b) agentStore.applySnapshot(agents, seq)               │    │
│  │  c) 连接 WebSocket                                      │    │
│  │  d) 开始接收实时推送                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. 实时更新                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  WebSocket 推送事件 → EventStream                       │    │
│  │  ├─ 提取 seq                                            │    │
│  │  ├─ 更新 lastSeq                                        │    │
│  │  └─ 调用 onAgentUpdate                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. 断线重连                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  a) 检测断开                                             │    │
│  │  b) performDeltaRecovery()                              │    │
│  │  ├─ GET /api/events?since=<lastSeq>  [尝试增量]         │    │
│  │  ├─ 成功: applyDeltaEvents()                           │    │
│  │  └─ 失败/过期: GET /api/snapshot/latest  [回退快照]     │    │
│  │     └─ applySnapshot()                                  │    │
│  │  c) 重新连接 WebSocket                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 测试场景

### 场景 1: 首次连接
```bash
1. 启动前端应用
2. 前端调用 GET /api/snapshot/latest
3. 后端返回最新快照（或 404）
4. 前端应用快照到 AgentStore
5. 连接 WebSocket
6. 开始接收实时更新
```

### 场景 2: 正常运行
```bash
1. WebSocket 推送事件
2. 前端提取 seq 并更新 lastSeq
3. 前端更新 AgentStore
4. UI 刷新
```

### 场景 3: 短暂断线（seq 未过期）
```bash
1. WebSocket 断开
2. 自动重连
3. performDeltaRecovery() 调用 GET /api/events?since=<lastSeq>
4. 后端返回增量事件
5. 前端应用增量事件
6. 重新连接 WebSocket
```

### 场景 4: 长时间断线（seq 已过期）
```bash
1. WebSocket 断开
2. 自动重连
3. performDeltaRecovery() 调用 GET /api/events?since=<lastSeq>
4. 后端返回 404（seq 过期）
5. 回退到 GET /api/snapshot/latest
6. 前端应用快照
7. 重新连接 WebSocket
```

---

## 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 首次加载时间 | < 2s | 快照 API 响应时间 |
| 增量恢复时间 | < 500ms | 增量事件 API 响应时间 |
| WebSocket 重连 | < 3s | 指数退避重连延迟 |
| 端到端延迟 | < 100ms | 事件从发生到前端展示 |

---

## 故障处理

| 故障 | 症状 | 处理 |
|------|------|------|
| 快照 API 404 | 无快照可用 | 回退到全量 API `/api/agents` |
| 增量 API 404 | seq 过期 | 回退到快照 API |
| WebSocket 断开 | 无法接收实时更新 | 自动重连 + 增量恢复 |
| 重连失败 | 超过最大重连次数 | 显示错误提示，提供手动重试 |

---

## 后端依赖

前端快照+增量同步依赖后端以下 API：

1. ✅ `GET /api/snapshot/latest` - 获取最新快照
2. ✅ `GET /api/events?since=<seq>` - 获取增量事件
3. ✅ WebSocket `/ws` - 实时推送

**注意**: 后端需要实现这些 API 才能支持前端的快照+增量同步功能。

---

## 后续优化

1. **快照压缩** - 使用 gzip 压缩快照数据
2. **增量事件预取** - 预先获取可能需要的增量事件
3. **本地快照缓存** - 使用 IndexedDB 缓存快照
4. **智能回退策略** - 根据断开时间决定使用增量还是快照

---

**Last Updated**: 2026-02-08
**Version**: 0.2.0
