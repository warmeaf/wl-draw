<script setup lang="ts">
type StrokeType = 'solid' | 'dashed'

interface Props {
  strokeWidth: number
  strokeColor: string
  strokeType: StrokeType
}

interface Emits {
  (e: 'update:strokeWidth', value: number): void
  (e: 'update:strokeColor', value: string): void
  (e: 'update:strokeType', value: StrokeType): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <n-popover :show-arrow="false" placement="bottom-start" trigger="click">
    <template #trigger>
      <slot name="trigger" />
    </template>
    <StrokeConfig
      :stroke-width="strokeWidth"
      :stroke-color="strokeColor"
      :stroke-type="strokeType"
      @update:stroke-width="$emit('update:strokeWidth', $event)"
      @update:stroke-color="$emit('update:strokeColor', $event)"
      @update:stroke-type="$emit('update:strokeType', $event)"
    />
  </n-popover>
</template>
