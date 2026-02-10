/**
 * Tooltip Directive
 *
 * Easy-to-use directive for adding tooltips to any element
 *
 * Usage:
 * v-tooltip="'Tooltip text'"
 * v-tooltip="{ content: 'Text', placement: 'bottom' }"
 */

import { DirectiveBinding } from 'vue'
import type { Directive } from 'vue'
import { createTooltip, destroyTooltip } from '../utils/tooltipManager'

interface TooltipDirectiveValue {
  content?: string
  placement?: string
  delay?: number
  hideDelay?: number
  trigger?: string
  followMouse?: boolean
}

/**
 * Parse directive value
 */
const parseValue = (value: string | TooltipDirectiveValue): TooltipDirectiveValue => {
  if (typeof value === 'string') {
    return { content: value }
  }
  return value
}

/**
 * Tooltip directive
 */
export const vTooltip: Directive<HTMLElement, string | TooltipDirectiveValue> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | TooltipDirectiveValue>) {
    const options = parseValue(binding.value)
    createTooltip(el, options)
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | TooltipDirectiveValue>) {
    const options = parseValue(binding.value)
    destroyTooltip(el)
    createTooltip(el, options)
  },

  unmounted(el: HTMLElement) {
    destroyTooltip(el)
  }
}

export default vTooltip
