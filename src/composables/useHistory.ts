/**
 * History composable for managing canvas state snapshots and undo/redo operations
 */

import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import type { HistorySnapshot } from '@/types/history'

export function useHistory() {
  const canvasStore = useCanvasStore()
  const historyStore = useHistoryStore()

  const canUndo = computed(() => historyStore.canUndo)
  const canRedo = computed(() => historyStore.canRedo)

  function createSnapshot(): HistorySnapshot {
    return canvasStore.toSnapshot()
  }

  function applySnapshot(snapshot: HistorySnapshot) {
    canvasStore.fromSnapshot(snapshot)
  }

  function undo() {
    const snapshot = historyStore.undo()
    if (snapshot) {
      applySnapshot(snapshot)
    }
  }

  function redo() {
    const snapshot = historyStore.redo()
    if (snapshot) {
      applySnapshot(snapshot)
    }
  }

  function addSnapshot() {
    const snapshot = createSnapshot()
    historyStore.addSnapshot(snapshot)
  }

  return {
    createSnapshot,
    applySnapshot,
    undo,
    redo,
    addSnapshot,
    canUndo,
    canRedo,
  }
}
