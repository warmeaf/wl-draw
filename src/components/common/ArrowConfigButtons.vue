<script setup lang="ts">
import { computed } from 'vue'
import type { ArrowType } from './ArrowPicker.vue'

interface Props {
  startArrow?: ArrowType
  endArrow?: ArrowType
}

interface Emits {
  (e: 'update:startArrow', value: ArrowType): void
  (e: 'update:endArrow', value: ArrowType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const defaultStartArrow: ArrowType = 'none'
const defaultEndArrow: ArrowType = 'arrow'

const currentStartArrow = computed(() => props.startArrow ?? defaultStartArrow)
const currentEndArrow = computed(() => props.endArrow ?? defaultEndArrow)

function updateStartArrow(arrowType: ArrowType) {
  emit('update:startArrow', arrowType)
}

function updateEndArrow(arrowType: ArrowType) {
  emit('update:endArrow', arrowType)
}
</script>

<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
    <template #trigger>
      <n-button quaternary size="small" circle>
        <template #icon>
          <SvgIcon :type="currentStartArrow" direction="left" size="18" />
        </template>
      </n-button>
    </template>
    <ArrowPicker
      :value="currentStartArrow"
      direction="left"
      :other-arrow="currentEndArrow"
      @update:value="updateStartArrow"
    />
  </n-popover>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
    <template #trigger>
      <n-button quaternary size="small" circle>
        <template #icon>
          <SvgIcon :type="currentEndArrow" direction="right" size="18" />
        </template>
      </n-button>
    </template>
    <ArrowPicker
      :value="currentEndArrow"
      direction="right"
      :other-arrow="currentStartArrow"
      @update:value="updateEndArrow"
    />
  </n-popover>
</template>
