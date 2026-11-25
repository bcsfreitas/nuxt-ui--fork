import type { ModuleOptions } from '../module'
import { fieldGroupVariant } from './field-group'
import { controlLeadingIcon, controlPadding, controlPaddingSquare, controlRadius, controlTrailingIcon } from './utils/control-geometry'

export default (options: Required<ModuleOptions>) => ({
  slots: {
    base: ['rounded-(--ui-badge-radius)', controlRadius('--ui-badge-radius'), 'font-medium inline-flex items-center', controlPadding],
    label: 'truncate',
    leadingIcon: controlLeadingIcon,
    // Line-height box, read from the badge's absolute line heights below; the size's plain value is the upstream avatar for browsers without `lh`
    leadingAvatar: 'shrink-0 size-(--ui-badge-avatar-size) supports-[height:1lh]:[--ui-badge-avatar-size:1lh]',
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
      subtle: ''
    },
    // Each size keeps its upstream block padding as `--py`; the plain `--px` / radius are the fallback for browsers without `cap` / `lh`
    size: {
      xs: {
        base: '[--py:--spacing(0.5)] [--px:--spacing(1)] [--ui-badge-radius:var(--radius-sm)] text-[8px]/3 gap-1',
        leadingAvatar: '[--ui-badge-avatar-size:--spacing(4)]',
        leadingAvatarSize: '3xs'
      },
      sm: {
        base: '[--py:--spacing(1)] [--px:--spacing(1.5)] [--ui-badge-radius:var(--radius-sm)] text-[10px]/3 gap-1',
        leadingAvatar: '[--ui-badge-avatar-size:--spacing(4)]',
        leadingAvatarSize: '3xs'
      },
      md: {
        base: '[--py:--spacing(1)] [--px:--spacing(2)] text-xs/4 gap-1',
        leadingAvatar: '[--ui-badge-avatar-size:--spacing(4)]',
        leadingAvatarSize: '3xs'
      },
      lg: {
        base: '[--py:--spacing(1)] [--px:--spacing(2)] text-sm/5 gap-1.5',
        leadingAvatar: '[--ui-badge-avatar-size:--spacing(5)]',
        leadingAvatarSize: '2xs'
      },
      xl: {
        base: '[--py:--spacing(1)] [--px:--spacing(2.5)] text-base/6 gap-1.5',
        leadingAvatar: '[--ui-badge-avatar-size:--spacing(5)]',
        leadingAvatarSize: '2xs'
      }
    },
    square: {
      true: ''
    }
  },
  compoundVariants: [...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'solid',
    class: `bg-${color} text-inverted`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'outline',
    class: `text-${color} ring ring-inset ring-${color}/50`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'soft',
    class: `bg-${color}/10 text-${color}`
  })), ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'subtle',
    class: `bg-${color}/10 text-${color} ring ring-inset ring-${color}/25`
  })), {
    color: 'neutral',
    variant: 'solid',
    class: 'text-inverted bg-inverted'
  }, {
    color: 'neutral',
    variant: 'outline',
    class: 'ring ring-inset ring-accented text-default bg-default'
  }, {
    color: 'neutral',
    variant: 'soft',
    class: 'text-default bg-elevated'
  }, {
    color: 'neutral',
    variant: 'subtle',
    class: 'ring ring-inset ring-accented text-default bg-elevated'
  }, {
    square: true,
    class: controlPaddingSquare
  }],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
})
