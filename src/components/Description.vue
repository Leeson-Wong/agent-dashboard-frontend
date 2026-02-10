<template>
  <div :class="descriptionClasses">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'

export type DescriptionSize = 'sm' | 'md' | 'lg'
export type DescriptionLayout = 'horizontal' | 'vertical'

interface Props {
  size?: DescriptionSize
  layout?: DescriptionLayout
  column?: number
  colon?: boolean
  labelStyle?: Record<string, any>
  contentStyle?: Record<string, any>
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  layout: 'horizontal',
  column: 1,
  colon: true,
  bordered: false
})

// Provide configuration to children
provide('descriptionConfig', {
  size: props.size,
  layout: props.layout,
  column: props.column,
  colon: props.colon,
  labelStyle: props.labelStyle,
  contentStyle: props.contentStyle,
  bordered: props.bordered
})

// Computed
const descriptionClasses = computed(() => [
  'description',
  `description--${props.size}`,
  `description--${props.layout}`,
  `description--${props.column}-column`,
  {
    'description--bordered': props.bordered
  }
])
</script>

<style scoped>
.description {
  width: 100%;
}

.description--horizontal {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
}

.description--2-column {
  grid-template-columns: repeat(2, 1fr);
}

.description--3-column {
  grid-template-columns: repeat(3, 1fr);
}

.description--4-column {
  grid-template-columns: repeat(4, 1fr);
}

.description--vertical {
  display: flex;
  flex-direction: column;
}

.description--bordered {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}
</style>
