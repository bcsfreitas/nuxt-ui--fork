import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderEach } from '../component-render'
import FieldGroup from '../../src/runtime/components/FieldGroup.vue'
import buttonTheme from '#build/ui/button'
import { UBadge, UInput, UButton, USelect, USelectMenu } from '#components'

describe('FieldGroup', () => {
  const sizes = Object.keys(buttonTheme.variants.size) as any

  renderEach(FieldGroup, [
    // Props
    ['with as', { props: { as: 'section' } }],
    ['with class', { props: { class: 'absolute' } }],
    // Slots
    ['with default slot', {
      slots: {
        default: {
          components: { UInput, UButton },
          template: `<UInput /> <UButton> Click me! </UButton>`
        }
      }
    }],
    ['orientation vertical with default slot', {
      props: { orientation: 'vertical' },
      slots: {
        default: {
          components: { UInput, UButton },
          template: `<UInput /> <UButton> Click me! </UButton>`
        }
      }
    }],
    ['with select and select menu in default slot', {
      slots: {
        default: {
          components: { UButton, USelect, USelectMenu },
          template: `<UButton> Click me! </UButton> <USelect name="select" /> <USelectMenu name="select-menu" />`
        }
      }
    }],
    ['orientation vertical with select and select menu in default slot', {
      props: { orientation: 'vertical' },
      slots: {
        default: {
          components: { UButton, USelect, USelectMenu },
          template: `<UButton> Click me! </UButton> <USelect name="select" /> <USelectMenu name="select-menu" />`
        }
      }
    }],
    ...sizes.map((size: string) =>
      [`with size ${size}`, {
        props: { size },
        slots: {
          default: {
            components: { UInput, UButton },
            template: `<UInput /> <UButton> Click me! </UButton>`
          }
        }
      }]
    )
  ])

  it.each(sizes as string[])('publishes the corner of its size at size %s', async (size) => {
    const wrapper = await mountSuspended(FieldGroup, { props: { size: size as any } })

    const declarations = wrapper.classes().filter(name => name.includes('[--ui-field-group-radius:'))
    expect(declarations).toHaveLength(2)
    expect(declarations).toContain('[--ui-field-group-radius:var(--radius-md)]')
  })

  it.each(['horizontal', 'vertical'])('gives a Badge prefix the group corner in %s orientation', async (orientation) => {
    const wrapper = await mountSuspended(FieldGroup, {
      props: { orientation: orientation as any, size: 'xl' },
      slots: {
        default: {
          components: { UBadge, UInput },
          template: `<UBadge size="lg" label="https://" /> <UInput />`
        } as any
      }
    })

    const classes = wrapper.get('[data-slot="base"]').classes()
    expect(classes).toContain('rounded-(--ui-badge-radius)')
    expect(classes.filter(name => name.includes('[--ui-badge-radius:'))).toEqual([
      '[--ui-badge-radius:var(--ui-field-group-radius,var(--radius-md))]',
      'supports-[height:1lh]:[--ui-badge-radius:var(--ui-field-group-radius,var(--radius-md))]'
    ])
  })

  it('passes accessibility tests', async () => {
    const wrapper = await mountSuspended(FieldGroup, {
      slots: {
        default: {
          template: `<UInput /> <UButton> Click me! </UButton>`
        }
      }
    })

    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
