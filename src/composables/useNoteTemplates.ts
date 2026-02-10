/**
 * Note Templates Composable
 *
 * Manages predefined and custom note templates for Agent Notes
 */

import { ref, computed } from 'vue'

export interface NoteTemplate {
  id: string
  name: string
  content: string
  category: string
  isBuiltIn: boolean
}

const STORAGE_KEY = 'agent-dashboard-note-templates'

// Built-in templates
const BUILTIN_TEMPLATES: NoteTemplate[] = [
  {
    id: 'bug-report',
    name: '🐛 Bug 报告',
    content: `## 问题描述

## 重现步骤
1.
2.
3.

## 期望行为


## 实际行为


## 环境
- 框架:
- 语言:
- 任务:

## 相关日志

`,
    category: '问题',
    isBuiltIn: true
  },
  {
    id: 'task-completed',
    name: '✅ 任务完成',
    content: `## 任务完成

### 完成时间
{{datetime}}

### 执行结果


### 性能数据


### 备注

`,
    category: '任务',
    isBuiltIn: true
  },
  {
    id: 'optimization',
    name: '⚡ 性能优化',
    content: `## 优化建议

### 问题描述


### 优化方案


### 预期收益


### 实施计划

`,
    category: '优化',
    isBuiltIn: true
  },
  {
    id: 'investigation',
    name: '🔍 问题调查',
    content: `## 问题调查

### 问题描述


### 调查过程


### 发现


### 结论


### 后续行动

`,
    category: '调查',
    isBuiltIn: true
  },
  {
    id: 'meeting-notes',
    name: '📝 会议记录',
    content: `## 会议记录

### 时间
{{datetime}}

### 参与者


### 议题


### 讨论要点


### 决策


### 行动项

- [ ]
- [ ]
- [ ]

`,
    category: '记录',
    isBuiltIn: true
  },
  {
    id: 'debug-session',
    name: '🔧 调试会话',
    content: `## 调试会话

### 时间
{{datetime}}

### 问题


### 尝试的解决方案


### 结果


### 下一步

`,
    category: '调试',
    isBuiltIn: true
  }
]

// Template store
const templates = ref<NoteTemplate[]>([])
const customTemplates = ref<NoteTemplate[]>([])

/**
 * Load templates from localStorage
 */
export const loadTemplates = (): NoteTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as NoteTemplate[]
      customTemplates.value = parsed.filter(t => !t.isBuiltIn)
    }
  } catch (error) {
    console.warn('Failed to load templates:', error)
    customTemplates.value = []
  }

  // Combine built-in and custom templates
  templates.value = [...BUILTIN_TEMPLATES, ...customTemplates.value]
  return templates.value
}

/**
 * Save custom templates to localStorage
 */
export const saveTemplates = (templatesToSave: NoteTemplate[]): void => {
  try {
    const customOnly = templatesToSave.filter(t => !t.isBuiltIn)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly))
    customTemplates.value = customOnly
    templates.value = [...BUILTIN_TEMPLATES, ...customOnly]
  } catch (error) {
    console.warn('Failed to save templates:', error)
  }
}

/**
 * Get all templates
 */
export const getAllTemplates = (): NoteTemplate[] => {
  if (templates.value.length === 0) {
    loadTemplates()
  }
  return templates.value
}

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): NoteTemplate | undefined => {
  return getAllTemplates().find(t => t.id === id)
}

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): NoteTemplate[] => {
  return getAllTemplates().filter(t => t.category === category)
}

/**
 * Get all categories
 */
export const getCategories = (): string[] => {
  const categories = new Set<string>()
  getAllTemplates().forEach(t => categories.add(t.category))
  return Array.from(categories).sort()
}

/**
 * Create custom template
 */
export const createTemplate = (template: Omit<NoteTemplate, 'id' | 'isBuiltIn'>): NoteTemplate => {
  const newTemplate: NoteTemplate = {
    ...template,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    isBuiltIn: false
  }

  const allTemplates = getAllTemplates()
  allTemplates.push(newTemplate)
  saveTemplates(allTemplates)

  return newTemplate
}

/**
 * Update template
 */
export const updateTemplate = (id: string, updates: Partial<NoteTemplate>): boolean => {
  const allTemplates = getAllTemplates()
  const index = allTemplates.findIndex(t => t.id === id)

  if (index === -1) return false
  if (allTemplates[index].isBuiltIn) return false // Cannot update built-in templates

  allTemplates[index] = { ...allTemplates[index], ...updates }
  saveTemplates(allTemplates)
  return true
}

/**
 * Delete template
 */
export const deleteTemplate = (id: string): boolean => {
  const allTemplates = getAllTemplates()
  const template = allTemplates.find(t => t.id === id)

  if (!template) return false
  if (template.isBuiltIn) return false // Cannot delete built-in templates

  const filtered = allTemplates.filter(t => t.id !== id)
  saveTemplates(filtered)
  return true
}

/**
 * Apply template with variable substitution
 */
export const applyTemplate = (template: NoteTemplate): string => {
  let content = template.content

  // Replace {{datetime}} with current datetime
  const now = new Date()
  const datetime = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  const date = now.toLocaleDateString('zh-CN')
  const time = now.toLocaleTimeString('zh-CN')

  content = content.replace(/\{\{datetime\}\}/g, datetime)
  content = content.replace(/\{\{date\}\}/g, date)
  content = content.replace(/\{\{time\}\}/g, time)

  return content
}

/**
 * Use note templates composable
 */
export function useNoteTemplates() {
  // Load templates on init
  if (templates.value.length === 0) {
    loadTemplates()
  }

  // All templates
  const allTemplates = computed(() => getAllTemplates())

  // Categories
  const categories = computed(() => getCategories())

  // Templates grouped by category
  const templatesByCategory = computed(() => {
    const grouped: Record<string, NoteTemplate[]> = {}
    getAllTemplates().forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = []
      }
      grouped[template.category].push(template)
    })
    return grouped
  })

  // Built-in templates
  const builtinTemplates = computed(() => {
    return getAllTemplates().filter(t => t.isBuiltIn)
  })

  // Custom templates
  const customTemplatesList = computed(() => {
    return getAllTemplates().filter(t => !t.isBuiltIn)
  })

  // Create template
  const create = (template: Omit<NoteTemplate, 'id' | 'isBuiltIn'>): NoteTemplate => {
    return createTemplate(template)
  }

  // Update template
  const update = (id: string, updates: Partial<NoteTemplate>): boolean => {
    return updateTemplate(id, updates)
  }

  // Delete template
  const remove = (id: string): boolean => {
    return deleteTemplate(id)
  }

  // Apply template
  const apply = (template: NoteTemplate): string => {
    return applyTemplate(template)
  }

  return {
    // State
    allTemplates,
    categories,
    templatesByCategory,
    builtinTemplates,
    customTemplatesList,

    // Methods
    create,
    update,
    remove,
    apply,
    getTemplateById,
    getTemplatesByCategory
  }
}

export default useNoteTemplates
