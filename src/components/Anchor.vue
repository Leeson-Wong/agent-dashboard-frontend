<template>
  <div class="anchor">
    <!-- Anchor Links -->
    <div class="anchor__wrapper">
      <div
        v-for="link in flatLinks"
        :key="link.id"
        :class="getLinkClasses(link)"
        @click="handleClick(link)"
      >
        <a
          :href="link.href"
          class="anchor__link"
          @click.prevent
        >
          {{ link.title }}
        </a>
        <span v-if="link.children?.length" class="anchor__toggle" @click.stop="toggleExpand(link)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline :points="link.expanded ? '6 9 12 15 18 9' : '9 18 15 12 9 6'" />
          </svg>
        </span>
      </div>
    </div>

    <!-- Anchor Content -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

export interface AnchorLink {
  id: string
  title: string
  href: string
  children?: AnchorLink[]
  expanded?: boolean
}

interface Props {
  links?: AnchorLink[]
  offset?: number
  duration?: number
  container?: string | (() => HTMLElement)
  scrollOffset?: number
  bound?: number
}

const props = withDefaults(defineProps<Props>(), {
  links: undefined,
  offset: 0,
  duration: 450,
  container: undefined,
  scrollOffset: 0,
  bound: 5
})

const emit = defineEmits<{
  click: [link: AnchorLink, event: Event]
  change: [activeLink: AnchorLink]
}>()

// State
const activeLink = ref<string>('')
const internalLinks = ref<AnchorLink[]>([])
const linksMap = ref<Map<string, AnchorLink>>(new Map())

// Flatten links for rendering
const flatLinks = computed(() => {
  const flatten = (links: AnchorLink[], level = 0): AnchorLink[] => {
    const result: AnchorLink[] = []
    for (const link of links) {
      result.push({ ...link, expanded: link.expanded ?? true })
      if (link.children?.length && link.expanded !== false) {
        result.push(...flatten(link.children, level + 1))
      }
    }
    return result
  }
  return flatten(internalLinks.value)
})

// Get link classes
const getLinkClasses = (link: AnchorLink) => {
  const isActive = activeLink.value === link.id
  const level = getLinkLevel(link)

  return [
    'anchor__item',
    `anchor__item--level-${level}`,
    {
      'anchor__item--active': isActive,
      'anchor__item--expanded': link.expanded !== false && link.children?.length
    }
  ]
}

// Get link level
const getLinkLevel = (link: AnchorLink): number => {
  const findLevel = (links: AnchorLink[], target: AnchorLink, level = 0): number => {
    for (const l of links) {
      if (l.id === target.id) return level
      if (l.children?.length) {
        const found = findLevel(l.children, target, level + 1)
        if (found >= 0) return found
      }
    }
    return -1
  }
  return findLevel(internalLinks.value, link)
}

// Handle link click
const handleClick = (link: AnchorLink) => {
  const target = document.querySelector(link.href)
  if (!target) return

  const container = props.container
    ? (typeof props.container === 'string'
        ? document.querySelector(props.container)
        : props.container())
    : window

  if (!container) return

  const containerRect = container instanceof Window
    ? { top: 0, left: 0 }
    : container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const scrollTop = (container instanceof Window
    ? window.pageYOffset || document.documentElement.scrollTop
    : container.scrollTop) +
    targetRect.top -
    containerRect.top -
    props.offset

  const startTime = performance.now()
  const startScroll = container instanceof Window
    ? window.pageYOffset || document.documentElement.scrollTop
    : container.scrollTop

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3) // Ease out cubic

    const currentScroll = startScroll + (scrollTop - startScroll) * ease

    if (container instanceof Window) {
      window.scrollTo(0, currentScroll)
    } else {
      (container as HTMLElement).scrollTop = currentScroll
    }

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)

  activeLink.value = link.id
  emit('click', link, event as Event)
  emit('change', link)
}

// Toggle expand
const toggleExpand = (link: AnchorLink) => {
  link.expanded = link.expanded === false ? true : false
}

