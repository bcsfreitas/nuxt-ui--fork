import { useCookie } from '#imports'

export function useCodePanel() {
  const open = useCookie<boolean>('code-panel-open', { default: () => false })

  function toggle() {
    open.value = !open.value
  }

  return { open, toggle }
}
