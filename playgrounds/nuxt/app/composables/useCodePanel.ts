import { useCookieRef } from './useCookieRef'

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
