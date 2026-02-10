<template>
  <div :class="configProviderClasses" :style="providerStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'
export type Locale = 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR' | 'de-DE' | 'fr-FR' | 'es-ES' | 'pt-BR'
export type Size = 'sm' | 'md' | 'lg'
export type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error'

export interface ComponentConfig {
  size?: Size
  variant?: Variant
  disabled?: boolean
  loading?: boolean
}

interface Config {
  theme?: Theme
  locale?: Locale
  primaryColor?: string
  successColor?: string
  warningColor?: string
  errorColor?: string
  borderRadius?: string | number
  fontSize?: string | number
  fontFamily?: string
  componentSize?: Size
  componentVariant?: Variant
  rtl?: boolean
  components?: Record<string, ComponentConfig>
}

interface Props {
  config?: Config
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

// Default configuration
const defaultConfig: Config = {
  theme: 'light',
  locale: 'en-US',
  primaryColor: '#3b82f6',
  successColor: '#22c55e',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  componentSize: 'md',
  componentVariant: 'default',
  rtl: false,
  components: {}
}

// Current configuration (merged)
const currentConfig = ref<Config>({ ...defaultConfig, ...props.config })

// Provide configuration to all children
provide('config', currentConfig)

// Computed classes
const configProviderClasses = computed(() => [
  'config-provider',
  `config-provider--theme-${currentConfig.value.theme}`,
  {
    'config-provider--rtl': currentConfig.value.rtl
  }
])

// Computed style
const providerStyle = computed(() => {
  const style: Record<string, string> = {}

  // Set CSS variables for theme
  if (currentConfig.value.primaryColor) {
    style['--primary-color'] = currentConfig.value.primaryColor
  }
  if (currentConfig.value.successColor) {
    style['--success-color'] = currentConfig.value.successColor
  }
  if (currentConfig.value.warningColor) {
    style['--warning-color'] = currentConfig.value.warningColor
  }
  if (currentConfig.value.errorColor) {
    style['--error-color'] = currentConfig.value.errorColor
  }
  if (currentConfig.value.borderRadius !== undefined) {
    style['--border-radius'] = typeof currentConfig.value.borderRadius === 'number'
      ? `${currentConfig.value.borderRadius}px`
      : currentConfig.value.borderRadius
  }
  if (currentConfig.value.fontSize !== undefined) {
    style['--font-size'] = typeof currentConfig.value.fontSize === 'number'
      ? `${currentConfig.value.fontSize}px`
      : currentConfig.value.fontSize
  }
  if (currentConfig.value.fontFamily) {
    style['--font-family'] = currentConfig.value.fontFamily
  }
  if (currentConfig.value.componentSize) {
    style['--component-size'] = currentConfig.value.componentSize
  }
  if (currentConfig.value.componentVariant) {
    style['--component-variant'] = currentConfig.value.componentVariant
  }

  return style
})

// Watch for config changes
watch(() => props.config, (newConfig) => {
  currentConfig.value = { ...defaultConfig, ...newConfig }
}, { deep: true })

// Apply theme to document
const applyTheme = () => {
  const theme = currentConfig.value.theme || 'light'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const effectiveTheme = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme

  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Apply RTL
const applyRTL = () => {
  if (currentConfig.value.rtl) {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }
}

// Initialize
applyTheme()
applyRTL()

// Watch for theme changes
watch(() => currentConfig.value.theme, applyTheme)
watch(() => currentConfig.value.rtl, applyRTL)
</script>

<style scoped>
.config-provider {
  /* CSS variables are set via inline styles */
  --primary-color: #3b82f6;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --border-radius: 0.375rem;
  --font-size: 0.875rem;
  --font-family: system-ui, -apple-system, sans-serif;
  --component-size: md;
  --component-variant: default;
}

.config-provider--rtl {
  direction: rtl;
}
</style>
