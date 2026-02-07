# Agent Dashboard Frontend

Agent 监控前端 - 基于 Vue 3 + Three.js 的 3D 可视化监控面板

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.4+ | UI 框架，组件化开发 |
| **TypeScript** | 5.6+ | 类型安全 |
| **Three.js** | 0.170+ | 3D 场景渲染 |
| **Vite** | 6.0+ | 构建工具 |
| **STOMP** | 7.0+ | WebSocket 通信 |
| **SockJS** | 1.6+ | WebSocket 降级方案 |

## 快速开始

### 1. 安装依赖

```bash
cd agent-dashboard-frontend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并修改配置：

```bash
cp .env.example .env.local
```

```env
# API 服务器地址
VITE_API_BASE_URL=http://localhost:8080

# WebSocket 服务器地址
VITE_WS_BASE_URL=http://localhost:8080/ws

# 使用模拟数据（开发调试）
VITE_USE_MOCK_DATA=true
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 项目结构

```
src/
├── api/                        # API 调用封装
│   ├── ApiClientNew.ts        # REST API 客户端
│   └── WebSocketConnection.ts # WebSocket 连接管理
├── components/                 # Vue 组件
│   ├── AgentListPanel.vue     # Agent 列表面板（左侧）
│   ├── AgentDetailPanel.vue   # Agent 详情面板（右侧）
│   ├── LogPanel.vue           # 日志查看面板
│   └── TaskHistoryPanel.vue   # 任务历史面板
├── scene/                     # Three.js 3D 场景
│   └── AgentScene.ts          # Agent 可视化场景
├── store/                     # 状态管理
│   └── AgentStore.ts          # Agent 状态存储
├── config/                    # 配置
│   └── env.ts                 # 环境变量管理
├── App.vue                    # 根组件
├── main.ts                    # 入口文件
└── vite-env.d.ts             # TypeScript 类型声明
```

## 功能模块

### 1. 3D 可视化

- **六边形 Agent 区域** - 每个 Agent 一个六边形，颜色反映状态
- **粒子效果** - 不同状态有不同的粒子动画
- **交互控制** - 鼠标拖拽旋转、滚轮缩放

| 状态 | 颜色 | 动画效果 |
|------|------|----------|
| online | 绿色 | 平滑脉冲 |
| thinking | 紫色 | 快速旋转 + 粒子 |
| busy | 橙色 | 波浪扩散 |
| error | 红色 | 闪烁警告 |

### 2. 实时数据同步

- **WebSocket 长连接** - STOMP 协议实时推送
- **指数退避重连** - 断线自动重连，延迟递增
- **心跳检测** - 定期 PING/PONG，检测连接健康
- **增量更新** - 只更新变化的 Agent，减少渲染

### 3. UI 面板

#### Agent 列表（左侧）
- 搜索过滤
- 状态统计
- 实时更新

#### Agent 详情（右侧）
- 基本信息
- 当前活动
- 关联 Memory
- 时间线
- 操作按钮

#### 日志面板
- 级别过滤 (Debug/Info/Warn/Error)
- 搜索功能
- 自动滚动
- 导出日志

#### 任务历史
- 列表/时间线视图切换
- 状态筛选
- 详情查看
- 重试功能

## API 接口

### Agent 查询

```typescript
import { getAPIClient } from './api/ApiClientNew'

const api = getAPIClient()

// 获取所有 Agent
const agents = await api.getAgents()

// 获取在线 Agent
const onlineAgents = await api.getOnlineAgents()

// 获取统计
const stats = await api.getStats()
```

### Agent 操作

```typescript
// 暂停 Agent
await api.pauseAgent(agentId)

// 恢复 Agent
await api.resumeAgent(agentId)

// 停止 Agent
await api.stopAgent(agentId)

// 重启 Agent
await api.restartAgent(agentId)

// 删除 Agent
await api.deleteAgent(agentId)

// 批量操作
await api.batchAgentOperation('pause', [agentId1, agentId2])
```

### Memory 管理

```typescript
// 获取所有 Memory
const memories = await api.getAllMemories()

// 创建 Memory
const memory = await api.createMemory({
  name: '研究员 Memory',
  role: '高级研究员',
  persona: '专业、严谨',
})

// 激活 Memory
await api.activateMemory(memoryId)
```

### Task 管理

```typescript
// 获取待分配任务
const tasks = await api.getPendingTasks()

// 分配任务
await api.assignTask(taskId, agentId, memoryId)

// 开始任务
await api.startTask(taskId)

// 更新进度
await api.updateTaskProgress(taskId, 50)
```

## 组件使用

### LogPanel

```vue
<template>
  <LogPanel
    :agent-id="selectedAgentId"
    :logs="logs"
    :is-connected="wsConnected"
    @close="showLogPanel = false"
    @clear="logs = []"
    @export="exportLogs"
  />
</template>

<script setup>
import LogPanel from './components/LogPanel.vue'
import type { LogEntry } from './components/LogPanel.vue'

const logs = ref<LogEntry[]>([])
</script>
```

### TaskHistoryPanel

```vue
<template>
  <TaskHistoryPanel
    :agent-id="agentId"
    :tasks="tasks"
    @close="showTaskPanel = false"
    @refresh="loadTasks"
    @retry="retryTask"
  />
</template>

<script setup>
import TaskHistoryPanel from './components/TaskHistoryPanel.vue'
import type { Task } from './components/TaskHistoryPanel.vue'
</script>
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | 后端 API 地址 |
| `VITE_WS_BASE_URL` | `http://localhost:8080/ws` | WebSocket 地址 |
| `VITE_APP_TITLE` | `Agent Dashboard` | 应用标题 |
| `VITE_USE_MOCK_DATA` | `false` | 是否使用模拟数据 |
| `VITE_WS_RECONNECT_DELAY` | `3000` | WebSocket 重连延迟(ms) |
| `VITE_WS_MAX_RECONNECT_ATTEMPTS` | `5` | 最大重连次数 |
| `VITE_ENABLE_3D_SCENE` | `true` | 是否启用 3D 场景 |

## 开发指南

### 添加新的 UI 组件

1. 在 `src/components/` 创建 `.vue` 文件
2. 使用 `<script setup lang="ts">` 语法
3. 定义 Props 和 Emits 接口

```vue
<script setup lang="ts">
interface Props {
  title: string
}

interface Emits {
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
```

### 添加新的 API 方法

在 `src/api/ApiClientNew.ts` 的 APIClient 类中添加方法：

```typescript
async myNewMethod(param: string): Promise<ResponseType> {
  return this.request<ResponseType>(`/api/endpoint/${param}`, {
    method: 'POST',
    body: JSON.stringify({ data: param }),
  })
}
```

### 状态管理

使用 `AgentStore` 管理 Agent 状态：

```typescript
import { AgentStore } from './store/AgentStore'

// 获取所有 Agent
const agents = AgentStore.getAgents()

// 增量更新
AgentStore.updateAgent(agentId, { status: 'online' })

// 获取统计
const stats = AgentStore.getStats()
```

## 常见问题

### Q1: WebSocket 连接失败

**A:** 检查后端是否启动，确认 `VITE_WS_BASE_URL` 配置正确。

### Q2: 3D 场景不显示

**A:** 确认浏览器支持 WebGL，检查控制台是否有错误。

### Q3: TypeScript 类型错误

**A:** 运行 `npm run build` 查看完整错误信息。

### Q4: 构建产物过大

**A:** 已配置 code-splitting，可进一步使用动态导入拆分代码。

---

**最后更新**: 2025-02-07
**版本**: 0.1.0
