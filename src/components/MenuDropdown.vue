/** 
 * Menu dropdown component for toolbar actions like export 
 */

<script setup lang="ts">
import type { DropdownOption } from 'naive-ui'
import { computed, h } from 'vue'
import IconRenderer from '@/components/IconRenderer.vue'
import { exportFormats } from '@/config/export'
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

  return [
    {
      label: ui.label,
      key: 'export-image',
      shortcut,
      iconComponent: ui.iconComponent,
      children: [
        {
          label: exportFormats.png,
          key: 'export-png',
        },
        {
          label: exportFormats.jpg,
          key: 'export-jpg',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      label: 'GitHub',
      key: 'github',
      iconComponent: 'i-lucide-github',
    },
  ]
})

function renderLabel(option: DropdownOption & { shortcut?: string; iconComponent?: string }) {
  if (option.type === 'divider') {
    return null
  }

  const labelContent =
    typeof option.label === 'string'
      ? option.label
      : typeof option.label === 'function'
        ? option.label()
        : ''
  const iconContent = option.iconComponent
    ? h(IconRenderer, { name: option.iconComponent, class: 'text-sm' })
    : null

  return h(
    'div',
    {
      class: 'flex items-center justify-between gap-4',
    },
    [
      h(
        'div',
        {
          class: 'flex items-center gap-2',
        },
        [iconContent, h('span', labelContent)]
      ),
      option.shortcut
        ? h(
            'span',
            {
              class: 'text-gray-400 text-xs',
            },
            option.shortcut
          )
        : null,
    ]
  )
}

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
  } else if (key === 'github') {
    window.open('https://github.com/warmeaf/wl-draw/tree/plugin-architecture', '_blank')
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2 p-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-dropdown
      :options="dropdownOptions"
      placement="bottom-start"
      trigger="click"
      size="small"
      :render-label="renderLabel"
      @select="handleSelect"
      :disabled="!exportPlugin"
    >
      <n-button size="small" circle quaternary>
        <template #icon>
          <i-lucide-menu class="text-sm" />
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>
