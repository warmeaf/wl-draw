/**
 * History store for managing canvas state snapshots and undo/redo operations
 */

import { defineStore } from 'pinia'
import type { HistorySnapshot } from '@/types/history'

const MAX_HISTORY_SIZE = 50

export const useHistoryStore = defineStore('history', {
  state: () => ({
    snapshots: [] as HistorySnapshot[],
    currentIndex: -1,
  }),

  getters: {
    canUndo: (state) => {
      return state.currentIndex > 0
    },

    canRedo: (state) => {
      return state.currentIndex < state.snapshots.length - 1
    },
  },

  actions: {
    addSnapshot(snapshot: HistorySnapshot) {
      if (this.currentIndex < this.snapshots.length - 1) {
        this.snapshots = this.snapshots.slice(0, this.currentIndex + 1)
      }

      try {
        const clonedSnapshot = JSON.parse(JSON.stringify(snapshot))
        this.snapshots.push(clonedSnapshot)
      } catch (error) {
        console.error('Failed to clone snapshot:', error)
        return
      }

      if (this.snapshots.length > MAX_HISTORY_SIZE) {
        this.snapshots.shift()
      }

      this.currentIndex = this.snapshots.length - 1
    },

    undo(): HistorySnapshot | null {
      if (!this.canUndo) {
        return null
      }

      this.currentIndex--
      const snapshot = this.snapshots[this.currentIndex]
      return snapshot ?? null
    },

    redo(): HistorySnapshot | null {
      if (!this.canRedo) {
        return null
      }

      this.currentIndex++
      const snapshot = this.snapshots[this.currentIndex]
      return snapshot ?? null
    },

    clearHistory() {
      this.snapshots = []
      this.currentIndex = -1
    },
  },
})
