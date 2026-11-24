import { describe, it, expect } from 'vitest'
import { tv } from 'tailwind-variants'
import badge from '../../src/theme/badge'
import button from '../../src/theme/button'
import card from '../../src/theme/card'
import checkbox from '../../src/theme/checkbox'
import kbd from '../../src/theme/kbd'
import radioGroup from '../../src/theme/radio-group'
import separator from '../../src/theme/separator'
import switchTheme from '../../src/theme/switch'
import table from '../../src/theme/table'

const options = { theme: { colors: ['primary', 'error'], transitions: true } } as any

type Theme = object | ((options: any) => object)

function slots(theme: Theme, variants: Record<string, unknown> = {}) {
  const config = typeof theme === 'function' ? theme(options) : theme
  const result = tv(config as any)(variants) as Record<string, (props?: any) => string> | string
  if (typeof result === 'string') {
    return { base: result }
  }
  return Object.fromEntries(Object.entries(result).map(([slot, fn]) => [slot, fn()]))
}

function classes(theme: Theme, variants: Record<string, unknown> = {}) {
  return Object.values(slots(theme, variants)).join(' ').split(/\s+/)
}

describe('control edge', () => {
  it.each([
    ['Checkbox', checkbox],
    ['RadioGroup', radioGroup]
  ])('%s draws its unchecked edge with the control token', (_, theme) => {
    const base = slots(theme).base!.split(' ')

    expect(base).toContain('ring-control')
    expect(base).not.toContain('ring-accented')
  })

  it.each([
    ['Checkbox', checkbox],
    ['RadioGroup', radioGroup]
  ])('%s lets the highlight color replace the control edge', (_, theme) => {
    const base = slots(theme, { color: 'error', highlight: true }).base!.split(' ')

    expect(base).toContain('ring-error')
    expect(base).not.toContain('ring-control')
  })

  it('Switch draws its unchecked track edge with the control token', () => {
    const base = slots(switchTheme).base!.split(' ')

    expect(base).toContain('border-transparent')
    expect(base).toContain('data-[state=unchecked]:border-control')
  })

  it('Switch keeps the highlight ring next to the control edge', () => {
    const base = slots(switchTheme, { color: 'error', highlight: true }).base!.split(' ')

    expect(base).toContain('ring-error')
    expect(base).toContain('data-[state=unchecked]:border-control')
  })

  it.each(['outline', 'subtle'])('neutral %s Button uses the control edge', (variant) => {
    const base = slots(button, { color: 'neutral', variant }).base!.split(' ')

    expect(base).toContain('ring-control')
    expect(base).not.toContain('ring-accented')
    expect(base).toContain('focus-visible:ring-inverted')
  })

  it.each(['solid', 'soft', 'ghost', 'link'])('neutral %s Button has no control edge', (variant) => {
    expect(classes(button, { color: 'neutral', variant })).not.toContain('ring-control')
  })

  it('colored outline Button keeps its own color edge', () => {
    const base = slots(button, { color: 'primary', variant: 'outline' }).base!.split(' ')

    expect(base).toContain('ring-primary/50')
    expect(base).not.toContain('ring-control')
  })

  it.each([
    ['Badge', badge, { color: 'neutral', variant: 'outline' }],
    ['Badge', badge, { color: 'neutral', variant: 'subtle' }],
    ['Kbd', kbd, { variant: 'outline' }],
    ['Kbd', kbd, { variant: 'subtle' }],
    ['Card', card, { variant: 'outline' }],
    ['Card', card, { variant: 'subtle' }],
    ['Separator', separator, {}],
    ['Table', table, {}]
  ])('%s keeps its decorative seams off the control token (%o)', (_, theme, variants) => {
    const all = classes(theme, variants)

    expect(all.some(cls => /(?:^|:)(?:ring|border|divide)-control$/.test(cls))).toBe(false)
  })
})
