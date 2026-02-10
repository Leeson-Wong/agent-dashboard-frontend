<template>
  <div :class="['agent-skeleton', `agent-skeleton-${mode}`]">
    <Skeleton variant="circle" width="16px" height="16px" class="skeleton-status" />
    <Skeleton variant="circle" width="16px" height="16px" class="skeleton-avatar" />
    <div class="skeleton-info">
      <Skeleton variant="text" width="40%" height="14px" class="skeleton-name" />
      <div class="skeleton-meta">
        <Skeleton variant="text" width="25%" height="11px" />
        <Skeleton variant="text" width="20%" height="11px" />
      </div>
      <Skeleton variant="text" width="70%" height="11px" class="skeleton-activity" />
    </div>
    <Skeleton variant="text" width="60px" height="12px" class="skeleton-time" />
    <Skeleton variant="rect" width="24px" height="24px" class="skeleton-actions" />
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue'

interface Props {
  mode?: 'list' | 'grid'
}

withDefaults(defineProps<Props>(), {
  mode: 'list'
})
</script>

<style scoped>
.agent-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-medium);
  margin-bottom: 8px;
}

.skeleton-status {
  flex-shrink: 0;
}

.skeleton-avatar {
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.skeleton-meta {
  display: flex;
  gap: 8px;
}

.skeleton-time {
  flex-shrink: 0;
}

.skeleton-actions {
  flex-shrink: 0;
}

/* Grid mode */
.agent-skeleton-grid {
  flex-direction: column;
  align-items: flex-start;
}

.agent-skeleton-grid .skeleton-info {
  width: 100%;
}

.agent-skeleton-grid .skeleton-time {
  align-self: flex-end;
}

.agent-skeleton-grid .skeleton-actions {
  align-self: flex-end;
}
</style>
