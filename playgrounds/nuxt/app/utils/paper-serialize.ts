import type { PaperColorToken, PaperTokenMode } from './paper-tokens'
import {
  PAPER_COLOR_PREFERENCE,
  PAPER_FONT_SANS,
  PAPER_FONT_SIZE,
  PAPER_FONT_WEIGHT,
  PAPER_LEADING,
  PAPER_RADIUS,
  PAPER_RAW_PALETTES,
  PAPER_ROLES,
  PAPER_SPACING,
  PAPER_TRACKING,
  paperColorTokens
} from './paper-tokens'

/**
 * Turns a rendered DOM subtree into HTML that Paper (paper.design) can paste:
 * every element is a flex box or a `<p>`, styled only inline, with values linked to Paper tokens.
 */

export interface PaperSerializeResult {
  html: string
  /** Values that had no matching token and were emitted as literals */
  unmapped: string[]
}

type ColorKind = keyof typeof PAPER_COLOR_PREFERENCE
type Direction = 'row' | 'column' | 'row-reverse' | 'column-reverse'

interface Rgb {
  r: number
  g: number
  b: number
}

interface ResolvedToken {
  token: PaperColorToken
  rgb: Rgb
}

interface PaperNode {
  tag: 'div' | 'p' | 'img' | 'svg'
  layerName?: string
  style: string[]
  children: PaperNode[]
  text?: string
  attrs?: [string, string][]
  /** Cleaned `<svg>` element, serialized with the node's styles at render time */
  svg?: Element
}

interface ParentLayout {
  element: Element
  direction: Direction
  /** The parent is a real flex container, not a converted block or grid */
  flex: boolean
  /** Children of a multi-track grid keep their track width */
  grid: boolean
  stretch: boolean
  contentWidth: number
  contentHeight: number
}

interface Context {
  root: HTMLElement
  tokens: ResolvedToken[]
  canvas: CanvasRenderingContext2D
  unmapped: Set<string>
}

type Item = { kind: 'run', nodes: Node[] } | { kind: 'element', element: Element }

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META'])
const ATOMIC_TAGS = new Set(['IMG', 'SVG', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'CANVAS', 'IFRAME'])
const SEMANTIC_HINTS: Record<string, string[]> = {
  bg: ['default', 'muted', 'elevated', 'accented', 'inverted'],
  text: ['default', 'muted', 'toned', 'dimmed', 'highlighted', 'inverted'],
  border: ['default', 'muted', 'accented', 'inverted', 'control']
}

export function serializeForPaper(root: HTMLElement, mode: PaperTokenMode): PaperSerializeResult {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context2d = canvas.getContext('2d', { willReadFrequently: true })
  if (!context2d) {
    throw new Error('Canvas 2D context is unavailable')
  }

  const ctx: Context = { root, tokens: [], canvas: context2d, unmapped: new Set() }
  ctx.tokens = resolveTokens(ctx, mode)

  const rootStyle = getComputedStyle(root)
  const items = collectItems(root)
  const layout = layoutOf(ctx, root, rootStyle, items)
  const children = convertItems(ctx, root, items, layout.parent)
  const elements = items.flatMap(item => item.kind === 'element' ? [item.element] : [])

  let top: PaperNode | undefined
  let width = contentBox(root, rootStyle).width
  if (children.length === 1 && elements.length === 1 && children[0]!.tag !== 'p') {
    top = children[0]!
    width = elements[0]!.getBoundingClientRect().width
  } else if (children.length) {
    const relative = children.some(child => child.style.includes('position: absolute')) ? ['position: relative'] : []
    top = { tag: 'div', layerName: 'Preview', style: ['display: flex', ...layout.styles, ...relative], children }
  }

  if (top && top.tag !== 'svg' && !top.style.some(declaration => declaration.startsWith('width:'))) {
    top.style.push(`width: ${formatPx(width)}`)
  }

  return {
    html: top ? render(top, 0) : '',
    unmapped: [...ctx.unmapped].sort()
  }
}

/* Colors */

function resolveTokens(ctx: Context, mode: PaperTokenMode): ResolvedToken[] {
  const probe = document.createElement('span')
  probe.style.display = 'none'
  ctx.root.appendChild(probe)

  const resolved: ResolvedToken[] = []
  const missing = 'rgb(1, 2, 3)'
  for (const token of paperColorTokens(mode)) {
    probe.style.color = `var(${token.source}, ${missing})`
    const value = getComputedStyle(probe).color
    if (!value || value === missing) {
      continue
    }
    const parsed = parseColor(ctx, value)
    if (parsed && parsed.alpha === 1) {
      resolved.push({ token, rgb: parsed.rgb })
    }
  }

  probe.remove()
  return resolved
}

function parseAlphaValue(value: string) {
  const number = Number.parseFloat(value)
  if (Number.isNaN(number)) {
    return 1
  }
  return value.trim().endsWith('%') ? number / 100 : number
}

