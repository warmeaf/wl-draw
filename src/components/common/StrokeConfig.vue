<script setup lang="ts">
export type StrokeType = 'solid' | 'dashed'
type Size = 'small' | 'medium' | 'large'

interface Props {
  strokeType?: StrokeType
  strokeWidth: number
  strokeColor: string
  minWidth?: number
  maxWidth?: number
  step?: number
}
interface Emits {
  (e: 'update:strokeType', value: StrokeType): void
  (e: 'update:strokeWidth', value: number): void
  (e: 'update:strokeColor', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  strokeType: 'solid',
  minWidth: 0,
  maxWidth: 100,
  step: 1,
})
const emit = defineEmits<Emits>()
const size = ref<Size>('small')

function handleStrokeTypeChange(type: StrokeType) {
  emit('update:strokeType', type)
}

function handleWidthChange(value: number | null) {
  if (value === null) return
  const clampedValue = Math.max(props.minWidth, Math.min(props.maxWidth, value))
  emit('update:strokeWidth', clampedValue)
}

function handleColorUpdate(color: string) {
  emit('update:strokeColor', color)
}
</script>

<template>
  <div class="flex flex-col bg-white">
    <div class="flex items-center">
      <n-button
        quaternary
        :tertiary="props.strokeType === 'solid'"
        :size="size"
        @click="handleStrokeTypeChange('solid')"
      >
        <template #icon>
          <svg
            class="w-4 h-3 flex items-center justify-center"
            viewBox="0 0 16 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="1"
              y1="1"
              x2="15"
              y2="1"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
            />
          </svg>
        </template>
      </n-button>
      <n-button
        quaternary
        :tertiary="props.strokeType === 'dashed'"
        :size="size"
        @click="handleStrokeTypeChange('dashed')"
      >
        <template #icon>
          <svg
            class="w-4 h-3 flex items-center justify-center"
            viewBox="0 0 16 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="1"
              y1="1"
              x2="15"
              y2="1"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-dasharray="2 2"
            />
          </svg>
        </template>
      </n-button>
    </div>

    <n-divider />

    <div class="flex items-center gap-2">
      <n-input-number
        :value="props.strokeWidth"
        :min="props.minWidth"
        :max="props.maxWidth"
        :step="props.step"
        :size="size"
        class="w-[90px]"
        placeholder=""
        @update:value="handleWidthChange"
      />
      <ColorPicker
        size="small"
        :value="props.strokeColor"
        :circle="false"
        @update:value="handleColorUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.n-divider:not(.n-divider--vertical)) {
  margin: 6px 0;
}
</style>
