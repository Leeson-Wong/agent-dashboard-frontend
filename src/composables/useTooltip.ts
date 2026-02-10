/**
 * Tooltip Composable
 *
 * Manages tooltip positioning and display logic
 */

import { ref } from 'vue'

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type TooltipTrigger = 'hover' | 'click' | 'focus'

export interface TooltipOptions {
  content: string
  placement?: TooltipPlacement
  delay?: number
  hideDelay?: number
  trigger?: TooltipTrigger
  followMouse?: boolean
  offset?: number
}

const DEFAULT_DELAY = 300
const DEFAULT_HIDE_DELAY = 100
const DEFAULT_OFFSET = 8

/**
 * Calculate tooltip position
 */
const calculatePosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: TooltipPlacement,
  offset: number
): { top: number; left: number } => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - offset
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'top-start':
      top = triggerRect.top - tooltipRect.height - offset
      left = triggerRect.left
      break
    case 'top-end':
      top = triggerRect.top - tooltipRect.height - offset
      left = triggerRect.right - tooltipRect.width
      break
    case 'bottom':
      top = triggerRect.bottom + offset
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom-start':
      top = triggerRect.bottom + offset
      left = triggerRect.left
      break
    case 'bottom-end':
      top = triggerRect.bottom + offset
      left = triggerRect.right - tooltipRect.width
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - offset
      break
    case 'left-start':
      top = triggerRect.top
      left = triggerRect.left - tooltipRect.width - offset
      break
    case 'left-end':
      top = triggerRect.bottom - tooltipRect.height
      left = triggerRect.left - tooltipRect.width - offset
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + offset
      break
    case 'right-start':
      top = triggerRect.top
      left = triggerRect.right + offset
      break
    case 'right-end':
      top = triggerRect.bottom - tooltipRect.height
      left = triggerRect.right + offset
      break
  }

  // Adjust if out of viewport
  if (left < 8) left = 8
  if (left + tooltipRect.width > viewportWidth - 8) left = viewportWidth - tooltipRect.width - 8
  if (top < 8) top = 8
  if (top + tooltipRect.height > viewportHeight - 8) top = viewportHeight - tooltipRect.height - 8

  return { top, left }
}

/**
 * Tooltip composable
 */
export function useTooltip(options: TooltipOptions) {
  const isVisible = ref(false)
  const tooltipRef = ref<HTMLElement | null>(null)
  const triggerRef = ref<HTMLElement | null>(null)
  const position = ref({ top: 0, left: 0 })
  const mousePosition = ref({ x: 0, y: 0 })

  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const placement = options.placement || 'top'
  const delay = options.delay ?? DEFAULT_DELAY
  const hideDelay = options.hideDelay ?? DEFAULT_HIDE_DELAY
  const offset = options.offset ?? DEFAULT_OFFSET
  const trigger = options.trigger || 'hover'
  const followMouse = options.followMouse || false

  /**
   * Show tooltip
   */
  const show = () => {
    hide()
    showTimer = setTimeout(() => {
      isVisible.value = true
      updatePosition()
    }, delay)
  }

  /**
   * Hide tooltip
   */
  const hide = () => {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    hideTimer = setTimeout(() => {
      isVisible.value = false
    }, hideDelay)
  }

  /**
   * Update tooltip position
   */
  const updatePosition = () => {
    if (!triggerRef.value || !tooltipRef.value) return

    const triggerRect = triggerRef.value.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()

    if (followMouse) {
      position.value = {
        top: mousePosition.value.y + offset,
        left: mousePosition.value.x + offset
      }
    } else {
      position.value = calculatePosition(triggerRect, tooltipRect, placement, offset)
    }
  }

  /**
   * Handle mouse move (for follow cursor mode)
   */
  const handleMouseMove = (event: MouseEvent) => {
    mousePosition.value = { x: event.clientX, y: event.clientY }
    if (isVisible.value && followMouse) {
      updatePosition()
    }
  }

  /**
   * Bind events to trigger element
   */
  const bindTrigger = (element: HTMLElement) => {
    triggerRef.value = element

    if (trigger === 'hover') {
      element.addEventListener('mouseenter', show)
      element.addEventListener('mouseleave', hide)
      if (followMouse) {
        element.addEventListener('mousemove', handleMouseMove)
      }
    } else if (trigger === 'click') {
      element.addEventListener('click', (e) => {
        e.stopPropagation()
        if (isVisible.value) {
          hide()
        } else {
          show()
        }
      })
    } else if (trigger === 'focus') {
      element.addEventListener('focus', show)
      element.addEventListener('blur', hide)
    }

    // Hide on scroll
    window.addEventListener('scroll', hide)
    window.addEventListener('resize', hide)
  }

  /**
   * Unbind events from trigger element
   */
  const unbindTrigger = (element: HTMLElement) => {
    if (trigger === 'hover') {
      element.removeEventListener('mouseenter', show)
      element.removeEventListener('mouseleave', hide)
      if (followMouse) {
        element.removeEventListener('mousemove', handleMouseMove)
      }
    } else if (trigger === 'click') {
      element.removeEventListener('click', show)
    } else if (trigger === 'focus') {
      element.removeEventListener('focus', show)
      element.removeEventListener('blur', hide)
    }

    window.removeEventListener('scroll', hide)
    window.removeEventListener('resize', hide)
  }

  return {
    isVisible,
    tooltipRef,
    triggerRef,
    position,
    show,
    hide,
    updatePosition,
    bindTrigger,
    unbindTrigger
  }
}

export default useTooltip
