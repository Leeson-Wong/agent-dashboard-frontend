<template>
  <div :class="calendarClasses">
    <!-- Header -->
    <div class="calendar__header">
      <!-- Previous Month Button -->
      <button
        class="calendar__nav"
        :disabled="!canNavigatePrevious"
        @click="navigatePrevious"
        aria-label="Previous month"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15" />
        </svg>
      </button>

      <!-- Month/Year Selector -->
      <div class="calendar__selector">
        <button
          class="calendar__month-year"
          @click="toggleMonthView"
        >
          {{ currentMonthName }} {{ currentYear }}
        </button>
      </div>

      <!-- Next Month Button -->
      <button
        class="calendar__nav"
        :disabled="!canNavigateNext"
        @click="navigateNext"
        aria-label="Next month"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9" />
        </svg>
      </button>
    </div>

    <!-- Month View -->
    <div v-if="view === 'month'" class="calendar__month-view">
      <!-- Weekday Headers -->
      <div class="calendar__weekdays">
        <div
          v-for="weekday in weekdays"
          :key="weekday"
          class="calendar__weekday"
        >
          {{ weekday }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="calendar__days">
        <!-- Empty cells before first day of month -->
        <div
          v-for="i in firstDayOffset"
          :key="`empty-${i}`"
          class="calendar__day calendar__day--empty"
        ></div>

        <!-- Days of month -->
        <button
          v-for="day in daysInMonth"
          :key="day.date"
          class="calendar__day"
          :class="getDayClasses(day)"
          :disabled="isDateDisabled(day.date)"
          @click="selectDate(day.date)"
        >
          {{ day.dayNumber }}
        </button>
      </div>
    </div>

    <!-- Year/Month View -->
    <div v-else class="calendar__year-view">
      <div class="calendar__months">
        <button
          v-for="(month, index) in months"
          :key="index"
          class="calendar__month-btn"
          :class="{ 'calendar__month-btn--active': index === currentMonth }"
          @click="selectMonth(index)"
        >
          {{ month }}
        </button>
      </div>
    </div>

    <!-- Today Button -->
    <div class="calendar__footer" v-if="showToday">
      <button
        class="calendar__today"
        @click="goToToday"
      >
        Today
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type CalendarSize = 'sm' | 'md' | 'lg'
export type CalendarVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface CalendarDate {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

interface Props {
  modelValue?: Date
  min?: Date
  max?: Date
  disabledDates?: (date: Date) => boolean
  size?: CalendarSize
  variant?: CalendarVariant
  showToday?: boolean
  format?: (date: Date) => string
  weekStartsOn?: 0 | 1 | 6
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  showToday: true,
  weekStartsOn: 0
})

const emit = defineEmits<{
  'update:modelValue': [date: Date]
  'select': [date: Date]
}>()

// State
const view = ref<'month' | 'year'>('month')
const currentDate = ref(new Date(props.modelValue || new Date()))

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const weekdays = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (props.weekStartsOn === 1) {
    return [...days.slice(1), days[0]]
  }
  return days
})

// Current date info
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => months[currentMonth.value])

// First day of month offset
const firstDayOffset = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  let day = firstDay.getDay()
  if (props.weekStartsOn === 1) {
    day = day === 0 ? 6 : day - 1
  }
  return day
})

// Days in current month
const daysInMonth = computed((): CalendarDate[] => {
  const year = currentYear.value
  const month = currentMonth.value
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const selectedDate = props.modelValue

  const days: CalendarDate[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isCurrentMonth = month === currentDate.value.getMonth()
    const isToday = isSameDay(date, today)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const isDisabled = props.disabledDates ? props.disabledDates(date) : false

    // Check min/max
    let disabled = isDisabled
    if (props.min && date < props.min) disabled = true
    if (props.max && date > props.max) disabled = true

    days.push({
      date,
      dayNumber: day,
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled: disabled || false
    })
  }

  return days
})

// Can navigate
const canNavigatePrevious = computed(() => {
  if (props.min) {
    const prevMonth = new Date(currentYear.value, currentMonth.value - 1, 1)
    return prevMonth >= props.min
  }
  return true
})

const canNavigateNext = computed(() => {
  if (props.max) {
    const nextMonth = new Date(currentYear.value, currentMonth.value + 1, 1)
    return nextMonth <= props.max
  }
  return true
})

// Calendar classes
const calendarClasses = computed(() => [
  'calendar',
  `calendar--${props.size}`,
  `calendar--${props.variant}`
])

