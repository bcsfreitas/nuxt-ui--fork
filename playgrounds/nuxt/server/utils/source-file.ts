import { existsSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { pascalCase } from 'scule'
import { createError } from 'nuxt/server'

const SLUG = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

// Maps a `/components/<slug>` route to its page file or to the library component and theme it shows. Dev only: the playground edits its own sources.
export function resolveSourceFile(route: unknown, kind: unknown, dirs: { pagesDir: string, componentsDir: string, themeDir: string }) {
  if (!import.meta.dev) {
    throw createError({ status: 404 })
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

  const file = candidates.find(existsSync)
  if (!file || !file.startsWith(root + sep)) {
    throw createError({ status: 404, message: 'Source file not found' })
  }

  return { file, relative: `${prefix}/${file.slice(root.length + 1).replaceAll(sep, '/')}` }
}
