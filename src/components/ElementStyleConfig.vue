<script setup lang="ts">
import { computed } from 'vue'
import type { ArrowType } from './common/ArrowPicker.vue'

type ElementType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image' | null
type StrokeType = 'solid' | 'dashed'

interface Props {
  elementType: ElementType
  fillColor: string
  strokeColor: string
  strokeWidth: number
  dashPattern?: number[] | undefined
  startArrow?: ArrowType
  endArrow?: ArrowType
  textColor?: string
  fontSize?: number
}

interface Emits {
  (e: 'update:fillColor', value: string): void
  (e: 'update:strokeColor', value: string): void
  (e: 'update:strokeWidth', value: number): void
  (e: 'update:strokeType', value: StrokeType): void
  (e: 'update:startArrow', value: ArrowType): void
  (e: 'update:endArrow', value: ArrowType): void
  (e: 'update:textColor', value: string): void
  (e: 'update:fontSize', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentStrokeType = computed<StrokeType>(() => {
  return props.dashPattern ? 'dashed' : 'solid'
})

const isFillableElement = computed(() => {
  return props.elementType === 'rect' || props.elementType === 'circle'
})

const isStrokeOnlyElement = computed(() => {
  return props.elementType === 'line' || props.elementType === 'pen'
})

const isArrowElement = computed(() => {
  return props.elementType === 'arrow'
})

const isTextElement = computed(() => {
  return props.elementType === 'text'
})

function updateStrokeType(type: StrokeType) {
  emit('update:strokeType', type)
}

function updateFillColor(color: string) {
  emit('update:fillColor', color)
}

function updateStrokeColor(color: string) {
  emit('update:strokeColor', color)
}

function updateStrokeWidth(width: number) {
  emit('update:strokeWidth', width)
}

function updateStartArrow(arrowType: ArrowType) {
  emit('update:startArrow', arrowType)
}

function updateEndArrow(arrowType: ArrowType) {
  emit('update:endArrow', arrowType)
}

function updateTextColor(color: string) {
  emit('update:textColor', color)
}

function updateFontSize(size: number) {
  emit('update:fontSize', size)
}

function handleFontSizeInput(value: number | null) {
  if (value === null) return
  const minFontSize = 8
  const maxFontSize = 200
  const clampedValue = Math.max(minFontSize, Math.min(maxFontSize, value))
  updateFontSize(clampedValue)
}
</script>

<template>
  <template v-if="isFillableElement">
    <ColorPicker size="small" :value="fillColor" @update:value="updateFillColor" />
    <StrokeConfigPopover
      :stroke-width="strokeWidth"
      :stroke-color="strokeColor"
      :stroke-type="currentStrokeType"
      @update:stroke-width="updateStrokeWidth"
      @update:stroke-color="updateStrokeColor"
      @update:stroke-type="updateStrokeType"
    >
      <template #trigger>
        <StrokeColorButton :stroke-color="strokeColor" />
      </template>
    </StrokeConfigPopover>
  </template>
  <template v-else-if="isStrokeOnlyElement">
    <StrokeConfigPopover
      :stroke-width="strokeWidth"
      :stroke-color="strokeColor"
      :stroke-type="currentStrokeType"
      @update:stroke-width="updateStrokeWidth"
      @update:stroke-color="updateStrokeColor"
      @update:stroke-type="updateStrokeType"
    >
      <template #trigger>
        <StrokeColorButton :stroke-color="strokeColor" />
      </template>
    </StrokeConfigPopover>
  </template>
  <template v-else-if="isArrowElement">
    <StrokeConfigPopover
      :stroke-width="strokeWidth"
      :stroke-color="strokeColor"
      :stroke-type="currentStrokeType"
      @update:stroke-width="updateStrokeWidth"
      @update:stroke-color="updateStrokeColor"
      @update:stroke-type="updateStrokeType"
    >
      <template #trigger>
        <StrokeColorButton :stroke-color="strokeColor" />
      </template>
    </StrokeConfigPopover>
    <ArrowConfigButtons
      :start-arrow="startArrow"
      :end-arrow="endArrow"
      @update:start-arrow="updateStartArrow"
      @update:end-arrow="updateEndArrow"
    />
  </template>
  <template v-else-if="isTextElement">
    <ColorPicker
      size="small"
      :value="textColor ?? '#000000'"
      @update:value="updateTextColor"
    />
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button quaternary size="small" circle>
          <template #icon>
            <div class="flex items-center justify-center w-[18px] h-[18px] text-xs font-semibold">
              {{ fontSize ?? 16 }}
            </div>
          </template>
        </n-button>
      </template>
      <div class="flex flex-col bg-white p-2">
        <n-input-number
          :value="fontSize ?? 16"
          :min="8"
          :max="200"
          :step="1"
          size="small"
          class="w-[90px]"
          placeholder=""
          @update:value="handleFontSizeInput"
        />
      </div>
    </n-popover>
  </template>
</template>