function parseColor(ctx: Context, color: string): { rgb: Rgb, alpha: number } | undefined {
  const value = color.trim()
  if (!value || value === 'transparent' || value === 'none') {
    return undefined
  }

  let opaque = value
  let alpha = 1
  const rgb = value.match(/^rgba?\(([^)]*)\)$/i)
  if (rgb) {
    const parts = rgb[1]!.split(/[\s,/]+/).filter(Boolean)
    alpha = parts[3] === undefined ? 1 : parseAlphaValue(parts[3])
    opaque = `rgb(${parts.slice(0, 3).join(' ')})`
  } else {
    const slash = value.lastIndexOf('/')
    if (slash > 0 && value.endsWith(')')) {
      alpha = parseAlphaValue(value.slice(slash + 1, -1))
      opaque = `${value.slice(0, slash).trim()})`
    }
  }

  if (alpha <= 0) {
    return undefined
  }

  const canvas = ctx.canvas
  canvas.clearRect(0, 0, 1, 1)
  canvas.fillStyle = '#000000'
  canvas.fillStyle = opaque
  canvas.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = canvas.getImageData(0, 0, 1, 1).data
  return { rgb: { r, g, b }, alpha: Math.round(alpha * 1000) / 1000 }
}

function sameRgb(a: Rgb, b: Rgb) {
  return Math.abs(a.r - b.r) <= 1 && Math.abs(a.g - b.g) <= 1 && Math.abs(a.b - b.b) <= 1
}

