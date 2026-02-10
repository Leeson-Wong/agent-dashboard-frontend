<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="menuOpen"
        ref="menuRef"
        class="context-menu"
        :style="menuStyle"
        @click.stop
      >
        <div
          v-for="(item, index) in menuItems"
          :key="item.id || index"
          class="context-menu-item"
          :class="{
            'disabled': item.disabled,
            'danger': item.danger,
            'separator': item.separator
          }"
          @click="handleItemClick(item)"
        >
          <div v-if="item.separator" class="menu-separator"></div>
          <template v-else>
            <span v-if="item.icon" class="menu-icon">{{ item.icon }}</span>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useContextMenu, registerCloseMenu, type ContextMenuItem } from '../composables/useContextMenu'

const {
  menuOpen,
  menuPosition,
  menuItems,
  closeMenu
} = useContextMenu()

const menuRef = ref<HTMLElement | null>(null)

// Calculate menu position to keep it within viewport
const menuStyle = computed(() => {
  const x = menuPosition.value.x
  const y = menuPosition.value.y

  // Get viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Get menu dimensions (estimate before render)
  const menuWidth = 200
  const menuHeight = menuItems.value.length * 36 + 16 // 36px per item + padding

  // Adjust position if menu would go off screen
  let adjustedX = x
  let adjustedY = y

  if (x + menuWidth > viewportWidth) {
    adjustedX = viewportWidth - menuWidth - 8
  }

  if (y + menuHeight > viewportHeight) {
    adjustedY = viewportHeight - menuHeight - 8
  }

  return {
    left: `${adjustedX}px`,
    top: `${adjustedY}px`
  }
})

// Handle menu item click
const handleItemClick = (item: ContextMenuItem): void => {
  if (!item.disabled && !item.separator) {
    item.action()
    closeMenu()
  }
}

// Handle click outside to close menu
const handleClickOutside = (event: MouseEvent): void => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

// Handle escape key to close menu
const handleEscapeKey = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
  }
}

// Register close menu function globally
onMounted(() => {
  registerCloseMenu(closeMenu)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
})

// Watch for menu open changes
watch(menuOpen, (isOpen) => {
  if (isOpen) {
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 180px;
  max-width: 280px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: 6px;
  user-select: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.context-menu-item:hover:not(.disabled):not(.separator) {
  background: rgba(59, 130, 246, 0.15);
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.danger:hover:not(.disabled) {
  background: rgba(239, 68, 68, 0.15);
}

.context-menu-item.danger .menu-label {
  color: #f87171;
}

.context-menu-item.separator {
  padding: 0;
  margin: 4px 0;
  pointer-events: none;
}

.menu-separator {
  height: 1px;
  background: rgba(100, 116, 139, 0.2);
  margin: 0;
}

.menu-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
  font-size: 13px;
  color: #e2e8f0;
}

.menu-shortcut {
  font-size: 11px;
  color: #64748b;
  margin-left: auto;
}

/* Transition */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: all 0.15s ease;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Scrollbar for long menus */
.context-menu {
  max-height: 400px;
  overflow-y: auto;
}

.context-menu::-webkit-scrollbar {
  width: 6px;
}

.context-menu::-webkit-scrollbar-track {
  background: transparent;
}

.context-menu::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.context-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>
