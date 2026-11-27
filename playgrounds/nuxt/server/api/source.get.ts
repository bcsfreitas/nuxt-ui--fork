import { readFile } from 'node:fs/promises'
import { defineEventHandler, getQuery, useRuntimeConfig } from 'nuxt/server'
import { resolveSourceFile } from '../utils/source-file'

export default defineEventHandler(async (event) => {
  const { route, kind, file: id } = getQuery(event)
  const { file, relative } = resolveSourceFile({ route, kind, file: id }, useRuntimeConfig())

  return { path: relative, content: await readFile(file, 'utf8') }
})
