import { readFileSync } from 'node:fs'
import { join } from 'pathe'
import { compile } from 'tailwindcss'
import colors from 'tailwindcss/colors'
import { describe, it, expect } from 'vitest'

type Oklab = [number, number, number]
type Tokens = Record<string, string>

const css = readFileSync(join(process.cwd(), 'src/runtime/index.css'), 'utf-8')

/**
 * Collects the custom properties of every rule in the stylesheet, keyed by the
 * at-rule conditions wrapping the rule followed by its selector, e.g.
 * `.dark` or `@media (prefers-contrast: more) .dark`.
 */
function parseBlocks(source: string): Record<string, Tokens> {
  const blocks: Record<string, Tokens> = {}
  const stack: string[] = []
  let buffer = ''
  for (const char of source.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '))
      buffer = ''
    } else if (char === '}') {
      const prelude = stack.pop()!
      if (!prelude.startsWith('@')) {
        const key = [...stack.filter(entry => entry.startsWith('@media') || entry.startsWith('@supports')), prelude].join(' ')
        for (const [, name, value] of buffer.matchAll(/(--[\w-]+):([^;]+);/g)) {
          (blocks[key] ||= {})[name!] = value!.trim()
        }
      }
      buffer = ''
    } else {
      buffer += char
    }
  }
  return blocks
}

const blocks = parseBlocks(css)

/**
 * A mode is the ordered list of rule keys that apply, later ones win.
 * High-contrast modes add their `@media (prefers-contrast: more) ...` keys here.
 */
const MODES: Record<string, string[]> = {
  'light': [':root, :host, .light'],
  'dark': [':root, :host, .light', '.dark'],
  'light-hc': [':root, :host, .light', '@media (prefers-contrast: more) :root, :host, .light'],
  'dark-hc': [':root, :host, .light', '.dark', '@media (prefers-contrast: more) :root, :host, .light', '@media (prefers-contrast: more) .dark']
}

const HC_PAIRS = [['light', 'light-hc'], ['dark', 'dark-hc']] as const

/**
 * [mode, edge token, background token or literal color, minimum ratio].
 * `#f2f2f2` is the page background of the Nuxt playground.
 */
const CASES: [string, string, string, number][] = [
  ['light', '--ui-border-control', '--ui-bg', 3],
  ['light', '--ui-border-control', '--ui-bg-muted', 3],
  ['light', '--ui-border-control', '--ui-bg-elevated', 3],
  ['light', '--ui-border-control', '#f2f2f2', 3],
  ['dark', '--ui-border-control', '--ui-bg', 3],
  ['dark', '--ui-border-control', '--ui-bg-muted', 3],
  ['dark', '--ui-border-control', '--ui-bg-elevated', 3],
  ['light-hc', '--ui-border-control', '--ui-bg', 4.5],
  ['light-hc', '--ui-border-control', '--ui-bg-muted', 4.5],
  ['light-hc', '--ui-border-control', '--ui-bg-elevated', 4.5],
  ['light-hc', '--ui-border-control', '#f2f2f2', 4.5],
  ['light-hc', '--ui-text-muted', '--ui-bg', 4.5],
  ['light-hc', '--ui-text-muted', '--ui-bg-muted', 4.5],
  ['dark-hc', '--ui-border-control', '--ui-bg', 4.5],
  ['dark-hc', '--ui-border-control', '--ui-bg-muted', 4.5],
  ['dark-hc', '--ui-border-control', '--ui-bg-elevated', 4.5],
  ['dark-hc', '--ui-text-muted', '--ui-bg', 4.5],
  ['dark-hc', '--ui-text-muted', '--ui-bg-muted', 4.5],
  ['light-hc', '--ui-border-accented', '--ui-bg', 2],
  ['light-hc', '--ui-bg-elevated', '--ui-bg', 1.2],
  ['dark-hc', '--ui-bg-elevated', '--ui-bg', 1.3]
]

/**
 * Tokens that high contrast must make stronger against the default background.
 */
const STRENGTHENED = ['--ui-border-control', '--ui-border', '--ui-border-muted', '--ui-border-accented', '--ui-text-dimmed', '--ui-text-muted', '--ui-bg-elevated', '--ui-bg-accented']

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

