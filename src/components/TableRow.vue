<template>
  <tr :class="classes" v-bind="$attrs">
    <slot />
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  selected?: boolean
  hoverable?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  hoverable: false,
  clickable: false
})

const classes = computed(() => [
  'table-row',
  {
    'table-row--selected': props.selected,
    'table-row--hoverable': props.hoverable,
    'table-row--clickable': props.clickable
  }
])
</script>

<style scoped>
.table-row--selected {
  background-color: #eff6ff !important;
}

.table-row--hoverable:hover {
  background-color: #f3f4f6;
}

.table-row--clickable {
  cursor: pointer;
}

.table-row--clickable:hover {
  background-color: #f3f4f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .table-row--selected {
    background-color: #1e40af !important;
  }

  .table-row--hoverable:hover,
  .table-row--clickable:hover {
    background-color: #374151;
  }
}
</style>
