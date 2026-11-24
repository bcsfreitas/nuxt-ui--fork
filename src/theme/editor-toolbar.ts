export default {
  slots: {
    root: 'focus:outline-none',
    base: 'flex items-stretch gap-1.5',
    group: 'flex items-center gap-0.5',
    separator: 'w-px self-stretch bg-border',
    item: ''
  },
  variants: {
    layout: {
      bubble: {
        base: 'bg-default border border-default rounded-(--ui-frame-radius) [--ui-frame-radius:var(--radius-xl)] p-1 [--ui-frame-inset:calc(--spacing(1)+1px)]',
        item: 'frame-shape-(--ui-button-radius) rounded-(--ui-frame-shape-radius)'
      },
      floating: {
        base: 'bg-default border border-default rounded-(--ui-frame-radius) [--ui-frame-radius:var(--radius-xl)] p-1 [--ui-frame-inset:calc(--spacing(1)+1px)]',
        item: 'frame-shape-(--ui-button-radius) rounded-(--ui-frame-shape-radius)'
      },
      fixed: {
        base: ''
      }
    }
  }
}
