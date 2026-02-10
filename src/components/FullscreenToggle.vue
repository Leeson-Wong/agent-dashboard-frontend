<template>
  <button
    class="fullscreen-toggle"
    @click="toggleFullscreen"
    :title="tooltip"
  >
    <span class="fullscreen-icon">{{ currentIcon }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isFullscreen = ref(false)

// Current icon based on fullscreen state
const currentIcon = computed(() => {
  return isFullscreen.value ? '⛶' : '⛶'
})

// Tooltip text
const tooltip = computed(() => {
  return isFullscreen.value ? '退出全屏 (按 ESC)' : '进入全屏'
})

// Toggle fullscreen
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    enterFullscreen()
  } else {
    exitFullscreen()
  }
}

// Enter fullscreen
const enterFullscreen = () => {
  const element = document.documentElement

  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if ((element as any).webkitRequestFullscreen) {
    /* Safari */
    (element as any).webkitRequestFullscreen()
  } else if ((element as any).msRequestFullscreen) {
    /* IE11 */
    (element as any).msRequestFullscreen()
  }
}

// Exit fullscreen
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if ((document as any).webkitExitFullscreen) {
    /* Safari */
    (document as any).webkitExitFullscreen()
  } else if ((document as any).msExitFullscreen) {
    /* IE11 */
    (document as any).msExitFullscreen()
  }
}

// Handle fullscreen change
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// Handle fullscreen error
const handleFullscreenError = (event: Event) => {
  console.error('Fullscreen error:', event)
}

// Setup event listeners
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('fullscreenerror', handleFullscreenError)

  // Initialize state
  handleFullscreenChange()
})

// Cleanup event listeners
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('fullscreenerror', handleFullscreenError)
})

// Expose methods for external use
defineExpose({
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen
})
</script>

<style scoped>
.fullscreen-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.fullscreen-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  transform: scale(1.05);
}

.fullscreen-toggle:active {
  transform: scale(0.95);
}

.fullscreen-icon {
  font-size: 16px;
  display: block;
  transition: transform 0.3s ease;
}

.fullscreen-toggle:hover .fullscreen-icon {
  transform: scale(1.1);
}

/* Pulse animation when in fullscreen mode */
.fullscreen-toggle.fullscreen {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}

.fullscreen-toggle.fullscreen:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
}

/* Add subtle glow effect */
.fullscreen-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.fullscreen-toggle:hover::before {
  width: 100%;
  height: 100%;
}

/* Fullscreen mode indicator */
.fullscreen-toggle.fullscreen .fullscreen-icon {
  animation: pulse-fullscreen 2s ease-in-out infinite;
}

@keyframes pulse-fullscreen {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Animation for icon when entering/exiting fullscreen */
@keyframes fullscreenToggle {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.fullscreen-toggle:active .fullscreen-icon {
  animation: fullscreenToggle 0.3s ease;
}
</style>
