<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal"
        :class="modalClasses"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="modal__backdrop" />

        <!-- Modal Container -->
        <div
          ref="modalRef"
          class="modal__container"
          :class="containerClasses"
          @click.stop
        >
          <!-- Header -->
          <div v-if="$slots.header || title" class="modal__header">
            <div class="modal__header-content">
              <slot name="header">
                <h2 :id="titleId" class="modal__title">{{ title }}</h2>
              </slot>
            </div>

            <button
              v-if="closable"
              type="button"
              class="modal__close"
              :aria-label="closeButtonLabel"
              @click="close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal__body" :class="bodyClasses">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type ModalPosition = 'center' | 'top'

interface Props {
  modelValue: boolean
  title?: string
  size?: ModalSize
  position?: ModalPosition
  closable?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  scrollLock?: boolean
  closeButtonLabel?: string
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  position: 'center',
  closable: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  scrollLock: true,
  closeButtonLabel: 'Close modal'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open': []
  'close': []
  'before-open': []
  'before-close': []
}>()

const modalRef = ref<HTMLElement>()
const titleId = `modal-title-${Math.random().toString(36).slice(2, 11)}`

// Modal classes
const modalClasses = computed(() => {
  return [
    `modal--${props.position}`
  ]
})

// Container classes
const containerClasses = computed(() => {
  return [
    `modal__container--${props.size}`
  ]
})

// Body classes
const bodyClasses = computed(() => {
  return {
    'modal__body--has-footer': props.$slots?.footer
  }
})

// Close modal
const close = (): void => {
  emit('update:modelValue', false)
  emit('close')
}

// Handle backdrop click
const handleBackdropClick = (): void => {
  if (props.closeOnBackdrop && !props.persistent) {
    close()
  }
}

// Handle escape key
const handleEscape = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
    close()
  }
}

// Lock body scroll
const lockScroll = (): void => {
  if (props.scrollLock) {
    document.body.style.overflow = 'hidden'
  }
}

// Unlock body scroll
const unlockScroll = (): void => {
  if (props.scrollLock) {
    document.body.style.overflow = ''
  }
}

// Watch for open state
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    emit('before-open')
    nextTick(() => {
      emit('open')
      lockScroll()
      // Focus first focusable element
      if (modalRef.value) {
        const focusable = modalRef.value.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }
    })
  } else {
    emit('before-close')
    nextTick(() => {
      emit('close')
      unlockScroll()
    })
  }
})

// Mount/unmount handlers
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  unlockScroll()
})

// Expose methods
defineExpose({
  close,
  open: () => emit('update:modelValue', true)
})
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Positions */
.modal--center {
  align-items: center;
}

.modal--top {
  align-items: flex-start;
  padding-top: 10vh;
}

/* Backdrop */
.modal__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

/* Container */
.modal__container {
  position: relative;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Sizes */
.modal__container--sm {
  width: 100%;
  max-width: 24rem;
}

.modal__container--md {
  width: 100%;
  max-width: 32rem;
}

.modal__container--lg {
  width: 100%;
  max-width: 48rem;
}

.modal__container--xl {
  width: 100%;
  max-width: 64rem;
}

.modal__container--full {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100vh;
  border-radius: 0;
}

/* Header */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal__header-content {
  flex: 1;
}

.modal__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal__close:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.modal__close svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Body */
.modal__body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal__body--has-footer {
  padding-bottom: 1rem;
}

/* Footer */
.modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal__backdrop,
.modal-leave-active .modal__backdrop {
  transition: opacity 0.3s ease;
}

.modal-enter-from .modal__backdrop,
.modal-leave-to .modal__backdrop {
  opacity: 0;
}

.modal-enter-from .modal__container,
.modal-leave-to .modal__container {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to .modal__container,
.modal-leave-from .modal__container {
  opacity: 1;
  transform: scale(1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .modal__backdrop {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .modal__container {
    background-color: #1f2937;
  }

  .modal__title {
    color: #f9fafb;
  }

  .modal__close {
    color: #9ca3af;
  }

  .modal__close:hover {
    color: #d1d5db;
    background-color: #374151;
  }

  .modal__header,
  .modal__footer {
    border-color: #374151;
  }
}
</style>
