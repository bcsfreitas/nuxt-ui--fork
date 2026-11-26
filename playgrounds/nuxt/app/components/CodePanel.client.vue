<script setup lang="ts">
import type { HighlighterGeneric } from 'shiki'
import { createHighlighter } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const route = useRoute()
const toast = useToast()
const { toggle } = useCodePanel()

const path = ref('')
const code = ref('')
const saved = ref('')
const loading = ref(false)
const saving = ref(false)

const dirty = computed(() => code.value !== saved.value)

let highlighter: Promise<HighlighterGeneric<any, any>> | undefined
const html = ref('')

function getHighlighter() {
  highlighter ??= createHighlighter({
    langs: ['vue'],
    themes: ['github-light', 'github-dark'],
    engine: createJavaScriptRegexEngine()
  })
  return highlighter
}

watch(code, async (value) => {
  const shiki = await getHighlighter()
  // A trailing space keeps the last empty line as tall as the textarea's
  html.value = shiki.codeToHtml(`${value} `, {
    lang: 'vue',
    themes: { light: 'github-light', dark: 'github-dark' },
    // The playground's dual-theme CSS paints every token with the theme background
    colorReplacements: { 'github-light': { '#fff': 'transparent' }, 'github-dark': { '#24292e': 'transparent' } }
  })
}, { immediate: true })

async function load() {
  if (!route.path.startsWith('/components/')) {
    return
  }

  loading.value = true
  try {
    const result = await $fetch('/api/source', { query: { route: route.path } })
    path.value = result.path
    code.value = result.content
    saved.value = result.content
  } catch {
    path.value = ''
    code.value = ''
    saved.value = ''
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!dirty.value || saving.value) {
    return
  }

  saving.value = true
  const content = code.value
  try {
    await $fetch('/api/source', { method: 'PUT', body: { route: route.path, content } })
    saved.value = content
  } catch (error: any) {
    toast.add({ title: 'Could not save the file', description: error?.data?.message ?? error?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function revert() {
  code.value = saved.value
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    save()
    return
  }

  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    const el = event.target as HTMLTextAreaElement
    el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end')
    code.value = el.value
  }
}

watch(() => route.path, load, { immediate: true })

const removeGuard = useRouter().beforeEach((to, from) => {
  if (dirty.value && to.path !== from.path) {
    return window.confirm('Discard unsaved changes?')
  }
})

onBeforeUnmount(removeGuard)
</script>

<template>
  <UDashboardPanel id="code" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar :ui="{ title: 'font-mono text-sm font-normal truncate' }" :title="path || 'Code'">
        <template #leading>
          <UIcon name="i-lucide-code-xml" class="size-4 text-muted shrink-0" />
        </template>

        <template #right>
          <UBadge v-if="dirty" label="Unsaved" color="warning" variant="subtle" size="sm" />
          <UButton
            v-if="dirty"
            label="Revert"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="revert"
          />
          <UButton
            label="Save"
            size="sm"
            :loading="saving"
            :disabled="!dirty"
            @click="save"
          >
            <template #trailing>
              <UKbd value="meta" size="sm" />
              <UKbd value="s" size="sm" />
            </template>
          </UButton>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Close code panel"
            @click="toggle"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading && !path" class="flex flex-1 items-center justify-center text-sm text-muted">
        Loading…
      </div>

      <div v-else-if="!path" class="flex flex-1 items-center justify-center text-sm text-muted">
        This page has no source file to edit.
      </div>

      <div v-else class="flex-1 overflow-auto bg-default">
        <div class="grid min-w-full w-max font-mono text-xs/5">
          <!-- eslint-disable vue/no-v-html -->
          <div
            aria-hidden="true"
            class="[grid-area:1/1] pointer-events-none [&_pre]:p-4 [&_pre]:bg-transparent! [&_pre]:font-mono"
            v-html="html"
          />
          <!-- eslint-enable vue/no-v-html -->
          <textarea
            v-model="code"
            wrap="off"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            aria-label="Page source code"
            class="[grid-area:1/1] p-4 resize-none overflow-hidden bg-transparent text-transparent caret-(--ui-text-highlighted) outline-none selection:bg-primary/20 whitespace-pre"
            @keydown="onKeydown"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
