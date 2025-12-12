<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  value: string
  size?: 'small' | 'medium' | 'large'
  circle?: boolean
}

type Emits = {
  'update:value': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  circle: true,
})

const emit = defineEmits<Emits>()

function updateColor(color: string) {
  emit('update:value', color)
}

const isColorPickerVisible = ref(false)

function openColorPicker() {
  isColorPickerVisible.value = true
}
</script>

<template>
  <n-button quaternary size="small" :circle="props.circle" @click="openColorPicker">
    <template #icon>
      <n-color-picker
        :size="props.size"
        :value="props.value"
        class="h-[18px]! w-[18px]!"
        :class="{ circle: props.circle }"
        v-model:show="isColorPickerVisible"
        @update:value="updateColor"
      >
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}"></slot>
        </template>
      </n-color-picker>
    </template>
  </n-button>
</template>

<style scoped>
:deep(.n-color-picker-trigger) {
  border: none !important;
}

:deep(.n-color-picker-trigger__value) {
  font-size: 0 !important;
}

:deep(.n-color-picker-trigger .n-color-picker-trigger__fill) {
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.circle :deep(.n-color-picker-trigger .n-color-picker-trigger__fill > div) {
  border-radius: 50% !important;
}
</style>