/**
 * Chromatic Tailwind palettes a theme color (primary, error...) can point at.
 */
const PALETTES = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] as const

/**
 * Menu highlight drawn at 50% elevated outside high contrast, as `bg-elevated/50` was.
 */
const HIGHLIGHT_NORMAL = 'color-mix(in oklab, var(--ui-bg-elevated) 50%, transparent)'

function tokensFor(mode: string): Tokens {
  return Object.assign({}, ...MODES[mode]!.map((key) => {
    expect(blocks, `missing rule \`${key}\` in index.css`).toHaveProperty([key])
    return blocks[key]
  }))
}

function splitArgs(value: string): string[] {
  const args: string[] = []
  let depth = 0
  let current = ''
  for (const char of value) {
    if (char === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }
    if (char === '(') depth++
    if (char === ')') depth--
    current += char
  }
  args.push(current.trim())
  return args
}

function srgbToOklab(rgb: number[]): Oklab {
  const [r, g, b] = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}

function oklabToLinearSrgb([L, a, b]: Oklab): number[] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ].map(v => Math.min(1, Math.max(0, v)))
}

function resolve(value: string, tokens: Tokens, palette: Record<string, string>): Oklab {
  value = value.trim()
  const variable = value.match(/^var\((--[\w-]+)(?:,(.*))?\)$/)
  if (variable) {
    const [, name, fallback] = variable
    const shade = name!.match(/^--ui-color-neutral-(\d+)$/)
    if (shade) return resolve(palette[shade[1]!]!, tokens, palette)
    if (tokens[name!]) return resolve(tokens[name!]!, tokens, palette)
    if (fallback) return resolve(fallback, tokens, palette)
    throw new Error(`Unresolved ${name}`)
  }
  if (value.startsWith('--')) {
    if (!tokens[value]) throw new Error(`Missing token ${value}`)
    return resolve(tokens[value]!, tokens, palette)
  }
  if (value === 'white') return [1, 0, 0]
  if (value === 'black') return [0, 0, 0]
  const hex = value.match(/^#([\da-f]{6})$/i)
  if (hex) return srgbToOklab([0, 2, 4].map(i => Number.parseInt(hex[1]!.slice(i, i + 2), 16) / 255))
  const oklch = value.match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)\)$/)
  if (oklch) {
    const [l, c, h] = [Number(oklch[1]) / 100, Number(oklch[2]), oklch[3] === 'none' ? 0 : Number(oklch[3])]
    return [l, c * Math.cos(h * Math.PI / 180), c * Math.sin(h * Math.PI / 180)]
  }
  const mix = value.match(/^color-mix\(in oklab,(.*)\)$/)
  if (mix) {
    const [first, second] = splitArgs(mix[1]!).map((arg) => {
      const weight = arg.match(/\s([\d.]+)%$/)
      return { color: resolve(weight ? arg.slice(0, weight.index) : arg, tokens, palette), weight: weight ? Number(weight[1]) / 100 : undefined }
    }) as [{ color: Oklab, weight?: number }, { color: Oklab, weight?: number }]
    const p = first.weight ?? (second.weight !== undefined ? 1 - second.weight : 0.5)
    return first.color.map((v, i) => v * p + second.color[i]! * (1 - p)) as Oklab
  }
  throw new Error(`Unsupported color ${value}`)
}

