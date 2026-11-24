import { readFileSync } from 'node:fs'
import { join } from 'pathe'
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
        for (const [, name, value] of buffer.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
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
  light: [':root, :host, .light'],
  dark: [':root, :host, .light', '.dark']
}

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
  ['dark', '--ui-border-control', '--ui-bg-elevated', 3]
]

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

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

describe('control edge contrast', () => {
  it('resolves known WCAG pairs', () => {
    expect(contrast('light', 'black', 'white', 'slate')).toBeCloseTo(21, 1)
    expect(contrast('light', '#767676', 'white', 'slate')).toBeCloseTo(4.54, 1)
  })

  it('flags an edge under the minimum', () => {
    expect(contrast('light', '--ui-border-accented', '--ui-bg', 'slate')).toBeLessThan(3)
    expect(contrast('dark', '--ui-border-accented', '--ui-bg', 'slate')).toBeLessThan(3)
  })

  describe.each(NEUTRALS)('with %s as neutral', (neutral) => {
    it.each(CASES)('%s: %s on %s is at least %d:1', (mode, edge, background, min) => {
      expect(contrast(mode, edge, background, neutral)).toBeGreaterThanOrEqual(min)
    })
  })
})
