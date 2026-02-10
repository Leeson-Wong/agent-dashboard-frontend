<template>
  <component :is="tag" :class="classes" v-bind="$attrs">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type TableCellAlign = 'left' | 'center' | 'right'
export type TableCellVerticalAlign = 'top' | 'middle' | 'bottom'

interface Props {
  header?: boolean
  align?: TableCellAlign
  verticalAlign?: TableCellVerticalAlign
  width?: string
  nowrap?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  header: false,
  align: 'left',
  verticalAlign: 'middle',
  nowrap: false
})

const tag = computed(() => props.header ? 'th' : 'td')

const classes = computed(() => [
  'table-cell',
  `table-cell--align-${props.align}`,
  `table-cell--vertical-${props.verticalAlign}`,
  {
    'table-cell--nowrap': props.nowrap
  }
])
</script>

<style scoped>
.table-cell {
  padding: 0.625rem 0.75rem;
}

/* Alignment */
.table-cell--align-left {
  text-align: left;
}

.table-cell--align-center {
  text-align: center;
}

.table-cell--align-right {
  text-align: right;
}

/* Vertical alignment */
.table-cell--vertical-top {
  vertical-align: top;
}

.table-cell--vertical-middle {
  vertical-align: middle;
}

.table-cell--vertical-bottom {
  vertical-align: bottom;
}

/* Nowrap */
.table-cell--nowrap {
  white-space: nowrap;
}
</style>
