<template>
  <thead :class="classes">
    <slot />
  </thead>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sticky: false
})

const classes = computed(() => [
  'table-head',
  {
    'table-head--sticky': props.sticky
  }
])
</script>

<style scoped>
.table-head--sticky {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
