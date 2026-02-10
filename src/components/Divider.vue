<template>
  <div
    :class="dividerClasses"
    :role="role"
    :aria-orientation="orientation"
  >
    <span v-if="$slots.start || startText" class="divider__content divider__content--start">
      <slot name="start">{{ startText }}</slot>
    </span>

    <div class="divider__line" :style="lineStyles" />

    <span v-if="text || $slots.default" class="divider__content divider__content--center">
      <slot>{{ text }}</slot>
    </span>

    <div class="divider__line" :style="lineStyles" />

    <span v-if="$slots.end || endText" class="divider__content divider__content--end">
      <slot name="end">{{ endText }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type DividerVariant = 'solid' | 'dashed' | 'dotted'
export type DividerColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type DividerOrientation = 'horizontal' | 'vertical'

interface Props {
  text?: string
  startText?: string
  endText?: string
  variant?: DividerVariant
  color?: DividerColor
  orientation?: DividerOrientation
  thickness?: string
  spacing?: string
  role?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  color: 'default',
  orientation: 'horizontal',
  thickness: '1px',
  spacing: '1rem',
  role: 'separator'
})

// Divider classes
const dividerClasses = computed(() => {
  return [
    'divider',
    `divider--${props.orientation}`,
    `divider--${props.variant}`,
    `divider--${props.color}`,
    {
      'divider--has-text': props.text || props.$slots?.default,
      'divider--has-start': props.$slots?.start || props.startText,
      'divider--has-end': props.$slots?.end || props.endText
    }
  ]
})

// Line styles
const lineStyles = computed(() => {
  return {
    borderWidth: props.thickness,
    margin: props.orientation === 'horizontal' ? `0 ${props.spacing}` : `${props.spacing} 0`
  }
})
</script>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  width: 100%;
}

/* Horizontal */
.divider--horizontal {
  flex-direction: row;
}

.divider--horizontal .divider__line {
  flex: 1;
  border-top-style: solid;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

/* Vertical */
.divider--vertical {
  flex-direction: column;
  height: 100%;
  min-height: 1rem;
}

.divider--vertical .divider__line {
  flex: 1;
  border-left-style: solid;
  border-top: none;
  border-right: none;
  border-bottom: none;
}

/* Variants */
.divider--solid .divider__line {
  border-style: solid;
}

.divider--dashed .divider__line {
  border-style: dashed;
}

.divider--dotted .divider__line {
  border-style: dotted;
}

/* Colors */
.divider--default .divider__line {
  border-color: #e5e7eb;
}

.divider--primary .divider__line {
  border-color: #3b82f6;
}

.divider--success .divider__line {
  border-color: #22c55e;
}

.divider--warning .divider__line {
  border-color: #f59e0b;
}

.divider--error .divider__line {
  border-color: #ef4444;
}

.divider--info .divider__line {
  border-color: #06b6d4;
}

/* Content */
.divider__content {
  padding: 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.divider__content--start {
  padding-right: 0.75rem;
  padding-left: 0;
}

.divider__content--end {
  padding-left: 0.75rem;
  padding-right: 0;
}

.divider--primary .divider__content {
  color: #3b82f6;
}

.divider--success .divider__content {
  color: #22c55e;
}

.divider--warning .divider__content {
  color: #f59e0b;
}

.divider--error .divider__content {
  color: #ef4444;
}

.divider--info .divider__content {
  color: #06b6d4;
}

/* Vertical adjustments */
.divider--vertical.divider--has-start .divider__line:first-child,
.divider--vertical.divider--has-end .divider__line:last-child {
  display: none;
}

/* Horizontal adjustments */
.divider--horizontal.divider--has-start .divider__line:first-child,
.divider--horizontal.divider--has-end .divider__line:last-child {
  display: none;
}

/* Single line when no content */
.divider--horizontal:not(.divider--has-text):not(.divider--has-start):not(.divider--has-end) .divider__line:first-child {
  display: none;
}

.divider--vertical:not(.divider--has-text):not(.divider--has-start):not(.divider--has-end) .divider__line:first-child {
  display: none;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .divider--default .divider__line {
    border-color: #374151;
  }

  .divider__content {
    color: #9ca3af;
  }
}
</style>
