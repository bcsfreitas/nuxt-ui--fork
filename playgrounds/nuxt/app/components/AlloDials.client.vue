<script setup lang="ts">
import { DialRoot, useDialKitController } from 'dialkit/vue'
import 'dialkit/styles.css'

const root = document.documentElement
const colorMode = useColorMode()

// The manual amount starts at the stylesheet default, so turning Automatic off changes nothing until the slider moves
const stylesheetRoundness = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ui-font-roundness'))
const roundnessDefault = Number.isFinite(stylesheetRoundness) ? stylesheetRoundness : 50

// Tailwind's weight ladder: every `font-*` weight utility reads one of these
const weightVariables = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'].map(name => `--font-weight-${name}`)

const dial = useDialKitController('Allo', {
  // Automatic leaves the library's roundness untouched, so a saved panel can't pin an old default
  roundness: {
    automatic: true,
    amount: [roundnessDefault, 0, 100, 1]
  },
  // Allo's opsz axis spans 9–32; the size only applies once "Automatic" is off
  opticalSize: {
    automatic: true,
    size: [14, 9, 32, 1]
  },
  // Allo's wght axis spans 100–900; the weight only applies once "Automatic" is off
  weight: {
    automatic: true,
    weight: [400, 100, 900, 1]
  },
  // DialKit 2.2.1 has no Reset button of its own; back at the defaults, the watchers below remove every inline variable
  reset: { type: 'action', label: 'Reset' }
}, {
  id: 'allo',
  persist: true,
  onAction: (action) => {
    if (action === 'reset') {
      dial.resetValues()
    }
  }
})

const values = dial.values

// Writing on the root lets teleported overlays (menus, modals, toasts) follow too; Automatic removes the inline value so the stylesheet applies untouched
watchEffect(() => {
  const { automatic, amount } = values.value.roundness

  if (automatic) {
    root.style.removeProperty('--ui-font-roundness')
  } else {
    root.style.setProperty('--ui-font-roundness', String(amount))
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

function removeWeight() {
  for (const variable of weightVariables) {
    root.style.removeProperty(variable)
  }
  root.style.removeProperty('font-weight')
  root.style.removeProperty('--allo-dial-weight')
}

// One weight for all text: the ladder variables cover `font-*` utilities, the root weight covers inherited text, and `--allo-dial-weight` pins `b`/`strong` (see main.css); automatic removes it all
watchEffect(() => {
  const { automatic, weight } = values.value.weight

  if (automatic) {
    removeWeight()
    return
  }

  // A persisted or hand-edited value can't push the text outside the font's real weights
  const value = String(Math.min(900, Math.max(100, Math.round(weight))))

  for (const variable of weightVariables) {
    root.style.setProperty(variable, value)
  }
  root.style.setProperty('font-weight', value)
  root.style.setProperty('--allo-dial-weight', value)
})

onBeforeUnmount(() => {
  root.style.removeProperty('--ui-font-roundness')
  root.style.removeProperty('--ui-font-optical-size')
  removeWeight()
})

const theme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
</script>

<template>
  <DialRoot position="top-right" :theme="theme" />
</template>
