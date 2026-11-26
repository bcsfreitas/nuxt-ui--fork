export function useCodePanel() {
  const open = useCookie<boolean>('code-panel-open', { default: () => false })
  const homeFile = useCookie<string>('code-panel-home-file', { default: () => 'pages/index.vue' })

  function toggle() {
    open.value = !open.value
  }

  function openFile(file: string) {
    homeFile.value = file
    open.value = true
  }

  return { open, homeFile, toggle, openFile }
}
