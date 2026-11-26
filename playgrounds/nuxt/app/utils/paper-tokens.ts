/**
 * Design tokens of the Paper file (paper.design) the export links to.
 * Names follow Paper; `source` is the CSS variable that holds the same value in this app.
 */

export type PaperTokenMode = 'light' | 'dark'

export type PaperColorGroup = 'bg' | 'text' | 'border' | 'role' | 'palette' | 'raw'

export interface PaperColorToken {
  /** Token name in Paper, `-dark` suffixed for dark semantic tokens */
  name: string
  /** CSS variable resolved in the preview to get the token's color */
  source: string
  group: PaperColorGroup
  /** Hint key matched against the classes of the element, e.g. `bg:elevated` or `role:success` */
  key: string
}

export const PAPER_ROLES = ['primary', 'secondary', 'success', 'info', 'warning', 'error'] as const
export const PAPER_RAW_PALETTES = ['slate', 'green', 'blue', 'yellow', 'red'] as const
export const PAPER_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

const BG_TOKENS: [string, string][] = [
  ['--ui-bg', 'default'],
  ['--ui-bg-muted', 'muted'],
  ['--ui-bg-elevated', 'elevated'],
  ['--ui-bg-accented', 'accented'],
  ['--ui-bg-inverted', 'inverted']
]

const TEXT_TOKENS: [string, string][] = [
  ['--ui-text', 'default'],
  ['--ui-text-muted', 'muted'],
  ['--ui-text-toned', 'toned'],
  ['--ui-text-dimmed', 'dimmed'],
  ['--ui-text-highlighted', 'highlighted'],
  ['--ui-text-inverted', 'inverted']
]

const BORDER_TOKENS: [string, string][] = [
  ['--ui-border', 'default'],
  ['--ui-border-muted', 'muted'],
  ['--ui-border-accented', 'accented'],
  ['--ui-border-inverted', 'inverted'],
  ['--ui-border-control', 'control']
]

export function paperColorTokens(mode: PaperTokenMode): PaperColorToken[] {
  const suffix = mode === 'dark' ? '-dark' : ''
  const semantic = (group: PaperColorGroup, list: [string, string][]) =>
    list.map(([source, key]) => ({ name: `${source}${suffix}`, source, group, key: `${group}:${key}` }))

  return [
    ...semantic('bg', BG_TOKENS),
    ...semantic('text', TEXT_TOKENS),
    ...semantic('border', BORDER_TOKENS),
    ...PAPER_ROLES.map(role => ({ name: `--ui-${role}${suffix}`, source: `--ui-${role}`, group: 'role' as const, key: `role:${role}` })),
    ...['neutral', ...PAPER_ROLES].flatMap(role => PAPER_SHADES.map(shade => ({
      name: `--color-${role}-${shade}`,
      source: `--ui-color-${role}-${shade}`,
      group: 'palette' as const,
      key: `role:${role}`
    }))),
    ...PAPER_RAW_PALETTES.flatMap(palette => PAPER_SHADES.map(shade => ({
      name: `--color-${palette}-${shade}`,
      source: `--color-${palette}-${shade}`,
      group: 'raw' as const,
      key: `raw:${palette}`
    })))
  ]
}

/** Lookup order of color groups per CSS property */
export const PAPER_COLOR_PREFERENCE: Record<'background' | 'text' | 'border', PaperColorGroup[]> = {
  background: ['bg', 'role', 'palette', 'raw'],
  text: ['text', 'role', 'palette', 'raw'],
  border: ['border', 'role', 'palette', 'raw']
}

export const PAPER_SPACING: Record<number, string> = {
  2: '--spacing-0_5',
  4: '--spacing-1',
  6: '--spacing-1_5',
  8: '--spacing-2',
  10: '--spacing-2_5',
  12: '--spacing-3',
  16: '--spacing-4',
  20: '--spacing-5',
  24: '--spacing-6',
  32: '--spacing-8',
  40: '--spacing-10',
  48: '--spacing-12',
  64: '--spacing-16',
  80: '--spacing-20',
  96: '--spacing-24'
}

export const PAPER_RADIUS: Record<number, string> = {
  2: '--radius-xs',
  4: '--radius-sm',
  6: '--radius-md',
  8: '--radius-lg',
  12: '--radius-xl',
  16: '--radius-2xl',
  24: '--radius-3xl'
}

export const PAPER_FONT_SIZE: Record<number, string> = {
  12: '--text-xs',
  14: '--text-sm',
  16: '--text-base',
  18: '--text-lg',
  20: '--text-xl',
  24: '--text-2xl',
  30: '--text-3xl',
  36: '--text-4xl',
  48: '--text-5xl',
  60: '--text-6xl'
}

export const PAPER_FONT_WEIGHT: Record<number, string> = {
  100: '--font-weight-thin',
  200: '--font-weight-extralight',
  300: '--font-weight-light',
  400: '--font-weight-normal',
  500: '--font-weight-medium',
  600: '--font-weight-semibold',
  700: '--font-weight-bold',
  800: '--font-weight-extrabold',
  900: '--font-weight-black'
}

/** Unitless line-height ratios */
export const PAPER_LEADING: [number, string][] = [
  [1.25, '--leading-tight'],
  [1.375, '--leading-snug'],
  [1.5, '--leading-normal'],
  [1.625, '--leading-relaxed'],
  [2, '--leading-loose']
]

/** Letter spacing in em */
export const PAPER_TRACKING: [number, string][] = [
  [-0.05, '--tracking-tighter'],
  [-0.025, '--tracking-tight'],
  [0, '--tracking-normal'],
  [0.025, '--tracking-wide'],
  [0.05, '--tracking-wider'],
  [0.1, '--tracking-widest']
]

export const PAPER_FONT_SANS = { name: '--font-sans', family: 'Allo' }
