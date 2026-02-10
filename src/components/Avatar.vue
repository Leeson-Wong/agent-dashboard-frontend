<template>
  <div :class="avatarClasses" :style="avatarStyles">
    <!-- Image -->
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt"
      class="avatar__image"
      :class="{ 'avatar__image--rounded': rounded }"
      @error="handleImageError"
    >

    <!-- Fallback Content -->
    <span v-else class="avatar__fallback" :class="fallbackClasses">
      <slot name="fallback">
        <span class="avatar__initials">{{ initials }}</span>
      </slot>
    </span>

    <!-- Status Indicator -->
    <span
      v-if="status"
      class="avatar__status"
      :class="statusClasses"
    />

    <!-- Badge -->
    <Badge
      v-if="badge !== null && badge !== undefined"
      :count="badge"
      :variant="badgeVariant"
      :size="badgeSize"
      class="avatar__badge"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Badge from './Badge.vue'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type AvatarColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'

interface Props {
  src?: string
  alt?: string
  name?: string // Used to generate initials
  size?: AvatarSize
  color?: AvatarColor
  rounded?: boolean
  status?: AvatarStatus
  badge?: number | string
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  badgeSize?: 'xs' | 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  rounded: false,
  badgeVariant: 'primary',
  badgeSize: 'sm'
})

const imageError = ref(false)

// Generate initials from name
const initials = computed(() => {
  if (!props.name) return ''

  const parts = props.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return '?'

  return parts
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

// Avatar classes
const avatarClasses = computed(() => {
  return [
    'avatar',
    `avatar--${props.size}`,
    `avatar--${props.color}`,
    {
      'avatar--rounded': props.rounded,
      'avatar--has-status': props.status,
      'avatar--has-badge': props.badge !== null && props.badge !== undefined
    }
  ]
})

// Avatar styles
const avatarStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (!props.rounded) {
    styles.borderRadius = '50%'
  }

  return styles
})

// Fallback classes
const fallbackClasses = computed(() => {
  return [
    `avatar__fallback--${props.color}`
  ]
})

// Status classes
const statusClasses = computed(() => {
  return [
    `avatar__status--${props.status}`
  ]
})

// Handle image error
const handleImageError = (): void => {
  imageError.value = true
}
</script>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #e5e7eb;
  flex-shrink: 0;
}

.avatar--rounded {
  border-radius: 0.375rem;
}

/* Sizes */
.avatar--xs {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.625rem;
}

.avatar--sm {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}

.avatar--md {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 0.875rem;
}

.avatar--lg {
  width: 3rem;
  height: 3rem;
  font-size: 1rem;
}

.avatar--xl {
  width: 4rem;
  height: 4rem;
  font-size: 1.25rem;
}

.avatar--2xl {
  width: 5rem;
  height: 5rem;
  font-size: 1.5rem;
}

.avatar--3xl {
  width: 6rem;
  height: 6rem;
  font-size: 1.75rem;
}

.avatar--4xl {
  width: 8rem;
  height: 8rem;
  font-size: 2rem;
}

/* Colors for fallback */
.avatar__fallback--default {
  background-color: #9ca3af;
  color: #ffffff;
}

.avatar__fallback--primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.avatar__fallback--success {
  background-color: #22c55e;
  color: #ffffff;
}

.avatar__fallback--warning {
  background-color: #f59e0b;
  color: #ffffff;
}

.avatar__fallback--error {
  background-color: #ef4444;
  color: #ffffff;
}

.avatar__fallback--info {
  background-color: #06b6d4;
  color: #ffffff;
}

/* Image */
.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--rounded .avatar__image {
  border-radius: inherit;
}

/* Fallback */
.avatar__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: 600;
  color: #ffffff;
}

.avatar__initials {
  text-transform: uppercase;
}

/* Status Indicator */
.avatar__status {
  position: absolute;
  bottom: 0;
  right: 0;
  display: block;
  width: 25%;
  height: 25%;
  min-width: 0.375rem;
  min-height: 0.375rem;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.avatar__status--online {
  background-color: #22c55e;
}

.avatar__status--offline {
  background-color: #9ca3af;
}

.avatar__status--away {
  background-color: #f59e0b;
}

.avatar__status--busy {
  background-color: #ef4444;
}

/* Badge */
.avatar__badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(25%, -25%);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .avatar {
    background-color: #374151;
  }

  .avatar__status {
    border-color: #1f2937;
  }
}
</style>
