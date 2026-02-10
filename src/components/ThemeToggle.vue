<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :title="tooltip"
  >
    <span class="theme-icon">{{ currentIcon }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type ThemeMode = 'dark' | 'light' | 'auto'

const currentTheme = ref<ThemeMode>('dark')
const systemTheme = ref<'light' | 'dark'>('dark')

// Get current effective theme (considers 'auto' mode)
const effectiveTheme = computed<'light' | 'dark'>(() => {
  if (currentTheme.value === 'auto') {
    return systemTheme.value
  }
  return currentTheme.value
})

// Current icon based on theme
const currentIcon = computed(() => {
  return effectiveTheme.value === 'dark' ? '🌙' : '☀️'
})

// Tooltip text
const tooltip = computed(() => {
  const mode = currentTheme.value === 'auto' ? '自动' : (currentTheme.value === 'dark' ? '深色' : '浅色')
  const effective = effectiveTheme.value === 'dark' ? '深色模式' : '浅色模式'
  return `当前: ${mode} (${effective}) - 点击切换`
})

// Toggle theme
const toggleTheme = () => {
  // Cycle through: dark -> light -> auto -> dark
  if (currentTheme.value === 'dark') {
    currentTheme.value = 'light'
  } else if (currentTheme.value === 'light') {
    currentTheme.value = 'auto'
  } else {
    currentTheme.value = 'dark'
  }

  applyTheme()
  saveTheme()
}

// Apply theme to document
const applyTheme = () => {
  const root = document.documentElement
  root.classList.remove('theme-dark', 'theme-light')

  const theme = currentTheme.value === 'auto'
    ? systemTheme.value
    : currentTheme.value

  root.classList.add(`theme-${theme}`)
}

// Save theme to localStorage
const saveTheme = () => {
  try {
    // Get existing settings
    const saved = localStorage.getItem('userSettings')
    let settings = {}

    if (saved) {
      try {
        settings = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }

    // Update theme
    settings = { ...settings, theme: currentTheme.value }

    // Save back
    localStorage.setItem('userSettings', JSON.stringify(settings))

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: currentTheme.value }
    }))
  } catch (e) {
    console.error('Failed to save theme:', e)
  }
}

// Detect system theme changes
const updateSystemTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  systemTheme.value = prefersDark ? 'dark' : 'light'

  // Re-apply theme if in auto mode
  if (currentTheme.value === 'auto') {
    applyTheme()
  }
}

// Load theme from settings on mount
onMounted(() => {
  // Load saved theme
  const saved = localStorage.getItem('userSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      if (settings.theme && ['dark', 'light', 'auto'].includes(settings.theme)) {
        currentTheme.value = settings.theme
      }
    } catch (e) {
      console.error('Failed to parse settings:', e)
    }
  }

  // Detect system theme
  updateSystemTheme()

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme)

  // Listen for settings changes from other components
  window.addEventListener('theme-changed', ((e: CustomEvent) => {
    if (e.detail && e.detail.theme) {
      currentTheme.value = e.detail.theme
      applyTheme()
    }
  }) as EventListener)

  // Apply initial theme
  applyTheme()
})

// Watch for theme changes
watch(currentTheme, () => {
  applyTheme()
})

// Sync with settings changes from UserSettings component
watch(() => {
  // Check localStorage periodically for changes from UserSettings
  const saved = localStorage.getItem('userSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      return settings.theme
    } catch (e) {
      return null
    }
  }
  return null
}, (newTheme) => {
  if (newTheme && newTheme !== currentTheme.value) {
    currentTheme.value = newTheme
    applyTheme()
  }
})
</script>

<style scoped>
.theme-toggle {
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

.theme-toggle:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  font-size: 18px;
  display: block;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-icon {
  transform: rotate(20deg) scale(1.1);
}

/* Add subtle glow effect */
.theme-toggle::before {
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

.theme-toggle:hover::before {
  width: 100%;
  height: 100%;
}

/* Animation for icon change */
.theme-icon {
  animation: none;
}

@keyframes iconSwap {
  0% {
    transform: rotate(-20deg) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: rotate(0deg) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
}

.theme-toggle:active .theme-icon {
  animation: iconSwap 0.3s ease;
}
</style>
