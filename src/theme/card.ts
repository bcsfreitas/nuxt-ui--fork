export default {
  slots: {
    root: 'rounded-3xl overflow-hidden',
    header: 'p-6 sm:px-6',
    title: 'text-highlighted text-xl font-semibold',
    description: 'mt-1 text-muted text-sm',
    body: 'p-4 sm:p-6',
    footer: 'p-6 sm:px-6'
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
        root: 'bg-(--ui-card-bg) shadow-(--ui-card-shadow) [--ui-card-bg:var(--ui-bg)] [--ui-card-shadow:var(--ui-shadow-raised)] dark:[--ui-card-bg:var(--ui-bg-elevated)] dark:[--ui-card-shadow:var(--shadow-card-raised)]'
      }
    }
  },
  defaultVariants: {
    variant: 'shaded'
  }
}
