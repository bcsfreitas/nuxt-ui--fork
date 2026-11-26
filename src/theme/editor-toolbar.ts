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
      // Raised like the dark Card: elevated background and accented hairline in dark; inside it, `elevated` hovers move one step up
      bubble: {
        base: 'bg-(--ui-toolbar-bg) border border-(--ui-toolbar-border) [--ui-toolbar-bg:var(--ui-bg)] [--ui-toolbar-border:var(--ui-border)] dark:[--ui-toolbar-bg:var(--ui-bg-elevated)] dark:[--ui-toolbar-border:var(--ui-border-accented)] rounded-(--ui-frame-radius) [--ui-frame-radius:var(--radius-xl)] p-1 [--ui-frame-inset:calc(--spacing(1)+1px)]',
        group: 'dark:[--ui-bg-elevated:var(--ui-bg-accented)]',
        item: 'frame-shape-(--ui-button-radius) rounded-(--ui-frame-shape-radius)'
      },
      floating: {
        base: 'bg-(--ui-toolbar-bg) border border-(--ui-toolbar-border) [--ui-toolbar-bg:var(--ui-bg)] [--ui-toolbar-border:var(--ui-border)] dark:[--ui-toolbar-bg:var(--ui-bg-elevated)] dark:[--ui-toolbar-border:var(--ui-border-accented)] rounded-(--ui-frame-radius) [--ui-frame-radius:var(--radius-xl)] p-1 [--ui-frame-inset:calc(--spacing(1)+1px)]',
        group: 'dark:[--ui-bg-elevated:var(--ui-bg-accented)]',
        item: 'frame-shape-(--ui-button-radius) rounded-(--ui-frame-shape-radius)'
      },
      fixed: {
        base: ''
      }
    }
  }
}
