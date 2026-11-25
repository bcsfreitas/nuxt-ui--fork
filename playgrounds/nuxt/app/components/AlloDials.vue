<script setup lang="ts">
import { DialRoot, useDialKit } from 'dialkit/vue'
import 'dialkit/styles.css'

const root = document.documentElement
const colorMode = useColorMode()

// The stylesheet default seeds the dial, so the library stays the single source of truth
const roundnessDefault = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ui-font-roundness')) || 50

const values = useDialKit('Allo', {
  roundness: [roundnessDefault, 0, 100, 1]
}, { id: 'allo', persist: true })

// Writing on the root lets teleported overlays (menus, modals, toasts) follow too; at the default the inline value is removed so the stylesheet applies untouched
watchEffect(() => {
  const roundness = values.value.roundness

  if (roundness === roundnessDefault) {
    root.style.removeProperty('--ui-font-roundness')
  } else {
    root.style.setProperty('--ui-font-roundness', String(roundness))
  }
})

onBeforeUnmount(() => {
  root.style.removeProperty('--ui-font-roundness')
})

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
</script>

<template>
  <DialRoot position="top-right" :theme="theme" />
</template>
