import { describe, expect, it } from 'vitest'
import {
  checkShortcutConflict,
  matchShortcut,
  normalizeShortcut,
  parseShortcut,
  shortcutsEqual,
} from '@/plugins/shortcut'

function createKeyboardEvent(
  code: string,
  options: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    code,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
  })
}

describe('shortcut utilities', () => {
  describe('normalizeShortcut', () => {
    it('should normalize shortcut with modifiers', () => {
      expect(normalizeShortcut('ctrl+a')).toBe('Ctrl+a')
      expect(normalizeShortcut('shift+ctrl+b')).toBe('Ctrl+Shift+b')
      expect(normalizeShortcut('alt+meta+c')).toBe('Alt+Meta+c')
    })

    it('should handle case variations', () => {
      expect(normalizeShortcut('CTRL+A')).toBe('Ctrl+A')
      expect(normalizeShortcut('Ctrl+A')).toBe('Ctrl+A')
      expect(normalizeShortcut('cTrL+a')).toBe('Ctrl+a')
    })

    it('should handle shortcut without modifiers', () => {
      expect(normalizeShortcut('a')).toBe('a')
      expect(normalizeShortcut('KeyA')).toBe('KeyA')
    })

    it('should return empty string for empty input', () => {
      expect(normalizeShortcut('')).toBe('')
    })

    it('should sort modifiers in correct order', () => {
      expect(normalizeShortcut('shift+ctrl+a')).toBe('Ctrl+Shift+a')
      expect(normalizeShortcut('meta+alt+shift+ctrl+a')).toBe('Ctrl+Shift+Alt+Meta+a')
    })
  })

  describe('parseShortcut', () => {
    it('should parse shortcut with single modifier', () => {
      const result = parseShortcut('Ctrl+A')
      expect(result).toEqual({
        key: 'A',
        ctrl: true,
        shift: false,
        alt: false,
        meta: false,
      })
    })

    it('should parse shortcut with multiple modifiers', () => {
      const result = parseShortcut('Ctrl+Shift+A')
      expect(result).toEqual({
        key: 'A',
        ctrl: true,
        shift: true,
        alt: false,
        meta: false,
      })
    })

    it('should parse shortcut without modifiers', () => {
      const result = parseShortcut('KeyA')
      expect(result).toEqual({
        key: 'KeyA',
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
      })
    })

    it('should return null for empty input', () => {
      expect(parseShortcut('')).toBeNull()
    })

    it('should return null for invalid shortcut', () => {
      expect(parseShortcut('Ctrl+')).toBeNull()
    })
  })

  describe('shortcutsEqual', () => {
    it('should return true for equal shortcuts', () => {
      expect(shortcutsEqual('Ctrl+a', 'ctrl+a')).toBe(true)
      expect(shortcutsEqual('Ctrl+Shift+b', 'shift+ctrl+b')).toBe(true)
      expect(shortcutsEqual('KeyA', 'KeyA')).toBe(true)
    })

    it('should return false for different shortcuts', () => {
      expect(shortcutsEqual('Ctrl+A', 'Ctrl+B')).toBe(false)
      expect(shortcutsEqual('Ctrl+A', 'Shift+A')).toBe(false)
    })

    it('should return false for empty shortcuts', () => {
      expect(shortcutsEqual('', 'Ctrl+A')).toBe(false)
      expect(shortcutsEqual('Ctrl+A', '')).toBe(false)
      expect(shortcutsEqual('', '')).toBe(false)
    })
  })

  describe('checkShortcutConflict', () => {
    it('should detect conflicts', () => {
      const existing = [
        { pluginId: 'plugin1', shortcut: 'Ctrl+A' },
        { pluginId: 'plugin2', shortcut: 'Ctrl+B' },
      ]
      const conflicts = checkShortcutConflict('Ctrl+A', existing)
      expect(conflicts).toHaveLength(1)
      const [firstConflict] = conflicts
      expect(firstConflict?.pluginId).toBe('plugin1')
    })

    it('should detect conflicts with different case', () => {
      const existing = [{ pluginId: 'plugin1', shortcut: 'ctrl+a' }]
      const conflicts = checkShortcutConflict('Ctrl+a', existing)
      expect(conflicts).toHaveLength(1)
    })

    it('should return empty array when no conflicts', () => {
      const existing = [{ pluginId: 'plugin1', shortcut: 'Ctrl+A' }]
      const conflicts = checkShortcutConflict('Ctrl+B', existing)
      expect(conflicts).toHaveLength(0)
    })

    it('should return empty array for empty shortcut', () => {
      const existing = [{ pluginId: 'plugin1', shortcut: 'Ctrl+A' }]
      const conflicts = checkShortcutConflict('', existing)
      expect(conflicts).toHaveLength(0)
    })

    it('should detect multiple conflicts', () => {
      const existing = [
        { pluginId: 'plugin1', shortcut: 'Ctrl+A' },
        { pluginId: 'plugin2', shortcut: 'Ctrl+A' },
        { pluginId: 'plugin3', shortcut: 'Ctrl+B' },
      ]
      const conflicts = checkShortcutConflict('Ctrl+A', existing)
      expect(conflicts).toHaveLength(2)
    })
  })

  describe('matchShortcut', () => {
    it('should match simple key without modifiers', () => {
      const event = createKeyboardEvent('KeyA')
      const parsed = { key: 'KeyA', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should not match when key differs', () => {
      const event = createKeyboardEvent('KeyB')
      const parsed = { key: 'KeyA', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should match Ctrl+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Ctrl shortcut when metaKey is pressed (macOS compatibility)', () => {
      const event = createKeyboardEvent('KeyA', { metaKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Shift+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { shiftKey: true })
      const parsed = { key: 'KeyA', ctrl: false, shift: true, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Alt+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { altKey: true })
      const parsed = { key: 'KeyA', ctrl: false, shift: false, alt: true, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Meta+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { metaKey: true })
      const parsed = { key: 'KeyA', ctrl: false, shift: false, alt: false, meta: true }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Ctrl+Shift+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true, shiftKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: true, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Ctrl+Alt+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true, altKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: true, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Ctrl+Shift+Alt+Key shortcut', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true, shiftKey: true, altKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: true, alt: true, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should not match when Ctrl is expected but not pressed', () => {
      const event = createKeyboardEvent('KeyA')
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should not match when Ctrl is pressed but not expected', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true })
      const parsed = { key: 'KeyA', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should not match when Shift modifier differs', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: true, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should not match when Alt modifier differs', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: true, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should not match when extra modifiers are pressed', () => {
      const event = createKeyboardEvent('KeyA', { ctrlKey: true, shiftKey: true, altKey: true })
      const parsed = { key: 'KeyA', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(false)
    })

    it('should match function keys', () => {
      const event = createKeyboardEvent('F1')
      const parsed = { key: 'F1', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match Ctrl+function key', () => {
      const event = createKeyboardEvent('F5', { ctrlKey: true })
      const parsed = { key: 'F5', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match number keys', () => {
      const event = createKeyboardEvent('Digit1')
      const parsed = { key: 'Digit1', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match special keys like Escape', () => {
      const event = createKeyboardEvent('Escape')
      const parsed = { key: 'Escape', ctrl: false, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })

    it('should match special keys like Enter', () => {
      const event = createKeyboardEvent('Enter', { ctrlKey: true })
      const parsed = { key: 'Enter', ctrl: true, shift: false, alt: false, meta: false }
      expect(matchShortcut(event, parsed)).toBe(true)
    })
  })
})
