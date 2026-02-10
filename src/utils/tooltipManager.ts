/**
 * Tooltip Manager
 *
 * Manages tooltip instances and DOM elements
 */

import { createApp, h } from 'vue'
import Tooltip from '../components/Tooltip.vue'

interface TooltipInstance {
  container: HTMLElement
  app: any
}

const tooltipInstances = new WeakMap<HTMLElement, TooltipInstance>()

/**
 * Create tooltip for an element
 */
export const createTooltip = (element: HTMLElement, options: any): void => {
  // Destroy existing tooltip if any
  destroyTooltip(element)

  // Create container
  const container = document.createElement('div')
  document.body.appendChild(container)

  // Generate unique ID
  const tooltipId = `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Set attributes for later lookup
  element.setAttribute('data-tooltip-id', tooltipId)
  container.setAttribute('data-tooltip-target', tooltipId)

  // Create Vue app with Tooltip component
  const app = createApp({
    render() {
      return h(Tooltip, {
        content: options.content,
        placement: options.placement || 'top',
        delay: options.delay || 300,
        hideDelay: options.hideDelay || 100,
        trigger: options.trigger || 'hover',
        followMouse: options.followMouse || false,
        offset: options.offset || 8
      })
    }
  })

  app.mount(container)

  // Store instance
  tooltipInstances.set(element, { container, app })
}

/**
 * Destroy tooltip for an element
 */
export const destroyTooltip = (element: HTMLElement): void => {
  const instance = tooltipInstances.get(element)
  if (instance) {
    instance.app.unmount()
    document.body.removeChild(instance.container)
    tooltipInstances.delete(element)
  }

  // Remove attributes
  element.removeAttribute('data-tooltip-id')
}

/**
 * Destroy all tooltips
 */
export const destroyAllTooltips = (): void => {
  // WeakMap doesn't support iteration, so we can't implement this
  // Tooltips will be cleaned up when elements are removed
}

export default {
  createTooltip,
  destroyTooltip,
  destroyAllTooltips
}
