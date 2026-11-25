import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderEach } from '../component-render'
import Badge from '../../src/runtime/components/Badge.vue'
import theme from '#build/ui/badge'

describe('Badge', () => {
  const sizes = Object.keys(theme.variants.size) as any
  const variants = Object.keys(theme.variants.variant) as any

  renderEach(Badge, [
    // Props
    ['with label', { props: { label: 'Badge' } }],
    ...sizes.map((size: string) => [`with size ${size}`, { props: { label: 'Badge', size } }]),
    ...variants.map((variant: string) => [`with primary variant ${variant}`, { props: { label: 'Badge', variant } }]),
    ...variants.map((variant: string) => [`with neutral variant ${variant}`, { props: { label: 'Badge', variant, color: 'neutral' } }]),
    ['with icon', { props: { icon: 'i-lucide-rocket' } }],
    ['with leading and icon', { props: { leading: true, icon: 'i-lucide-arrow-left' } }],
    ['with leadingIcon', { props: { leadingIcon: 'i-lucide-arrow-left' } }],
    ['with trailing and icon', { props: { trailing: true, icon: 'i-lucide-arrow-right' } }],
    ['with trailingIcon', { props: { trailingIcon: 'i-lucide-arrow-right' } }],
    ['with avatar', { props: { avatar: { src: 'https://github.com/benjamincanac.png' } } }],
    ['with avatar and leadingIcon', { props: { avatar: { src: 'https://github.com/benjamincanac.png' }, leadingIcon: 'i-lucide-arrow-left' } }],
    ['with avatar and trailingIcon', { props: { avatar: { src: 'https://github.com/benjamincanac.png' }, trailingIcon: 'i-lucide-arrow-right' } }],
    ['with square', { props: { label: 'Badge', square: true } }],
    ['with as', { props: { label: 'Badge', as: 'div' } }],
    ['with class', { props: { label: 'Badge', class: 'rounded-full font-bold' } }],
    ['with ui', { props: { label: 'Badge', ui: { label: 'font-bold' } } }],
    // Slots
    ['with default slot', { slots: { default: () => 'Default slot' } }],
    ['with leading slot', { slots: { leading: () => 'Leading slot' } }],
    ['with trailing slot', { slots: { trailing: () => 'Trailing slot' } }]
  ])

  it('passes accessibility tests', async () => {
    const wrapper = await mountSuspended(Badge, {
      props: {
        label: 'Badge',
        icon: 'i-lucide-rocket',
        leadingIcon: 'i-lucide-arrow-left',
        trailingIcon: 'i-lucide-arrow-right',
        avatar: { src: 'https://github.com/benjamincanac.png' }
      }
    })

    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it.each(sizes as string[])('carries the shared geometry recipe at size %s', async (size) => {
    const wrapper = await mountSuspended(Badge, { props: { label: 'Badge', size: size as any, icon: 'i-lucide-rocket', trailingIcon: 'i-lucide-arrow-right' } })

    const classes = wrapper.classes()
    expect(classes).toContain('py-(--py)')
    expect(classes).toContain('px-(--px)')
    expect(classes).toContain('rounded-(--ui-badge-radius)')
    expect(classes.filter(name => name.startsWith('[--py:'))).toHaveLength(1)
    // The size's own fallback padding and the optical one both survive the merge
    expect(classes.filter(name => name.startsWith('[--px:--spacing('))).toHaveLength(1)
    expect(classes).toContain('supports-[(height:1cap)_and_(height:1lh)]:[--px:calc(var(--py)_+_(1lh_-_1cap)_/_2)]')
    expect(classes.some(name => name.startsWith('supports-[height:1lh]:[--ui-badge-radius:'))).toBe(true)
    expect(wrapper.get('[data-slot="leadingIcon"]').classes()).toContain('size-[1lh]')
    expect(wrapper.get('[data-slot="trailingIcon"]').classes()).toContain('size-[1lh]')
  })

  it.each([['xs', 'sm'], ['sm', 'sm'], ['md', 'md'], ['lg', 'md'], ['xl', 'md']])('keeps the upstream corner as the fallback at size %s', async (size, radius) => {
    const wrapper = await mountSuspended(Badge, { props: { label: 'Badge', size: size as any } })

    const fallbacks = wrapper.classes().filter(name => name.startsWith('[--ui-badge-radius:'))
    expect(fallbacks).toEqual([`[--ui-badge-radius:var(--radius-${radius})]`])
  })

  it.each([['xs', 4], ['sm', 4], ['md', 4], ['lg', 5], ['xl', 5]])('sizes the avatar to the line height at size %s, upstream size as the fallback', async (size, spacing) => {
    const wrapper = await mountSuspended(Badge, { props: { label: 'Badge', size: size as any, avatar: { src: 'https://github.com/benjamincanac.png' } } })

    const classes = wrapper.get('[data-slot="leadingAvatar"]').classes()
    expect(classes).toContain('size-(--ui-badge-avatar-size)')
    expect(classes).toContain('supports-[height:1lh]:[--ui-badge-avatar-size:1lh]')
    expect(classes).toContain(`[--ui-badge-avatar-size:--spacing(${spacing})]`)
    expect(classes.filter(name => /^size-\d/.test(name))).toEqual([])
  })

  it('uses the block padding inline when square', async () => {
    const wrapper = await mountSuspended(Badge, { props: { icon: 'i-lucide-rocket', square: true } })

    const classes = wrapper.classes()
    expect(classes).toContain('[--px:var(--py)]')
    expect(classes).toContain('supports-[(height:1cap)_and_(height:1lh)]:[--px:var(--py)]')
    expect(classes.some(name => name.startsWith('[--px:--spacing('))).toBe(false)
  })

  it('lets a consumer `rounded-*` class replace the derived radius', async () => {
    const wrapper = await mountSuspended(Badge, { props: { label: 'Badge', class: 'rounded-full' } })

    const classes = wrapper.classes()
    expect(classes).toContain('rounded-full')
    expect(classes).not.toContain('rounded-(--ui-badge-radius)')
  })

  it('lets a `ui.base` padding replace the derived padding', async () => {
    const wrapper = await mountSuspended(Badge, { props: { label: 'Badge', ui: { base: 'px-4' } } })

    const classes = wrapper.classes()
    expect(classes).toContain('px-4')
    expect(classes).not.toContain('px-(--px)')
  })
})
