<template>
  <div class="time-display" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button
      class="time-toggle"
      @click="toggleCollapsed"
      :title="isCollapsed ? '展开时间显示' : '收起时间显示'"
    >
      <span class="toggle-icon">🕐</span>
    </button>

    <Transition name="expand">
      <div v-if="!isCollapsed" class="time-container">
        <!-- Current Time -->
        <div class="time-section">
          <div class="time-value">{{ formattedTime }}</div>
          <div class="time-label">{{ formattedDate }}</div>
        </div>

        <!-- Session Timer -->
        <div class="session-section">
          <div class="session-label">会话时长</div>
          <div class="session-value">{{ formattedDuration }}</div>
        </div>

        <!-- Timezone -->
        <div class="timezone-section">
          <span class="timezone-label">时区: {{ timezone }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeDisplay } from '../composables/useTimeDisplay'

// Time display
const {
  formattedTime,
  formattedDate,
  formattedDuration
} = useTimeDisplay()

// UI state
const isCollapsed = ref(false)

// Toggle collapsed state
const toggleCollapsed = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// Get timezone
const timezone = ref('')

onMounted(() => {
  try {
    timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    timezone.value = 'Local'
  }
})

// Expose methods
defineExpose({
  toggleCollapsed
})
</script>

<style scoped>
.time-display {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 850;
  font-size: 12px;
}

.time-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
}

.toggle-icon {
  font-size: 18px;
}

.time-container {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 180px;
  overflow: hidden;
  margin-top: 8px;
}

.time-section {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.time-value {
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  line-height: 1;
  margin-bottom: 4px;
}

.time-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.session-section {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
}

.session-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.session-value {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

.timezone-section {
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.5);
}

.timezone-label {
  font-size: 10px;
  color: #475569;
  font-weight: 500;
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

/* Responsive */
@media (max-width: 768px) {
  .time-display {
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
  }

  .time-value {
    font-size: 20px;
  }
}
</style>
