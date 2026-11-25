import type { ModuleOptions } from '../module'
import { fieldGroupVariantWithRoot } from './field-group'
import { controlEnhanced, controlPadding, controlPy, controlRadius } from './utils/control-geometry'

/**
 * The field frame: the element that holds the size's `--py` and is an ancestor of both the text and the
 * leading/trailing slots (`root`, or `base` in themes without a root). It publishes the growing corner
 * to slot buttons (`--ui-frame-radius`), the slots' inline inset (icon `--py` from the edge, upstream
 * `--py + 1` without `cap` / `lh`) and the text's padding next to an icon (inset, icon at `1lh`, then `--py`).
 */
export const fieldFrame = `${controlRadius('--ui-frame-radius')} [--ui-field-inset:calc(var(--py)_+_--spacing(1))] ${controlEnhanced}:[--ui-field-inset:var(--py)] ${controlEnhanced}:[--ui-field-icon-padding:calc(var(--py)_*_2_+_1lh)]`

// Per size: `--py` and the upstream text padding next to an icon, kept for browsers without `cap` / `lh`
export const fieldFrameSize = {
  xs: `${controlPy.xs} [--ui-field-icon-padding:--spacing(7)]`,
  sm: `${controlPy.sm} [--ui-field-icon-padding:--spacing(8)]`,
  md: `${controlPy.md} [--ui-field-icon-padding:--spacing(9)]`,
  lg: `${controlPy.lg} [--ui-field-icon-padding:--spacing(10)]`,
  xl: `${controlPy.xl} [--ui-field-icon-padding:--spacing(11)]`
} as const

export default (options: Required<ModuleOptions>) => ({
  slots: {
    root: `relative inline-flex items-center ${fieldFrame}`,
    base: ['w-full rounded-(--ui-frame-radius) border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75', options.theme.transitions && 'transition-colors'],
    // Slot buttons sit closest to the block edge (a button one size smaller leaves 2px), so their curve follows that gap
    leading: 'absolute inset-y-0 start-0 flex items-center ps-(--ui-field-inset) [--ui-frame-inset:--spacing(0.5)] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]',
    leadingIcon: 'shrink-0 size-[1lh] text-dimmed',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailing: 'absolute inset-y-0 end-0 flex items-center pe-(--ui-field-inset) [--ui-frame-inset:--spacing(0.5)] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]',
    trailingIcon: 'shrink-0 size-[1lh] text-dimmed'
  },
  variants: {
    ...fieldGroupVariantWithRoot,
    // The slots sit outside the text element, so they repeat its line height for their `1lh` icons
    size: {
      xs: {
        root: fieldFrameSize.xs,
        base: `${controlPadding} text-sm/4 gap-1`,
        leading: 'leading-4',
        trailing: 'leading-4',
        leadingAvatarSize: '3xs'
      },
      sm: {
        root: fieldFrameSize.sm,
        base: `${controlPadding} text-sm/4 gap-1.5`,
        leading: 'leading-4',
        trailing: 'leading-4',
        leadingAvatarSize: '3xs'
      },
      md: {
        root: fieldFrameSize.md,
        base: `${controlPadding} text-base/5 gap-1.5`,
        leading: 'leading-5',
        trailing: 'leading-5',
        leadingAvatarSize: '2xs'
      },
      lg: {
        root: fieldFrameSize.lg,
        base: `${controlPadding} text-base/5 gap-2`,
        leading: 'leading-5',
        trailing: 'leading-5',
        leadingAvatarSize: '2xs'
      },
      xl: {
        root: fieldFrameSize.xl,
        base: `${controlPadding} text-base gap-2`,
        leading: 'leading-6',
        trailing: 'leading-6',
        leadingAvatarSize: 'xs'
      }
    },
    variant: {
      outline: 'text-highlighted bg-default ring ring-inset ring-control',
      soft: 'text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50',
      subtle: 'text-highlighted bg-elevated ring ring-inset ring-control',
      ghost: 'text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent',
      none: 'text-highlighted bg-transparent focus:outline-none'
    },
    color: {
      ...Object.fromEntries((options.theme.colors || []).map((color: string) => [color, ''])),
      neutral: ''
    },
    leading: {
      true: ''
    },
    trailing: {
      true: ''
    },
    loading: {
      true: ''
    },
    highlight: {
      true: ''
    },
    fixed: {
      false: ''
    },
    type: {
      file: 'file:me-1.5 file:font-medium file:text-muted file:outline-none'
    }
  },
  compoundVariants: [...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: ['outline', 'subtle'],
    class: `outline-${color}/25 focus-visible:outline-3 focus-visible:ring-2 focus-visible:ring-focus-${color}`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: ['soft', 'ghost'],
    class: `outline-${color}/25 focus-visible:outline-3`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    highlight: true,
    class: `ring ring-inset ring-focus-${color}`
  })), {
    color: 'neutral',
    variant: ['outline', 'subtle'],
    class: 'outline-inverted/25 focus-visible:outline-3 focus-visible:ring-2 focus-visible:ring-focus-inverted'
  }, {
    color: 'neutral',
    variant: ['soft', 'ghost'],
    class: 'outline-inverted/25 focus-visible:outline-3'
  }, {
    color: 'neutral',
    highlight: true,
    class: 'ring ring-inset ring-focus-inverted'
  }, {
    leading: true,
    class: 'ps-(--ui-field-icon-padding)'
  }, {
    trailing: true,
    class: 'pe-(--ui-field-icon-padding)'
  }, {
    loading: true,
    leading: true,
    class: {
      leadingIcon: 'animate-spin'
    }
  }, {
    loading: true,
    leading: false,
    trailing: true,
    class: {
      trailingIcon: 'animate-spin'
    }
  }, {
    fixed: false,
    size: 'xs',
    class: 'md:text-xs'
  }, {
    fixed: false,
    size: 'sm',
    class: 'md:text-xs'
  }, {
    fixed: false,
    size: 'md',
    class: 'md:text-sm'
  }, {
    fixed: false,
    size: 'lg',
    class: 'md:text-sm'
  }],
  defaultVariants: {
    size: 'md',
    color: 'primary',
    variant: 'outline'
  }
})