function luminance(color: Oklab): number {
  const [r, g, b] = oklabToLinearSrgb(color) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(mode: string, foreground: string, background: string, neutral: typeof NEUTRALS[number]): number {
  const tokens = tokensFor(mode)
  const palette = colors[neutral] as Record<string, string>
  const [high, low] = [luminance(resolve(foreground, tokens, palette)), luminance(resolve(background, tokens, palette))].sort((a, b) => b - a) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

function toSrgb(color: Oklab): number[] {
  return oklabToLinearSrgb(color).map(v => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
}

function ratio(a: Oklab, b: Oklab): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

/**
 * Paints `--ui-bg-highlight` over a background token the way the browser does: a translucent
 * `color-mix(in oklab, <color> N%, transparent)` is composited in sRGB.
 */
function highlight(mode: string, background: string, neutral: typeof NEUTRALS[number]): Oklab {
  const tokens = tokensFor(mode)
  const palette = colors[neutral] as Record<string, string>
  const value = tokens['--ui-bg-highlight']!
  const translucent = value.match(/^color-mix\(in oklab, (.+) ([\d.]+)%, transparent\)$/)
  if (!translucent) return resolve(value, tokens, palette)
  const alpha = Number(translucent[2]) / 100
  const [front, under] = [toSrgb(resolve(translucent[1]!, tokens, palette)), toSrgb(resolve(background, tokens, palette))]
  return srgbToOklab(front.map((v, i) => v * alpha + under[i]! * (1 - alpha)))
}

function highlightOn(mode: string, background: string, neutral: typeof NEUTRALS[number]): number {
  return ratio(highlight(mode, background, neutral), resolve(background, tokensFor(mode), colors[neutral] as Record<string, string>))
}

/**
 * Focus ring of an input-like field: the theme color pulled toward `--ui-text-highlighted`
 * by `--ui-focus-ring-mix`, as the `ring-focus-*` utility does. Theme colors use shade 500
 * in light and 400 in dark.
 */
function focusRing(mode: string, palette: typeof PALETTES[number], neutral: typeof NEUTRALS[number]): Oklab {
  const tokens = tokensFor(mode)
  const neutrals = colors[neutral] as Record<string, string>
  const shades = colors[palette] as Record<string, string>
  const color = resolve(shades[mode.startsWith('dark') ? '400' : '500']!, tokens, neutrals)
  const text = resolve('--ui-text-highlighted', tokens, neutrals)
  const amount = Number(tokens['--ui-focus-ring-mix']?.match(/^([\d.]+)%$/)?.[1] ?? Number.NaN) / 100
  return color.map((v, i) => v * (1 - amount) + text[i]! * amount) as Oklab
}

describe('control edge contrast', () => {
  it('resolves known WCAG pairs', () => {
    expect(contrast('light', 'black', 'white', 'slate')).toBeCloseTo(21, 1)
    expect(contrast('light', '#767676', 'white', 'slate')).toBeCloseTo(4.54, 1)
  })

  it('keys rules by their media condition and selector', () => {
    expect(parseBlocks('.dark { --a: red; } @media (prefers-contrast: more) { :root, .light { --b: blue; } .dark { --a: white; } }')).toEqual({
      '.dark': { '--a': 'red' },
      '@media (prefers-contrast: more) :root, .light': { '--b': 'blue' },
      '@media (prefers-contrast: more) .dark': { '--a': 'white' }
    })
  })

  it('flags an edge under the minimum', () => {
    expect(contrast('light', '--ui-border-accented', '--ui-bg', 'slate')).toBeLessThan(3)
    expect(contrast('dark', '--ui-border-accented', '--ui-bg', 'slate')).toBeLessThan(3)
  })

  describe.each(NEUTRALS)('with %s as neutral', (neutral) => {
    it.each(CASES)('%s: %s on %s is at least %d:1', (mode, edge, background, min) => {
      expect(contrast(mode, edge, background, neutral)).toBeGreaterThanOrEqual(min)
    })

    it.each(HC_PAIRS.flatMap(([normal, hc]) => STRENGTHENED.map(token => [hc, token, normal] as const)))('%s: %s is stronger than in %s', (hc, token, normal) => {
      expect(contrast(hc, token, '--ui-bg', neutral)).toBeGreaterThan(contrast(normal, token, '--ui-bg', neutral))
    })
  })
})

describe('high contrast tokens', () => {
  it('overrides the same tokens in light and dark', () => {
    const light = blocks['@media (prefers-contrast: more) :root, :host, .light']
    const dark = blocks['@media (prefers-contrast: more) .dark']
    expect(light).toBeDefined()
    // The light block also matches the root in dark mode, so the dark block must win on every token it sets
    expect(Object.keys(dark ?? {}).sort()).toEqual(Object.keys(light ?? {}).sort())
  })

  it('gives the light raised surface a hairline edge', () => {
    expect(blocks[':root, :host, .light']?.['--ui-shadow-raised']).toBe('var(--shadow-card)')
    expect(blocks['@media (prefers-contrast: more) :root, :host, .light']?.['--ui-shadow-raised']).toBe('var(--shadow-card-raised)')
  })
})

describe('menu highlight', () => {
  it.each(['light', 'dark'])('keeps the 50%% elevated highlight in %s', (mode) => {
    expect(tokensFor(mode)['--ui-bg-highlight']).toBe(HIGHLIGHT_NORMAL)
  })

  describe.each(NEUTRALS)('with %s as neutral', (neutral) => {
    it.each(['light-hc', 'dark-hc'])('%s: highlight is at least 1.3:1 on the menu', (mode) => {
      expect(highlightOn(mode, '--ui-bg', neutral)).toBeGreaterThanOrEqual(1.3)
    })

    it.each(['light-hc', 'dark-hc'])('%s: muted text keeps 4.5:1 on the highlight', (mode) => {
      const text = resolve('--ui-text-muted', tokensFor(mode), colors[neutral] as Record<string, string>)

      expect(ratio(text, highlight(mode, '--ui-bg', neutral))).toBeGreaterThanOrEqual(4.5)
    })

    it.each(HC_PAIRS)('%s: high contrast highlight is stronger', (normal, hc) => {
      expect(highlightOn(hc, '--ui-bg', neutral)).toBeGreaterThan(highlightOn(normal, '--ui-bg', neutral))
    })
  })
})

describe('focus ring', () => {
  it.each(['light', 'dark'])('keeps the plain theme color in %s', (mode) => {
    expect(tokensFor(mode)['--ui-focus-ring-mix']).toBe('0%')
  })

  describe('ring-focus utility', () => {
    const utility = css.match(/@utility ring-focus-\* \{[^}]*\}/)![0]

    async function build(candidates: string[]) {
      const compiler = await compile(`@theme inline { --color-primary: var(--ui-primary); --ring-color-inverted: var(--ui-border-inverted); }\n${utility}\n@tailwind utilities;`)
      return compiler.build(candidates)
    }

    it.each([
      ['ring-focus-primary', 'var(--ui-primary)'],
      ['ring-focus-inverted', 'var(--ui-border-inverted)']
    ])('compiles %s to the plain color with the mix behind a feature query', async (candidate, color) => {
      const output = await build([candidate])
      const [fallback, enhanced] = output.split('@supports')

      expect(fallback).toContain(`.${candidate} {`)
      expect(fallback).toContain(`--tw-ring-color: ${color};`)
      expect(enhanced).toMatch(/^ \(color: color-mix\(in lab, red, red\)\) \{/)
      expect(enhanced).toContain(`--tw-ring-color: color-mix(in oklab, ${color}, var(--ui-text-highlighted) var(--ui-focus-ring-mix, 0%));`)
    })

    it('emits nothing for an unknown color', async () => {
      expect(await build(['ring-focus-unknown'])).not.toContain('ring-focus-unknown')
    })
  })

  describe.each(NEUTRALS)('with %s as neutral', (neutral) => {
    it.each(PALETTES.flatMap(palette => (['light-hc', 'dark-hc'] as const).flatMap(mode => ['--ui-bg', '--ui-bg-elevated'].map(background => [mode, palette, background] as const))))('%s: %s focus and highlight ring beats the rest edge on %s', (mode, palette, background) => {
      const tokens = tokensFor(mode)
      const neutrals = colors[neutral] as Record<string, string>
      const back = resolve(background, tokens, neutrals)
      const rest = ratio(resolve('--ui-border-control', tokens, neutrals), back)

      expect(ratio(focusRing(mode, palette, neutral), back)).toBeGreaterThan(rest)
    })

    it.each((['light-hc', 'dark-hc'] as const).flatMap(mode => ['--ui-bg', '--ui-bg-elevated'].map(background => [mode, background] as const)))('%s: neutral focus and highlight ring beats the rest edge on %s', (mode, background) => {
      const tokens = tokensFor(mode)
      const neutrals = colors[neutral] as Record<string, string>
      const back = resolve(background, tokens, neutrals)
      const ring = resolve(`color-mix(in oklab, var(--ui-border-inverted), var(--ui-text-highlighted) ${tokens['--ui-focus-ring-mix']})`, tokens, neutrals)

      expect(ratio(ring, back)).toBeGreaterThan(ratio(resolve('--ui-border-control', tokens, neutrals), back))
    })
  })
})
