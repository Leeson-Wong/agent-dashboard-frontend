<template>
  <div class="statistics-cards" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Header -->
    <div class="cards-header">
      <button
        class="cards-toggle"
        @click="toggleCollapsed"
        :title="isCollapsed ? '展开统计卡片' : '收起统计卡片'"
      >
        <span class="toggle-icon">{{ isCollapsed ? '📊' : '📈' }}</span>
        <span v-if="isCollapsed" class="toggle-mini">{{ totalCards }}</span>
      </button>

      <StatsVisibilitySelector />
    </div>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="cards-container">
        <!-- Category -->
        <div
          v-for="category in visibleCategories"
          :key="category.id"
          class="category"
          :class="{ 'single-card': category.cards.length === 1 }"
        >
          <div class="category-header" v-if="category.name">
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.cards.length }}</span>
          </div>

          <div class="cards-grid" :class="`grid-${Math.min(category.cards.length, 4)}`">
            <div
              v-for="card in category.cards"
              :key="card.id"
              class="stat-card"
              :class="[
                `trend-${getTrendClass(card.trend)}`,
                { 'is-clickable': card.clickAction }
              ]"
              @click="handleCardClick(card)"
            >
              <div class="card-header">
                <span class="card-icon">{{ card.icon || '📊' }}</span>
                <span v-if="card.trend" class="card-trend" :class="card.trend">
                  {{ getTrendIcon(card.trend) }}
                </span>
              </div>
              <div class="card-value">
                {{ formatDisplayValue(card) }}
              </div>
              <div class="card-title">{{ card.title }}</div>
              <div v-if="card.description" class="card-description">
                {{ card.description }}
              </div>
              <div v-if="card.trendValue !== undefined" class="card-trend-value">
                <span :class="card.trend === 'up' ? 'positive' : 'negative'">
                  {{ card.trendValue > 0 ? '+' : '' }}{{ card.trendValue }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Last Update -->
        <div class="cards-footer">
          <span class="update-text">{{ updateText }}</span>
          <button
            v-if="error"
            class="retry-btn"
            @click="fetchStatistics"
            title="重试"
          >
            🔄 重试
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useStatisticsCards,
  type StatCard,
  type StatCategory
} from '../composables/useStatisticsCards'
import { useStatsVisibility } from '../composables/useStatsVisibility'
import StatsVisibilitySelector from './StatsVisibilitySelector.vue'

interface Props {
  agents?: Array<{
    framework?: string
    status: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  agents: () => []
})

// Statistics cards
const {
  isLoading,
  error,
  categories,
  totalCards,
  updateFromAgentsData,
  updateFromStatsData,
  updateFrameworkDistribution,
  fetchStatistics,
  formatValue,
  getTrendIcon,
  getTrendClass
} = useStatisticsCards()

// Stats visibility
const { isVisible } = useStatsVisibility()

// Visible categories (filtered by visibility settings)
const visibleCategories = computed(() => {
  return categories.value.filter(category => {
    // Map category id to visibility key
    const visibilityMap: Record<string, string> = {
      'overview': 'overview',
      'agents': 'agents',
      'performance': 'performance',
      'memory': 'memory',
      'frameworks': 'frameworks'
    }
    const key = visibilityMap[category.id] || 'overview'
    return isVisible(key as any)
  })
})

// UI state
const isCollapsed = ref(false)

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Format display value
const formatDisplayValue = (card: StatCard): string => {
  return formatValue(card)
}

// Handle card click
const handleCardClick = (card: StatCard): void => {
  if (card.clickAction) {
    console.log(`Card clicked: ${card.clickAction}`)
    // Could emit event or trigger action
  }
}

// Update time text
const updateText = computed(() => {
  const now = new Date()
  return `更新于 ${now.toLocaleTimeString()}`
})

// Get trend icon
const getTrendIconLocal = (card: StatCard): string => {
  return getTrendIcon(card.trend)
}

// Get trend class
const getTrendClassLocal = (card: StatCard): string => {
  return getTrendClass(card.trend)
}

// Initialize statistics on mount
onMounted(async () => {
  // Initial update from props
  if (props.agents && props.agents.length > 0) {
    // Count by status
    const stats = {
      total: props.agents.length,
      online: props.agents.filter(a => a.status === 'online' || a.status === 'ready').length,
      offline: props.agents.filter(a => a.status === 'offline' || a.status === 'paused').length,
      error: props.agents.filter(a => a.status === 'error').length
    }
    updateFromAgentsData(stats)

    // Update framework distribution
    updateFrameworkDistribution(props.agents)
  }

  // Try to fetch from backend
  await fetchStatistics()

  // Set up auto-refresh every 10 seconds
  setInterval(async () => {
    if (!isCollapsed.value) {
      await fetchStatistics()
    }
  }, 10000)
})

// Expose methods
defineExpose({
  toggleCollapsed,
  refresh: fetchStatistics
})
</script>

<style scoped>
.statistics-cards {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 900;
  font-size: 12px;
}

.cards-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cards-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 16px;
}

.toggle-mini {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.cards-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 280px;
  max-width: 400px;
  overflow: hidden;
  margin-top: 8px;
}

.category {
  padding: 16px;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-name {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-count {
  font-size: 10px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.cards-grid {
  display: grid;
  gap: 8px;
}

.cards-grid.grid-1 {
  grid-template-columns: 1fr;
}

.cards-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.cards-grid.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.cards-grid.grid-4 {
  grid-template-columns: repeat(2, 1fr);
}

.stat-card {
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-card:hover {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(100, 116, 139, 0.4);
}

.stat-card.is-clickable {
  cursor: pointer;
}

.stat-card.is-clickable:hover {
  border-color: rgba(59, 130, 246, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-icon {
  font-size: 14px;
}

.card-trend {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.card-trend.up {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.card-trend.down {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.card-trend.neutral {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  line-height: 1;
  margin-bottom: 4px;
}

.card-title {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 2px;
}

.card-description {
  font-size: 10px;
  color: #64748b;
  line-height: 1.3;
}

.card-trend-value {
  margin-top: 4px;
  font-size: 10px;
  font-weight: 500;
}

.card-trend-value .positive {
  color: #22c55e;
}

.card-trend-value .negative {
  color: #ef4444;
}

.cards-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.update-text {
  font-size: 10px;
  color: #64748b;
}

.retry-btn {
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 4px;
  color: #60a5fa;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: rgba(59, 130, 246, 0.3);
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
