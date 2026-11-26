<script setup lang="ts">
import { useClipboard, useEventListener } from '@vueuse/core'
import { useColorMode, useRoute } from '#imports'
import { serializeElementForPaper } from '../utils/paper-serialize'

interface Instance {
  type?: { __name?: string, name?: string, __file?: string }
  subTree?: { el?: unknown, children?: unknown }
  parent?: Instance | null
}

interface Target {
  element: HTMLElement | SVGElement
  name?: string
}

const AREA_SELECTOR = '[data-copy-element-area]'
const SWITCH_DELAY = 150
const HIDE_DELAY = 300

const route = useRoute()
const colorMode = useColorMode()
const toast = useToast()
const { copy } = useClipboard({ legacy: true })

const active = computed(() => route.path.startsWith('/components/'))
const target = shallowRef<Target>()
const rect = ref<DOMRect>()
const button = useTemplateRef<{ $el: HTMLElement }>('button')

let pending: ReturnType<typeof setTimeout> | undefined

function isElement(value: unknown): value is HTMLElement | SVGElement {
  return value instanceof HTMLElement || value instanceof SVGElement
}

function isLibraryComponent(instance: Instance) {
  return /[\\/]runtime[\\/]components[\\/]/.test(instance.type?.__file ?? '')
}

function rootElement(instance: Instance) {
  const el = instance.subTree?.el
  if (isElement(el)) {
    return el
  }
  const children = instance.subTree?.children
  if (Array.isArray(children)) {
    return children.map(child => (child as { el?: unknown })?.el).find(isElement)
  }
  return undefined
}

function resolveTarget(hovered: Element, area: Element): Target | undefined {
  let found: Target | undefined
  let instance = (hovered as unknown as { __vueParentComponent?: Instance }).__vueParentComponent
  for (; instance; instance = instance.parent ?? undefined) {
    const name = instance.type?.__name || instance.type?.name
    if (name === 'Navbar' && !isLibraryComponent(instance)) {
      return undefined
    }
    if (!isLibraryComponent(instance)) {
      continue
    }
    const element = rootElement(instance)
    if (!element || element === area || !area.contains(element) || !element.contains(hovered)) {
      continue
    }
    found = { element, name }
  }
  if (found) {
    return found
  }

  const slotted = hovered.closest('[data-slot]')
  if (isElement(slotted) && slotted !== area && area.contains(slotted)) {
    return { element: slotted }
  }
  return undefined
}

function measure() {
  if (target.value && !target.value.element.isConnected) {
    target.value = undefined
  }
  rect.value = target.value?.element.getBoundingClientRect()
}

function show(next: Target | undefined) {
  clearTimeout(pending)
  pending = undefined
  target.value = next
  measure()
}

function onPointerMove(event: PointerEvent) {
  const hovered = event.target
  if (!active.value || !(hovered instanceof Element)) {
    return
  }
  if (button.value?.$el.contains(hovered)) {
    clearTimeout(pending)
    pending = undefined
    return
  }

  const area = hovered.closest(AREA_SELECTOR)
  const next = area ? resolveTarget(hovered, area) : undefined
  if (next?.element === target.value?.element) {
    clearTimeout(pending)
    pending = undefined
    return
  }
  if (!target.value) {
    show(next)
    return
  }
  clearTimeout(pending)
  pending = setTimeout(() => show(next), next ? SWITCH_DELAY : HIDE_DELAY)
}

useEventListener(document, 'pointermove', onPointerMove, { passive: true })
useEventListener(window, 'scroll', measure, { capture: true, passive: true })
useEventListener(window, 'resize', measure, { passive: true })

watch(() => route.path, () => show(undefined))

onBeforeUnmount(() => clearTimeout(pending))

const outlineStyle = computed(() => rect.value && {
  top: `${rect.value.top - 2}px`,
  left: `${rect.value.left - 2}px`,
  width: `${rect.value.width + 4}px`,
  height: `${rect.value.height + 4}px`
})

const buttonStyle = computed(() => {
  if (!rect.value) {
    return undefined
  }
  const area = document.querySelector(AREA_SELECTOR)?.getBoundingClientRect()
  const above = !area || rect.value.top - 32 >= area.top
  const rtl = document.documentElement.dir === 'rtl'
  return {
    top: above ? `${rect.value.top - 4}px` : `${rect.value.bottom + 4}px`,
    left: rtl ? `${rect.value.left}px` : `${rect.value.right}px`,
    transform: `translate(${rtl ? '0' : '-100%'}, ${above ? '-100%' : '0'})`
  }
})

async function copyTarget() {
  const current = target.value
  if (!current?.element.isConnected) {
    return
  }

  try {
    const result = serializeElementForPaper(current.element, colorMode.value === 'dark' ? 'dark' : 'light', { layerName: current.name })
    if (!result.html) {
      toast.add({ title: 'Nothing to copy', description: 'This element has no visible content.', icon: 'i-lucide-circle-alert', color: 'warning' })
      return
    }
    await copy(result.html)
    const literals = result.unmapped.length
    toast.add({
      title: 'Copied for Paper',
      description: literals ? `${literals} ${literals === 1 ? 'value has' : 'values have'} no token and stayed literal.` : 'Paste it into a Paper file.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error) {
    toast.add({ title: 'Copy failed', description: error instanceof Error ? error.message : String(error), icon: 'i-lucide-circle-x', color: 'error' })
  }
}
</script>

<template>
  <Teleport to="body">
    <template v-if="active && target && rect">
      <div
        data-copy-element-overlay
        class="fixed z-50 pointer-events-none rounded-xs ring-1 ring-primary"
        :style="outlineStyle"
      />

      <UButton
        ref="button"
        data-copy-element-overlay
        size="xs"
        icon="i-lucide-copy"
        label="Copy raw element"
        class="fixed z-50 shadow-sm"
        :style="buttonStyle"
        @click="copyTarget"
      />
    </template>
  </Teleport>
</template>
