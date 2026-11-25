import { describe, it, expect } from 'vitest'
import { tv } from 'tailwind-variants'
import commandPalette from '../../src/theme/command-palette'
import contextMenu from '../../src/theme/context-menu'
import dropdownMenu from '../../src/theme/dropdown-menu'
import editorSuggestionMenu from '../../src/theme/editor-suggestion-menu'
import input from '../../src/theme/input'
import inputMenu from '../../src/theme/input-menu'
import inputNumber from '../../src/theme/input-number'
import listbox from '../../src/theme/listbox'
import navigationMenu from '../../src/theme/navigation-menu'
import pinInput from '../../src/theme/pin-input'
import select from '../../src/theme/select'
import selectMenu from '../../src/theme/select-menu'
import textarea from '../../src/theme/textarea'

const options = { theme: { colors: ['primary', 'error'], transitions: true } } as any

type Theme = object | ((options: any) => object)

function slots(theme: Theme, variants: Record<string, unknown> = {}, extra: Record<string, string> = {}): Record<string, string[]> {
  const config = typeof theme === 'function' ? theme(options) : theme
  const result = tv(config as any)(variants) as Record<string, (props?: any) => string> | string
  if (typeof result === 'string') {
    return { base: result.split(' ') }
  }
  return Object.fromEntries(Object.entries(result).map(([slot, fn]) => [slot, (fn({ class: extra[slot] }) ?? '').split(' ')]))
}

describe('menu highlight', () => {
  it.each([
    ['CommandPalette', commandPalette],
    ['ContextMenu', contextMenu],
    ['DropdownMenu', dropdownMenu],
    ['EditorSuggestionMenu', editorSuggestionMenu],
    ['InputMenu', inputMenu],
    ['Listbox', listbox],
    ['Select', select],
    ['SelectMenu', selectMenu]
  ])('%s paints highlighted items with the highlight token', (_, theme) => {
    const item = slots(theme).item!

    expect(item.some(cls => /^data-highlighted:(?:not-data-disabled:)?before:bg-\(--ui-bg-highlight\)$/.test(cls))).toBe(true)
    expect(item.some(cls => cls.endsWith('before:bg-elevated/50'))).toBe(false)
  })

  it('DropdownMenu and ContextMenu also paint open submenus with the token', () => {
    for (const theme of [dropdownMenu, contextMenu]) {
      expect(slots(theme).item).toContain('data-[state=open]:before:bg-(--ui-bg-highlight)')
    }
  })

  it('NavigationMenu hovers links with the token', () => {
    expect(slots(navigationMenu, { orientation: 'horizontal' }).link).toContain('hover:before:bg-(--ui-bg-highlight)')
    expect(slots(navigationMenu, { orientation: 'horizontal' }).childLink).toContain('hover:before:bg-(--ui-bg-highlight)')
  })
})

describe('focus ring', () => {
  it.each([
    ['Input', input],
    ['Textarea', textarea],
    ['InputNumber', inputNumber],
    ['PinInput', pinInput],
    ['Select', select]
  ])('%s draws a 2px focus ring in the focus color', (_, theme) => {
    const base = slots(theme, { color: 'primary', variant: 'outline' }).base!

    expect(base).toContain('focus-visible:ring-2')
    expect(base).toContain('focus-visible:ring-focus-primary')
    expect(base).not.toContain('focus-visible:ring-primary')
  })

  it('neutral fields use the inverted focus color', () => {
    expect(slots(input, { color: 'neutral', variant: 'subtle' }).base).toContain('focus-visible:ring-focus-inverted')
  })

  it('InputMenu with tags rings the wrapper in the focus color', () => {
    expect(slots(inputMenu, { color: 'error', variant: 'outline', multiple: true }).base).toContain('has-focus-visible:ring-focus-error')
  })

  it('a consumer ring color replaces the focus color', () => {
    const base = slots(input, { color: 'primary', variant: 'outline' }, { base: 'focus-visible:ring-error' }).base!

    expect(base).toContain('focus-visible:ring-error')
    expect(base).not.toContain('focus-visible:ring-focus-primary')
    expect(base).toContain('focus-visible:ring-2')
  })
})
