import { existsSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { createError } from 'nuxt/server'

const SLUG = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

// Maps a `/components/<slug>` route to its page file. Dev only: the playground edits its own sources.
export function resolvePageFile(route: unknown, pagesDir: string) {
  if (!import.meta.dev) {
    throw createError({ status: 404 })
  }

  const slug = typeof route === 'string' ? route.replace(/^\/components\//, '').replace(/\/$/, '') : ''
  if (!SLUG.test(slug)) {
    throw createError({ status: 400, message: 'Invalid page route' })
  }

  const root = resolve(pagesDir, 'components')
  const file = [join(root, `${slug}.vue`), join(root, slug, 'index.vue')].find(existsSync)
  if (!file || !file.startsWith(root + sep)) {
    throw createError({ status: 404, message: 'Page file not found' })
  }

  return { file, relative: `pages/components/${file.slice(root.length + 1).replaceAll(sep, '/')}` }
}
