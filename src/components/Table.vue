<template>
  <div :class="tableWrapperClasses">
    <table :class="tableClasses">
      <slot />
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type TableSize = 'sm' | 'md' | 'lg'
export type TableVariant = 'default' | 'bordered' | 'striped' | 'hover'

interface Props {
  size?: TableSize
  variant?: TableVariant
  responsive?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  responsive: false,
  fullWidth: true
})

// Computed classes
const tableWrapperClasses = computed(() => [
  'table-wrapper',
  {
    'table-wrapper--responsive': props.responsive
  }
])

const tableClasses = computed(() => [
  'table',
  `table--${props.size}`,
  `table--${props.variant}`,
  {
    'table--full-width': props.fullWidth
  }
])
</script>

<style scoped>
.table-wrapper {
  width: 100%;
}

.table-wrapper--responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
}

.table--full-width {
  width: 100%;
}

/* Sizes */
.table--sm th,
.table--sm td {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
}

.table--md th,
.table--md td {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
}

.table--lg th,
.table--lg td {
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
}

/* Header */
.table thead th {
  font-weight: 600;
  text-align: left;
  color: #374151;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.table--sm thead th {
  font-size: 0.75rem;
}

.table--md thead th {
  font-size: 0.8125rem;
}

.table--lg thead th {
  font-size: 0.875rem;
}

/* Body */
.table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;
}

.table tbody tr:last-child {
  border-bottom: none;
}

.table tbody td {
  color: #4b5563;
}

/* Variants */
.table--bordered {
  border: 1px solid #e5e7eb;
}

.table--bordered th,
.table--bordered td {
  border: 1px solid #e5e7eb;
}

.table--striped tbody tr:nth-child(even) {
  background-color: #f9fafb;
}

.table--hover tbody tr:hover {
  background-color: #f3f4f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .table {
    background-color: #1f2937;
  }

  .table thead th {
    color: #e5e7eb;
    background-color: #374151;
    border-color: #4b5563;
  }

  .table tbody tr {
    border-color: #374151;
  }

  .table tbody td {
    color: #d1d5db;
  }

  .table--bordered {
    border-color: #374151;
  }

  .table--bordered th,
  .table--bordered td {
    border-color: #374151;
  }

  .table--striped tbody tr:nth-child(even) {
    background-color: #374151;
  }

  .table--hover tbody tr:hover {
    background-color: #4b5563;
  }
}
</style>
