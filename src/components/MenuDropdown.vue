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
const exportPlugin = computed(() => pluginRegistry.getPluginMetadata('export'))
const exportJsonPlugin = computed(() => pluginRegistry.getPluginMetadata('exportJson'))
const exportTool = computed(() => {
  if (!tree.value) return null
  return useExportTool(tree.value, store)
})

const dropdownOptions = computed(() => {
  if (!exportPlugin.value || !exportPlugin.value.ui) return []

  const ui = exportPlugin.value.ui
  const shortcut = exportPlugin.value.shortcut
  const exportJsonUi = exportJsonPlugin.value?.ui
  const exportJsonShortcut = exportJsonPlugin.value?.shortcut

  const options: Array<DropdownOption & { shortcut?: string; iconComponent?: string }> = [
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
  ]

  if (exportJsonUi) {
    options.push({
      label: exportJsonUi.label,
      key: 'export-json',
      shortcut: exportJsonShortcut,
      iconComponent: exportJsonUi.iconComponent,
    })
  }

  options.push(
    {
      type: 'divider',
    },
    {
      label: 'GitHub',
      key: 'github',
      iconComponent: 'i-lucide-github',
    }
  )

  return options
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
    ? h(IconRenderer, { name: option.iconComponent, size: 14 })
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

const EXPORT_OPTION_KEYS = {
  PNG: 'export-png',
  JPG: 'export-jpg',
  JSON: 'export-json',
  GITHUB: 'github',
} as const

const GITHUB_URL = 'https://github.com/warmeaf/wl-draw/'

async function exportImage(format: 'png' | 'jpg') {
  if (exportTool.value) {
    await exportTool.value.exportCanvas(format)
  }
}

function exportJSON() {
  if (exportTool.value) {
    exportTool.value.exportCanvasAsJSON()
  }
}

function openGitHub() {
  window.open(GITHUB_URL, '_blank')
}

function handleSelect(key: string) {
  if (key === EXPORT_OPTION_KEYS.PNG) {
    exportImage('png')
  } else if (key === EXPORT_OPTION_KEYS.JPG) {
    exportImage('jpg')
  } else if (key === EXPORT_OPTION_KEYS.JSON) {
    exportJSON()
  } else if (key === EXPORT_OPTION_KEYS.GITHUB) {
    openGitHub()
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
          <IconRenderer name="i-lucide-menu" class="text-sm" />
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>
