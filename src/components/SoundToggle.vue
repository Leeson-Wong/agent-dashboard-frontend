<template>
  <div class="sound-toggle">
    <button
      class="toggle-btn"
      @click="toggle"
      :class="{ enabled: isEnabled }"
      :title="isEnabled ? '关闭声音通知' : '开启声音通知'"
    >
      <span class="toggle-icon">{{ isEnabled ? '🔊' : '🔇' }}</span>
      <span class="toggle-label">{{ isEnabled ? '声音开' : '声音关' }}</span>
    </button>

    <!-- Volume slider (when enabled) -->
    <Transition name="slide">
      <div v-if="isEnabled" class="volume-control">
        <input
          type="range"
          min="0"
          max="100"
          :value="volume * 100"
          @input="handleVolumeChange"
          @mousedown="stopPropagation"
          class="volume-slider"
          title="音量调节"
        />
        <span class="volume-label">{{ Math.round(volume * 100) }}%</span>
      </div>
    </Transition>

    <!-- Test sound button -->
    <Transition name="fade">
      <button
        v-if="isEnabled"
        class="test-btn"
        @click="testSound"
        title="测试声音"
      >
        🔔
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useSoundNotifications } from '../composables/useSoundNotifications'

const {
  isEnabled,
  volume,
  toggle,
  setVolume,
  testSound
} = useSoundNotifications()

const handleVolumeChange = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const newVolume = parseInt(target.value) / 100
  setVolume(newVolume)
}

const stopPropagation = (event: Event): void => {
  event.stopPropagation()
}
</script>

<style scoped>
.sound-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: #e2e8f0;
}

.toggle-btn.enabled {
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.toggle-btn.enabled:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.5);
}

.toggle-icon {
  font-size: 16px;
  line-height: 1;
}

.toggle-label {
  font-weight: 500;
}

/* Volume control */
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #16a34a;
  transform: scale(1.2);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  background: #16a34a;
  transform: scale(1.2);
}

.volume-label {
  font-size: 11px;
  color: #94a3b8;
  min-width: 35px;
  text-align: right;
}

/* Test button */
.test-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  transform: scale(1.1);
}

.test-btn:active {
  transform: scale(0.95);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .toggle-label {
    display: none;
  }

  .volume-slider {
    width: 60px;
  }
}
</style>
