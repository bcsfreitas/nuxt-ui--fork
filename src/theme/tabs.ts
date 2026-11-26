import type { ModuleOptions } from '../module'
import { controlIconSize, controlLeadingIcon, controlPadding, controlPy, controlRadius } from './utils/control-geometry'

// Active-tab highlight shown before reka-ui's `TabsIndicator` mounts (SSR / pre-hydration).
// reka-ui only renders the real indicator on the client (it needs DOM measurements), so we gate
// a CSS-only pseudo-element fallback on the active trigger by the *absence* of the indicator
// element — the instant reka's measured indicator appears, this selector stops matching.
const ssr = (...classes: string[]) => classes.map(c => `in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:${c}`).join(' ')

export default (options: Required<ModuleOptions>) => ({
  slots: {
    root: 'flex items-center gap-2',
    // Sizes set `--py` and the text size on the list, so the triggers and the pill indicator share the Button corner
    list: ['relative flex p-1 group', controlRadius('--ui-tabs-trigger-radius')],
    indicator: 'absolute transition-[translate,width] duration-200 ease-out motion-reduce:transition-none',
    trigger: ['group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-(--ui-tabs-trigger-radius)', controlPadding, 'disabled:cursor-not-allowed disabled:opacity-75', options.theme.transitions && 'transition-colors'],
    leadingIcon: controlLeadingIcon,
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    label: 'truncate',
    trailingBadge: 'shrink-0',
    trailingBadgeSize: 'sm',
    content: 'w-full rounded-md focus-visible:outline-3'
  },
  variants: {
    color: {
      ...Object.fromEntries((options.theme.colors || []).map((color: string) => [color, {
        content: `outline-${color}/25`
      }])),
      neutral: {
        content: 'outline-inverted/25'
      }
    },
    variant: {
      pill: {
        // Concentric around the triggers: their corner plus the list padding, 0 when `--ui-radius` is 0
        list: 'bg-elevated ring ring-inset ring-accented rounded-(--ui-tabs-list-radius) [--ui-tabs-list-radius:min(var(--ui-radius)_*_100,_var(--ui-tabs-trigger-radius)_+_--spacing(1))]',
        trigger: ['grow', ssr('before:content-[\'\']', 'before:absolute', 'before:inset-0', 'before:rounded-(--ui-tabs-trigger-radius)', 'before:shadow-xs', 'before:-z-10', 'isolate')],
        indicator: 'rounded-(--ui-tabs-trigger-radius) shadow-xs'
      },
      link: {
        list: 'border-default',
        indicator: 'rounded-full',
        trigger: [ssr('after:content-[\'\']', 'after:absolute', 'after:rounded-full')]
      }
    },
    orientation: {
      horizontal: {
        root: 'flex-col',
        list: 'w-full',
        indicator: 'left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)',
        trigger: 'justify-center'
      },
      vertical: {
        list: 'flex-col',
        indicator: 'top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)'
      }
    },
    size: {
      xs: {
        list: `${controlPy.xs} text-xs`,
        trigger: `${controlIconSize.xs} gap-1`,
        leadingAvatarSize: '3xs'
      },
      sm: {
        list: `${controlPy.sm} text-xs`,
        trigger: `${controlIconSize.sm} gap-1.5`,
        leadingAvatarSize: '3xs'
      },
      md: {
        list: `${controlPy.md} text-sm`,
        trigger: `${controlIconSize.md} gap-1.5`,
        leadingAvatarSize: '2xs'
      },
      lg: {
        list: `${controlPy.lg} text-sm`,
        trigger: `${controlIconSize.lg} gap-2`,
        leadingAvatarSize: '2xs'
      },
      xl: {
        list: `${controlPy.xl} text-base`,
        trigger: `${controlIconSize.xl} gap-2`,
        leadingAvatarSize: 'xs'
      }
    }
  },
  compoundVariants: [{
    orientation: 'horizontal',
    variant: 'pill',
    class: {
      indicator: 'inset-y-1'
    }
  }, {
    orientation: 'horizontal',
    variant: 'link',
    class: {
      list: 'border-b -mb-px',
      indicator: '-bottom-px h-px',
      trigger: ssr('after:inset-x-0', 'after:-bottom-[calc(var(--spacing)+1px)]', 'after:h-px')
    }
  }, {
    orientation: 'vertical',
    variant: 'pill',
    class: {
      indicator: 'inset-x-1',
      list: 'items-center',
      trigger: 'w-full justify-center'
    }
  }, {
    orientation: 'vertical',
    variant: 'link',
    class: {
      list: 'border-s -ms-px',
      indicator: '-start-px w-px',
      trigger: ssr('after:inset-y-0', 'after:-start-[calc(var(--spacing)+1px)]', 'after:w-px')
    }
  }, ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'pill',
    class: {
      indicator: `bg-${color}`,
      trigger: [`data-[state=active]:text-inverted outline-${color}/25 focus-visible:outline-3`, ssr(`before:bg-${color}`)]
    }
  })), {
    color: 'neutral',
    variant: 'pill',
    class: {
      list: '[--ui-tabs-segment-bg:var(--ui-bg)] [--ui-tabs-segment-shadow:var(--shadow-xs)] dark:[--ui-tabs-segment-bg:var(--ui-bg-accented)] dark:[--ui-tabs-segment-shadow:var(--shadow-segment-edge)]',
      indicator: 'bg-(--ui-tabs-segment-bg) shadow-(--ui-tabs-segment-shadow)',
      trigger: [`data-[state=active]:text-highlighted outline-inverted/25 focus-visible:outline-3`, ssr('before:bg-(--ui-tabs-segment-bg)', 'before:shadow-(--ui-tabs-segment-shadow)')]
    }
  }, ...(options.theme.colors || []).map((color: string) => ({
    color,
    variant: 'link',
    class: {
      indicator: `bg-${color}`,
      trigger: [`data-[state=active]:text-${color} outline-${color}/25 focus-visible:outline-3`, ssr(`after:bg-${color}`)]
    }
  })), {
    color: 'neutral',
    variant: 'link',
    class: {
      indicator: 'bg-inverted',
      trigger: [`data-[state=active]:text-highlighted outline-inverted/25 focus-visible:outline-3`, ssr('after:bg-inverted')]
    }
  }],
  defaultVariants: {
    color: 'primary',
    variant: 'pill',
    size: 'md'
  }
})
