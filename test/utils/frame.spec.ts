import { readFileSync } from 'node:fs'
import { join } from 'pathe'
import { describe, it, expect } from 'vitest'
import { compile } from 'tailwindcss'

const indexCss = readFileSync(join(process.cwd(), 'src/runtime/index.css'), 'utf-8')
const frameRule = indexCss.slice(indexCss.indexOf('/* Concentric frame rule'))

async function build(candidates: string[]) {
  const css = `@theme inline { --radius-md: calc(var(--ui-radius) * 1.5); }\n${frameRule}\n@tailwind utilities;`
  const compiler = await compile(css)
  return compiler.build(candidates)
}

describe('concentric frame rule', () => {
  it('is credited to @ariakit/tailwind', () => {
    expect(frameRule.startsWith('/* Concentric frame rule ported from @ariakit/tailwind (MIT) */')).toBe(true)
  })

  it('keeps the declared radius as the fallback outside the math feature query', async () => {
    const output = await build(['frame-shape-md'])
    const [fallback, enhanced] = output.split('@supports')

    expect(fallback).toContain('--ui-frame-declared: calc(var(--ui-radius) * 1.5);')
    expect(fallback).toContain('--ui-frame-shape-radius: var(--ui-frame-declared);')
    expect(enhanced).toContain('tan(atan2(')
    expect(enhanced).toContain('--ui-frame-shape-radius: min(')
  })

  it('accepts an arbitrary declared radius', async () => {
    const output = await build(['frame-shape-[10px]'])

    expect(output).toContain('--ui-frame-declared: 10px;')
  })
})
