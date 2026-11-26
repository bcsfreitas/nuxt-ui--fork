import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { lowerFirst, pascalCase, splitByCase, upperFirst } from 'scule'
import { createError } from 'nuxt/server'

const SLUG = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/
const PLAYGROUND_FILE = /^Playground[A-Za-z]+\.vue$/
const HOME_PAGE = 'pages/index.vue'
const HOME_WALL = 'PlaygroundWall.vue'
const HOME_CARD = 'PlaygroundCard.vue'

interface SourceDirs {
  pagesDir: string
  componentsDir: string
  themeDir: string
  playgroundDir: string
}

interface SourceTarget {
  route?: unknown
  kind?: unknown
  file?: unknown
}

function assertDev() {
  if (!import.meta.dev) {
    throw createError({ status: 404 })
  }
}

function contained(file: string | undefined, root: string, prefix: string) {
  if (!file || !file.startsWith(root + sep) || !existsSync(file)) {
    throw createError({ status: 404, message: 'Source file not found' })
  }

  return { file, relative: `${prefix}/${file.slice(root.length + 1).replaceAll(sep, '/')}` }
}

// Only `pages/index.vue` and `components/playground/Playground*.vue` are home files
function resolveHomeFile(id: unknown, dirs: SourceDirs) {
  if (id === HOME_PAGE) {
    const root = resolve(dirs.pagesDir)
    return contained(join(root, 'index.vue'), root, 'pages')
  }

  if (typeof id !== 'string' || !PLAYGROUND_FILE.test(id)) {
    throw createError({ status: 400, message: 'Invalid home file' })
  }

  const root = resolve(dirs.playgroundDir)
  return contained(join(root, id), root, 'components/playground')
}

// Maps a `/components/<slug>` route to its page file or to the library component and theme it shows, and a `home` file id to a home page file. Dev only: the playground edits its own sources.
export function resolveSourceFile({ route, kind, file }: SourceTarget, dirs: SourceDirs) {
  assertDev()

  if (kind === 'home') {
    return resolveHomeFile(file, dirs)
  }

  const slug = typeof route === 'string' ? route.replace(/^\/components\//, '').replace(/\/$/, '') : ''
  if (!SLUG.test(slug)) {
    throw createError({ status: 400, message: 'Invalid page route' })
  }

  let root: string
  let prefix: string
  let candidates: string[]

  if (kind === 'component') {
    root = resolve(dirs.componentsDir)
    prefix = 'src/runtime/components'
    const segments = slug.split('/')
    const name = pascalCase(segments.pop()!)
    candidates = [join(root, ...segments, `${name}.vue`)]
  } else if (kind === 'theme') {
    root = resolve(dirs.themeDir)
    prefix = 'src/theme'
    candidates = [join(root, `${slug}.ts`)]
  } else if (kind === 'page' || kind === undefined) {
    root = resolve(dirs.pagesDir, 'components')
    prefix = 'pages/components'
    candidates = [join(root, `${slug}.vue`), join(root, slug, 'index.vue')]
  } else {
    throw createError({ status: 400, message: 'Invalid source kind' })
  }

  return contained(candidates.find(existsSync), root, prefix)
}

// `PlaygroundTransferFunds.vue` becomes "Transfer funds"
function tileLabel(file: string) {
  const words = splitByCase(file.replace(/^Playground/, '').replace(/\.vue$/, '')).map(word => lowerFirst(word))
  return upperFirst(words.join(' '))
}

// The files the home page is made of: the page, the wall, then every tile
export async function listHomeFiles(dirs: SourceDirs) {
  assertDev()

  const entries = await readdir(resolve(dirs.playgroundDir))
  const tiles = entries
    .filter(file => PLAYGROUND_FILE.test(file) && file !== HOME_WALL && file !== HOME_CARD)
    .sort()
    .map(file => ({ label: tileLabel(file), value: file }))

  return [
    { label: 'Home page', value: HOME_PAGE },
    { label: 'Wall layout', value: HOME_WALL },
    ...tiles
  ]
}
