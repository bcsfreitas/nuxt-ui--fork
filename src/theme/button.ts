import type { ModuleOptions } from '../module'
import { fieldGroupVariant } from './field-group'
import { controlIconSize, controlLeadingIcon, controlPadding, controlPaddingSquare, controlPy, controlRadius, controlTrailingIcon } from './utils/control-geometry'

export default (options: Required<ModuleOptions>) => ({
  slots: {
    // A parent frame (Input slots) hands its concentric radius through `--ui-button-frame-radius`, so a consumer `rounded-*` class still wins
    base: ['rounded-[var(--ui-button-frame-radius,var(--ui-button-radius))]', controlRadius('--ui-button-radius'), 'font-medium inline-flex items-center', controlPadding, 'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75', options.theme.transitions && 'transition-colors'],
    label: 'truncate',
    leadingIcon: controlLeadingIcon,
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: controlTrailingIcon
  },
  variants: {
    ...fieldGroupVariant,
    color: {
      ...Object.fromEntries((options.theme.colors || []).map((color: string) => [color, ''])),
      neutral: ''
    },
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: '',
      ghost: '',
      link: ''
    },
    size: {
      xs: {
        base: `${controlPy.xs} ${controlIconSize.xs} text-xs gap-1`,
        leadingAvatarSize: '3xs'
      },
      sm: {
        base: `${controlPy.sm} ${controlIconSize.sm} text-xs gap-1.5`,
        leadingAvatarSize: '3xs'
      },
      md: {
        base: `${controlPy.md} ${controlIconSize.md} text-sm gap-1.5`,
        leadingAvatarSize: '2xs'
      },
      lg: {
        base: `${controlPy.lg} ${controlIconSize.lg} text-sm gap-2`,
        leadingAvatarSize: '2xs'
      },
      xl: {
        base: `${controlPy.xl} ${controlIconSize.xl} text-base gap-2`,
        leadingAvatarSize: 'xs'
      }
    },
    block: {
      true: {
        base: 'w-full justify-center',
        trailingIcon: 'ms-auto'
      }
    },
    square: {
      true: ''
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
    active: {
      true: {
        base: ''
      },
      false: {
        base: ''
      }
    }
  },
  compoundVariants: [...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'solid',
    class: `text-inverted bg-${color} hover:bg-${color}/75 active:bg-${color}/75 disabled:bg-${color} aria-disabled:bg-${color} outline-${color}/25 focus-visible:outline-3`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'outline',
    class: `ring ring-inset ring-${color}/50 text-${color} hover:bg-${color}/10 active:bg-${color}/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-${color}/25 focus-visible:outline-3 focus-visible:ring-${color}`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'soft',
    class: `text-${color} bg-${color}/10 hover:bg-${color}/15 active:bg-${color}/15 outline-${color}/25 focus-visible:outline-3 disabled:bg-${color}/10 aria-disabled:bg-${color}/10`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'subtle',
    class: `text-${color} ring ring-inset ring-${color}/25 bg-${color}/10 hover:bg-${color}/15 active:bg-${color}/15 disabled:bg-${color}/10 aria-disabled:bg-${color}/10 outline-${color}/25 focus-visible:outline-3 focus-visible:ring-${color}`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'ghost',
    class: `text-${color} hover:bg-${color}/10 active:bg-${color}/10 outline-${color}/25 focus-visible:outline-3 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'link',
    class: `text-${color} hover:text-${color}/75 active:text-${color}/75 disabled:text-${color} aria-disabled:text-${color} outline-${color}/25 focus-visible:outline-3`
  })), {
    color: 'neutral',
    variant: 'solid',
    class: 'text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted outline-inverted/25 focus-visible:outline-3'
  }, {
    color: 'neutral',
    variant: 'outline',
    class: 'ring ring-inset ring-control text-default bg-default hover:bg-elevated active:bg-elevated disabled:bg-default aria-disabled:bg-default outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
  }, {
    color: 'neutral',
    variant: 'soft',
    class: 'text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 outline-inverted/25 focus-visible:outline-3 disabled:bg-elevated aria-disabled:bg-elevated'
  }, {
    color: 'neutral',
    variant: 'subtle',
    class: 'ring ring-inset ring-control text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
  }, {
    color: 'neutral',
    variant: 'ghost',
    class: 'text-default hover:bg-elevated active:bg-elevated outline-inverted/25 focus-visible:outline-3 hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent'
  }, {
    color: 'neutral',
    variant: 'link',
    class: 'text-muted hover:text-default active:text-default disabled:text-muted aria-disabled:text-muted outline-inverted/25 focus-visible:outline-3'
  }, {
    square: true,
    class: controlPaddingSquare
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
  }],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
})
