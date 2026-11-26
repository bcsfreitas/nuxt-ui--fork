import type { Ref } from 'vue'
import { isRef, ref } from 'vue'
import { useCookie } from '#imports'

// The Vue playground stubs `useCookie` with a plain object, so it gets a local ref there
function useCookieRef<T>(name: string, fallback: T): Ref<T> {
  const cookie: unknown = useCookie<T>(name, { default: () => fallback })
  return isRef(cookie) ? cookie as Ref<T> : ref(fallback) as Ref<T>
}

export function useCodePanel() {
  const open = useCookieRef('code-panel-open', false)
  const homeFile = useCookieRef('code-panel-home-file', 'pages/index.vue')

  function toggle() {
    open.value = !open.value
  }

  function openFile(file: string) {
    homeFile.value = file
    open.value = true
  }

  return { open, homeFile, toggle, openFile }
}
