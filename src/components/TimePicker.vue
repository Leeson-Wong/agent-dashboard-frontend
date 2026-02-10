<template>
  <div :class="timePickerClasses">
    <!-- Time Input Display -->
    <div class="time-picker__input" @click="toggleDropdown">
      <div class="time-picker__time">
        <span
          v-if="!isDropdownOpen"
          class="time-picker__value"
        >
          {{ displayTime }}
        </span>
        <input
          v-else
          ref="hourInput"
          :value="formattedHours"
          @input="handleHoursInput"
          @focus="selectHours"
          class="time-picker__field"
          :class="{ 'time-picker__field--active': activeField === 'hours' }"
          maxlength="2"
        />
        <span class="time-picker__separator">:</span>
        <input
          v-if="isDropdownOpen"
          ref="minuteInput"
          :value="formattedMinutes"
          @input="handleMinutesInput"
          @focus="selectMinutes"
          class="time-picker__field"
          :class="{ 'time-picker__field--active': activeField === 'minutes' }"
          maxlength="2"
        />
        <span v-else class="time-picker__value">{{ formattedMinutes }}</span>
        <span
          v-if="format12Hour"
          class="time-picker__period"
          @click.stop="togglePeriod"
        >
          {{ period }}
        </span>
      </div>
      <div class="time-picker__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
    </div>

    <!-- Dropdown with Clock -->
    <Transition name="time-picker__dropdown">
      <div v-if="isDropdownOpen" class="time-picker__dropdown">
        <div class="time-picker__clock">
          <!-- Clock face -->
          <div class="time-picker__clock-face">
            <!-- Hour hand -->
            <div
              v-if="activeField === 'hours'"
              class="time-picker__hand time-picker__hand--hour"
              :style="hourHandStyle"
            ></div>
            <!-- Minute hand -->
            <div
              v-if="activeField === 'minutes'"
              class="time-picker__hand time-picker__hand--minute"
              :style="minuteHandStyle"
            ></div>

            <!-- Clock numbers -->
            <div
              v-for="(num, index) in clockNumbers"
              :key="index"
              class="time-picker__clock-number"
              :style="getClockNumberPosition(index, clockNumbers.length)"
              :class="{ 'time-picker__clock-number--active': isClockNumberActive(num) }"
              @click="selectClockNumber(num)"
            >
              {{ num }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="time-picker__actions">
          <button
            class="time-picker__btn time-picker__btn--cancel"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            class="time-picker__btn time-picker__btn--confirm"
            @click="confirm"
          >
            OK
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

export type TimePickerSize = 'sm' | 'md' | 'lg'
export type TimePickerVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

interface Props {
  modelValue?: Date
  size?: TimePickerSize
  variant?: TimePickerVariant
  format12Hour?: boolean
  hourStep?: number
  minuteStep?: number
  disabled?: boolean
  placeholder?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  format12Hour: false,
  hourStep: 1,
  minuteStep: 1,
  disabled: false,
  placeholder: 'Select time',
  clearable: true
})

const emit = defineEmits<{
  'update:modelValue': [date: Date]
  'change': [date: Date]
  'open': []
  'close': []
}>()

// State
const isDropdownOpen = ref(false)
const activeField = ref<'hours' | 'minutes'>('hours')
const internalValue = ref<Date | undefined>(props.modelValue ? new Date(props.modelValue) : undefined)
const hourInput = ref<HTMLInputElement>()
const minuteInput = ref<HTMLInputElement>()

// Hours and minutes
const hours = computed(() => internalValue.value?.getHours() ?? 0)
const minutes = computed(() => internalValue.value?.getMinutes() ?? 0)

// 12-hour format
const displayHours = computed(() => {
  if (props.format12Hour) {
    const h = hours.value % 12
    return h === 0 ? 12 : h
  }
  return hours.value
})

const period = computed(() => {
  return hours.value >= 12 ? 'PM' : 'AM'
})

// Formatted values
const formattedHours = computed(() => String(displayHours.value).padStart(2, '0'))
const formattedMinutes = computed(() => String(minutes.value).padStart(2, '0'))

// Display time
const displayTime = computed(() => {
  if (!internalValue.value) return props.placeholder
  if (props.format12Hour) {
    return `${formattedHours.value}:${formattedMinutes.value} ${period.value}`
  }
  return `${formattedHours.value}:${formattedMinutes.value}`
})

// Clock numbers
const clockNumbers = computed(() => {
  if (activeField.value === 'hours') {
    if (props.format12Hour) {
      return Array.from({ length: 12 }, (_, i) => i + 1)
    }
    return Array.from({ length: 24 }, (_, i) => i)
  }
  // Minutes - show every 5 minutes
  const nums: number[] = []
  for (let i = 0; i < 60; i += props.minuteStep) {
    nums.push(i)
  }
  return nums
})

