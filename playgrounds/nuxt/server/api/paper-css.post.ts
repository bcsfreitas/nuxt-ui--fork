import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { compile } from '@tailwindcss/node'
import { defineEventHandler, readBody, createError, useRuntimeConfig } from 'nuxt/server'

type Compiler = Awaited<ReturnType<typeof compile>>

const MAX_CANDIDATES = 5000
const MAX_CANDIDATE_LENGTH = 200

let compilerPromise: Promise<Compiler> | undefined

function getCompiler(rootDir: string, buildDir: string) {
  if (!compilerPromise) {
    compilerPromise = (async () => {
      const entry = join(rootDir, 'app/assets/css/main.css')
      const css = await readFile(entry, 'utf8')
      return compile(css, {
        base: dirname(entry),
        from: entry,
        onDependency: () => {},
        customCssResolver: async (id: string) => id === '#build/ui.css' ? join(buildDir, 'ui.css') : undefined
      })
    })()
    compilerPromise.catch(() => {
      compilerPromise = undefined
    })
  }
  return compilerPromise
}

// Keeps the `@layer utilities` blocks and `@property` rules: the page already has the theme and base layers
function extractUtilities(css: string) {
  const parts: string[] = []
  const pattern = /@layer utilities\s*\{|@property\s[^{]+\{/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(css))) {
    let depth = 1
    let index = match.index + match[0].length
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth++
      else if (css[index] === '}') depth--
      index++
    }
    parts.push(css.slice(match.index, index))
    pattern.lastIndex = index
  }
  return parts.join('\n')
}

export default defineEventHandler(async (event) => {
  const { candidates } = await readBody<{ candidates?: unknown }>(event)
  if (!Array.isArray(candidates)) {
    throw createError({ status: 400, message: 'candidates must be an array of strings' })
  }

  const list = [...new Set(candidates.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0 && candidate.length <= MAX_CANDIDATE_LENGTH))]
  if (list.length > MAX_CANDIDATES) {
    throw createError({ status: 413, message: 'Too many candidates' })
  }

  const { paperCss } = useRuntimeConfig() as unknown as { paperCss: { rootDir: string, buildDir: string } }
  const compiler = await getCompiler(paperCss.rootDir, paperCss.buildDir)

  return { css: extractUtilities(compiler.build(list)) }
})
