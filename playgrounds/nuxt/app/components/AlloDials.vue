<script setup lang="ts">
import { DialRoot, useDialKit } from 'dialkit/vue'
import 'dialkit/styles.css'

const root = document.documentElement
const colorMode = useColorMode()

// The stylesheet default seeds the dial, so the library stays the single source of truth
const roundnessDefault = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ui-font-roundness')) || 50

const values = useDialKit('Allo', {
  roundness: [roundnessDefault, 0, 100, 1],
  // Allo's opsz axis spans 9–32; the size only applies once "Automatic" is off
  opticalSize: {
    automatic: true,
    size: [14, 9, 32, 1]
  }
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

// Automatic removes the variable, so the browser keeps picking opsz from each text's font size
watchEffect(() => {
  const { automatic, size } = values.value.opticalSize

  if (automatic) {
    root.style.removeProperty('--ui-font-optical-size')
  } else {
    root.style.setProperty('--ui-font-optical-size', `"opsz" ${size}`)
  }
})

onBeforeUnmount(() => {
  root.style.removeProperty('--ui-font-roundness')
  root.style.removeProperty('--ui-font-optical-size')
})

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
</script>

<template>
  <DialRoot position="top-right" :theme="theme" />
</template>
