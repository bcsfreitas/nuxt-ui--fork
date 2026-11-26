<script setup lang="ts">
import type { Component } from 'vue'
import type { PaperTokenMode } from '../utils/paper-tokens'
import { compile, defineComponent, markRaw } from 'vue'
import { useClipboard, watchDebounced } from '@vueuse/core'
import { serializeForPaper } from '../utils/paper-serialize'

const DEFAULT_CODE = `<div class="flex flex-col gap-4 p-6 rounded-lg bg-elevated ring ring-default max-w-sm">
  <div class="flex items-center justify-between gap-2">
    <h3 class="text-lg font-semibold text-highlighted">Project settings</h3>
    <UBadge label="New" color="success" variant="subtle" />
  </div>
  <p class="text-sm text-muted">Paste any template with Tailwind classes and Nuxt UI components.</p>
  <div class="flex items-center gap-2">
    <UButton label="Save" icon="i-lucide-check" />
    <UButton label="Cancel" color="neutral" variant="outline" />
  </div>
</div>`

const colorMode = useColorMode()
const toast = useToast()
const { copy } = useClipboard()

const code = ref(DEFAULT_CODE)
const tokenMode = ref<PaperTokenMode>('light')
const preview = shallowRef<Component>()
const previewRoot = useTemplateRef<HTMLElement>('previewRoot')
const output = ref('')
const unmapped = ref<string[]>([])
const compileError = ref('')
const runtimeError = ref('')
const cssWarning = ref('')
const unknownComponents = ref<string[]>([])

const tokenModes = [{ label: 'Light tokens', value: 'light' }, { label: 'Dark tokens', value: 'dark' }]
const modeMismatch = computed(() => tokenMode.value === 'light' && colorMode.value === 'dark')

// Nuxt UI components by tag name, loaded on demand: the pasted template is compiled at runtime
const loaders = Object.fromEntries(Object.entries(import.meta.glob<{ default: Component }>('#ui/components/*.vue'))
  .map(([file, loader]) => [`U${file.split('/').pop()!.replace(/\.vue$/, '')}`, loader]))

let styleElement: HTMLStyleElement | undefined
let runId = 0

function extractTemplate(source: string) {
  const trimmed = source.trim()
  const wrapped = trimmed.match(/^<template(?:\s[^>]*)?>([\s\S]*)<\/template>$/i)
  return (wrapped ? wrapped[1]! : trimmed).trim()
}

function componentTags(template: string) {
  const tags = [...template.matchAll(/<([a-z][\w-]*)/gi)].map(match => match[1]!.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''))
  return [...new Set(tags.filter(tag => /^U[A-Z]/.test(tag)))]
}

async function loadComponents(tags: string[]) {
  const entries = await Promise.all(tags.filter(tag => loaders[tag]).map(async tag => [tag, (await loaders[tag]!()).default] as const))
  return Object.fromEntries(entries)
}

function buildComponent(template: string, components: Record<string, Component>): Component {
  if (/<script[\s>]/i.test(template)) {
    throw new Error('Only templates are supported: remove the <script> block.')
  }

  const errors: string[] = []
  const render = compile(template, {
    onError: error => errors.push(error.message)
  })
  if (errors.length) {
    throw new Error(errors.join('\n'))
  }

  return markRaw(defineComponent({ name: 'PaperPreview', components, render }))
}

