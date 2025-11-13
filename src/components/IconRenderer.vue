/**
 * Icon renderer component for dynamically rendering iconify icons
 */

<script setup lang="ts">
defineProps<{
  name: string
  class?: string
}>()
</script>

<template>
  <i-lucide-mouse-pointer-2 v-if="name === 'i-lucide-mouse-pointer-2'" :class="class" />
  <i-lucide-hand v-else-if="name === 'i-lucide-hand'" :class="class" />
  <i-lucide-square v-else-if="name === 'i-lucide-square'" :class="class" />
  <i-lucide-circle v-else-if="name === 'i-lucide-circle'" :class="class" />
  <i-lucide-minus v-else-if="name === 'i-lucide-minus'" :class="class" />
  <i-lucide-arrow-right v-else-if="name === 'i-lucide-arrow-right'" :class="class" />
  <i-lucide-pen-tool v-else-if="name === 'i-lucide-pen-tool'" :class="class" />
  <i-lucide-type v-else-if="name === 'i-lucide-type'" :class="class" />
  <i-lucide-image v-else-if="name === 'i-lucide-image'" :class="class" />
  <i-lucide-image-down v-else-if="name === 'i-lucide-image-down'" :class="class" />
</template>

