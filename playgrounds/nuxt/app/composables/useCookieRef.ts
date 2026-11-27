import type { Ref } from 'vue'
import { isRef, ref } from 'vue'
import { useCookie } from '#imports'

// The Vue playground stubs `useCookie` with a plain object, so it gets a local ref there
export function useCookieRef<T>(name: string, fallback: T): Ref<T> {
  const cookie: unknown = useCookie<T>(name, { default: () => fallback })
  return isRef(cookie) ? cookie as Ref<T> : ref(fallback) as Ref<T>
}
