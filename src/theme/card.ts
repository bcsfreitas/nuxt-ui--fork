export default {
  slots: {
    root: 'rounded-4xl overflow-hidden',
    header: 'p-4 sm:px-6',
    title: 'text-highlighted font-semibold',
    description: 'mt-1 text-muted text-sm',
    body: 'p-4 sm:p-6',
    footer: 'p-4 sm:px-6'
  },
  variants: {
    variant: {
      solid: {
        root: 'bg-inverted text-inverted',
        title: 'text-inverted',
        description: 'text-dimmed'
      },
      outline: {
        root: 'bg-default ring ring-default divide-y divide-default'
      },
      soft: {
        root: 'bg-elevated/50 divide-y divide-default'
      },
      subtle: {
        root: 'bg-elevated/50 ring ring-default divide-y divide-default'
      },
      shaded: {
        // Raised in both themes: light keeps the soft shadow, dark gets the elevated background plus a hairline edge
        root: 'bg-(--ui-card-bg) shadow-(--ui-card-shadow) [--ui-card-bg:var(--ui-bg)] [--ui-card-shadow:var(--shadow-card)] dark:[--ui-card-bg:var(--ui-bg-elevated)] dark:[--ui-card-shadow:0_0_0_1px_var(--ui-border-accented),var(--shadow-card)]'
      }
    }
  },
  defaultVariants: {
    variant: 'shaded'
  }
}