function colorValue(ctx: Context, color: string, kind: ColorKind, hints: string[], label: string): string | undefined {
  const parsed = parseColor(ctx, color)
  if (!parsed) {
    return undefined
  }

  const matches = ctx.tokens.filter(entry => sameRgb(entry.rgb, parsed.rgb))
  let name: string | undefined
  for (const group of PAPER_COLOR_PREFERENCE[kind]) {
    const inGroup = matches.filter(entry => entry.token.group === group)
    if (!inGroup.length) {
      continue
    }
    const hinted = hints.map(hint => inGroup.find(entry => entry.token.key === hint)).find(Boolean)
    name = (hinted ?? inGroup[0]!).token.name
    break
  }

  const { r, g, b } = parsed.rgb
  if (!name) {
    const literal = parsed.alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${parsed.alpha})` : `rgb(${r}, ${g}, ${b})`
    ctx.unmapped.add(`${label}: ${literal}`)
    return literal
  }

  if (parsed.alpha < 1) {
    return `color-mix(in srgb, var(${name}) ${Math.round(parsed.alpha * 1000) / 10}%, transparent)`
  }
  return `var(${name})`
}

/** Token hints from the classes of the element and its ancestors, nearest first */
function classHints(ctx: Context, element: Element): string[] {
  const hints: string[] = []
  const roles = ['neutral', ...PAPER_ROLES].join('|')
  const raws = PAPER_RAW_PALETTES.join('|')
  for (let node: Element | null = element; node && node !== ctx.root.parentElement; node = node.parentElement) {
    for (const raw of (node.getAttribute('class') || '').split(/\s+/)) {
      const utility = (raw.split(':').pop() || '').replace(/^!|!$/g, '').split('/')[0] || ''
      const match = utility.match(/^(bg|text|border(?:-[xytblrse])?|ring|divide(?:-[xy])?|outline|fill|stroke)-(.+)$/)
      if (!match) {
        continue
      }
      const prefix = match[1]!
      const word = match[2]!
      const group = prefix === 'bg' ? 'bg' : prefix === 'text' || prefix === 'fill' || prefix === 'stroke' ? 'text' : 'border'
      if (new RegExp(`^(${roles})(-\\d+)?$`).test(word)) {
        hints.push(`role:${word.split('-')[0]}`)
      } else if (new RegExp(`^(${raws})-\\d+$`).test(word)) {
        hints.push(`raw:${word.split('-')[0]}`)
      } else if (SEMANTIC_HINTS[group]?.includes(word)) {
        hints.push(`${group}:${word}`)
      }
    }
  }
  return hints
}

/* Lengths */

function px(value: string) {
  const number = Number.parseFloat(value)
  return Number.isNaN(number) ? 0 : number
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function formatPx(value: number) {
  return value === 0 ? '0' : `${round(value)}px`
}

function scaleValue(ctx: Context, value: number, scale: Record<number, string>, label: string) {
  if (value === 0) {
    return '0'
  }
  const token = scale[round(value)]
  if (token) {
    return `var(${token})`
  }
  ctx.unmapped.add(`${label}: ${formatPx(value)}`)
  return formatPx(value)
}

function spacing(ctx: Context, value: number, label: string) {
  return value < 0 ? formatPx(value) : scaleValue(ctx, value, PAPER_SPACING, label)
}

function shorthand(values: string[]) {
  const [top, right, bottom, left] = values as [string, string, string, string]
  if (top === right && right === bottom && bottom === left) {
    return top
  }
  if (top === bottom && right === left) {
    return `${top} ${right}`
  }
  return `${top} ${right} ${bottom} ${left}`
}

/* DOM helpers */

function isHidden(element: Element, style: CSSStyleDeclaration) {
  if (SKIPPED_TAGS.has(element.tagName.toUpperCase()) || style.display === 'none' || style.visibility === 'hidden') {
    return true
  }
  if (style.position === 'absolute' || style.position === 'fixed') {
    const rect = element.getBoundingClientRect()
    return rect.width <= 1 && rect.height <= 1
  }
  return false
}

function iconMask(style: CSSStyleDeclaration) {
  const mask = style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image')
  const match = mask.match(/url\((["']?)(data:image\/svg\+xml.*?)\1\)/)
  return match?.[2]
}

function isAtomic(element: Element, style: CSSStyleDeclaration) {
  return ATOMIC_TAGS.has(element.tagName.toUpperCase()) || !!iconMask(style)
}

function isInlineText(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return true
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.nodeType === Node.COMMENT_NODE
  }
  const element = node as Element
  const style = getComputedStyle(element)
  if (isHidden(element, style)) {
    return true
  }
  return (style.display === 'inline' || style.display === 'contents') && !isAtomic(element, style) && [...element.childNodes].every(isInlineText)
}

function hasText(node: Node) {
  return !!node.textContent?.trim()
}

function isTextElement(element: Element) {
  return hasText(element) && [...element.childNodes].every(isInlineText)
}

/** Flattens `display: contents` and groups consecutive inline text into runs */
function collectItems(element: Element): Item[] {
  const items: Item[] = []
  let run: Node[] = []
  const flush = () => {
    if (run.some(hasText)) {
      items.push({ kind: 'run', nodes: run })
    }
    run = []
  }

  const visit = (parent: Element) => {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        run.push(node)
        continue
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue
      }
      const child = node as Element
      const style = getComputedStyle(child)
      if (isHidden(child, style)) {
        continue
      }
      if (style.display === 'contents') {
        visit(child)
        continue
      }
      if (style.display === 'inline' && isInlineText(child) && !hasBox(child, style)) {
        run.push(child)
        continue
      }
      flush()
      items.push({ kind: 'element', element: child })
    }
  }

  visit(element)
  flush()
  return items
}

function runRange(nodes: Node[]) {
  const range = document.createRange()
  range.setStartBefore(nodes[0]!)
  range.setEndAfter(nodes[nodes.length - 1]!)
  return range
}

function itemRect(item: Item) {
  return item.kind === 'element' ? item.element.getBoundingClientRect() : runRange(item.nodes).getBoundingClientRect()
}

function isOutOfFlow(item: Item) {
  if (item.kind === 'run') {
    return false
  }
  const position = getComputedStyle(item.element).position
  return position === 'absolute' || position === 'fixed'
}

function isInlineLevel(item: Item) {
  return item.kind === 'run' || getComputedStyle(item.element).display.startsWith('inline')
}

function lineCount(range: Range) {
  const lines: { top: number, bottom: number }[] = []
  for (const rect of range.getClientRects()) {
    if (rect.width === 0 && rect.height === 0) {
      continue
    }
    const center = (rect.top + rect.bottom) / 2
    if (!lines.some(line => center > line.top && center < line.bottom)) {
      lines.push({ top: rect.top, bottom: rect.bottom })
    }
  }
  return lines.length
}

function contentBox(element: Element, style: CSSStyleDeclaration) {
  const rect = element.getBoundingClientRect()
  return {
    width: rect.width - px(style.paddingLeft) - px(style.paddingRight) - px(style.borderLeftWidth) - px(style.borderRightWidth),
    height: rect.height - px(style.paddingTop) - px(style.paddingBottom) - px(style.borderTopWidth) - px(style.borderBottomWidth)
  }
}

function hasBox(element: Element, style: CSSStyleDeclaration) {
  const background = style.backgroundColor
  const transparent = !background || background === 'transparent' || /^rgba\(.*,\s*0\)$/.test(background)
  const borders = ['Top', 'Right', 'Bottom', 'Left'].some(side => px(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none')
  const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].some(value => px(value) > 0)
  const shadow = !!visibleShadow(style.boxShadow)
  return !transparent || borders || padding || shadow
}

function visibleShadow(value: string) {
  if (!value || value === 'none') {
    return ''
  }
  return splitTopLevel(value).filter((shadow) => {
    const color = shadow.match(/^(\w+\([^)]*\)|#[\da-f]+|[a-z]+)\s/i)?.[1] ?? ''
    if (/^rgba\(.*,\s*0\)$/.test(color) || color === 'transparent') {
      return false
    }
    return shadow.replace(color, '').match(/-?[\d.]+px/g)?.some(length => px(length) !== 0) ?? false
  }).join(', ')
}

function splitTopLevel(value: string) {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of value) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) {
    parts.push(current.trim())
  }
  return parts
}

/** A size is fixed when forcing it to `auto` changes the rendered size */
function fixedSize(element: HTMLElement | SVGElement) {
  const rect = element.getBoundingClientRect()
  const measure = (property: 'width' | 'height') => {
    const value = element.style.getPropertyValue(property)
    const priority = element.style.getPropertyPriority(property)
    element.style.setProperty(property, 'auto', 'important')
    const size = element.getBoundingClientRect()[property]
    if (value) {
      element.style.setProperty(property, value, priority)
    } else {
      element.style.removeProperty(property)
    }
    return Math.abs(size - rect[property]) > 0.5 ? rect[property] : undefined
  }
  return { width: measure('width'), height: measure('height') }
}

/** Auto margins grow when the parent grows */
function autoMargins(element: Element, parent: Element) {
  const style = getComputedStyle(element)
  const before = { top: px(style.marginTop), right: px(style.marginRight), bottom: px(style.marginBottom), left: px(style.marginLeft) }
  const result = { top: false, right: false, bottom: false, left: false }
  if (!(parent instanceof HTMLElement) || Object.values(before).every(value => value <= 0)) {
    return result
  }

  const cssText = parent.style.cssText
  const rect = parent.getBoundingClientRect()
  parent.style.setProperty('width', `${rect.width + 37}px`, 'important')
  parent.style.setProperty('height', `${rect.height + 37}px`, 'important')
  result.left = before.left > 0 && px(style.marginLeft) !== before.left
  result.right = before.right > 0 && px(style.marginRight) !== before.right
  result.top = before.top > 0 && px(style.marginTop) !== before.top
  result.bottom = before.bottom > 0 && px(style.marginBottom) !== before.bottom
  parent.style.cssText = cssText
  return result
}

function componentName(ctx: Context, element: Element) {
  type Instance = { type?: { __name?: string, name?: string }, vnode?: { el?: unknown }, parent?: Instance | null }
  let instance = (element as unknown as { __vueParentComponent?: Instance }).__vueParentComponent
  let name: string | undefined
  while (instance && instance.vnode?.el === element) {
    const candidate = instance.type?.__name || instance.type?.name
    if (candidate === 'PaperPreview') {
      break
    }
    if (candidate && !candidate.startsWith('Async')) {
      name = candidate
    }
    instance = instance.parent ?? undefined
  }
  return element === ctx.root ? undefined : name
}

function layerName(ctx: Context, element: Element) {
  return componentName(ctx, element) || element.getAttribute('data-slot') || undefined
}

/* Styles */

function textTransform(text: string, transform: string) {
  if (transform === 'uppercase') return text.toUpperCase()
  if (transform === 'lowercase') return text.toLowerCase()
  if (transform === 'capitalize') return text.replace(/\b\w/g, char => char.toUpperCase())
  return text
}

function runText(nodes: Node[], parentStyle: CSSStyleDeclaration) {
  const preserve = parentStyle.whiteSpace.startsWith('pre')
  // eslint-disable-next-line unicorn/prefer-dom-node-text-content -- innerText applies text-transform and <br> like the render
  const text = nodes.map(node => node instanceof HTMLElement ? node.innerText : textTransform(node.textContent || '', parentStyle.textTransform)).join('')
  return preserve ? text : text.replace(/[ \t\r\n]+/g, ' ').trim()
}

function textStyles(ctx: Context, element: Element, style: CSSStyleDeclaration, lines: number, text: string): string[] {
  const styles: string[] = []
  const color = colorValue(ctx, style.color, 'text', classHints(ctx, element), 'color')
  if (color) {
    styles.push(`color: ${color}`)
  }

  const family = style.fontFamily
  if (family.includes(PAPER_FONT_SANS.family)) {
    styles.push(`font-family: var(${PAPER_FONT_SANS.name})`)
  } else {
    ctx.unmapped.add(`font-family: ${family.replace(/"/g, '\'')}`)
    styles.push(`font-family: ${family.replace(/"/g, '\'')}`)
  }

  const fontSize = px(style.fontSize)
  const sizeToken = PAPER_FONT_SIZE[round(fontSize)]
  if (sizeToken) {
    styles.push(`font-size: var(${sizeToken})`)
  } else {
    ctx.unmapped.add(`font-size: ${formatPx(fontSize)}`)
    styles.push(`font-size: ${formatPx(fontSize)}`)
  }

  const weight = Number.parseInt(style.fontWeight, 10)
  const weightToken = PAPER_FONT_WEIGHT[weight]
  styles.push(`font-weight: ${weightToken ? `var(${weightToken})` : weight}`)

  if (style.lineHeight !== 'normal') {
    const lineHeight = px(style.lineHeight)
    const leading = PAPER_LEADING.find(([ratio]) => Math.abs(lineHeight / fontSize - ratio) < 0.005)
    if (leading) {
      styles.push(`line-height: var(${leading[1]})`)
    } else {
      ctx.unmapped.add(`line-height: ${formatPx(lineHeight)} (${round(lineHeight / fontSize, 3)})`)
      styles.push(`line-height: ${formatPx(lineHeight)}`)
    }
  }

  if (style.letterSpacing !== 'normal' && px(style.letterSpacing) !== 0) {
    const em = px(style.letterSpacing) / fontSize
    const tracking = PAPER_TRACKING.find(([value]) => Math.abs(em - value) < 0.002)
    if (tracking) {
      styles.push(`letter-spacing: var(${tracking[1]})`)
    } else {
      ctx.unmapped.add(`letter-spacing: ${round(em, 4)}em`)
      styles.push(`letter-spacing: ${round(em, 4)}em`)
    }
  }

  if (['center', 'right', 'end', 'justify'].includes(style.textAlign)) {
    styles.push(`text-align: ${style.textAlign === 'end' ? 'right' : style.textAlign}`)
  }
  if (style.fontStyle === 'italic') {
    styles.push('font-style: italic')
  }
  const decoration = style.textDecorationLine
  if (decoration && decoration !== 'none') {
    styles.push(`text-decoration: ${decoration}`)
  }

  if (style.whiteSpace.startsWith('pre')) {
    styles.push(`white-space: ${style.whiteSpace}`)
  } else if (text.includes('\n')) {
    styles.push('white-space: pre-line')
  } else if (lines <= 1) {
    styles.push('white-space: nowrap')
  }
  return styles
}

function boxStyles(ctx: Context, element: Element, style: CSSStyleDeclaration): string[] {
  const styles: string[] = []
  const hints = classHints(ctx, element)

  const padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(px)
  if (padding.some(value => value !== 0)) {
    styles.push(`padding: ${shorthand(padding.map(value => spacing(ctx, value, 'padding')))}`)
  }

  const background = colorValue(ctx, style.backgroundColor, 'background', hints, 'background-color')
  if (background) {
    styles.push(`background-color: ${background}`)
  }
  if (style.backgroundImage && style.backgroundImage !== 'none' && !iconMask(style)) {
    ctx.unmapped.add(`background-image: ${style.backgroundImage.slice(0, 60)}`)
  }

  const sides = ['top', 'right', 'bottom', 'left'].map((side) => {
    const width = px(style.getPropertyValue(`border-${side}-width`))
    const lineStyle = style.getPropertyValue(`border-${side}-style`)
    if (!width || lineStyle === 'none' || lineStyle === 'hidden') {
      return { side, value: '' }
    }
    const color = colorValue(ctx, style.getPropertyValue(`border-${side}-color`), 'border', hints, 'border-color')
    return { side, value: color ? `${formatPx(width)} ${lineStyle} ${color}` : '' }
  })
  if (sides.every(side => side.value && side.value === sides[0]!.value)) {
    styles.push(`border: ${sides[0]!.value}`)
  } else {
    for (const side of sides) {
      if (side.value) {
        styles.push(`border-${side.side}: ${side.value}`)
      }
    }
  }

  const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(px)
  if (radii.some(value => value !== 0)) {
    styles.push(`border-radius: ${shorthand(radii.map(value => value >= 9999 ? '9999px' : scaleValue(ctx, value, PAPER_RADIUS, 'border-radius')))}`)
  }

  const shadow = visibleShadow(style.boxShadow)
  if (shadow) {
    const mapped = splitTopLevel(shadow).map((part) => {
      const color = part.match(/^(\w+\([^)]*\)|#[\da-f]+|[a-z]+)\s/i)?.[1] ?? ''
      const rest = part.slice(color.length).trim()
      const inset = /\binset\b/.test(rest)
      const lengths = rest.replace(/\binset\b/, '').trim()
      const value = colorValue(ctx, color, 'border', hints, 'box-shadow color') ?? color
      return `${inset ? 'inset ' : ''}${lengths} ${value}`
    })
    styles.push(`box-shadow: ${mapped.join(', ')}`)
  }

  const opacity = Number.parseFloat(style.opacity)
  if (opacity < 1) {
    styles.push(`opacity: ${round(opacity, 3)}`)
  }
  if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
    styles.push('overflow: hidden')
  }
  return styles
}

function sizeLimits(style: CSSStyleDeclaration): string[] {
  const styles: string[] = []
  for (const property of ['min-width', 'min-height'] as const) {
    const value = style.getPropertyValue(property)
    if (value && value !== 'auto' && px(value) > 0) {
      styles.push(`${property}: ${formatPx(px(value))}`)
    }
  }
  for (const property of ['max-width', 'max-height'] as const) {
    const value = style.getPropertyValue(property)
    if (value && value !== 'none') {
      styles.push(`${property}: ${formatPx(px(value))}`)
    }
  }
  return styles
}

/* Layout */

function layoutOf(ctx: Context, element: Element, style: CSSStyleDeclaration, allItems: Item[]): { styles: string[], parent: ParentLayout } {
  const styles: string[] = []
  const items = allItems.filter(item => !isOutOfFlow(item))
  const box = contentBox(element, style)
  const rects = items.map(itemRect)
  const parent: ParentLayout = { element, direction: 'column', flex: false, grid: false, stretch: true, contentWidth: box.width, contentHeight: box.height }
  let wrap = false
  let gap: { row: number, column: number } = { row: 0, column: 0 }

  if (style.display.includes('flex')) {
    parent.flex = true
    parent.direction = style.flexDirection as Direction
    const horizontal = parent.direction.startsWith('row')
    wrap = style.flexWrap !== 'nowrap' && rects.some(rect => horizontal ? Math.abs(rect.top - rects[0]!.top) > 1 : Math.abs(rect.left - rects[0]!.left) > 1)
    gap = { row: px(style.rowGap), column: px(style.columnGap) }
    parent.stretch = ['normal', 'stretch'].includes(style.alignItems)
    if (!parent.stretch) {
      styles.push(`align-items: ${style.alignItems}`)
    }
    if (!['normal', 'flex-start', 'start'].includes(style.justifyContent)) {
      styles.push(`justify-content: ${style.justifyContent}`)
    }
  } else if (style.display.includes('grid')) {
    const tracks = style.gridTemplateColumns.split(/\s+/).filter(track => track && !track.startsWith('[') && track !== 'none').length
    gap = { row: px(style.rowGap), column: px(style.columnGap) }
    if (tracks > 1) {
      parent.direction = 'row'
      parent.grid = true
      wrap = items.length > tracks
      parent.stretch = ['normal', 'stretch'].includes(style.alignItems)
      if (!parent.stretch) {
        styles.push(`align-items: ${style.alignItems}`)
      }
    }
  } else if (items.length && items.every(isInlineLevel)) {
    parent.direction = 'row'
    parent.stretch = false
    wrap = rects.some(rect => Math.abs(rect.top - rects[0]!.top) > rect.height / 2 && rect.top > rects[0]!.bottom - 1)
    const spaces = rects.slice(1).map((rect, index) => rect.left - rects[index]!.right).filter(space => space > 0)
    if (spaces.length && spaces.every(space => Math.abs(space - spaces[0]!) < 1)) {
      gap.column = round(spaces[0]!)
    }
    const centers = rects.map(rect => (rect.top + rect.bottom) / 2)
    const bottoms = rects.map(rect => rect.bottom)
    if (rects.length > 1) {
      if (centers.every(center => Math.abs(center - centers[0]!) < 1)) {
        styles.push('align-items: center')
      } else if (bottoms.every(bottom => Math.abs(bottom - bottoms[0]!) < 1)) {
        styles.push('align-items: flex-end')
      } else {
        styles.push('align-items: baseline')
      }
    }
    if (['center', 'right', 'end'].includes(style.textAlign)) {
      styles.push(`justify-content: ${style.textAlign === 'center' ? 'center' : 'flex-end'}`)
    }
  }

  styles.unshift(`flex-direction: ${parent.direction}`)
  if (wrap) {
    styles.push('flex-wrap: wrap')
  }

  const horizontal = parent.direction.startsWith('row')
  const mainGap = horizontal ? gap.column : gap.row
  const crossGap = horizontal ? gap.row : gap.column
  if (wrap && mainGap !== crossGap) {
    if (gap.row) styles.push(`row-gap: ${spacing(ctx, gap.row, 'gap')}`)
    if (gap.column) styles.push(`column-gap: ${spacing(ctx, gap.column, 'gap')}`)
  } else if (mainGap) {
    styles.push(`gap: ${spacing(ctx, mainGap, 'gap')}`)
  }

  return { styles, parent }
}

function outerStyles(ctx: Context, element: HTMLElement | SVGElement, parent: ParentLayout): { styles: string[], before: boolean, after: boolean } {
  const style = getComputedStyle(element)
  const styles: string[] = []
  const auto = autoMargins(element, parent.element)
  const horizontal = parent.direction.startsWith('row')
  const rect = element.getBoundingClientRect()

  const margins = [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft].map(px)
  const keep = [!auto.top, !auto.right, !auto.bottom, !auto.left]
  const values = margins.map((value, index) => keep[index] ? value : 0)
  if (values.some(value => value !== 0)) {
    styles.push(`margin: ${shorthand(values.map(value => spacing(ctx, value, 'margin')))}`)
  }

  let before: boolean
  let after: boolean
  let alignSelf = parent.flex && !['auto', 'normal'].includes(style.alignSelf) ? style.alignSelf : ''
  if (horizontal) {
    before = auto.left
    after = auto.right
    if (auto.top && auto.bottom) alignSelf = 'center'
  } else {
    before = auto.top
    after = auto.bottom
    if (auto.left && auto.right) alignSelf = 'center'
    else if (auto.left) alignSelf = 'flex-end'
    else if (!alignSelf && parent.stretch && rect.width < parent.contentWidth - 0.5) alignSelf = 'flex-start'
  }
  if (alignSelf) {
    styles.push(`align-self: ${alignSelf}`)
  }

  if (parent.flex) {
    const grow = Number.parseFloat(style.flexGrow)
    if (grow > 0) styles.push(`flex-grow: ${grow}`)
    if (Number.parseFloat(style.flexShrink) === 0) styles.push('flex-shrink: 0')
    if (style.flexBasis !== 'auto' && style.flexBasis !== 'content') styles.push(`flex-basis: ${style.flexBasis.endsWith('%') ? style.flexBasis : formatPx(px(style.flexBasis))}`)
  }

  const fixed = fixedSize(element)
  const width = parent.grid ? rect.width : fixed.width
  if (width !== undefined) styles.push(`width: ${formatPx(width)}`)
  if (fixed.height !== undefined) styles.push(`height: ${formatPx(fixed.height)}`)
  styles.push(...sizeLimits(style))

  return { styles, before, after }
}

/* Conversion */

/** Out-of-flow children keep their offset inside the parent's padding box */
function absoluteStyles(element: Element, parentElement: Element) {
  const rect = element.getBoundingClientRect()
  const parentRect = parentElement.getBoundingClientRect()
  const parentStyle = getComputedStyle(parentElement)
  return [
    'position: absolute',
    `left: ${formatPx(rect.left - parentRect.left - px(parentStyle.borderLeftWidth))}`,
    `top: ${formatPx(rect.top - parentRect.top - px(parentStyle.borderTopWidth))}`,
    `width: ${formatPx(rect.width)}`,
    `height: ${formatPx(rect.height)}`
  ]
}

const SPACER: PaperNode = { tag: 'div', layerName: 'Spacer', style: ['flex-grow: 1'], children: [] }

function convertItems(ctx: Context, parentElement: Element, items: Item[], parent: ParentLayout): PaperNode[] {
  const nodes: PaperNode[] = []
  const parentStyle = getComputedStyle(parentElement)
  for (const item of items) {
    if (item.kind === 'run') {
      const text = runText(item.nodes, parentStyle)
      if (!text) continue
      const lines = lineCount(runRange(item.nodes))
      const firstElement = item.nodes.find((node): node is Element => node instanceof Element)
      const source = firstElement && item.nodes.filter(hasText).length === 1 ? firstElement : parentElement
      nodes.push({ tag: 'p', style: textStyles(ctx, source, getComputedStyle(source), lines, text), children: [], text })
      continue
    }

    const element = item.element
    if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
      continue
    }
    const node = convertElement(ctx, element)
    if (!node) continue
    if (isOutOfFlow(item)) {
      node.style.push(...absoluteStyles(element, parentElement))
      nodes.push(node)
      continue
    }
    const outer = outerStyles(ctx, element, parent)
    node.style.push(...outer.styles)
    if (outer.before) nodes.push({ ...SPACER, style: [...SPACER.style] })
    nodes.push(node)
    if (outer.after) nodes.push({ ...SPACER, style: [...SPACER.style] })
  }
  return nodes
}

