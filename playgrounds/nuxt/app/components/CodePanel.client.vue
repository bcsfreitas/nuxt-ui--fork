<script setup lang="ts">
import type { HighlighterGeneric } from 'shiki'
import type { TabsItem } from '@nuxt/ui'
import { createHighlighter } from 'shiki'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

type SourceKind = 'page' | 'component' | 'theme'

const kinds: SourceKind[] = ['page', 'component', 'theme']
const labels: Record<SourceKind, string> = { page: 'Page', component: 'Component', theme: 'Theme' }

interface SourceFile {
  path: string
  code: string
  saved: string
}

interface HomeFileItem {
  label: string
  value: string
}

const route = useRoute()
const toast = useToast()
const { toggle, homeFile } = useCodePanel()

const tab = useCookie<SourceKind>('code-panel-tab', { default: () => 'page' })
const files = reactive<Record<SourceKind, SourceFile>>({
  page: { path: '', code: '', saved: '' },
  component: { path: '', code: '', saved: '' },
  theme: { path: '', code: '', saved: '' }
})
const home = reactive<SourceFile>({ path: '', code: '', saved: '' })
const homeFiles = ref<HomeFileItem[]>([])
const loading = ref(false)
const saving = ref(false)

const isHome = computed(() => route.path === '/')
const active = computed(() => isHome.value ? home : files[tab.value])
const isDirty = (kind: SourceKind) => files[kind].code !== files[kind].saved
const isHomeDirty = () => home.code !== home.saved
const dirty = computed(() => isHome.value ? isHomeDirty() : isDirty(tab.value))
const lang = computed(() => !isHome.value && tab.value === 'theme' ? 'ts' : 'vue')
const label = computed(() => isHome.value ? homeFiles.value.find(item => item.value === homeFile.value)?.label ?? 'Home' : labels[tab.value])

const tabs = computed<TabsItem[]>(() => kinds.map(kind => ({ label: labels[kind], value: kind, disabled: !files[kind].path })))

let highlighter: Promise<HighlighterGeneric<any, any>> | undefined
const html = ref('')

function getHighlighter() {
  highlighter ??= createHighlighter({
    langs: ['vue', 'ts'],
    themes: ['github-light', 'github-dark'],
    engine: createJavaScriptRegexEngine()
  })
  return highlighter
}

watch([() => active.value.code, lang], async ([value, language]) => {
  const shiki = await getHighlighter()
  // A trailing space keeps the last empty line as tall as the textarea's
  html.value = shiki.codeToHtml(`${value} `, {
    lang: language,
    themes: { light: 'github-light', dark: 'github-dark' },
    // The playground's dual-theme CSS paints every token with the theme background
    colorReplacements: { 'github-light': { '#fff': 'transparent' }, 'github-dark': { '#24292e': 'transparent' } }
  })
}, { immediate: true })

async function loadFile(kind: SourceKind) {
  try {
    const result = await $fetch('/api/source', { query: { route: route.path, kind } })
    Object.assign(files[kind], { path: result.path, code: result.content, saved: result.content })
  } catch {
    Object.assign(files[kind], { path: '', code: '', saved: '' })
  }
}

async function loadHomeFile() {
  const id = homeFile.value
  try {
    const result = await $fetch('/api/source', { query: { kind: 'home', file: id } })
    if (homeFile.value === id) {
      Object.assign(home, { path: result.path, code: result.content, saved: result.content })
    }
  } catch {
    Object.assign(home, { path: '', code: '', saved: '' })
  }
}

async function loadHome() {
  loading.value = true
  try {
    if (!homeFiles.value.length) {
      homeFiles.value = await $fetch<HomeFileItem[]>('/api/source-files')
    }
  } catch {
    homeFiles.value = []
  }

  if (homeFiles.value.length && !homeFiles.value.some(item => item.value === homeFile.value)) {
    homeFile.value = homeFiles.value[0]!.value
  }

  await loadHomeFile()
  loading.value = false
}

async function load() {
  if (isHome.value) {
    return loadHome()
  }

  if (!route.path.startsWith('/components/')) {
    return
  }

  loading.value = true
  await Promise.all(kinds.map(loadFile))
  loading.value = false

  if (!files[tab.value].path) {
    tab.value = kinds.find(kind => files[kind].path) ?? 'page'
  }
}

async function save() {
  if (!dirty.value || saving.value) {
    return
  }

  const file = active.value
  const id = homeFile.value
  const body = isHome.value ? { kind: 'home', file: id } : { route: route.path, kind: tab.value }

  saving.value = true
  const content = file.code
  try {
    await $fetch('/api/source', { method: 'PUT', body: { ...body, content } })
    if (file !== home || homeFile.value === id) {
      file.saved = content
    }
  } catch (error: any) {
    toast.add({ title: 'Could not save the file', description: error?.data?.message ?? error?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function revert() {
  active.value.code = active.value.saved
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
    active.value.code = el.value
  }
}

watch(() => route.path, load, { immediate: true })

let restoring = false

// Picking another home file, here or from a tile, discards the open edits only once confirmed
watch(homeFile, (_, previous) => {
  if (restoring) {
    restoring = false
    return
  }

  if (!isHome.value) {
    return
  }

  if (isHomeDirty() && !window.confirm('Discard unsaved changes?')) {
    restoring = true
    homeFile.value = previous
    return
  }

  loadHomeFile()
})

const removeGuard = useRouter().beforeEach((to, from) => {
  if ((kinds.some(isDirty) || isHomeDirty()) && to.path !== from.path) {
    return window.confirm('Discard unsaved changes?')
  }
})

onBeforeUnmount(removeGuard)
</script>

<template>
  <UDashboardPanel id="code" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar :ui="{ left: 'min-w-0', right: 'shrink-0' }">
        <template #title>
          <USelectMenu
            v-if="isHome"
            v-model="homeFile"
            :items="homeFiles"
            value-key="value"
            size="sm"
            class="w-56"
            aria-label="Home file"
          />
          <UTabs
            v-else
            v-model="tab"
            :items="tabs"
            :content="false"
            variant="link"
            size="sm"
          >
            <template #trailing="{ item }">
              <span
                v-if="isDirty(item.value as SourceKind)"
                class="size-1.5 rounded-full bg-warning"
                aria-label="Unsaved changes"
              />
            </template>
          </UTabs>
        </template>

        <template #right>
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
      <div v-if="loading && !active.path" class="flex flex-1 items-center justify-center text-sm text-muted">
        Loading…
      </div>

      <div v-else-if="!active.path" class="flex flex-1 items-center justify-center text-sm text-muted">
        This page has no source file to edit.
      </div>

      <template v-else>
        <div class="px-4 py-2 border-b border-default font-mono text-xs text-muted truncate">
          {{ active.path }}
        </div>

        <div class="flex-1 overflow-auto bg-default">
          <div class="grid min-w-full w-max font-mono text-xs/5">
            <!-- eslint-disable vue/no-v-html -->
            <div
              aria-hidden="true"
              class="[grid-area:1/1] pointer-events-none [&_pre]:p-4 [&_pre]:bg-transparent! [&_pre]:font-mono"
              v-html="html"
            />
            <!-- eslint-enable vue/no-v-html -->
            <textarea
              :key="isHome ? homeFile : tab"
              v-model="active.code"
              wrap="off"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              :aria-label="`${label} source code`"
              class="[grid-area:1/1] p-4 resize-none overflow-hidden bg-transparent text-transparent caret-(--ui-text-highlighted) outline-none selection:bg-primary/20 whitespace-pre"
              @keydown="onKeydown"
            />
          </div>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>
