/**
 * Help Tooltip Composable
 *
 * Manages help tooltips and context-sensitive help
 */

import { ref, computed } from 'vue'

export interface HelpTooltip {
  id: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  priority?: number
  showOnce?: boolean
}

export interface HelpTooltipConfig {
  storageKey: string
  enabled: boolean
  autoShowDelay?: number // milliseconds
}

export function useHelpTooltip(config: HelpTooltipConfig = {
  storageKey: 'help_tooltips',
  enabled: true,
  autoShowDelay: 3000
}) {
  const activeTooltips = ref<Set<string>>(new Set())
  const dismissedTooltips = ref<Set<string>>(new Set())
  const isLoaded = ref(false)

  /**
   * Load dismissed tooltips from localStorage
   */
  const loadDismissed = (): void => {
    if (!config.enabled) return

    try {
      const saved = localStorage.getItem(`${config.storageKey}_dismissed`)
      if (saved) {
        const dismissed = JSON.parse(saved) as string[]
        dismissedTooltips.value = new Set(dismissed)
      }
    } catch (error) {
      console.warn('Failed to load dismissed tooltips:', error)
    }
  }

  /**
   * Save dismissed tooltips to localStorage
   */
  const saveDismissed = (): void => {
    if (!config.enabled) return

    try {
      const dismissed = Array.from(dismissedTooltips.value)
      localStorage.setItem(`${config.storageKey}_dismissed`, JSON.stringify(dismissed))
    } catch (error) {
      console.warn('Failed to save dismissed tooltips:', error)
    }
  }

  /**
   * Check if tooltip should be shown
   */
  const shouldShow = (tooltip: HelpTooltip): boolean => {
    if (!config.enabled) return false
    if (dismissedTooltips.value.has(tooltip.id)) return false
    if (tooltip.showOnce && activeTooltips.value.has(tooltip.id)) return false
    return true
  }

  /**
   * Dismiss a tooltip
   */
  const dismiss = (tooltipId: string): void => {
    dismissedTooltips.value.add(tooltipId)
    saveDismissed()
    activeTooltips.value.delete(tooltipId)
  }

  /**
   * Mark tooltip as shown
   */
  const markShown = (tooltipId: string): void => {
    activeTooltips.value.add(tooltipId)
  }

  /**
   * Reset all dismissed tooltips
   */
  const resetDismissed = (): void => {
    dismissedTooltips.value.clear()
    saveDismissed()
  }

  /**
   * Get priority-sorted tooltips
   */
  const getSortedTooltips = (tooltips: HelpTooltip[]): HelpTooltip[] => {
    return tooltips
      .filter(t => shouldShow(t))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Show tooltip for a specific element
   */
  const showTooltip = (
    tooltip: HelpTooltip,
    element: HTMLElement
  ): void => {
    if (!shouldShow(tooltip)) return

    markShown(tooltip.id)

    // Create tooltip element
    const tooltipEl = document.createElement('div')
    tooltipEl.className = 'help-tooltip'
    tooltipEl.setAttribute('data-tooltip-id', tooltip.id)
    tooltipEl.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-title">${tooltip.title}</span>
        <button class="tooltip-close" data-tooltip-id="${tooltip.id}">×</button>
      </div>
      <div class="tooltip-content">${tooltip.content}</div>
    `

    // Position tooltip
    const rect = element.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    let top, left
    switch (tooltip.position || 'top') {
      case 'top':
        top = rect.top + scrollY - 10
        left = rect.left + scrollX + rect.width / 2
        tooltipEl.style.transform = 'translate(-50%, -100%)'
        break
      case 'bottom':
        top = rect.bottom + scrollY + 10
        left = rect.left + scrollX + rect.width / 2
        tooltipEl.style.transform = 'translate(-50%, 0)'
        break
      case 'left':
        top = rect.top + scrollY + rect.height / 2
        left = rect.left + scrollX - 10
        tooltipEl.style.transform = 'translate(-100%, -50%)'
        break
      case 'right':
        top = rect.top + scrollY + rect.height / 2
        left = rect.right + scrollX + 10
        tooltipEl.style.transform = 'translate(0, -50%)'
        break
    }

    tooltipEl.style.top = `${top}px`
    tooltipEl.style.left = `${left}px`
    tooltipEl.style.position = 'absolute'
    tooltipEl.style.zIndex = '10000'

    document.body.appendChild(tooltipEl)

    // Add close handler
    const closeBtn = tooltipEl.querySelector('.tooltip-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dismiss(tooltip.id)
        tooltipEl.remove()
      })
    }

    // Auto-hide after delay
    if (tooltip.showOnce) {
      setTimeout(() => {
        if (document.body.contains(tooltipEl)) {
          tooltipEl.remove()
        }
      }, 5000)
    }
  }

  /**
   * Remove all active tooltips
   */
  const removeAllTooltips = (): void => {
    document.querySelectorAll('.help-tooltip').forEach(el => el.remove())
    activeTooltips.value.clear()
  }

  /**
   * Check if any tooltips are active
   */
  const hasActiveTooltips = computed(() => activeTooltips.value.size > 0)

  // Initialize
  loadDismissed()

  return {
    activeTooltips,
    dismissedTooltips,
    isLoaded,
    hasActiveTooltips,
    shouldShow,
    dismiss,
    markShown,
    resetDismissed,
    getSortedTooltips,
    showTooltip,
    removeAllTooltips
  }
}
