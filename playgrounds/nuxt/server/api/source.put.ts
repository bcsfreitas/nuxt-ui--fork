import { writeFile } from 'node:fs/promises'
import { createError, defineEventHandler, readBody, useRuntimeConfig } from 'nuxt/server'
import { resolvePageFile } from '../utils/page-source'

export default defineEventHandler(async (event) => {
  const { route, content } = await readBody<{ route?: string, content?: string }>(event)
  if (typeof content !== 'string') {
    throw createError({ status: 400, message: 'Content is required' })
  }

  const { file, relative } = resolvePageFile(route, useRuntimeConfig().pagesDir)
  await writeFile(file, content.replace(/\r\n/g, '\n'), 'utf8')

  return { path: relative }
})