// Clock hand styles
const hourHandStyle = computed(() => {
  const rotation = (displayHours.value % 12) * 30 + (minutes.value / 60) * 30
  return {
    transform: `rotate(${rotation}deg)`
  }
})

const minuteHandStyle = computed(() => {
  const rotation = minutes.value * 6
  return {
    transform: `rotate(${rotation}deg)`
  }
})

// Time picker classes
const timePickerClasses = computed(() => [
  'time-picker',
  `time-picker--${props.size}`,
  `time-picker--${props.variant}`,
  {
    'time-picker--disabled': props.disabled,
    'time-picker--open': isDropdownOpen.value
  }
])

// Get clock number position
const getClockNumberPosition = (index: number, total: number) => {
  const angle = (index * 360) / total - 90
  const radius = total === 12 ? 35 : total === 24 ? 35 : 40
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  return {
    left: `calc(50% + ${x}px - 10px)`,
    top: `calc(50% + ${y}px - 10px)`
  }
}

// Check if clock number is active
const isClockNumberActive = (num: number) => {
  if (activeField.value === 'hours') {
    if (props.format12Hour) {
      return num === displayHours.value
    }
    return num === hours.value
  }
  return num === minutes.value
}

// Select clock number
const selectClockNumber = (num: number) => {
  if (!internalValue.value) {
    internalValue.value = new Date()
  }

  if (activeField.value === 'hours') {
    const newHours = props.format12Hour
      ? (period.value === 'PM' && num !== 12 ? num + 12 : period.value === 'AM' && num === 12 ? 0 : num)
      : num
    internalValue.value.setHours(newHours)
    activeField.value = 'minutes'
    nextTick(() => minuteInput.value?.focus())
  } else {
    internalValue.value.setMinutes(num)
  }
}

// Toggle dropdown
const toggleDropdown = () => {
  if (props.disabled) return
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    emit('open')
    activeField.value = 'hours'
    nextTick(() => hourInput.value?.focus())
  } else {
    emit('close')
  }
}

// Toggle period (AM/PM)
const togglePeriod = () => {
  if (!internalValue.value) {
    internalValue.value = new Date()
  }

  const currentHours = internalValue.value.getHours()
  if (currentHours >= 12) {
    internalValue.value.setHours(currentHours - 12)
  } else {
    internalValue.value.setHours(currentHours + 12)
  }
}

// Handle hours input
const handleHoursInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  if (props.format12Hour) {
    if (value < 1) value = 1
    if (value > 12) value = 12
  } else {
    if (value < 0) value = 0
    if (value > 23) value = 23
  }

  if (!internalValue.value) {
    internalValue.value = new Date()
  }

  const newHours = props.format12Hour
    ? (period.value === 'PM' && value !== 12 ? value + 12 : period.value === 'AM' && value === 12 ? 0 : value)
    : value
  internalValue.value.setHours(newHours)
}

// Handle minutes input
const handleMinutesInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  if (value < 0) value = 0
  if (value > 59) value = 59

  if (!internalValue.value) {
    internalValue.value = new Date()
  }
  internalValue.value.setMinutes(value)
}

// Select hours
const selectHours = () => {
  activeField.value = 'hours'
  hourInput.value?.select()
}

// Select minutes
const selectMinutes = () => {
  activeField.value = 'minutes'
  minuteInput.value?.select()
}

// Confirm selection
const confirm = () => {
  if (internalValue.value) {
    emit('update:modelValue', new Date(internalValue.value))
    emit('change', new Date(internalValue.value))
  }
  isDropdownOpen.value = false
}

// Cancel selection
const cancel = () => {
  internalValue.value = props.modelValue ? new Date(props.modelValue) : undefined
  isDropdownOpen.value = false
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    internalValue.value = new Date(newValue)
  }
})

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Node
    const picker = document.querySelector('.time-picker')
    if (picker && !picker.contains(target) && isDropdownOpen.value) {
      confirm()
    }
  })
}
</script>

<style scoped>
.time-picker {
  position: relative;
  display: inline-block;
}

/* Input */
.time-picker__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-picker__input:hover {
  border-color: #d1d5db;
}

