import { tv } from 'tailwind-variants'

const options = { theme: { colors: ['primary', 'error'], transitions: true } } as any

type Theme = object | ((options: any) => object)

/**
 * Resolves a theme file with `tailwind-variants` and returns the classes of each slot,
 * with `extra` passed as each slot's `class` (a consumer override).
 */
export function themeSlots(theme: Theme, variants: Record<string, unknown> = {}, extra: Record<string, string> = {}): Record<string, string[]> {
  const config = typeof theme === 'function' ? theme(options) : theme
  const result = tv(config as any)(variants) as Record<string, (props?: any) => string> | string
  if (typeof result === 'string') {
    return { base: result.split(' ') }
  }
  return Object.fromEntries(Object.entries(result).map(([slot, fn]) => [slot, (fn({ class: extra[slot] }) ?? '').split(' ')]))
}