// Get day classes
const getDayClasses = (day: CalendarDate) => {
  return {
    'calendar__day--other-month': !day.isCurrentMonth,
    'calendar__day--today': day.isToday,
    'calendar__day--selected': day.isSelected,
    'calendar__day--disabled': day.isDisabled
  }
}

// Check if date is disabled
const isDateDisabled = (date: Date) => {
  return daysInMonth.value.find(d => d.date.getTime() === date.getTime())?.isDisabled || false
}

// Select date
const selectDate = (date: Date) => {
  currentDate.value = date
  emit('update:modelValue', date)
  emit('select', date)
}

// Navigate
const navigatePrevious = () => {
  const newDate = new Date(currentYear.value, currentMonth.value - 1, 1)
  currentDate.value = newDate
}

const navigateNext = () => {
  const newDate = new Date(currentYear.value, currentMonth.value + 1, 1)
  currentDate.value = newDate
}

const toggleMonthView = () => {
  view.value = view.value === 'month' ? 'year' : 'month'
}

const selectMonth = (monthIndex: number) => {
  currentDate.value = new Date(currentYear.value, monthIndex, 1)
  view.value = 'month'
}

const goToToday = () => {
  currentDate.value = new Date()
  emit('update:modelValue', currentDate.value)
}

// Utilities
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}
</script>

<style scoped>
.calendar {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

/* Sizes */
.calendar--sm {
  font-size: 0.8125rem;
}

.calendar--sm .calendar__day {
  min-height: 2rem;
  font-size: 0.75rem;
}

.calendar--md {
  font-size: 0.875rem;
}

.calendar--md .calendar__day {
  min-height: 2.5rem;
  font-size: 0.875rem;
}

.calendar--lg {
  font-size: 0.9375rem;
}

.calendar--lg .calendar__day {
  min-height: 3rem;
  font-size: 0.9375rem;
}

/* Header */
.calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.calendar__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.calendar__nav:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.calendar__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.calendar__nav svg {
  width: 1rem;
  height: 1rem;
}

/* Selector */
.calendar__selector {
  flex: 1;
  text-align: center;
}

.calendar__month-year {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar__month-year:hover {
  background-color: #f3f4f6;
}

/* Month View */
.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.calendar__weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}

.calendar--sm .calendar__weekday {
  font-size: 0.6875rem;
}

.calendar--lg .calendar__weekday {
  font-size: 0.8125rem;
}

.calendar__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

/* Day Buttons */
.calendar__day {
  min-height: 2.5rem;
  padding: 0.25rem;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar__day:hover:not(.calendar__day--disabled) {
  background-color: #f3f4f6;
}

.calendar__day:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.calendar__day--today {
  font-weight: 600;
  border-color: #3b82f6;
  color: #3b82f6;
}

.calendar__day--selected {
  background-color: #3b82f6 !important;
  color: #ffffff !important;
  border-color: #3b82f6 !important;
}

.calendar--primary .calendar__day--selected {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.calendar--success .calendar__day--selected {
  background-color: #22c55e !important;
  border-color: #22c55e !important;
}

.calendar--warning .calendar__day--selected {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
}

.calendar--error .calendar__day--selected {
  background-color: #ef4444 !important;
  border-color: #ef4444 !important;
}

.calendar__day--other-month {
  color: #d1d5db;
}

.calendar__day--disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.calendar__day--empty {
  pointer-events: none;
}

/* Year View */
.calendar__year-view {
  padding: 1rem 0;
}

.calendar__months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.calendar__month-btn {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar__month-btn:hover {
  background-color: #f3f4f6;
}

.calendar__month-btn--active {
  background-color: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

/* Footer */
.calendar__footer {
  margin-top: 1rem;
  text-align: center;
}

.calendar__today {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  transition: all 0d.2s ease;
}

.calendar__today:hover {
  background-color: #f3f4f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .calendar {
    background-color: #1f2937;
    border-color: #374151;
  }

  .calendar__month-year {
    color: #f9fafb;
  }

  .calendar__weekday {
    color: #9ca3af;
  }

  .calendar__day {
    color: #d1d5db;
    border-color: transparent;
  }

  .calendar__day:hover:not(.calendar__day--disabled) {
    background-color: #374151;
  }

  .calendar__day--today {
    border-color: #60a5fa;
    color: #60a5fa;
  }

  .calendar__day--other-month {
    color: #6b7280;
  }

  .calendar__month-btn {
    border-color: #4b5563;
  }

  .calendar__month-btn:hover {
    background-color: #374151;
  }

  .calendar__today {
    border-color: #4b5563;
  }

  .calendar__today:hover {
    background-color: #374151;
  }
}
</style>
