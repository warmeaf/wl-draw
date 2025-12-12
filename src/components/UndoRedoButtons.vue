/**
 * Undo/Redo buttons component for toolbar
 */

<script setup lang="ts">
import { computed } from 'vue'
import { useHistory } from '@/plugins/composables/useHistory'
import { pluginRegistry } from '@/plugins/registry'

const { undo, redo, canUndo, canRedo } = useHistory()

const undoPlugin = computed(() => pluginRegistry.getPluginMetadata('undo'))
const redoPlugin = computed(() => pluginRegistry.getPluginMetadata('redo'))

const undoUi = computed(() => undoPlugin.value?.ui)
const redoUi = computed(() => redoPlugin.value?.ui)

function performUndo() {
  undo()
}

function performRedo() {
  redo()
}
</script>

<template>
  <div
    class="flex items-center gap-2 p-2 shadow-sm backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full"
  >
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button
          size="small"
          circle
          quaternary
          :disabled="!canUndo"
          @click="performUndo"
        >
          <template #icon>
            <IconRenderer
              v-if="undoUi"
              :name="undoUi.iconComponent"
              :size="14"
            />
            <IconRenderer v-else name="i-lucide-undo-2" :size="14" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ undoUi?.label || '撤销' }}</span>
        <span v-if="undoPlugin?.shortcut" class="text-gray-400 text-xs ml-2">
          {{ undoPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>

    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button
          size="small"
          circle
          quaternary
          :disabled="!canRedo"
          @click="performRedo"
        >
          <template #icon>
            <IconRenderer
              v-if="redoUi"
              :name="redoUi.iconComponent"
              :size="14"
            />
            <IconRenderer v-else name="i-lucide-redo-2" :size="14" />
          </template>
        </n-button>
      </template>
      <template #default>
        <span>{{ redoUi?.label || '重做' }}</span>
        <span v-if="redoPlugin?.shortcut" class="text-gray-400 text-xs ml-2">
          {{ redoPlugin.shortcut }}
        </span>
      </template>
    </n-tooltip>
  </div>
</template>

