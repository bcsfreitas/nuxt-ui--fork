/**
 * Shared geometry for the controls on the Button size scale (Button, the Input family, Badge, Kbd, Tabs).
 *
 * Each size sets one value, the block padding `--py`; the inline padding, the icon box and the corner
 * derive from it and from the line height. Enhancements live in custom properties read by plain
 * utilities (`py-(--py)`, `rounded-(--var)`), so a consumer `rounded-*` / `px-*` class still wins
 * through tailwind-merge. Browsers without `cap` / `lh` keep the upstream padding and `rounded-md`.
 */

type CustomProperty = `--${string}`

// Block padding per size on the Button scale (heights 24/28/32/36/40 with Button's text sizes)
export const controlPy = {
  xs: '[--py:--spacing(1)]',
  sm: '[--py:--spacing(1.5)]',
  md: '[--py:--spacing(1.5)]',
  lg: '[--py:--spacing(2)]',
  xl: '[--py:--spacing(2)]'
} as const

/**
 * Block padding for a control with a fixed height and no padding of its own (Kbd): the line box
 * sits centred, so `--py = (height - 1lh) / 2`. `height` is a CSS length in Tailwind arbitrary
 * syntax, e.g. `--spacing(5)`.
 */
export function controlPyFromHeight(height: string) {
  return `[--py:calc((${height}_-_1lh)_/_2)]`
}

/**
 * Variant gating every value that reads both `cap` and `lh` (the optical padding and what depends on it).
 * Firefox 97–119 has `cap` but not `lh`: gated on `cap` alone, the value would be invalid there and drop to 0.
 */
export const controlEnhanced = 'supports-[(height:1cap)_and_(height:1lh)]'

// Optical inline padding `--py + (1lh - 1cap) / 2` centres the cap height; without `cap` / `lh`, `--py + --spacing(1)` is the upstream padding
export const controlPadding = `py-(--py) px-(--px) [--px:calc(var(--py)_+_--spacing(1))] ${controlEnhanced}:[--px:calc(var(--py)_+_(1lh_-_1cap)_/_2)]`

// Square / icon-only control. Repeats the enhanced form: a compound variant is emitted after the base's enhanced `--px` and must override it too
export const controlPaddingSquare = `[--px:var(--py)] ${controlEnhanced}:[--px:var(--py)]`

// Upstream icon box per size on the Button scale: declare it on the padded element, browsers without `lh` keep it
export const controlIconSize = {
  xs: '[--ui-control-icon-size:--spacing(4)]',
  sm: '[--ui-control-icon-size:--spacing(4)]',
  md: '[--ui-control-icon-size:--spacing(5)]',
  lg: '[--ui-control-icon-size:--spacing(5)]',
  xl: '[--ui-control-icon-size:--spacing(6)]'
} as const

// Icon at the line height, read through `--ui-control-icon-size` so a consumer `size-*` still wins and old browsers keep the size's fallback
export const controlIcon = 'shrink-0 size-(--ui-control-icon-size) supports-[height:1lh]:[--ui-control-icon-size:1lh]'

// Pull-in toward the edge so the icon sits `--py` from every edge, 0 without `cap` / `lh`. Read by a plain margin utility so a consumer `ms-*` / `me-*` still wins
const controlIconInset = `[--ui-control-icon-inset:0px] ${controlEnhanced}:[--ui-control-icon-inset:calc(var(--py)_-_var(--px))]`

export const controlLeadingIcon = `${controlIcon} ms-(--ui-control-icon-inset) ${controlIconInset}`

export const controlTrailingIcon = `${controlIcon} me-(--ui-control-icon-inset) ${controlIconInset}`

/**
 * Declares the corner in `variable`: `--ui-radius + (1lh - 1rem) / 4 + --py`, concentric with a
 * line-height icon sitting `--py` from the edge (xs 8, sm 10, md 11, lg 13, xl 14 px at the default
 * `--ui-radius`), 0 when `--ui-radius` is 0, `--radius-md` without `lh`. The element still reads it
 * with a plain `rounded-(<variable>)` utility. Pass `--ui-frame-radius` to publish it to nested frame
 * shapes (`frame-shape-*`), and declare it on the element that sets `--py`.
 */
export function controlRadius(variable: CustomProperty) {
  return `[${variable}:var(--radius-md)] supports-[height:1lh]:[${variable}:min(var(--ui-radius)_*_100,_var(--ui-radius)_+_(1lh_-_1rem)_/_4_+_var(--py))]`
}
