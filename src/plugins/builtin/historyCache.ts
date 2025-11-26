/**
 * History cache plugin for persisting history snapshots to IndexedDB
 */

import { useHistoryStore } from '@/stores/history'
import type { HistorySnapshot } from '@/types/history'
import { errorHandler } from '@/utils/errorHandler'
import type { ToolPlugin } from '../types'
import { checkIndexedDBSupport, loadSnapshots, saveSnapshots } from '../utils/indexedDB'

let originalAddSnapshot: ((snapshot: HistorySnapshot) => void) | null = null

export const historyCachePlugin: ToolPlugin = {
  id: 'historyCache',
  name: 'History Cache',
  type: 'historyCache',
  metadata: {
    version: '1.0.0',
    description: 'Cache history snapshots to IndexedDB',
  },
  category: 'utility',
  onInstall: async () => {
    if (!checkIndexedDBSupport()) {
      throw new Error('IndexedDB is not supported, plugin will not be installed')
    }

    if (originalAddSnapshot !== null) {
      errorHandler.warn('History cache plugin is already installed, skipping installation')
      return
    }

    const historyStore = useHistoryStore()

    try {
      const cachedSnapshots = await loadSnapshots()
      if (cachedSnapshots.length > 0) {
        historyStore.snapshots = cachedSnapshots
        historyStore.currentIndex = cachedSnapshots.length - 1
      }
    } catch (error) {
      errorHandler.handleRuntimeError(
        'Failed to load cached snapshots from IndexedDB',
        error instanceof Error ? error : undefined,
        { operation: 'onInstall', pluginId: 'historyCache' }
      )
    }

    originalAddSnapshot = historyStore.addSnapshot.bind(historyStore)

    historyStore.addSnapshot = (snapshot: HistorySnapshot) => {
      originalAddSnapshot?.call(historyStore, snapshot)

      const snapshots = historyStore.snapshots
      saveSnapshots(snapshots).catch((error) => {
        errorHandler.handleRuntimeError(
          'Failed to cache snapshots to IndexedDB',
          error instanceof Error ? error : undefined,
          { operation: 'addSnapshot', pluginId: 'historyCache' }
        )
      })
    }
  },

  onUninstall: async () => {
    if (originalAddSnapshot) {
      const historyStore = useHistoryStore()
      historyStore.addSnapshot = originalAddSnapshot
      originalAddSnapshot = null
    }
  },

  createTool: () => ({}),
}