function convertElement(ctx: Context, element: HTMLElement | SVGElement): PaperNode | undefined {
  const style = getComputedStyle(element)
  const tag = element.tagName.toUpperCase()
  const name = layerName(ctx, element)

  const mask = iconMask(style)
  if (mask) {
    return iconNode(ctx, element, style, mask)
  }
  if (tag === 'SVG') {
    return svgNode(ctx, element as SVGSVGElement)
  }
  if (tag === 'IMG') {
    const rect = element.getBoundingClientRect()
    const image = element as HTMLImageElement
    return {
      tag: 'img',
      layerName: name,
      attrs: [['src', image.currentSrc || image.src], ['alt', image.alt]],
      style: [`width: ${formatPx(rect.width)}`, `height: ${formatPx(rect.height)}`, ...boxStyles(ctx, element, style)],
      children: []
    }
  }

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    const field = element as HTMLInputElement
    const value = tag === 'SELECT' ? (element as HTMLSelectElement).selectedOptions[0]?.text ?? '' : field.value
    const placeholder = !value && 'placeholder' in field ? field.placeholder : ''
    const text = value || placeholder
    const children: PaperNode[] = []
    if (text) {
      const textStyle = placeholder ? getComputedStyle(element, '::placeholder') : style
      const styles = textStyles(ctx, element, textStyle, 1, text).map(declaration => declaration.startsWith('white-space:') ? 'white-space: nowrap' : declaration)
      children.push({ tag: 'p', style: styles, children: [], text })
    }
    return { tag: 'div', layerName: name ?? tag.toLowerCase(), style: ['display: flex', 'flex-direction: row', 'align-items: center', ...boxStyles(ctx, element, style)], children }
  }

  if (isTextElement(element)) {
    const text = runText([...element.childNodes], style)
    const range = document.createRange()
    range.selectNodeContents(element)
    const paragraph: PaperNode = { tag: 'p', layerName: name, style: textStyles(ctx, element, style, lineCount(range), text), children: [], text }
    if (!hasBox(element, style)) {
      return paragraph
    }
    const align = style.textAlign === 'center' ? ['align-items: center'] : []
    return { tag: 'div', layerName: name, style: ['display: flex', 'flex-direction: column', 'justify-content: center', ...align, ...boxStyles(ctx, element, style)], children: [{ ...paragraph, layerName: undefined }] }
  }

  const items = collectItems(element)
  const layout = layoutOf(ctx, element, style, items)
  const children = convertItems(ctx, element, items, layout.parent)
  const relative = children.some(child => child.style.includes('position: absolute')) ? ['position: relative'] : []
  return {
    tag: 'div',
    layerName: name,
    style: ['display: flex', ...layout.styles, ...boxStyles(ctx, element, style), ...relative],
    children
  }
}

