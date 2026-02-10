<template>
  <div :class="qrCodeClasses" :style="containerStyle">
    <canvas ref="canvasRef" class="qrcode__canvas"></canvas>
    <div v-if="loading" class="qrcode__loading">
      <Spinner />
    </div>
    <div v-if="error" class="qrcode__error">
      Failed to generate QR code
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

export type QRCodeSize = 'sm' | 'md' | 'lg'
export type QRCodeErrorLevel = 'L' | 'M' | 'Q' | 'H'

interface Props {
  value?: string
  size?: number
  level?: QRCodeErrorLevel
  bgColor?: string
  fgColor?: string
  sizeVariant?: QRCodeSize
  includeMargin?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  size: 200,
  level: 'M',
  bgColor: '#ffffff',
  fgColor: '#000000',
  sizeVariant: 'md',
  includeMargin: true,
  title: ''
})

// State
const canvasRef = ref<HTMLCanvasElement>()
const loading = ref(false)
const error = ref(false)

// Computed
const qrCodeClasses = computed(() => [
  'qrcode',
  `qrcode--${props.sizeVariant}`
])

const containerStyle = computed(() => {
  const size = getSize()
  return {
    width: `${size}px`,
    height: `${size}px`
  }
})

// Get size based on variant
const getSize = (): number => {
  switch (props.sizeVariant) {
    case 'sm': return 128
    case 'md': return 200
    case 'lg': return 256
    default: return props.size
  }
}

// Simple QR Code generation (basic implementation)
const generateQRCode = async () => {
  if (!props.value || !canvasRef.value) return

  loading.value = true
  error.value = false

  try {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    const size = getSize()
    canvas.width = size
    canvas.height = size

    // Simple QR code placeholder (for demo purposes)
    // In production, use a library like qrcode.js or qrcode-generator
    const moduleCount = 25 // Standard QR code size
    const moduleSize = size / (moduleCount + 2)

    // Clear canvas
    ctx.fillStyle = props.bgColor
    ctx.fillRect(0, 0, size, size)

    // Draw a simple pattern as placeholder
    // Real QR code generation requires complex algorithms
    ctx.fillStyle = props.fgColor

    // Draw finder patterns (corners)
    drawFinderPattern(ctx, moduleSize, 1, 1)
    drawFinderPattern(ctx, moduleSize, moduleCount - 6, 1)
    drawFinderPattern(ctx, moduleSize, 1, moduleCount - 6)

    // Draw some random modules as placeholder
    const margin = moduleSize
    const qrSize = moduleCount * moduleSize

    // Add some "data" modules
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * (moduleCount - 10)) + 5
      const y = Math.floor(Math.random() * (moduleCount - 10)) + 5

      // Skip finder pattern areas
      if ((x < 8 && y < 8) ||
          (x > moduleCount - 9 && y < 8) ||
          (x < 8 && y > moduleCount - 9)) {
        continue
      }

      ctx.fillRect(
        margin + x * moduleSize,
        margin + y * moduleSize,
        moduleSize - 1,
        moduleSize - 1
      )
    }

    // Add timing pattern
    for (let i = 8; i < moduleCount - 8; i++) {
      ctx.fillRect(margin + 6 * moduleSize, margin + i * moduleSize, moduleSize - 1, moduleSize - 1)
      ctx.fillRect(margin + i * moduleSize, margin + 6 * moduleSize, moduleSize - 1, moduleSize - 1)
    }

  } catch (err) {
    error.value = true
    console.error('Failed to generate QR code:', err)
  } finally {
    loading.value = false
  }
}

const drawFinderPattern = (
  ctx: CanvasRenderingContext2D,
  moduleSize: number,
  col: number,
  row: number
) => {
  const margin = moduleSize
  const size = 7 // Finder pattern is 7x7 modules

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Outer border
      if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
        ctx.fillRect(
          margin + (col + x) * moduleSize,
          margin + (row + y) * moduleSize,
          moduleSize - 1,
          moduleSize - 1
        )
      }
      // Inner 3x3 square
      else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) {
        ctx.fillRect(
          margin + (col + x) * moduleSize,
          margin + (row + y) * moduleSize,
          moduleSize - 1,
          moduleSize - 1
        )
      }
    }
  }
}

// Watch for value changes
watch(() => props.value, generateQRCode, { immediate: true })

// Lifecycle
onMounted(() => {
  generateQRCode()
})

// Expose methods
defineExpose({
  generate: generateQRCode
})
</script>

<style scoped>
.qrcode {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.qrcode--sm {
  border-radius: 0.25rem;
}

.qrcode--lg {
  border-radius: 0.75rem;
}

.qrcode__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.qrcode__loading,
.qrcode__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

.qrcode__loading {
  background-color: rgba(255, 255, 255, 0.9);
}

.qrcode__error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .qrcode {
    background-color: #1f2937;
    border-color: #374151;
  }

  .qrcode__loading {
    background-color: rgba(31, 41, 55, 0.9);
  }
}
</style>
