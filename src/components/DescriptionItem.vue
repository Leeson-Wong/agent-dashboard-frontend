<template>
  <div :class="itemClasses">
    <div class="description-item__label" :style="labelStyle">
      {{ label }}<span v-if="showColon" class="description-item__colon">:</span>
    </div>
    <div class="description-item__content" :style="contentStyle">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

interface Props {
  label?: string
  content?: string
  span?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  content: ''
})

// Get config from parent
const config = inject('descriptionConfig', {
  size: 'md',
  layout: 'horizontal',
  column: 1,
  colon: true,
  labelStyle: undefined,
  contentStyle: undefined,
  bordered: false
})

// Computed
const itemClasses = computed(() => [
  'description-item',
  `description-item--${config.size}`,
  `description-item--${config.layout}`,
  {
    'description-item--bordered': config.bordered
  }
])

const showColon = computed(() => config.colon && config.layout === 'horizontal')

const labelStyle = computed(() => config.labelStyle || {})
const contentStyle = computed(() => config.contentStyle || {})
</script>

<style scoped>
.description-item {
  padding: 0.5rem 0;
}

.description-item--bordered {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

.description-item--bordered:last-child {
  border-bottom: none;
}

.description-item--horizontal {
  display: flex;
  gap: 1rem;
}

/* Label */
.description-item__label {
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
}

.description-item--sm .description-item__label {
  font-size: 0.8125rem;
  width: 5rem;
}

.description-item--md .description-item__label {
  font-size: 0.875rem;
  width: 8rem;
}

.description-item--lg .description-item__label {
  font-size: 0.9375rem;
  width: 10rem;
}

.description-item__colon {
  margin-right: 0.25rem;
}

/* Content */
.description-item__content {
  flex: 1;
  color: #111827;
}

.description-item--sm .description-item__content {
  font-size: 0.8125rem;
}

.description-item--md .description-item__content {
  font-size: 0.875rem;
}

.description-item--lg .description-item__content {
  font-size: 0.9375rem;
}

/* Vertical layout */
.description-item--vertical {
  flex-direction: column;
  gap: 0.25rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .description-item__label {
    color: #9ca3af;
  }

  .description-item__content {
    color: #f9fafb;
  }

  .description-item--bordered {
    border-bottom-color: #374151;
  }
}
</style>
