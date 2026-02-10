<template>
  <div class="timeline" :class="timelineClasses">
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      class="timeline-item"
      :class="getItemClasses(item)"
    >
      <!-- Timeline Icon -->
      <div class="timeline-item__icon">
        <component :is="getIcon(item)" class="timeline-item__icon-svg" />
      </div>

      <!-- Timeline Content -->
      <div class="timeline-item__content">
        <!-- Time -->
        <div v-if="showTime" class="timeline-item__time">
          {{ item.time }}
        </div>

        <!-- Title -->
        <div v-if="item.title" class="timeline-item__title">
          {{ item.title }}
        </div>

        <!-- Description -->
        <div v-if="item.description" class="timeline-item__description">
          {{ item.description }}
        </div>

        <!-- Extra Content Slot -->
        <div v-if="$slots.extra" class="timeline-item__extra">
          <slot name="extra" :item="item" />
        </div>

        <!-- Tags -->
        <div v-if="item.tags?.length" class="timeline-item__tags">
          <Chip
            v-for="tag in item.tags"
            :key="tag"
            :label="tag"
            size="xs"
            variant="soft"
          />
        </div>
      </div>

      <!-- Connecting Line (not for last item) -->
      <div
        v-if="index < items.length - 1"
        class="timeline-item__line"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import Chip from './Chip.vue'

export type TimelineSize = 'sm' | 'md' | 'lg'
export type TimelineVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

export interface TimelineItem {
  id?: string | number
  time?: string
  title?: string
  description?: string
  icon?: any
  tags?: string[]
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  disabled?: boolean
}

interface Props {
  items: TimelineItem[]
  size?: TimelineSize
  variant?: TimelineVariant
  showTime?: boolean
  align?: 'left' | 'right' | 'center'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  showTime: true,
  align: 'left'
})

// Timeline classes
const timelineClasses = computed(() => [
  'timeline',
  `timeline--${props.size}`,
  `timeline--${props.align}`
])

// Get item classes
const getItemClasses = (item: TimelineItem) => {
  return [
    `timeline-item--${item.type || 'default'}`,
    {
      'timeline-item--disabled': item.disabled
    }
  ]
}

// Get icon
const getIcon = (item: TimelineItem) => {
  if (item.icon) return item.icon

  // Default icons based on type
  const icons = {
    default: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [h('circle', { cx: '12', cy: '12', r: '4', fill: 'currentColor' })])
    }),
    primary: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [h('circle', { cx: '12', cy: '12', r: '4', fill: 'currentColor' })])
    }),
    success: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [h('polyline', { points: '20 6 9 17 4 12' })])
    }),
    warning: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 1 1.71 3h16.94a2 2 0 0 1 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' })])
    }),
    error: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2'
      }, [h('circle', { cx: '12', cy: '12', r: '10' }), h('line', { x1: '15', y1: '9', x2: '9', y2: '15' }), h('line', { x1: '9', y1: '9', x2: '15', y2: '15' })])
    })
  }

  return icons[item.type || 'default']
}
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Alignment */
.timeline--left .timeline-item {
  align-items: flex-start;
}

.timeline--right .timeline-item {
  align-items: flex-end;
  flex-direction: row-reverse;
}

.timeline--right .timeline-item__content {
  text-align: right;
}

.timeline--center .timeline-item {
  align-items: center;
}

.timeline--center .timeline-item__content {
  text-align: center;
}

/* Timeline Item */
.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
}

.timeline--left .timeline-item {
  flex-direction: row;
}

.timeline--right .timeline-item {
  flex-direction: row-reverse;
}

.timeline--center .timeline-item {
  flex-direction: column;
  align-items: center;
}

/* Icon */
.timeline-item__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
}

.timeline-item--default .timeline-item__icon {
  color: #6b7280;
}

.timeline-item--primary .timeline-item__icon {
  background-color: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.timeline-item--success .timeline-item__icon {
  background-color: #dcfce7;
  border-color: #22c55e;
  color: #22c55e;
}

.timeline-item--warning .timeline-item__icon {
  background-color: #fef3c7;
  border-color: #f59e0b;
  color: #f59e0b;
}

.timeline-item--error .timeline-item__icon {
  background-color: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

.timeline-item__icon-svg {
  width: 1rem;
  height: 1rem;
}

/* Sizes */
.timeline--sm .timeline-item__icon {
  width: 2rem;
  height: 2rem;
}

.timeline--sm .timeline-item__icon-svg {
  width: 0.75rem;
  height: 0.75rem;
}

.timeline--lg .timeline-item__icon {
  width: 3rem;
  height: 3rem;
}

.timeline--lg .timeline-item__icon-svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Content */
.timeline-item__content {
  flex: 1;
}

.timeline--center .timeline-item__content {
  width: 100%;
}

/* Time */
.timeline-item__time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.timeline--sm .timeline-item__time {
  font-size: 0.6875rem;
}

.timeline--lg .timeline-item__time {
  font-size: 0.8125rem;
}

/* Title */
.timeline-item__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.timeline--sm .timeline-item__title {
  font-size: 0.875rem;
}

.timeline--lg .timeline-item__title {
  font-size: 1rem;
}

.timeline-item--disabled .timeline-item__title {
  color: #9ca3af;
}

/* Description */
.timeline-item__description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.timeline--sm .timeline-item__description {
  font-size: 0.8125rem;
}

.timeline--lg .timeline-item__description {
  font-size: 0.9375rem;
}

.timeline-item--disabled .timeline-item__description {
  color: #9ca3af;
}

/* Extra Content */
.timeline-item__extra {
  margin-top: 0.5rem;
}

/* Tags */
.timeline-item__tags {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

/* Line */
.timeline-item__line {
  position: absolute;
  left: calc(1.25rem + 1px);
  top: 2.5rem;
  bottom: -1.5rem;
  width: 2px;
  background-color: #e5e7eb;
}

.timeline--left .timeline-item__line {
  left: calc(2.5rem / 2);
}

.timeline--right .timeline-item__line {
  right: calc(2.5rem / 2);
  left: auto;
}

.timeline--center .timeline-item__line {
  display: none;
}

.timeline--sm .timeline-item__line {
  top: 2rem;
}

.timeline--lg .timeline-item__line {
  top: 3rem;
}

/* Disabled */
.timeline-item--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .timeline-item__icon {
    background-color: #1f2937;
    border-color: #374151;
  }

  .timeline-item--default .timeline-item__icon {
    color: #9ca3af;
  }

  .timeline-item__time {
    color: #6b7280;
  }

  .timeline-item__title {
    color: #f9fafb;
  }

  .timeline-item__description {
    color: #d1d5db;
  }

  .timeline-item__line {
    background-color: #374151;
  }
}
</style>
