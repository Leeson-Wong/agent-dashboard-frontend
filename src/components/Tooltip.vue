<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="isVisible"
        :ref="tooltipRef"
        class="tooltip"
        :class="[`tooltip-${placement}`, { 'tooltip-follow': followMouse }]"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        role="tooltip"
        :aria-hidden="!isVisible"
      >
        <div class="tooltip-content">
          <slot>{{ content }}</slot>
        </div>
        <div class="tooltip-arrow" :data-placement="placement"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useTooltip, type TooltipPlacement, type TooltipTrigger } from '../composables/useTooltip'

interface Props {
  content?: string
  placement?: TooltipPlacement
  delay?: number
  hideDelay?: number
  trigger?: TooltipTrigger
  followMouse?: boolean
  offset?: number
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  placement: 'top',
  delay: 300,
  hideDelay: 100,
  trigger: 'hover',
  followMouse: false,
  offset: 8
})

const emit = defineEmits<{
  show: []
  hide: []
}>()

const tooltipRef = ref<HTMLElement | null>(null)
const triggerElement = ref<HTMLElement | null>(null)

const {
  isVisible,
  position,
  show,
  hide,
  updatePosition,
  bindTrigger,
  unbindTrigger
} = useTooltip(props)

// Watch for visibility changes to emit events
watch(isVisible, (newValue) => {
  if (newValue) {
    emit('show')
    // Update position after tooltip is rendered
    setTimeout(updatePosition, 0)
  } else {
    emit('hide')
  }
})

// Find and bind to trigger element
onMounted(() => {
  // The trigger element should have a data-tooltip-target attribute
  // that matches the tooltip's id
  const targetId = tooltipRef.value?.getAttribute('data-tooltip-target')
  if (targetId) {
    triggerElement.value = document.querySelector(`[data-tooltip-id="${targetId}"]`) as HTMLElement
    if (triggerElement.value) {
      bindTrigger(triggerElement.value)
    }
  }
})

onUnmounted(() => {
  if (triggerElement.value) {
    unbindTrigger(triggerElement.value)
  }
})

// Expose methods for parent components
defineExpose({
  show,
  hide,
  updatePosition
})
</script>

<style scoped>
.tooltip {
  position: absolute;
  z-index: 10000;
  max-width: 300px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.4;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(100, 116, 139, 0.3);
}

/* Arrow positioning */
.tooltip-arrow[data-placement="top"] {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip-arrow[data-placement="bottom"] {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip-arrow[data-placement="left"] {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.tooltip-arrow[data-placement="right"] {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

/* Follow mouse mode */
.tooltip-follow {
  transition: none;
}

/* Fade animation */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Dark mode adjustments */
:global(.dark-mode) .tooltip {
  background: rgba(15, 23, 42, 0.98);
  border-color: rgba(100, 116, 139, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

:global(.dark-mode) .tooltip-arrow {
  background: rgba(15, 23, 42, 0.98);
  border-color: rgba(100, 116, 139, 0.4);
}
</style>