function decodeSvg(uri: string) {
  const comma = uri.indexOf(',')
  const header = uri.slice(0, comma)
  const data = uri.slice(comma + 1)
  try {
    return header.includes(';base64') ? atob(data) : decodeURIComponent(data)
  } catch {
    return undefined
  }
}

function paintStyle(node: Element, property: string, value: string) {
  node.setAttribute('style', [node.getAttribute('style'), `${property}: ${value}`].filter(Boolean).join('; '))
}

function iconNode(ctx: Context, element: Element, style: CSSStyleDeclaration, uri: string): PaperNode | undefined {
  const source = decodeSvg(uri)
  if (!source) return undefined
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement
  if (svg.nodeName !== 'svg') return undefined

  const rect = element.getBoundingClientRect()
  svg.setAttribute('width', String(round(rect.width)))
  svg.setAttribute('height', String(round(rect.height)))
  const color = colorValue(ctx, style.color, 'text', classHints(ctx, element), 'icon color') ?? style.color

  // A mask only keeps the alpha, so every painted fill or stroke shows the icon color
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    for (const attribute of ['fill', 'stroke']) {
      const value = node.getAttribute(attribute)
      if (value && value !== 'none' && !value.startsWith('url(')) {
        node.removeAttribute(attribute)
        paintStyle(node, attribute, color)
      }
    }
  }
  if (!svg.hasAttribute('fill')) {
    paintStyle(svg, 'fill', color)
  }

  const name = [...element.classList].find(className => /^i-[\w-]+:/.test(className)) ?? layerName(ctx, element)
  return { tag: 'svg', layerName: name, style: [`width: ${formatPx(rect.width)}`, `height: ${formatPx(rect.height)}`, 'flex-shrink: 0'], children: [], svg }
}

