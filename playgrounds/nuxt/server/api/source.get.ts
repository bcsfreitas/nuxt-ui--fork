import { readFile } from 'node:fs/promises'
import { defineEventHandler, getQuery, useRuntimeConfig } from 'nuxt/server'
import { resolvePageFile } from '../utils/page-source'

export default defineEventHandler(async (event) => {
  const { file, relative } = resolvePageFile(getQuery(event).route, useRuntimeConfig().pagesDir)

  return { path: relative, content: await readFile(file, 'utf8') }
})