// Extract links from slot content
const extractLinksFromSlot = () => {
  const links: AnchorLink[] = []
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')

  headings.forEach((heading, index) => {
    const id = heading.id || `heading-${index}`
    if (!heading.id) heading.id = id

    const level = parseInt(heading.tagName.substring(1))
    const title = heading.textContent || ''

    links.push({
      id,
      title,
      href: `#${id}`
    })
  })

  return links
}

// Update active link based on scroll
const updateActiveLink = () => {
  const container = props.container
    ? (typeof props.container === 'string'
        ? document.querySelector(props.container)
        : props.container())
    : window

  if (!container) return

  let activeId = ''
  let minDistance = Infinity

  linksMap.value.forEach((link) => {
    const target = document.querySelector(link.href)
    if (!target) return

    const containerRect = container instanceof Window
      ? { top: 0 }
      : container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()

    const distance = Math.abs(targetRect.top - containerRect.top - props.scrollOffset - props.bound)

    if (targetRect.top <= containerRect.top + props.scrollOffset + props.bound &&
        targetRect.bottom > containerRect.top + props.scrollOffset) {
      if (distance < minDistance) {
        minDistance = distance
        activeId = link.id
      }
    }
  })

  if (activeId && activeId !== activeLink.value) {
    activeLink.value = activeId
    const link = linksMap.value.get(activeId)
    if (link) {
      emit('change', link)
    }
  }
}

// Build links map
const buildLinksMap = (links: AnchorLink[]) => {
  links.forEach((link) => {
    linksMap.value.set(link.id, link)
    if (link.children?.length) {
      buildLinksMap(link.children)
    }
  })
}

// Initialize
const initialize = () => {
  if (props.links) {
    internalLinks.value = props.links
  } else {
    internalLinks.value = extractLinksFromSlot()
  }

  buildLinksMap(internalLinks.value)
}

// Lifecycle
onMounted(() => {
  initialize()
  updateActiveLink()

  const container = props.container
    ? (typeof props.container === 'string'
        ? document.querySelector(props.container)
        : props.container())
    : window

  if (container) {
    container.addEventListener('scroll', updateActiveLink)
  }
})

onUnmounted(() => {
  const container = props.container
    ? (typeof props.container === 'string'
        ? document.querySelector(props.container)
        : props.container())
    : window

  if (container) {
    container.removeEventListener('scroll', updateActiveLink)
  }
})
</script>

<style scoped>
.anchor {
  position: relative;
}

/* Wrapper */
.anchor__wrapper {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Link Item */
.anchor__item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.anchor__item:hover {
  color: #111827;
  background-color: #f3f4f6;
}

.anchor__item--active {
  color: #3b82f6;
  font-weight: 500;
}

.anchor__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #3b82f6;
  border-radius: 0 2px 2px 0;
}

/* Levels */
.anchor__item--level-0 {
  padding-left: 0.75rem;
  font-weight: 500;
}

.anchor__item--level-1 {
  padding-left: 1.5rem;
  font-size: 0.8125rem;
}

.anchor__item--level-2 {
  padding-left: 2.25rem;
  font-size: 0.8125rem;
}

.anchor__item--level-3 {
  padding-left: 3rem;
  font-size: 0.75rem;
}

/* Link */
.anchor__link {
  flex: 1;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Toggle */
.anchor__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-left: 0.25rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.anchor__toggle:hover {
  color: #111827;
}

.anchor__toggle svg {
  width: 0.75rem;
  height: 0.75rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .anchor__item {
    color: #9ca3af;
  }

  .anchor__item:hover {
    color: #f9fafb;
    background-color: #374151;
  }

  .anchor__item--active {
    color: #60a5fa;
  }

  .anchor__item--active::before {
    background-color: #60a5fa;
  }

  .anchor__toggle {
    color: #9ca3af;
  }

  .anchor__toggle:hover {
    color: #f9fafb;
  }
}
</style>
