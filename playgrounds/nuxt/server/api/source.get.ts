import { readFile } from 'node:fs/promises'
import { defineEventHandler, getQuery, useRuntimeConfig } from 'nuxt/server'
import { resolveSourceFile } from '../utils/source-file'

export default defineEventHandler(async (event) => {
  const { route, kind } = getQuery(event)
  const { file, relative } = resolveSourceFile(route, kind, useRuntimeConfig())

  return { path: relative, content: await readFile(file, 'utf8') }
})
