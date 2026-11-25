import { describe, it, expect, test } from 'vitest'
import { axe } from 'vitest-axe'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderEach } from '../component-render'
import { flushPromises, mount } from '@vue/test-utils'
import Textarea from '../../src/runtime/components/Textarea.vue'
import UButton from '../../src/runtime/components/Button.vue'
import theme from '#build/ui/textarea'
import { renderForm } from '../utils/form'
import type { FormInputEvents } from '../../src/module'

describe('Textarea', () => {
  const sizes = Object.keys(theme.variants.size) as any
  const variants = Object.keys(theme.variants.variant) as any

  renderEach(Textarea, [
    // Props
    ['with id', { props: { id: 'id' } }],
    ['with name', { props: { name: 'name' } }],
    ['with placeholder', { props: { placeholder: 'Search...' } }],
    ['with required', { props: { required: true } }],
    ['with disabled', { props: { disabled: true } }],
    ['with rows', { props: { rows: 5 } }],
    ['with autoresize', { props: { autoresize: true } }],
    ['with icon', { props: { icon: 'i-lucide-search' } }],
    ['with leading and icon', { props: { leading: true, icon: 'i-lucide-arrow-left' } }],
    ['with leadingIcon', { props: { leadingIcon: 'i-lucide-arrow-left' } }],
    ['with trailing and icon', { props: { trailing: true, icon: 'i-lucide-arrow-right' } }],
    ['with trailingIcon', { props: { trailingIcon: 'i-lucide-arrow-right' } }],
    ['with avatar', { props: { avatar: { src: 'https://github.com/benjamincanac.png' } } }],
    ['with avatar and leadingIcon', { props: { avatar: { src: 'https://github.com/benjamincanac.png' }, leadingIcon: 'i-lucide-arrow-left' } }],
    ['with avatar and trailingIcon', { props: { avatar: { src: 'https://github.com/benjamincanac.png' }, trailingIcon: 'i-lucide-arrow-right' } }],
    ['with loading', { props: { loading: true } }],
    ['with loading and avatar', { props: { loading: true, avatar: { src: 'https://github.com/benjamincanac.png' } } }],
    ['with loading trailing', { props: { loading: true, trailing: true } }],
    ['with loading trailing and avatar', { props: { loading: true, trailing: true, avatar: { src: 'https://github.com/benjamincanac.png' } } }],
    ['with loadingIcon', { props: { loading: true, loadingIcon: 'i-lucide-loader' } }],
    ...sizes.map((size: string) => [`with size ${size}`, { props: { size } }]),
    ...variants.map((variant: string) => [`with primary variant ${variant}`, { props: { variant } }]),
    ...variants.map((variant: string) => [`with primary variant ${variant} highlight`, { props: { variant, highlight: true } }]),
    ...variants.map((variant: string) => [`with neutral variant ${variant}`, { props: { variant, color: 'neutral' } }]),
    ...variants.map((variant: string) => [`with neutral variant ${variant} highlight`, { props: { variant, color: 'neutral', highlight: true } }]),
    ['with ariaLabel', { attrs: { 'aria-label': 'Aria label' } }],
    ['with as', { props: { as: 'section' } }],
    ['with class', { props: { class: 'w-48' } }],
    ['with ui', { props: { ui: { wrapper: 'ms-4' } } }],
    // Slots
    ['with default slot', { slots: { default: () => 'Default slot' } }],
    ['with leading slot', { slots: { leading: () => 'Leading slot' } }],
    ['with trailing slot', { slots: { trailing: () => 'Trailing slot' } }]
  ])

  describe('slot buttons', () => {
    async function mountWithSlotButtons(props: Record<string, any> = {}) {
      return mountSuspended({
        components: { UButton, UTextarea: Textarea },
        setup: () => ({ props }),
        template: `<UTextarea v-bind="props"><template #leading><UButton icon="i-lucide-plus" size="sm" /></template><template #trailing><UButton icon="i-lucide-x" size="sm" class="rounded-full" /></template></UTextarea>`
      })
    }

    it('publishes the field radius as the frame', async () => {
      const wrapper = await mountWithSlotButtons()

      expect(wrapper.get('[data-slot="root"]').classes()).toContain('[--ui-frame-radius:var(--radius-md)]')
    })

    it('hands the concentric radius to buttons in the leading and trailing slots', async () => {
      const wrapper = await mountWithSlotButtons()

      for (const slot of ['leading', 'trailing']) {
        expect(wrapper.get(`[data-slot="${slot}"]`).classes()).toEqual(expect.arrayContaining(['[&_:where(button,a)]:frame-shape-(--ui-button-radius)', '[&_:where(button,a)]:[--ui-button-frame-radius:var(--ui-frame-shape-radius)]']))
      }
    })

    it('lets a consumer radius class win on a slot button', async () => {
      const wrapper = await mountWithSlotButtons()
      const button = wrapper.get('[data-slot="trailing"] button')

      expect(button.classes()).toContain('rounded-full')
      expect(button.classes().join(' ')).not.toContain('--ui-button-frame-radius')
    })

    test.each([
      ['xs', '[--ui-frame-inset:var(--py)]'],
      ['sm', '[--ui-frame-inset:var(--py)]'],
      ['md', '[--ui-frame-inset:var(--py)]'],
      ['lg', '[--ui-frame-inset:var(--py)]'],
      ['xl', '[--ui-frame-inset:var(--py)]']
    ])('insets slot buttons from the top edge at size %s', async (size, inset) => {
      const wrapper = await mountWithSlotButtons({ size })

      for (const slot of ['leading', 'trailing']) {
        const classes = wrapper.get(`[data-slot="${slot}"]`).classes()

        expect(classes).toContain(inset)
        expect(classes).toContain('inset-y-(--ui-frame-inset)')
        expect(classes.filter(cls => cls.startsWith('inset-y-'))).toHaveLength(1)
      }
    })

    test('a consumer inset moves the slot and the button curve together', async () => {
      const wrapper = await mountWithSlotButtons({ ui: { leading: '[--ui-frame-inset:--spacing(3)]' } })
      const classes = wrapper.get('[data-slot="leading"]').classes()

      expect(classes).toContain('[--ui-frame-inset:--spacing(3)]')
      expect(classes).not.toContain('[--ui-frame-inset:var(--py)]')
      expect(classes).toContain('inset-y-(--ui-frame-inset)')
    })
  })

  it.each(sizes as string[])('carries the shared geometry recipe at size %s', async (size) => {
    const wrapper = await mountSuspended(Textarea, { props: { icon: 'i-lucide-search', size: size as any } })

    const frame = wrapper.classes()
    expect(frame.some(name => name.startsWith('[--py:'))).toBe(true)
    expect(frame).toContain('supports-[height:1lh]:[--ui-frame-radius:min(var(--ui-radius)_*_100,_var(--ui-radius)_+_(1lh_-_1rem)_/_4_+_var(--py))]')
    expect(wrapper.get('[data-slot="base"]').classes()).toEqual(expect.arrayContaining(['py-(--py)', 'px-(--px)', 'rounded-(--ui-frame-radius)', 'ps-(--ui-field-icon-padding)']))
    expect(wrapper.get('[data-slot="leading"]').classes()).toContain('ps-(--ui-field-inset)')
    expect(wrapper.get('[data-slot="leadingIcon"]').classes()).toContain('size-(--ui-control-icon-size)')
    expect(wrapper.get('[data-slot="leading"]').classes()).toContain('[--ui-frame-inset:var(--py)]')
  })

  it('lets a consumer `rounded-*` / padding class replace the derived geometry', async () => {
    const wrapper = await mountSuspended(Textarea, { props: { ui: { base: 'rounded-full px-4' } } })

    const classes = wrapper.get('[data-slot="base"]').classes()
    expect(classes).toEqual(expect.arrayContaining(['rounded-full', 'px-4']))
    expect(classes).not.toContain('rounded-(--ui-frame-radius)')
    expect(classes).not.toContain('px-(--px)')
  })

  it('keeps the resize handle corner at `rounded-md` while resizable', async () => {
    const wrapper = await mountSuspended(Textarea)

    const classes = wrapper.get('[data-slot="base"]').classes()
    expect(classes).toEqual(expect.arrayContaining([
      'rounded-(--ui-frame-radius)',
      'rounded-ee-(--ui-textarea-resize-radius)',
      '[--ui-textarea-resize-radius:min(var(--ui-frame-radius),var(--radius-md))]',
      '[&.resize-none]:[--ui-textarea-resize-radius:var(--ui-frame-radius)]'
    ]))
  })

  it('keeps the full corner with autoresize', async () => {
    const wrapper = await mountSuspended(Textarea, { props: { autoresize: true } })

    const classes = wrapper.get('[data-slot="base"]').classes()
    expect(classes).toContain('resize-none')
    expect(classes.some(name => name.includes('rounded-ee-'))).toBe(false)
  })

  it('lets a consumer `rounded-*` class replace the resize handle corner', async () => {
    const wrapper = await mountSuspended(Textarea, { props: { ui: { base: 'rounded-full' } } })

    const classes = wrapper.get('[data-slot="base"]').classes()
    expect(classes.filter(name => /(^|:)rounded-/.test(name))).toEqual(['rounded-full'])
  })

  it('passes accessibility tests', async () => {
    const wrapper = await mountSuspended(Textarea, {
      props: {
        placeholder: 'Placeholder',
        leadingIcon: 'i-lucide-user',
        trailingIcon: 'i-lucide-check',
        rows: 5,
        required: true
      }
    })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  renderEach(
    Textarea,
    [
      ['with .trim modifier', { props: { modelModifiers: { trim: true } } }, { input: 'input  ', expected: 'input' }],
      ['with .number modifier', { props: { modelModifiers: { number: true } } }, { input: '42', expected: 42 }],
      ['with .lazy modifier', { props: { modelModifiers: { lazy: true } } }, { input: 'input', expected: 'input' }],
      ['with .nullable modifier', { props: { modelModifiers: { nullable: true } } }, { input: '', expected: null }],
      ['with .optional modifier', { props: { modelModifiers: { optional: true } } }, { input: '', expected: undefined }],
      ['with .number and .nullable modifiers', { props: { modelModifiers: { number: true, nullable: true } } }, { input: '0', expected: 0 }],
      ['with .number and .optional modifiers', { props: { modelModifiers: { number: true, optional: true } } }, { input: '0', expected: 0 }],
      ['with .number and .nullable modifiers on an empty value', { props: { modelModifiers: { number: true, nullable: true } } }, { input: '', expected: null }],
      ['with .number and .optional modifiers on an empty value', { props: { modelModifiers: { number: true, optional: true } } }, { input: '', expected: undefined }]
    ],
    '%s works',
    async (_, options, spec) => {
      const wrapper = mount(Textarea, {
        ...options
      })

      const input = wrapper.find('textarea')
      await input.setValue(spec.input)

      expect(wrapper.emitted()).toMatchObject({ 'update:modelValue': [[spec.expected]] })
    }
  )

  test('with .lazy modifier updates on change only', async () => {
    const wrapper = mount(Textarea, {
      props: {
        modelModifiers: { lazy: true }
      }
    })

    const input = wrapper.find('textarea')
    await input.trigger('update')
    expect(wrapper.emitted()).toMatchObject({ })

    await input.trigger('change')
    expect(wrapper.emitted()).toMatchObject({ 'update:modelValue': [['']] })
  })

  describe('emits', () => {
    test('update:modelValue event', async () => {
      const wrapper = mount(Textarea)

      const input = wrapper.find('textarea')
      await input.setValue('bob@dylan.com')

      expect(wrapper.emitted()).toMatchObject({ 'update:modelValue': [['bob@dylan.com']] })
    })

    test('change event', async () => {
      const wrapper = mount(Textarea)

      const input = wrapper.find('textarea')
      await input.setValue('bob@dylan.com')

      expect(wrapper.emitted()).toMatchObject({ change: [[{ type: 'change' }]] })
    })

    test('blur event', async () => {
      const wrapper = mount(Textarea)
      const input = wrapper.find('textarea')
      await input.trigger('blur')
      expect(wrapper.emitted()).toMatchObject({ blur: [[{ type: 'blur' }]] })
    })
  })

  describe('form integration', async () => {
    async function createForm(validateOn?: FormInputEvents[], eagerValidation?: boolean) {
      const wrapper = await renderForm({
        props: {
          validateOn,
          validateOnInputDelay: 0,
          async validate(state: any) {
            if (state.value !== 'valid')
              return [{ name: 'value', message: 'Error message' }]
            return []
          }
        },
        slotTemplate: `
        <UFormField name="value" :eager-validation="eagerValidation">
          <UTextarea id="input" v-model="state.value" />
        </UFormField>
        `,
        slotVars: {
          eagerValidation
        }
      })
      const input = wrapper.find('#input')
      return {
        wrapper,
        input
      }
    }

    test('validate on blur works', async () => {
      const { input, wrapper } = await createForm(['blur'])
      await input.trigger('blur')
      await flushPromises()
      expect(wrapper.text()).toContain('Error message')

      await input.setValue('valid')
      await input.trigger('blur')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Error message')
    })

    test('validate on change works', async () => {
      const { input, wrapper } = await createForm(['change'])
      await input.trigger('change')
      await flushPromises()
      expect(wrapper.text()).toContain('Error message')

      input.setValue('valid')
      await input.trigger('change')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Error message')
    })

    test('validate on input works', async () => {
      const { input, wrapper } = await createForm(['input'], true)
      await input.setValue('value')
      await flushPromises()
      expect(wrapper.text()).toContain('Error message')

      await input.setValue('valid')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Error message')
    })

    test('validate on input without eager validation works', async () => {
      const { input, wrapper } = await createForm(['input'])

      await input.setValue('value')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Error message')

      await input.trigger('blur')

      await input.setValue('value')
      await flushPromises()
      expect(wrapper.text()).toContain('Error message')

      await input.setValue('valid')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Error message')
    })
  })
})
