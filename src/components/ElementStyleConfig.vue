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
}

interface Emits {
  (e: 'update:fillColor', value: string): void
  (e: 'update:strokeColor', value: string): void
  (e: 'update:strokeWidth', value: number): void
  (e: 'update:strokeType', value: StrokeType): void
  (e: 'update:startArrow', value: ArrowType): void
  (e: 'update:endArrow', value: ArrowType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedElementStrokeType = computed<StrokeType>(() => {
  return props.dashPattern ? 'dashed' : 'solid'
})

const isFillableElement = computed(() => {
  return props.elementType === 'rect' || props.elementType === 'circle'
})

const handleStrokeTypeChange = (type: StrokeType) => {
  emit('update:strokeType', type)
}

const handleFillColorUpdate = (color: string) => {
  emit('update:fillColor', color)
}

const handleStrokeColorUpdate = (color: string) => {
  emit('update:strokeColor', color)
}

const handleStrokeWidthUpdate = (width: number) => {
  emit('update:strokeWidth', width)
}

const handleStartArrowUpdate = (arrowType: ArrowType) => {
  emit('update:startArrow', arrowType)
}

const handleEndArrowUpdate = (arrowType: ArrowType) => {
  emit('update:endArrow', arrowType)
}
</script>

<template>
  <template v-if="isFillableElement">
    <ColorPicker
      size="small"
      :value="fillColor"
      @update:value="handleFillColorUpdate"
    />
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button quaternary size="small" circle>
          <template #icon>
            <div
              class="flex w-[18px] h-[18px] rounded-full items-center justify-center before:content-[''] before:w-2.5 before:h-2.5 before:rounded-full before:bg-white"
              :style="{
                backgroundColor: strokeColor,
              }"
            />
          </template>
        </n-button>
      </template>
      <StrokeConfig
        :stroke-width="strokeWidth"
        :stroke-color="strokeColor"
        :stroke-type="selectedElementStrokeType"
        @update:stroke-width="handleStrokeWidthUpdate"
        @update:stroke-color="handleStrokeColorUpdate"
        @update:stroke-type="handleStrokeTypeChange"
      />
    </n-popover>
  </template>
  <template v-else-if="elementType === 'line' || elementType === 'pen'">
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button quaternary size="small" circle>
          <template #icon>
            <div
              class="flex w-[18px] h-[18px] rounded-full items-center justify-center before:content-[''] before:w-2.5 before:h-2.5 before:rounded-full before:bg-white"
              :style="{
                backgroundColor: strokeColor,
              }"
            />
          </template>
        </n-button>
      </template>
      <StrokeConfig
        :stroke-width="strokeWidth"
        :stroke-color="strokeColor"
        :stroke-type="selectedElementStrokeType"
        @update:stroke-width="handleStrokeWidthUpdate"
        @update:stroke-color="handleStrokeColorUpdate"
        @update:stroke-type="handleStrokeTypeChange"
      />
    </n-popover>
  </template>
  <template v-else-if="elementType === 'arrow'">
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button quaternary size="small" circle>
          <template #icon>
            <div
              class="flex w-[18px] h-[18px] rounded-full items-center justify-center before:content-[''] before:w-2.5 before:h-2.5 before:rounded-full before:bg-white"
              :style="{
                backgroundColor: strokeColor,
              }"
            />
          </template>
        </n-button>
      </template>
      <StrokeConfig
        :stroke-width="strokeWidth"
        :stroke-color="strokeColor"
        :stroke-type="selectedElementStrokeType"
        @update:stroke-width="handleStrokeWidthUpdate"
        @update:stroke-color="handleStrokeColorUpdate"
        @update:stroke-type="handleStrokeTypeChange"
      />
    </n-popover>
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button
          quaternary
          size="small"
          circle
        >
          <template #icon>
            <SvgIcon :type="startArrow ?? 'none'" direction="left" size="18" />
          </template>
        </n-button>
      </template>
      <ArrowPicker
        :value="startArrow ?? 'none'"
        direction="left"
        :other-arrow="endArrow ?? 'arrow'"
        @update:value="handleStartArrowUpdate"
      />
    </n-popover>
    <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
      <template #trigger>
        <n-button
          quaternary
          size="small"
          circle
        >
          <template #icon>
            <SvgIcon :type="endArrow ?? 'arrow'" direction="right" size="18" />
          </template>
        </n-button>
      </template>
      <ArrowPicker
        :value="endArrow ?? 'arrow'"
        direction="right"
        :other-arrow="startArrow ?? 'none'"
        @update:value="handleEndArrowUpdate"
      />
    </n-popover>
  </template>
</template>
