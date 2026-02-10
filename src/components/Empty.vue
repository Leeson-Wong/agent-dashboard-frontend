<template>
  <div :class="emptyClasses">
    <!-- Image/Illustration -->
    <div v-if="showImage" class="empty__image">
      <slot name="image">
        <component :is="defaultImage" class="empty__image-svg" />
      </slot>
    </div>

    <!-- Description -->
    <div v-if="description" class="empty__description">
      {{ description }}
    </div>

    <!-- Extra Content -->
    <div v-if="$slots.default" class="empty__content">
      <slot></slot>
    </div>

    <!-- Actions -->
    <div v-if="showActions" class="empty__actions">
      <slot name="actions">
        <Button
          v-if="action"
          @click="handleAction"
        >
          {{ action }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export type EmptyType = 'plain' | 'image' | 'list' | 'table' | 'search' | 'error' | 'custom'
export type EmptySize = 'sm' | 'md' | 'lg'

interface Props {
  type?: EmptyType
  description?: string
  size?: EmptySize
  showImage?: boolean
  action?: string
  image?: any
}

const props = withDefaults(defineProps<Props>(), {
  type: 'plain',
  size: 'md',
  showImage: true
})

const emit = defineEmits<{
  action: []
}>()

// Empty classes
const emptyClasses = computed(() => [
  'empty',
  `empty--${props.type}`,
  `empty--${props.size}`
])

// Default images
const defaultImage = computed(() => {
  if (props.image) return props.image

  const images = {
    plain: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('g', { transform: 'translate(0 1)' }, [
          h('path', {
            d: 'M42.197 32.691a1.5 1.5 0 0 1-.753 1.957l-5.05 2.226a1.5 1.5 0 0 1-2.056-1.356l-.52-5.755a1.5 1.5 0 0 1 2.056-1.644l5.05 2.226a1.5 1.5 0 0 1 .753 1.957z',
            fill: '#E5E7EB'
          }),
          h('path', {
            d: 'M54 28v5H12v-5a4 4 0 0 1 4-4h34a4 4 0 0 1 4 4z',
            fill: '#E5E7EB'
          }),
          h('path', {
            d: 'M44.5 15h-23a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h23a4 4 0 0 0 4-4V19a4 4 0 0 0-4-4z',
            fill: '#E5E7EB'
          })
        ])
      ])
    }),
    image: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('rect', {
          x: '4',
          y: '4',
          width: '56',
          height: '33',
          rx: '2',
          fill: '#E5E7EB'
        }),
        h('circle', { cx: '24', cy: '20', r: '4', fill: '#D1D5DB' }),
        h('path', {
          d: 'M4 30l10-10 8 8 12-12 16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z',
          fill: '#D1D5DB'
        })
      ])
    }),
    list: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('rect', { x: '8', y: '4', width: '48', height: '4', rx: '2', fill: '#E5E7EB' }),
        h('rect', { x: '8', y: '12', width: '48', height: '4', rx: '2', fill: '#E5E7EB' }),
        h('rect', { x: '8', y: '20', width: '48', height: '4', rx: '2', fill: '#E5E7EB' }),
        h('rect', { x: '8', y: '28', width: '32', height: '4', rx: '2', fill: '#E5E7EB' })
      ])
    }),
    table: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('rect', { x: '4', y: '4', width: '56', height: '33', rx: '2', fill: '#E5E7EB' }),
        h('rect', { x: '4', y: '12', width: '56', height: '4', fill: '#D1D5DB' }),
        h('rect', { x: '12', y: '20', width: '16', height: '4', rx: '2', fill: '#D1D5DB' }),
        h('rect', { x: '36', y: '20', width: '16', height: '4', rx: '2', fill: '#D1D5DB' }),
        h('rect', { x: '12', y: '28', width: '16', height: '4', rx: '2', fill: '#D1D5DB' }),
        h('rect', { x: '36', y: '28', width: '16', height: '4', rx: '2', fill: '#D1D5DB' })
      ])
    }),
    search: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('circle', { cx: '27', cy: '20', r: '8', fill: '#E5E7EB' }),
        h('path', {
          d: 'M33 26l5 5',
          stroke: '#E5E7EB',
          'stroke-width': '3',
          'stroke-linecap': 'round'
        })
      ])
    }),
    error: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('circle', { cx: '32', cy: '20', r: '12', fill: '#E5E7EB' }),
        h('path', {
          d: 'M28 16l8 8M36 16l-8 8',
          stroke: '#9CA3AF',
          'stroke-width': '2',
          'stroke-linecap': 'round'
        })
      ])
    }),
    custom: defineComponent({
      render: () => h('svg', {
        viewBox: '0 0 64 41',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'empty__image-svg'
      }, [
        h('rect', {
          x: '16',
          y: '4',
          width: '32',
          height: '32',
          rx: '4',
          fill: '#E5E7EB'
        }),
        h('circle', { cx: '32', cy: '20', r: '6', fill: '#D1D5DB' })
      ])
    })
  }
  return images[props.type]
})

// Show actions
const showActions = computed(() => {
  return !!props.action || !!$slots.actions
})

// Handle action
const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

/* Sizes */
.empty--sm {
  padding: 1rem;
}

.empty--md {
  padding: 2rem;
}

.empty--lg {
  padding: 3rem;
}

/* Image */
.empty__image {
  margin-bottom: 1rem;
}

.empty--sm .empty__image {
  margin-bottom: 0.75rem;
}

.empty--lg .empty__image {
  margin-bottom: 1.5rem;
}

.empty__image-svg {
  width: 100%;
  max-width: 150px;
  height: auto;
}

.empty--sm .empty__image-svg {
  max-width: 100px;
}

.empty--lg .empty__image-svg {
  max-width: 200px;
}

/* Description */
.empty__description {
  font-size: 0.9375rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  max-width: 400px;
}

.empty--sm .empty__description {
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.empty--lg .empty__description {
  font-size: 1rem;
  margin-bottom: 2rem;
}

/* Content */
.empty__content {
  margin-bottom: 1.5rem;
}

.empty--sm .empty__content {
  margin-bottom: 1rem;
}

.empty--lg .empty__content {
  margin-bottom: 2rem;
}

/* Actions */
.empty__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .empty__description {
    color: #d1d5db;
  }
}
</style>
