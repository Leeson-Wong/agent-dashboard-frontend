<template>
  <div :class="paginationClasses">
    <!-- Previous Button -->
    <Button
      :disabled="currentPage === 1 || disabled"
      :size="size"
      variant="outline"
      @click="goToPage(currentPage - 1)"
    >
      <template v-if="showIcons" #icon>
        <ChevronLeftIcon />
      </template>
      {{ previousText }}
    </Button>

    <!-- Page Numbers -->
    <div class="pagination__pages">
      <Button
        v-for="page in visiblePages"
        :key="page"
        :variant="page === currentPage ? 'solid' : 'ghost'"
        :size="size"
        :color="page === currentPage ? pageColor : 'default'"
        @click="goToPage(page)"
      >
        {{ page }}
      </Button>

      <!-- Ellipsis Start -->
      <span v-if="showStartEllipsis" class="pagination__ellipsis">...</span>

      <!-- Ellipsis End -->
      <span v-if="showEndEllipsis" class="pagination__ellipsis">...</span>
    </div>

    <!-- Next Button -->
    <Button
      :disabled="currentPage === totalPages || disabled"
      :size="size"
      variant="outline"
      @click="goToPage(currentPage + 1)"
    >
      {{ nextText }}
      <template v-if="showIcons" #icon-right>
        <ChevronRightIcon />
      </template>
    </Button>

    <!-- Page Info (optional) -->
    <div v-if="showInfo" class="pagination__info">
      {{ infoText }}
    </div>

    <!-- Page Size Selector (optional) -->
    <Select
      v-if="showPageSize"
      :model-value="pageSize"
      :size="size"
      @update:model-value="handlePageSizeChange"
    >
      <option v-for="size in pageSizeOptions" :key="size" :value="size">
        {{ size }} per page
      </option>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import Button from './Button.vue'
import Select from './Select.vue'

export type PaginationSize = 'sm' | 'md' | 'lg'
export type PaginationColor = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  currentPage: number
  totalPages: number
  pageSize?: number
  pageSizeOptions?: number[]
  size?: PaginationSize
  pageColor?: PaginationColor
  disabled?: boolean
  showIcons?: boolean
  showInfo?: boolean
  showPageSize?: boolean
  previousText?: string
  nextText?: string
  maxVisiblePages?: number
  infoFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  pageSizeOptions: () => [10, 25, 50, 100],
  size: 'md',
  pageColor: 'primary',
  disabled: false,
  showIcons: true,
  showInfo: false,
  showPageSize: false,
  previousText: 'Previous',
  nextText: 'Next',
  maxVisiblePages: 5,
  infoFormat: 'Page {current} of {total}'
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'page-change': [page: number]
  'page-size-change': [size: number]
}>()

// Icons
const ChevronLeftIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polyline', { points: '15 18 9 12 15 6' })])
})

const ChevronRightIcon = defineComponent({
  render: () => h('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [h('polyline', { points: '9 18 15 12 9 6' })])
})

// Computed classes
const paginationClasses = computed(() => [
  'pagination',
  `pagination--${props.size}`
])

// Visible page numbers with ellipsis
const visiblePages = computed(() => {
  const pages: number[] = []
  const current = props.currentPage
  const total = props.totalPages
  const maxVisible = props.maxVisiblePages

  if (total <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show first page
    pages.push(1)

    let startPage = Math.max(2, current - Math.floor(maxVisible / 2) + 1)
    let endPage = Math.min(total - 1, current + Math.floor(maxVisible / 2) - 1)

    if (current <= Math.floor(maxVisible / 2)) {
      endPage = maxVisible - 1
    }

    if (current >= total - Math.floor(maxVisible / 2)) {
      startPage = total - maxVisible + 2
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Show last page
    pages.push(total)
  }

  return pages
})

// Show ellipsis
const showStartEllipsis = computed(() => {
  return props.totalPages > props.maxVisiblePages &&
         props.currentPage > Math.floor(props.maxVisiblePages / 2) + 1
})

const showEndEllipsis = computed(() => {
  return props.totalPages > props.maxVisiblePages &&
         props.currentPage < props.totalPages - Math.floor(props.maxVisiblePages / 2)
})

// Info text
const infoText = computed(() => {
  return props.infoFormat
    .replace('{current}', props.currentPage.toString())
    .replace('{total}', props.totalPages.toString())
})

// Go to page
const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || props.disabled) return
  emit('update:currentPage', page)
  emit('page-change', page)
}

// Handle page size change
const handlePageSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('page-size-change', size)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Sizes */
.pagination--sm {
  gap: 0.25rem;
}

.pagination--lg {
  gap: 0.75rem;
}

/* Pages Container */
.pagination__pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination--sm .pagination__pages {
  gap: 0.125rem;
}

.pagination--lg .pagination__pages {
  gap: 0.375rem;
}

/* Ellipsis */
.pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
  user-select: none;
}

.pagination--sm .pagination__ellipsis {
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.8125rem;
}

.pagination--lg .pagination__ellipsis {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 0.9375rem;
}

/* Info */
.pagination__info {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.pagination--sm .pagination__info {
  font-size: 0.8125rem;
}

.pagination--lg .pagination__info {
  font-size: 0.9375rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .pagination__ellipsis {
    color: #9ca3af;
  }

  .pagination__info {
    color: #9ca3af;
  }
}
</style>
