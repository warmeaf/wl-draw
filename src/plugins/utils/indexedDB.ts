/**
 * IndexedDB utility functions for history cache plugin
 */

import type { HistorySnapshot } from '@/types/history'
import { errorHandler } from '@/utils/errorHandler'

const DB_NAME = 'wl-draw-history'
const DB_VERSION = 1
const STORE_NAME = 'snapshots'

export function checkIndexedDBSupport(): boolean {
  return 'indexedDB' in window
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!checkIndexedDBSupport()) {
      reject(new Error('IndexedDB is not supported'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

function serializeSnapshots(snapshots: HistorySnapshot[]): HistorySnapshot[] {
  try {
    return JSON.parse(JSON.stringify(snapshots))
  } catch (error) {
    if (error instanceof Error && error.message.includes('circular')) {
      throw new Error('Snapshots contain circular references and cannot be serialized')
    }
    throw error
  }
}

export async function saveSnapshots(snapshots: HistorySnapshot[]): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const serializedSnapshots = serializeSnapshots(snapshots)

    await new Promise<void>((resolve, reject) => {
      const data = {
        key: 'snapshots',
        snapshots: serializedSnapshots,
        timestamp: Date.now(),
      }

      const putRequest = store.put(data)
      putRequest.onsuccess = () => {
        resolve()
      }
      putRequest.onerror = () => {
        reject(new Error(`Failed to save snapshots: ${putRequest.error?.message}`))
      }
    })

    transaction.oncomplete = () => {
      db.close()
    }
  } catch (error) {
    errorHandler.handleRuntimeError(
      'Failed to save snapshots to IndexedDB',
      error instanceof Error ? error : undefined,
      { operation: 'saveSnapshots' }
    )
    throw error
  }
}

export async function loadSnapshots(): Promise<HistorySnapshot[]> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const snapshots = await new Promise<HistorySnapshot[]>((resolve, reject) => {
      const getRequest = store.get('snapshots')
      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data && Array.isArray(data.snapshots)) {
          resolve(data.snapshots)
        } else {
          resolve([])
        }
      }
      getRequest.onerror = () => {
        reject(new Error(`Failed to load snapshots: ${getRequest.error?.message}`))
      }
    })

    transaction.oncomplete = () => {
      db.close()
    }

    return snapshots
  } catch (error) {
    errorHandler.handleRuntimeError(
      'Failed to load snapshots from IndexedDB',
      error instanceof Error ? error : undefined,
      { operation: 'loadSnapshots' }
    )
    throw error
  }
}

export async function clearSnapshots(): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => {
        resolve()
      }
      clearRequest.onerror = () => {
        reject(new Error(`Failed to clear snapshots: ${clearRequest.error?.message}`))
      }
    })

    transaction.oncomplete = () => {
      db.close()
    }
  } catch (error) {
    errorHandler.handleRuntimeError(
      'Failed to clear snapshots from IndexedDB',
      error instanceof Error ? error : undefined,
      { operation: 'clearSnapshots' }
    )
    throw error
  }
}
