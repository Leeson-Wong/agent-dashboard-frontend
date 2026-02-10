<template>
  <div class="activity-feed" :class="{ 'is-collapsed': isCollapsed }">
    <div class="feed-header">
      <div class="header-left">
        <h3 class="feed-title">活动源</h3>
        <span class="feed-count">{{ eventCounts.all }}</span>
      </div>
      <div class="header-actions">
        <button
          class="filter-btn"
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
          title="全部"
        >
          全部
        </button>
        <button
          v-for="type in ['info', 'success', 'warning', 'error']"
          :key="type"
          class="filter-btn"
          :class="{ active: filter === type }"
          @click="filter = type"
          :title="getTypeLabel(type)"
        >
          <span class="filter-icon">{{ getTypeIcon(type) }}</span>
          <span v-if="eventCounts[type] > 0" class="filter-count">{{ eventCounts[type] }}</span>
        </button>
        <div class="header-divider"></div>
        <button
          class="action-btn"
          @click="handleAutoClear"
          title="清除7天前的记录"
        >
          🧹
        </button>
        <button
          class="action-btn"
          @click="handleClearAll"
          title="清除全部"
        >
          🗑️
        </button>
        <button
          class="collapse-btn"
          :class="{ 'is-collapsed': isCollapsed }"
          @click="toggleCollapse"
          :title="isCollapsed ? '展开' : '收起'"
        >
          {{ isCollapsed ? '◀' : '▶' }}
        </button>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="!isCollapsed" class="feed-content">
        <div v-if="Object.keys(groupedEvents).length === 0" class="feed-empty">
          <span class="empty-icon">📭</span>
          <span class="empty-text">暂无活动记录</span>
        </div>

        <div
          v-for="(events, date) in groupedEvents"
          :key="date"
          class="feed-group"
        >
          <div class="group-header">{{ date }}</div>
          <div class="group-events">
            <TransitionGroup name="list" tag="div">
              <div
                v-for="event in events"
                :key="event.id"
                class="feed-item"
                :class="`type-${event.type}`"
                @click="handleItemClick(event)"
              >
                <div class="item-icon">
                  {{ event.icon }}
                </div>
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-title">{{ event.title }}</span>
                    <span class="item-time">{{ formatTimestamp(event.timestamp) }}</span>
                  </div>
                  <div v-if="event.message" class="item-message">
                    {{ event.message }}
                  </div>
                  <div v-if="event.agentName" class="item-agent">
                    <span class="agent-label">Agent:</span>
                    <span class="agent-name">{{ event.agentName }}</span>
                  </div>
                </div>
                <button
                  class="item-remove"
                  @click.stop="removeEvent(event.id)"
                  title="删除"
                >
                  ×
                </button>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  useActivityFeed,
  type ActivityEvent,
  type ActivityFilter
} from '../composables/useActivityFeed'

// Activity feed
const {
  events,
  filter,
  groupedEvents,
  eventCounts,
  removeEvent,
  clearEvents,
  clearOldEvents,
  formatTimestamp
} = useActivityFeed()

// UI state
const isCollapsed = ref(false)

// Toggle collapse
const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Get type label
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    info: '信息',
    success: '成功',
    warning: '警告',
    error: '错误'
  }
  return labels[type] || type
}

// Get type icon
const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return icons[type] || '•'
}

// Handle clear all
const handleClearAll = (): void => {
  if (confirm('确定要清除所有活动记录吗？')) {
    clearEvents()
  }
}

// Handle auto clear old events
const handleAutoClear = (): void => {
  if (confirm('确定要清除7天前的记录吗？')) {
    clearOldEvents(7 * 24 * 60 * 60 * 1000)
  }
}

// Handle item click
const handleItemClick = (event: ActivityEvent): void => {
  // Could open details or navigate to related agent
  console.log('Clicked event:', event)
}
</script>

<style scoped>
.activity-feed {
  background: rgba(30, 41, 59, 0.98);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  transition: all 0.3s;
}

.activity-feed.is-collapsed {
  max-height: 50px;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feed-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.feed-count {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn,
.action-btn,
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover,
.action-btn:hover,
.collapse-btn:hover {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.5);
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.filter-icon {
  font-size: 13px;
}

.filter-count {
  font-size: 10px;
  font-weight: 600;
  background: rgba(100, 116, 139, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: rgba(100, 116, 139, 0.3);
  margin: 0 4px;
}

.collapse-btn.is-collapsed {
  transform: scaleX(-1);
}

.feed-content {
  overflow-y: auto;
  flex: 1;
  padding: 8px;
  min-height: 0;
}

.feed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 13px;
}

.feed-group {
  margin-bottom: 16px;
}

.feed-group:last-child {
  margin-bottom: 0;
}

.group-header {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.group-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.feed-item:hover {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(100, 116, 139, 0.4);
}

.feed-item.type-info {
  border-left: 3px solid #60a5fa;
}

.feed-item.type-success {
  border-left: 3px solid #22c55e;
}

.feed-item.type-warning {
  border-left: 3px solid #f59e0b;
}

.feed-item.type-error {
  border-left: 3px solid #ef4444;
}

.item-icon {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.item-time {
  font-size: 11px;
  color: #64748b;
  flex-shrink: 0;
}

.item-message {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
  margin-bottom: 4px;
}

.item-agent {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.agent-label {
  color: #64748b;
}

.agent-name {
  color: #60a5fa;
  font-weight: 500;
}

.item-remove {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.item-remove:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Scrollbar styling */
.feed-content::-webkit-scrollbar {
  width: 6px;
}

.feed-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

.feed-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.feed-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
