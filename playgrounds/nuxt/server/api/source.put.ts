import { writeFile } from 'node:fs/promises'
import { createError, defineEventHandler, readBody, useRuntimeConfig } from 'nuxt/server'
import { resolveSourceFile } from '../utils/source-file'

export default defineEventHandler(async (event) => {
  const { route, kind, content } = await readBody<{ route?: string, kind?: string, content?: string }>(event)
  if (typeof content !== 'string') {
    throw createError({ status: 400, message: 'Content is required' })
  }

  const { file, relative } = resolveSourceFile(route, kind, useRuntimeConfig())
  await writeFile(file, content.replace(/\r\n/g, '\n'), 'utf8')

  return { path: relative }
})
