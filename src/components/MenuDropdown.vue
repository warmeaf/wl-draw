/**
 * Menu dropdown component for toolbar actions like export
 */

<script setup lang="ts">
import { computed, h } from 'vue'
import IconRenderer from '@/components/IconRenderer.vue'
import { useExportTool } from '@/plugins/composables/useExportTool'
import { pluginRegistry } from '@/plugins/registry'
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()

const tree = computed(() => store.appInstance?.tree ?? null)
const exportPlugin = computed(() => pluginRegistry.getByType('export'))
const exportTool = computed(() => {
  if (!tree.value) return null
  return useExportTool(tree.value, store)
})

const dropdownOptions = computed(() => {
  if (!exportPlugin.value || !exportPlugin.value.ui) return []

  const ui = exportPlugin.value.ui
  const shortcut = exportPlugin.value.shortcut
  const label = shortcut ? `${ui.label}【${shortcut}】` : ui.label

  return [
    {
      label,
      key: 'export-image',
      icon: () => h(IconRenderer, { name: ui.iconComponent, class: 'text-sm' }),
      children: [
        {
          label: 'PNG',
          key: 'export-png',
        },
        {
          label: 'JPG',
          key: 'export-jpg',
        },
      ],
    },
  ]
})

async function handleExportImage(format: 'png' | 'jpg') {
  if (exportTool.value) {
    await exportTool.value.exportCanvas(format)
  }
}

function handleSelect(key: string) {
  if (key === 'export-png') {
    handleExportImage('png')
  } else if (key === 'export-jpg') {
    handleExportImage('jpg')
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-dropdown
      :options="dropdownOptions"
      placement="bottom-start"
      trigger="click"
      size="medium"
      @select="handleSelect"
      :disabled="!exportPlugin"
    >
      <n-button circle quaternary>
        <template #icon>
          <i-lucide-menu class="text-xl" />
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>
