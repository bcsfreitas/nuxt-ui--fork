import { describe, it, expect } from 'vitest'
import { compile } from 'tailwindcss'
import { controlLeadingIcon, controlPadding, controlPaddingSquare, controlPy, controlPyFromHeight, controlRadius, controlTrailingIcon } from '../../src/theme/utils/control-geometry'

async function build(classes: string) {
  const compiler = await compile('@theme inline { --spacing: 0.25rem; --radius-md: calc(var(--ui-radius) * 1.5); }\n@tailwind utilities;')
  return compiler.build(classes.split(/\s+/).filter(Boolean))
}

/**
 * Collects the values of a custom property in the compiled CSS, split between the plain rules
 * and the rules inside `@supports` (which Tailwind emits after the plain ones).
 */
function declarations(css: string, property: string) {
  const [plainCss = '', ...enhancedCss] = css.split('@supports')
  const values = (text: string) => [...text.matchAll(new RegExp(String.raw`\s${property}:\s*([^;]+);`, 'g'))].map(match => match[1]!.trim())
  return { plain: values(plainCss), enhanced: values(enhancedCss.join('')) }
}

/**
 * Evaluates a CSS length expression in px by turning its math functions into JavaScript.
 */
function px(expression: string, values: Record<string, number>) {
  let js = expression.replace(/([\d.]+)rem/g, '($1 * 16)')
  for (const [name, value] of Object.entries(values)) {
    js = js.split(name).join(String(value))
  }
  js = js.replace(/\bmin\(/g, 'Math.min(').replace(/\bmax\(/g, 'Math.max(').replace(/\bcalc\(/g, '(')
  return Math.round(Number(new Function(`return ${js}`)()) * 100) / 100
}

const sizes = {
  xs: { py: 4, lh: 16, radius: 8, fallbackPx: 8 },
  sm: { py: 6, lh: 16, radius: 10, fallbackPx: 10 },
  md: { py: 6, lh: 20, radius: 11, fallbackPx: 10 },
  lg: { py: 8, lh: 20, radius: 13, fallbackPx: 12 },
  xl: { py: 8, lh: 24, radius: 14, fallbackPx: 12 }
} as const

describe('control geometry recipe', () => {
  it('sets the Button block padding per size', async () => {
    for (const [size, { py }] of Object.entries(sizes)) {
      const { plain } = declarations(await build(controlPy[size as keyof typeof sizes]), '--py')
      expect(px(plain[0]!, {})).toBe(py)
    }
  })

  it('derives the block padding from a fixed height', async () => {
    const { plain } = declarations(await build(controlPyFromHeight('--spacing(5)')), '--py')
    expect(px(plain[0]!, { '1lh': 16 })).toBe(2)
  })

  describe('radius', () => {
    it('grows with size at the default `--ui-radius`', async () => {
      const { enhanced } = declarations(await build(controlRadius('--ui-control-radius')), '--ui-control-radius')
      for (const { py, lh, radius } of Object.values(sizes)) {
        expect(px(enhanced[0]!, { 'var(--ui-radius)': 4, 'var(--py)': py, '1lh': lh })).toBe(radius)
      }
    })

    it('gives square corners when `--ui-radius` is 0', async () => {
      const { enhanced } = declarations(await build(controlRadius('--ui-control-radius')), '--ui-control-radius')
      for (const { py, lh } of Object.values(sizes)) {
        expect(px(enhanced[0]!, { 'var(--ui-radius)': 0, 'var(--py)': py, '1lh': lh })).toBe(0)
      }
    })

    it('falls back to `rounded-md` without `lh`', async () => {
      const css = await build(controlRadius('--ui-frame-radius'))
      expect(declarations(css, '--ui-frame-radius').plain).toEqual(['var(--radius-md)'])
      expect(css).toContain('@supports (height:1lh)')
    })
  })

  describe('padding', () => {
    it('reads the block and inline padding from `--py` and `--px`', async () => {
      const css = await build(controlPadding)
      expect(css).toContain('padding-block: var(--py)')
      expect(css).toContain('padding-inline: var(--px)')
    })

    it('gates the optical padding on both `cap` and `lh`', async () => {
      const css = await build(controlPadding)
      expect(css).toContain('@supports (height:1cap) and (height:1lh)')
      expect(css).not.toMatch(/@supports \(height:1cap\)\s*\{/)
    })

    it('falls back to the upstream inline padding without `cap`', async () => {
      const { plain, enhanced } = declarations(await build(controlPadding), '--px')
      for (const { py, fallbackPx } of Object.values(sizes)) {
        expect(px(plain[0]!, { 'var(--py)': py })).toBe(fallbackPx)
      }
      expect(enhanced[0]).toContain('1cap')
    })

    it('makes a square control as wide as tall, in both forms', async () => {
      const { plain, enhanced } = declarations(await build(controlPaddingSquare), '--px')
      expect(plain).toEqual(['var(--py)'])
      expect(enhanced).toEqual(['var(--py)'])
    })
  })

  it('sizes icons to the line height and pulls them into the padding', async () => {
    for (const [icon, margin] of [[controlLeadingIcon, 'margin-inline-start'], [controlTrailingIcon, 'margin-inline-end']] as const) {
      const [plainCss = '', enhancedCss = ''] = (await build(icon)).split('@supports (height:1cap) and (height:1lh)')
      expect(plainCss).toContain('width: 1lh')
      expect(plainCss).toContain('height: 1lh')
      expect(plainCss).not.toContain(margin)
      expect(enhancedCss).toContain(`${margin}: calc(var(--py) - var(--px))`)
    }
  })
})