function svgNode(ctx: Context, element: SVGSVGElement): PaperNode {
  const clone = element.cloneNode(true) as SVGSVGElement
  const originals = [element, ...element.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  const hints = classHints(ctx, element)
  originals.forEach((original, index) => {
    const copy = copies[index]
    if (!copy) return
    const style = getComputedStyle(original)
    const paint: string[] = []
    for (const property of ['fill', 'stroke'] as const) {
      const value = style.getPropertyValue(property)
      if (value && value !== 'none' && !value.startsWith('url(')) {
        paint.push(`${property}: ${colorValue(ctx, value, 'text', hints, `svg ${property}`) ?? value}`)
      }
    }
    for (const attribute of ['class', 'style', 'fill', 'stroke']) {
      copy.removeAttribute(attribute)
    }
    if (paint.length) copy.setAttribute('style', paint.join('; '))
  })
  const rect = element.getBoundingClientRect()
  clone.setAttribute('width', String(round(rect.width)))
  clone.setAttribute('height', String(round(rect.height)))
  return { tag: 'svg', layerName: layerName(ctx, element), style: [`width: ${formatPx(rect.width)}`, `height: ${formatPx(rect.height)}`, 'flex-shrink: 0'], children: [], svg: clone }
}

/* Output */

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttribute(value: string) {
  return escapeText(value).replace(/"/g, '&quot;')
}

/** One declaration per property, the last one wins */
function dedupe(style: string[]) {
  const declarations = new Map<string, string>()
  for (const declaration of style) {
    const property = declaration.slice(0, declaration.indexOf(':')).trim()
    declarations.delete(property)
    declarations.set(property, declaration)
  }
  return [...declarations.values()]
}

function render(input: PaperNode, depth: number): string {
  const node = { ...input, style: dedupe(input.style) }
  const indent = '  '.repeat(depth)
  if (node.tag === 'svg' && node.svg) {
    const svg = node.svg.cloneNode(true) as Element
    for (const attribute of [...svg.attributes]) {
      if (attribute.name === 'class' || attribute.name === 'id' || attribute.name.startsWith('data-')) {
        svg.removeAttribute(attribute.name)
      }
    }
    if (node.layerName) {
      svg.setAttribute('layer-name', node.layerName)
    }
    svg.setAttribute('style', [svg.getAttribute('style'), ...node.style].filter(Boolean).join('; '))
    return `${indent}${new XMLSerializer().serializeToString(svg)}`
  }

  const attributes = [
    node.layerName ? ` layer-name="${escapeAttribute(node.layerName)}"` : '',
    ...(node.attrs ?? []).map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`),
    node.style.length ? ` style="${escapeAttribute(node.style.join('; '))}"` : ''
  ].join('')

  if (node.tag === 'img') {
    return `${indent}<img${attributes} />`
  }
  if (node.tag === 'p') {
    return `${indent}<p${attributes}>${escapeText(node.text ?? '')}</p>`
  }
  if (!node.children.length) {
    return `${indent}<div${attributes}></div>`
  }
  return [`${indent}<div${attributes}>`, ...node.children.map(child => render(child, depth + 1)), `${indent}</div>`].join('\n')
}
