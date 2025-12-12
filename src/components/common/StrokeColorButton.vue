<script setup lang="ts">
interface Props {
  strokeColor: string
}

defineProps<Props>()
</script>

<template>
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
