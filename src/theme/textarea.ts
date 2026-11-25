import { defu } from 'defu'
import type { ModuleOptions } from '../module'
import input from './input'

export default (options: Required<ModuleOptions>) => {
  return defu({
    slots: {
      // Slot buttons sit at the top of the slot, so `--ui-frame-inset` is both the slot's inset and their distance to the field's corner
      leading: 'absolute start-0 inset-y-(--ui-frame-inset) flex items-start [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]',
      trailing: 'absolute end-0 inset-y-(--ui-frame-inset) flex items-start [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]'
    },
    variants: {
      autoresize: {
        true: {
          base: 'resize-none'
        }
      },
      size: {
        xs: {
          leading: 'ps-2 [--ui-frame-inset:--spacing(1)]',
          trailing: 'pe-2 [--ui-frame-inset:--spacing(1)]'
        },
        sm: {
          leading: 'ps-2.5 [--ui-frame-inset:--spacing(1.5)]',
          trailing: 'pe-2.5 [--ui-frame-inset:--spacing(1.5)]'
        },
        md: {
          leading: 'ps-2.5 [--ui-frame-inset:--spacing(1.5)]',
          trailing: 'pe-2.5 [--ui-frame-inset:--spacing(1.5)]'
        },
        lg: {
          leading: 'ps-3 [--ui-frame-inset:--spacing(2)]',
          trailing: 'pe-3 [--ui-frame-inset:--spacing(2)]'
        },
        xl: {
          leading: 'ps-3 [--ui-frame-inset:--spacing(2)]',
          trailing: 'pe-3 [--ui-frame-inset:--spacing(2)]'
        }
      }
    }
  }, input(options))
}