function candidatesOf(source: string) {
  return [...new Set(source.split(/[\s"'`<>={}]+/).filter(candidate => candidate && candidate.length <= 200))].slice(0, 5000)
}

async function loadCss(source: string) {
  const { css } = await $fetch<{ css: string }>('/api/paper-css', {
    method: 'POST',
    body: { candidates: candidatesOf(source) }
  })
  if (styleElement) {
    styleElement.textContent = css
  }
}

function waitFrame() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

async function waitForIcons(root: HTMLElement) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const pending = [...root.querySelectorAll('.iconify')].some(icon => !getComputedStyle(icon).getPropertyValue('mask-image').includes('url('))
    if (!pending) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function refreshOutput(id = runId) {
  await nextTick()
  await waitFrame()
  await document.fonts.ready
  if (previewRoot.value) {
    await waitForIcons(previewRoot.value)
  }
  if (id !== runId || !previewRoot.value || compileError.value) {
    return
  }

  try {
    const result = serializeForPaper(previewRoot.value, tokenMode.value)
    output.value = result.html
    unmapped.value = result.unmapped
  } catch (error) {
    runtimeError.value = `Export failed: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function run() {
  const id = ++runId
  const template = extractTemplate(code.value)
  runtimeError.value = ''
  const tags = componentTags(template)
  unknownComponents.value = tags.filter(tag => !loaders[tag])

  let component: Component
  try {
    const components = await loadComponents(tags)
    if (id !== runId) {
      return
    }
    component = buildComponent(template, components)
    compileError.value = ''
  } catch (error) {
    compileError.value = error instanceof Error ? error.message : String(error)
    return
  }

  try {
    await loadCss(template)
    cssWarning.value = ''
  } catch (error) {
    cssWarning.value = `Classes used only here may have no CSS: ${error instanceof Error ? error.message : String(error)}`
  }
  if (id !== runId) {
    return
  }

  preview.value = component
  await refreshOutput(id)
}

async function copyOutput() {
  await copy(output.value)
  toast.add({ title: 'Copied for Paper', description: 'Paste it into a Paper file.', icon: 'i-lucide-check', color: 'success' })
}

onErrorCaptured((error) => {
  runtimeError.value = error instanceof Error ? error.message : String(error)
  return false
})

onMounted(() => {
  tokenMode.value = colorMode.value === 'dark' ? 'dark' : 'light'
  styleElement = document.createElement('style')
  styleElement.id = 'paper-css'
  document.head.appendChild(styleElement)
  run()
})

onBeforeUnmount(() => {
  styleElement?.remove()
})

watchDebounced(code, run, { debounce: 400 })
watch(() => colorMode.value, (value) => {
  tokenMode.value = value === 'dark' ? 'dark' : 'light'
})
watch(tokenMode, () => refreshOutput())
</script>

<template>
  <ClientOnly>
    <div class="grid w-full gap-4 self-stretch p-4 xl:grid-cols-3">
      <section class="flex min-w-0 flex-col gap-2">
        <h2 class="text-sm font-medium text-highlighted">
          Code
        </h2>

        <UTextarea
          v-model="code"
          autoresize
          :rows="16"
          spellcheck="false"
          aria-label="Template code"
          class="w-full"
          :ui="{ base: 'font-mono text-xs' }"
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-medium text-highlighted">
            Preview
          </h2>

          <UButton
            label="Refresh"
            icon="i-lucide-refresh-cw"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="run"
          />
        </div>

        <UAlert
          v-if="compileError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-x"
          title="Template error"
          :description="compileError"
        />
        <UAlert
          v-if="runtimeError"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Render error"
          :description="runtimeError"
        />
        <UAlert
          v-if="cssWarning"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Tailwind"
          :description="cssWarning"
        />
        <UAlert
          v-if="unknownComponents.length"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Unknown components"
          :description="unknownComponents.join(', ')"
        />

        <div ref="previewRoot" :class="[tokenMode, 'rounded-lg bg-default p-4 text-default ring ring-default']">
          <component :is="preview" v-if="preview" />
        </div>

        <p v-if="modeMismatch" class="text-xs text-muted">
          The page is in dark mode: `dark:` classes in the pasted code still apply to the light preview.
        </p>
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-medium text-highlighted">
            Paper HTML
          </h2>

          <div class="flex items-center gap-2">
            <UTabs v-model="tokenMode" :items="tokenModes" :content="false" size="xs" />
            <UButton label="Copy for Paper" icon="i-lucide-copy" size="sm" :disabled="!output" @click="copyOutput" />
          </div>
        </div>

        <pre class="max-h-[70vh] overflow-auto rounded-lg bg-elevated/50 p-3 font-mono text-xs whitespace-pre text-default ring ring-default">{{ output }}</pre>

        <UAlert
          v-if="unmapped.length"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="Literal values (no matching token)"
          :description="unmapped.join(' · ')"
        />
      </section>
    </div>
  </ClientOnly>
</template>
