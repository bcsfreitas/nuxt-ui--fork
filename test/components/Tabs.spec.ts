import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderEach } from '../component-render'
import Tabs from '../../src/runtime/components/Tabs.vue'
import theme from '#build/ui/tabs'

describe('Tabs', () => {
  const variants = Object.keys(theme.variants.variant) as any
  const sizes = Object.keys(theme.variants.size) as any

  const items = [{
    label: 'Tab1',
    avatar: {
      src: 'https://github.com/benjamincanac.png',
      alt: 'Benjamín Canac'
    },
    content: 'This is the content shown for Tab1'
  }, {
    label: 'Tab2',
    icon: 'i-lucide-user',
    content: 'And, this is the content for Tab2'
  }, {
    label: 'Tab3',
    icon: 'i-lucide-bell',
    content: 'Finally, this is the content for Tab3',
    slot: 'custom',
    badge: 'badge'
  }]

  const props = { items }

  renderEach(Tabs, [
    // Props
    ['with items', { props }],
    ['with modelValue', { props: { ...props, modelValue: '1' } }],
    ['with defaultValue', { props: { ...props, defaultValue: '1' } }],
    ['with valueKey', { props: { ...props, valueKey: 'label', defaultValue: 'Tab1' } }],
    ['with labelKey', { props: { ...props, labelKey: 'icon' } }],
    ['with orientation vertical', { props: { ...props, orientation: 'vertical' } }],
    ...sizes.map((size: string) => [`with size ${size}`, { props: { ...props, size } }]),
    ...variants.map((variant: string) => [`with primary variant ${variant}`, { props: { ...props, variant } }]),
    ...variants.map((variant: string) => [`with neutral variant ${variant}`, { props: { ...props, variant, color: 'neutral' } }]),
    ['without content', { props: { ...props, content: false } }],
    ['with unmountOnHide', { props: { ...props, unmountOnHide: false } }],
    ['with as', { props: { ...props, as: 'section' } }],
    ['with class', { props: { ...props, class: 'w-96' } }],
    ['with ui', { props: { ...props, ui: { content: 'w-full ring ring-default' } } }],
    // Slots
    ['with leading slot', { props, slots: { leading: () => 'Leading slot' } }],
    ['with default slot', { props, slots: { default: () => 'Default slot' } }],
    ['with trailing slot', { props, slots: { trailing: () => 'Trailing slot' } }],
    ['with content slot', { props, slots: { content: () => 'Content slot' } }],
    ['with custom slot', { props, slots: { custom: () => 'Custom slot' } }]
  ])

  it('passes accessibility tests', async () => {
    const wrapper = await mountSuspended(Tabs, {
      props: {
        items,
        modelValue: '0'
      }
    })

    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('gives the pill list a soft inset edge', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'pill' } })
    const list = wrapper.find('[data-slot="list"]')

    expect(list.classes()).toEqual(expect.arrayContaining(['ring', 'ring-inset', 'ring-accented']))
  })

  it('keeps the link list without the pill edge', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'link' } })

    expect(wrapper.find('[data-slot="list"]').classes()).not.toContain('ring-accented')
  })

  it('lets ui.list remove the pill edge', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'pill', ui: { list: 'ring-0' } } })
    const classes = wrapper.find('[data-slot="list"]').classes()

    expect(classes).toContain('ring-0')
    expect(classes).not.toContain('ring')
  })

  it.each(sizes as string[])('gives link triggers the shared geometry recipe at size %s', async (size) => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'link', size: size as any } })
    const trigger = wrapper.findAll('[data-slot="trigger"]')[1]!
    const classes = trigger.classes()

    expect(classes).toContain('py-(--py)')
    expect(classes).toContain('px-(--px)')
    expect(classes).toContain('rounded-(--ui-tabs-trigger-radius)')
    expect(classes.some(name => name.startsWith('[--py:'))).toBe(true)
    expect(classes.some(name => name.startsWith('supports-[height:1lh]:[--ui-tabs-trigger-radius:'))).toBe(true)
    expect(trigger.get('[data-slot="leadingIcon"]').classes()).toContain('size-(--ui-control-icon-size)')
  })

  it.each(sizes as string[])('keeps the pill trigger on the concentric segment at size %s', async (size) => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'pill', size: size as any } })
    const trigger = wrapper.findAll('[data-slot="trigger"]')[1]!
    const classes = trigger.classes()

    expect(classes).toContain('rounded-(--ui-frame-shape-radius)')
    expect(classes).toContain('frame-shape-md')
    expect(classes).not.toContain('rounded-(--ui-tabs-trigger-radius)')
    expect(classes).toContain('px-(--px)')
    expect(trigger.get('[data-slot="leadingIcon"]').classes()).toContain('size-(--ui-control-icon-size)')
  })

  it.each([['xs', 4], ['sm', 4], ['md', 5], ['lg', 5], ['xl', 6]])('keeps the upstream icon size as the fallback at size %s', async (size, spacing) => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, size: size as any } })
    const trigger = wrapper.findAll('[data-slot="trigger"]')[1]!

    expect(trigger.classes()).toContain(`[--ui-control-icon-size:--spacing(${spacing})]`)
    expect(trigger.get('[data-slot="leadingIcon"]').classes()).toContain('supports-[height:1lh]:[--ui-control-icon-size:1lh]')
  })

  it('lets a `ui.leadingIcon` size replace the derived icon size', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, ui: { leadingIcon: 'size-3' } } })
    const classes = wrapper.findAll('[data-slot="trigger"]')[1]!.get('[data-slot="leadingIcon"]').classes()

    expect(classes).toContain('size-3')
    expect(classes).not.toContain('size-(--ui-control-icon-size)')
  })

  it.each([['ms-0'], ['ms-4']])('lets a `ui.leadingIcon` margin `%s` replace the icon pull-in', async (margin) => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, ui: { leadingIcon: margin } } })
    const classes = wrapper.findAll('[data-slot="trigger"]')[1]!.get('[data-slot="leadingIcon"]').classes()

    expect(classes.filter(name => /(?:^|:)ms-/.test(name))).toEqual([margin])
  })

  it('lets a consumer `rounded-*` trigger class replace the derived radius', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'link', ui: { trigger: 'rounded-full' } } })
    const classes = wrapper.find('[data-slot="trigger"]').classes()

    expect(classes).toContain('rounded-full')
    expect(classes).not.toContain('rounded-(--ui-tabs-trigger-radius)')
  })

  it('lets a `ui.trigger` padding replace the derived padding', async () => {
    const wrapper = await mountSuspended(Tabs, { props: { ...props, variant: 'link', ui: { trigger: 'px-4' } } })
    const classes = wrapper.find('[data-slot="trigger"]').classes()

    expect(classes).toContain('px-4')
    expect(classes).not.toContain('px-(--px)')
  })
})
