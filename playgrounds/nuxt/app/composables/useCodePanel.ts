import { computed } from 'vue'
import { useCookie } from '#imports'

export function useCodePanel() {
  const cookie = useCookie<boolean>('code-panel-open', { default: () => false })
  const open = computed<boolean>({
    get: () => cookie.value,
    set: (value) => {
      cookie.value = value
    }
  })

  function toggle() {
    open.value = !open.value
  }

  return { open, toggle }
}
