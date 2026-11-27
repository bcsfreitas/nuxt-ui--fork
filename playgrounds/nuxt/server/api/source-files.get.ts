import { defineEventHandler, useRuntimeConfig } from 'nuxt/server'
import { listHomeFiles } from '../utils/source-file'

export default defineEventHandler(() => listHomeFiles(useRuntimeConfig()))
