<script setup lang="ts">
import { computed } from 'vue'

export type ArrowType =
  | 'none'
  | 'angle'
  | 'angle-side'
  | 'arrow'
  | 'triangle'
  | 'triangle-flip'
  | 'circle'
  | 'circle-line'
  | 'square'
  | 'square-line'
  | 'diamond'
  | 'diamond-line'
  | 'mark'

interface Props {
  value: ArrowType
  direction: 'left' | 'right'
  otherArrow?: ArrowType
}

type Emits = {
  'update:value': [value: ArrowType]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const arrowTypes: ArrowType[] = [
  'none',
  'angle',
  'angle-side',
  'arrow',
  'triangle',
  'triangle-flip',
  'circle',
  'circle-line',
  'square',
  'square-line',
  'diamond',
  'diamond-line',
  'mark',
]

function handleSelect(type: ArrowType) {
  emit('update:value', type)
}

const isNoneDisabled = computed(() => {
  return props.otherArrow === 'none'
})
</script>

<template>
  <div class="grid grid-cols-[repeat(4,auto)] bg-white">
    <n-button
      v-for="type in arrowTypes"
      :key="type"
      quaternary
      size="small"
      :tertiary="props.value === type"
      :disabled="type === 'none' && isNoneDisabled"
      @click="handleSelect(type)"
    >
      <template #icon>
        <SvgIcon :type="type" :direction="props.direction" size="18" />
      </template>
    </n-button>
  </div>
</template>
