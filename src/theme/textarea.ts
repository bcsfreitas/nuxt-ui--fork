import { defu } from 'defu'
import type { ModuleOptions } from '../module'
import input from './input'

export default (options: Required<ModuleOptions>) => {
  return defu({
    slots: {
      // Slot buttons sit at the top of the slot, so `--ui-frame-inset` (the field's `--py`) is both the slot's inset and their distance to the field's corner
      leading: 'absolute start-0 inset-y-(--ui-frame-inset) flex items-start ps-(--ui-field-inset) [--ui-frame-inset:var(--py)] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]',
      trailing: 'absolute end-0 inset-y-(--ui-frame-inset) flex items-start pe-(--ui-field-inset) [--ui-frame-inset:var(--py)] [&_:where(button,a)]:frame-shape-(--ui-button-radius) [&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]'
    },
    variants: {
      autoresize: {
        true: {
          base: 'resize-none'
        }
      }
    }
  }, input(options))
}
