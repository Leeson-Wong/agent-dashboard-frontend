<template>
  <Transition name="fade-up">
    <button
      v-if="isVisible"
      class="scroll-to-top-button"
      @click="scrollToTop"
      title="返回顶部 (Home键)"
      aria-label="返回顶部"
    >
      <span class="arrow-icon">↑</span>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const SCROLL_THRESHOLD = 200 // Show button after scrolling 200px
const isVisible = ref(false)

/**
 * Handle scroll event
 */
const handleScroll = (): void => {
  isVisible.value = window.scrollY > SCROLL_THRESHOLD
}

/**
 * Scroll to top
 */
const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

/**
 * Handle keyboard
 */
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Home' && event.ctrlKey) {
    event.preventDefault()
    scrollToTop()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.scroll-to-top-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
}

.scroll-to-top-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.scroll-to-top-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.arrow-icon {
  color: white;
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

/* Fade Up Animation */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Dark mode adjustments */
:global(.dark-mode) .scroll-to-top-button {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

:global(.dark-mode) .scroll-to-top-button:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
}
</style>
