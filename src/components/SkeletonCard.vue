<template>
  <div class="skeleton-card">
    <slot>
      <!-- Default skeleton pattern -->
      <div class="skeleton-header">
        <Skeleton variant="circle" width="40px" height="40px" />
        <div class="skeleton-title-group">
          <Skeleton variant="text" width="60%" height="16px" />
          <Skeleton variant="text" width="40%" height="12px" />
        </div>
      </div>
      <div class="skeleton-body">
        <Skeleton variant="text" width="100%" height="12px" />
        <Skeleton variant="text" width="100%" height="12px" />
        <Skeleton variant="text" width="80%" height="12px" />
      </div>
      <div v-if="showActions" class="skeleton-actions">
        <Skeleton variant="rect" width="60px" height="32px" />
        <Skeleton variant="rect" width="60px" height="32px" />
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue'

interface Props {
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: true
})
</script>

<style scoped>
.skeleton-card {
  padding: 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-medium);
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}
</style>