.time-picker--open .time-picker__input {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.time-picker--disabled .time-picker__input {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

/* Sizes */
.time-picker--sm .time-picker__input {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}

.time-picker--md .time-picker__input {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.time-picker--lg .time-picker__input {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
}

/* Time display */
.time-picker__time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.time-picker__value {
  color: #111827;
}

.time-picker__field {
  width: 2rem;
  padding: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  text-align: center;
  font-family: inherit;
  font-size: inherit;
  color: #111827;
  transition: all 0.2s ease;
}

.time-picker__field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.time-picker__field--active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.time-picker__separator {
  color: #6b7280;
}

.time-picker__period {
  padding: 0.25rem 0.5rem;
  margin-left: 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-picker__period:hover {
  background-color: #f3f4f6;
  color: #111827;
}

/* Icon */
.time-picker__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.time-picker--sm .time-picker__icon {
  width: 1rem;
  height: 1rem;
}

.time-picker--lg .time-picker__icon {
  width: 1.5rem;
  height: 1.5rem;
}

.time-picker__icon svg {
  width: 100%;
  height: 100%;
}

/* Dropdown */
.time-picker__dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 50;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.time-picker__dropdown-enter-active,
.time-picker__dropdown-leave-active {
  transition: all 0.2s ease;
}

.time-picker__dropdown-enter-from,
.time-picker__dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Clock */
.time-picker__clock {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.time-picker__clock-face {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  background-color: #f9fafb;
}

.time-picker--sm .time-picker__clock-face {
  width: 150px;
  height: 150px;
}

.time-picker--lg .time-picker__clock-face {
  width: 250px;
  height: 250px;
}

/* Clock hand */
.time-picker__hand {
  position: absolute;
  bottom: 50%;
  left: calc(50% - 2px);
  width: 4px;
  height: 50%;
  background-color: #3b82f6;
  transform-origin: bottom center;
  border-radius: 2px;
}

.time-picker--primary .time-picker__hand {
  background-color: #3b82f6;
}

.time-picker--success .time-picker__hand {
  background-color: #22c55e;
}

.time-picker--warning .time-picker__hand {
  background-color: #f59e0b;
}

.time-picker--error .time-picker__hand {
  background-color: #ef4444;
}

.time-picker__hand::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  background-color: inherit;
  border-radius: 50%;
}

/* Clock numbers */
.time-picker__clock-number {
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #6b7280;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-picker__clock-number:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.time-picker__clock-number--active {
  background-color: #3b82f6;
  color: #ffffff;
}

.time-picker--primary .time-picker__clock-number--active {
  background-color: #3b82f6;
}

.time-picker--success .time-picker__clock-number--active {
  background-color: #22c55e;
}

.time-picker--warning .time-picker__clock-number--active {
  background-color: #f59e0b;
}

.time-picker--error .time-picker__clock-number--active {
  background-color: #ef4444;
}

/* Actions */
.time-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.time-picker__btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-picker__btn--cancel {
  background-color: transparent;
  border-color: #e5e7eb;
  color: #6b7280;
}

.time-picker__btn--cancel:hover {
  background-color: #f9fafb;
}

.time-picker__btn--confirm {
  background-color: #3b82f6;
  color: #ffffff;
}

.time-picker--primary .time-picker__btn--confirm {
  background-color: #3b82f6;
}

.time-picker--success .time-picker__btn--confirm {
  background-color: #22c55e;
}

.time-picker--warning .time-picker__btn--confirm {
  background-color: #f59e0b;
}

.time-picker--error .time-picker__btn--confirm {
  background-color: #ef4444;
}

.time-picker__btn--confirm:hover {
  opacity: 0.9;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .time-picker__input {
    background-color: #1f2937;
    border-color: #374151;
  }

  .time-picker__input:hover {
    border-color: #4b5563;
  }

  .time-picker--open .time-picker__input {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .time-picker--disabled .time-picker__input {
    background-color: #111827;
  }

  .time-picker__value {
    color: #f9fafb;
  }

  .time-picker__field {
    background-color: #111827;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .time-picker__field:focus {
    border-color: #3b82f6;
  }

  .time-picker__field--active {
    background-color: #1e3a8a;
  }

  .time-picker__separator {
    color: #9ca3af;
  }

  .time-picker__period {
    color: #9ca3af;
  }

  .time-picker__period:hover {
    background-color: #374151;
    color: #f9fafb;
  }

  .time-picker__icon {
    color: #9ca3af;
  }

  .time-picker__dropdown {
    background-color: #1f2937;
    border-color: #374151;
  }

  .time-picker__clock-face {
    background-color: #111827;
    border-color: #374151;
  }

  .time-picker__clock-number {
    color: #9ca3af;
  }

  .time-picker__clock-number:hover {
    background-color: #374151;
    color: #f9fafb;
  }

  .time-picker__btn--cancel {
    background-color: transparent;
    border-color: #4b5563;
    color: #9ca3af;
  }

  .time-picker__btn--cancel:hover {
    background-color: #374151;
  }
}
</style>
