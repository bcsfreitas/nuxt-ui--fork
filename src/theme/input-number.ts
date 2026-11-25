import type { ModuleOptions } from '../module'
import inputTheme from './input'
import { fieldGroupVariantWithRoot } from './field-group'
import { controlPadding, controlPy, controlRadius } from './utils/control-geometry'

export default (options: Required<ModuleOptions>) => {
  const input = inputTheme(options)

  return {
    slots: {
      root: ['relative inline-flex items-center', controlRadius('--ui-frame-radius')],
      base: ['w-full rounded-(--ui-frame-radius) border-0 placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75', controlPadding, options.theme.transitions && 'transition-colors'],
      // The buttons span the field's block edge to edge, so their curve follows the field's corner
      increment: 'absolute flex items-center [--ui-frame-inset:0px] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]',
      decrement: 'absolute flex items-center [--ui-frame-inset:0px] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]'
    },
    variants: {
      ...fieldGroupVariantWithRoot,
      color: {
        ...Object.fromEntries((options.theme.colors || []).map((color: string) => [color, ''])),
        neutral: ''
      },
      size: {
        xs: {
          root: controlPy.xs,
          base: 'text-sm/4 gap-1'
        },
        sm: {
          root: controlPy.sm,
          base: 'text-sm/4 gap-1.5'
        },
        md: {
          root: controlPy.md,
          base: 'text-base/5 gap-1.5'
        },
        lg: {
          root: controlPy.lg,
          base: 'text-base/5 gap-2'
        },
        xl: {
          root: controlPy.xl,
          base: 'text-base gap-2'
        }
      },
      variant: {
        ...input.variants.variant
      },
      disabled: {
        true: {
          increment: 'opacity-75 cursor-not-allowed',
          decrement: 'opacity-75 cursor-not-allowed'
        }
      },
      orientation: {
        horizontal: {
          base: 'text-center',
          increment: 'inset-y-0 end-0 pe-1',
          decrement: 'inset-y-0 start-0 ps-1'
        },
        vertical: {
          increment: 'top-0 end-0 pe-1 [&>button]:py-0 scale-80',
          decrement: 'bottom-0 end-0 pe-1 [&>button]:py-0 scale-80'
        }
      },
      highlight: {
        true: ''
      },
      fixed: {
        false: ''
      },
      increment: {
        false: ''
      },
      decrement: {
        false: ''
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
      orientation: 'horizontal',
      decrement: false,
      class: 'text-start'
    }, {
      decrement: true,
      size: 'xs',
      class: 'ps-7'
    }, {
      decrement: true,
      size: 'sm',
      class: 'ps-8'
    }, {
      decrement: true,
      size: 'md',
      class: 'ps-9'
    }, {
      decrement: true,
      size: 'lg',
      class: 'ps-10'
    }, {
      decrement: true,
      size: 'xl',
      class: 'ps-11'
    }, {
      increment: true,
      size: 'xs',
      class: 'pe-7'
    }, {
      increment: true,
      size: 'sm',
      class: 'pe-8'
    }, {
      increment: true,
      size: 'md',
      class: 'pe-9'
    }, {
      increment: true,
      size: 'lg',
      class: 'pe-10'
    }, {
      increment: true,
      size: 'xl',
      class: 'pe-11'
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
  }
}
