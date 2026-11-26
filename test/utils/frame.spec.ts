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
    expect(enhanced).toContain('--ui-frame-shape-radius: calc(')
  })

  describe('resolved radius', () => {
    const formula = frameRule.match(/@supports[^{]*\{\s*--ui-frame-shape-radius:([^;]+);/)![1]!

    /**
     * Evaluates the enhanced formula in px for a frame radius, an inset and a declared radius,
     * by turning its CSS math functions into JavaScript.
     */
    function radius(frame: number, inset: number, declared: number): number {
      const expression = formula
        .replace(/var\(--ui-frame-radius, 0px\)/g, String(frame))
        .replace(/var\(--ui-frame-inset, 1rem\)/g, String(inset))
        .replace(/var\(--ui-frame-declared\)/g, String(declared))
        .replace(/([\d.]+)rem/g, (_, value) => String(Number(value) * 16))
        .replace(/([\d.]+)px/g, '$1')
        .replace(/\bcalc\(/g, '(')
        .replace(/\b(min|max|tan|atan2)\(/g, 'Math.$1(')
      return new Function('clamp', `return ${expression}`)((low: number, value: number, high: number) => Math.min(Math.max(value, low), high))
    }

    it('is concentric up to 8 px from the edge', () => {
      expect(radius(12, 4, 6)).toBeCloseTo(8)
      expect(radius(12, 8, 6)).toBeCloseTo(4)
      expect(radius(6, 10, 6)).toBeCloseTo(1.5)
    })

    it('keeps the declared radius from 16 px', () => {
      expect(radius(12, 16, 6)).toBeCloseTo(6)
      expect(radius(40, 16, 10)).toBeCloseTo(10)
      expect(radius(40, 24, 10)).toBeCloseTo(10)
    })

    it('blends without a jump when the frame is much larger than the shape', () => {
      const values = [8, 12, 15.5, 16].map(inset => radius(40, inset, 10))

      expect(values[0]).toBeCloseTo(32)
      expect(values[1]).toBeCloseTo(21)
      expect(values[2]).toBeCloseTo(11.375)
      expect(values[3]).toBeCloseTo(10)
      for (let i = 1; i < values.length; i++) {
        expect(values[i]!).toBeLessThan(values[i - 1]!)
        expect(values[i - 1]! - values[i]!).toBeLessThan(12)
      }
    })
  })

  it('accepts an arbitrary declared radius', async () => {
    const output = await build(['frame-shape-[10px]', 'frame-shape-(--ui-button-radius)'])

    expect(output).toContain('--ui-frame-declared: 10px;')
    expect(output).toContain('--ui-frame-declared: var(--ui-button-radius);')
  })
})
