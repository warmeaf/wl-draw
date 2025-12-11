/**
 * Shortcut utilities for parsing and normalizing keyboard shortcuts
 */

export interface ParsedShortcut {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

const MODIFIER_KEYS = ['Ctrl', 'Shift', 'Alt', 'Meta'] as const
type ModifierKey = (typeof MODIFIER_KEYS)[number]

export function normalizeShortcut(shortcut: string): string {
  if (!shortcut) return ''

  const parts = shortcut.split('+').map((part) => part.trim())
  const modifiers: ModifierKey[] = []
  let key = ''

  for (const part of parts) {
    const normalizedPart = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    if (MODIFIER_KEYS.includes(normalizedPart as ModifierKey)) {
      modifiers.push(normalizedPart as ModifierKey)
    } else {
      key = part.trim()
    }
  }

  if (!key) {
    return ''
  }

  const sortedModifiers = MODIFIER_KEYS.filter((mod) => modifiers.includes(mod))
  return sortedModifiers.length > 0 ? `${sortedModifiers.join('+')}+${key}` : key
}

export function parseShortcut(shortcut: string): ParsedShortcut | null {
  if (!shortcut) return null

  const normalized = normalizeShortcut(shortcut)
  const parts = normalized.split('+')

  const result: ParsedShortcut = {
    key: '',
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
  }

  for (const part of parts) {
    const trimmed = part.trim()
    switch (trimmed) {
      case 'Ctrl':
        result.ctrl = true
        break
      case 'Shift':
        result.shift = true
        break
      case 'Alt':
        result.alt = true
        break
      case 'Meta':
        result.meta = true
        break
      default:
        result.key = trimmed
        break
    }
  }

  if (!result.key) {
    return null
  }

  return result
}

export function shortcutsEqual(shortcut1: string, shortcut2: string): boolean {
  if (!shortcut1 || !shortcut2) return false
  return normalizeShortcut(shortcut1) === normalizeShortcut(shortcut2)
}

export function checkShortcutConflict(
  newShortcut: string | undefined,
  existingShortcuts: Array<{ pluginId: string; shortcut: string }>
): Array<{ pluginId: string; shortcut: string }> {
  if (!newShortcut) return []

  const normalizedNew = normalizeShortcut(newShortcut)
  if (!normalizedNew) return []

  return existingShortcuts.filter(({ shortcut }) => {
    const normalized = normalizeShortcut(shortcut)
    return normalized === normalizedNew
  })
}

function checkModifierKeys(parsed: ParsedShortcut, event: KeyboardEvent): boolean {
  const requiresCtrl = parsed.ctrl
  const requiresMeta = parsed.meta
  const requiresShift = parsed.shift
  const requiresAlt = parsed.alt

  const hasCtrl = event.ctrlKey || event.metaKey
  const hasMeta = event.metaKey
  const hasShift = event.shiftKey
  const hasAlt = event.altKey

  if (requiresCtrl) {
    if (!hasCtrl) return false
  } else if (requiresMeta) {
    if (!hasMeta) return false
  } else {
    if (hasCtrl || hasMeta) return false
  }

  if (requiresShift !== hasShift) return false
  if (requiresAlt !== hasAlt) return false

  return true
}

export function matchShortcut(e: KeyboardEvent, parsed: ParsedShortcut): boolean {
  if (parsed.key !== e.code) {
    return false
  }

  return checkModifierKeys(parsed, e)
}
