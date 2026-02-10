<template>
  <div class="density-mode-selector">
    <button
      class="density-btn"
      @click="cycleDensity"
      :title="densityDescription"
    >
      <span class="density-icon">{{ densityIcon }}</span>
      <span class="density-label">{{ densityLabel }}</span>
      <span class="density-arrow">▾</span>
    </button>

    <!-- Density Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="density-dropdown">
        <div
          v-for="mode in densityModes"
          :key="mode.value"
          class="density-option"
          :class="{ active: currentDensity === mode.value }"
          @click="selectDensity(mode.value)"
        >
          <span class="option-icon">{{ mode.icon }}</span>
          <span class="option-label">{{ mode.label }}</span>
          <span class="option-description">{{ mode.description }}</span>
          <span v-if="currentDensity === mode.value" class="option-check">✓</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDisplayDensity, type DisplayDensity } from '../composables/useDisplayDensity'

const {
  currentDensity,
  densityDescription,
  densityIcon,
  setDensity,
  cycleDensity
} = useDisplayDensity()

const isOpen = ref(false)

// Density modes
const densityModes = computed(() => [
  {
    value: 'compact' as DisplayDensity,
    label: '紧凑',
    icon: '📐',
    description: '显示更多内容'
  },
  {
    value: 'comfortable' as DisplayDensity,
    label: '舒适',
    icon: '📏',
    description: '适合大多数情况'
  },
  {
    value: 'spacious' as DisplayDensity,
    label: '宽松',
    icon: '📏',
    description: '更舒适的视觉体验'
  }
])

// Current density label
const densityLabel = computed(() => {
  const mode = densityModes.value.find(m => m.value === currentDensity.value)
  return mode?.label || '舒适'
})

// Select density
const selectDensity = (density: DisplayDensity): void => {
  setDensity(density)
  isOpen.value = false
}

// Handle click outside to close
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  if (!target.closest('.density-mode-selector')) {
    isOpen.value = false
  }
}

// Toggle dropdown
const toggleDropdown = (): void => {
  isOpen.value = !isOpen.value
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.density-mode-selector {
  position: relative;
  display: inline-block;
}

.density-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.density-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.density-btn:active {
  transform: scale(0.98);
}

.density-icon {
  font-size: 16px;
}

.density-label {
  flex: 1;
}

.density-arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.density-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 6px;
  z-index: 1000;
}

.density-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.density-option:hover {
  background: rgba(59, 130, 246, 0.15);
}

.density-option.active {
  background: rgba(59, 130, 246, 0.2);
}

.option-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.option-label {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  flex: 1;
}

.option-description {
  font-size: 11px;
  color: #94a3b8;
  margin-right: auto;
  padding-left: 8px;
}

.option-check {
  font-size: 14px;
  color: #3b82f6;
  font-weight: bold;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 768px) {
  .density-dropdown {
    right: auto;
    left: 0;
  }

  .option-description {
    display: none;
  }
}
</style>
