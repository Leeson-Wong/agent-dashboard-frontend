<template>
  <nav :class="breadcrumbClasses" aria-label="Breadcrumb">
    <ol class="breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumb__item"
        :class="{ 'breadcrumb__item--active': index === items.length - 1 }"
      >
        <!-- Icon for home/first item -->
        <component
          :is="isFirst && item.icon ? item.icon : 'a'"
          v-if="index === 0 && item.icon"
          :href="isFirst ? undefined : item.href"
          class="breadcrumb__link breadcrumb__link--icon"
          @click="handleClick(item, index)"
        >
          <component :is="item.icon" class="breadcrumb__icon" />
        </component>

        <!-- Regular breadcrumb link -->
        <component
          :is="isLast ? 'span' : 'a'"
          v-else-if="!isLast"
          :href="isLast ? undefined : item.href"
          class="breadcrumb__link"
          @click="handleClick(item, index)"
        >
          <slot name="item" :item="item">
            {{ item.label }}
          </slot>
        </component>

        <!-- Active breadcrumb (last item) -->
        <span v-else class="breadcrumb__current">
          <slot name="item" :item="item">
            {{ item.label }}
          </slot>
        </span>

        <!-- Separator (not for last item) -->
        <span
          v-if="!isLast"
          class="breadcrumb__separator"
          :aria-hidden="true"
        >
          <slot name="separator">
            <component :is="separatorIcon" class="breadcrumb__separator-icon" />
          </slot>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: any
  disabled?: boolean
  onClick?: () => void
}

export type BreadcrumbSize = 'sm' | 'md' | 'lg'
export type BreadcrumbSeparator = 'slash' | 'arrow' | 'bullet' | 'dot'

interface Props {
  items: BreadcrumbItem[]
  size?: BreadcrumbSize
  separator?: BreadcrumbSeparator
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  separator: 'slash'
})

const emit = defineEmits<{
  'click': [item: BreadcrumbItem, index: number]
}>()

// Default separator icons
const separatorIcons = {
  slash: defineComponent({
    render: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('polyline', { points: '9 18 15 12 3' })
    ])
  }),
  arrow: defineComponent({
    render: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('polyline', { points: '9 6 15 12 15' })
    ])
  }),
  bullet: defineComponent({
    render: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '1', fill: 'currentColor' })
    ])
  }),
  dot: defineComponent({
    render: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '3', fill: 'currentColor' })
    ])
  })
}

const separatorIcon = computed(() => separatorIcons[props.separator])

// Breadcrumb classes
const breadcrumbClasses = computed(() => {
  return [
    'breadcrumb',
    `breadcrumb--${props.size}`
  ]
})

// Computed properties
const isFirst = computed(() => true)
const isLast = computed(() => false)

// Handle click
const handleClick = (item: BreadcrumbItem, index: number): void => {
  if (!item.disabled) {
    if (item.onClick) {
      item.onClick()
    }
    emit('click', item, index)
  }
}
</script>

<style scoped>
.breadcrumb {
  width: 100%;
}

/* List */
.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Item */
.breadcrumb__item {
  display: flex;
  align-items: center;
}

.breadcrumb__item:not(:last-child) {
  margin-right: 0.5rem;
}

/* Link */
.breadcrumb__link {
  display: flex;
  align-items: center;
  font-size: inherit;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
}

.breadcrumb__link:hover {
  color: #3b82f6;
}

.breadcrumb__link:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.breadcrumb__link--icon {
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.breadcrumb__link--icon:hover {
  background-color: #f3f4f6;
}

/* Icon */
.breadcrumb__icon {
  width: 1em;
  height: 1em;
}

/* Separator */
.breadcrumb__separator {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  color: #9ca3af;
}

.breadcrumb__separator-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* Current (Active Item) */
.breadcrumb__current {
  display: flex;
  align-items: center;
  font-size: inherit;
  font-weight: 500;
  color: #111827;
}

/* Sizes */
.breadcrumb--sm .breadcrumb__link,
.breadcrumb--sm .breadcrumb__current {
  font-size: 0.875rem;
}

.breadcrumb--md .breadcrumb__link,
.breadcrumb--md .breadcrumb__current {
  font-size: 0.9375rem;
}

.breadcrumb--lg .breadcrumb__link,
.breadcrumb--lg .breadcrumb__current {
  font-size: 1rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .breadcrumb__link {
    color: #9ca3af;
  }

  .breadcrumb__link:hover {
    color: #60a5fa;
  }

  .breadcrumb__separator {
    color: #6b7280;
  }

  .breadcrumb__current {
    color: #f9fafb;
  }
}
</style>
