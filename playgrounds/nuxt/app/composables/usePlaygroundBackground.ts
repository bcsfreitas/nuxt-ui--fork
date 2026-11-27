import { computed } from 'vue'
import { useCookieRef } from './useCookieRef'

export const PLAYGROUND_BACKGROUND_DEFAULTS = {
  light: '#F2F2F2',
  dark: ''
}

export function usePlaygroundBackground() {
  const light = useCookieRef('playground-bg-light', PLAYGROUND_BACKGROUND_DEFAULTS.light)
  const dark = useCookieRef('playground-bg-dark', PLAYGROUND_BACKGROUND_DEFAULTS.dark)

  // An empty value falls back to the theme's own background
  const style = computed(() => ({
    '--playground-bg-light': light.value || 'var(--ui-bg)',
    '--playground-bg-dark': dark.value || 'var(--ui-bg)'
  }))

  function reset() {
    light.value = PLAYGROUND_BACKGROUND_DEFAULTS.light
    dark.value = PLAYGROUND_BACKGROUND_DEFAULTS.dark
  }

  return { light, dark, style, reset }
}
