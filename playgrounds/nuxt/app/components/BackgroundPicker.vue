<script setup lang="ts">
import { useColorMode } from '#imports'

const colorMode = useColorMode()
const { light, dark, reset } = usePlaygroundBackground()

const isDark = computed(() => colorMode.value === 'dark')
const current = computed({
  get: () => (isDark.value ? dark.value : light.value),
  set: (value: string) => {
    if (isDark.value) {
      dark.value = value
    } else {
      light.value = value
    }
  }
})

// The picker writes back on every programmatic change, so only accept its updates while it is being dragged
const dragging = ref(false)
let releaseTimer: ReturnType<typeof setTimeout> | undefined

function release() {
  clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => {
    dragging.value = false
  }, 200)
}

function onPick(value: string | undefined) {
  if (dragging.value && value) {
    current.value = value
  }
}

onMounted(() => window.addEventListener('pointerup', release))
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', release)
  clearTimeout(releaseTimer)
})

const presets = computed(() => isDark.value
  ? ['', '#000000', '#0A0A0A', '#171717', '#1C1C1E', '#262626']
  : ['', '#FFFFFF', '#FAFAFA', '#F2F2F2', '#E5E5E5', '#D4D4D4'])
</script>

<template>
  <UPopover :content="{ side: 'right', align: 'start' }">
    <UButton
      icon="i-lucide-paint-bucket"
      color="neutral"
      variant="ghost"
      class="data-[state=open]:bg-elevated"
      aria-label="Page background"
    />

    <template #content>
      <div class="flex flex-col gap-3 p-3 w-60">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-highlighted">
            Background ({{ isDark ? 'dark' : 'light' }})
          </span>

          <UButton
            label="Reset"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="reset"
          />
        </div>

        <div class="flex gap-1.5">
          <button
            v-for="preset in presets"
            :key="preset || 'theme'"
            type="button"
            class="size-6 rounded-md ring ring-default bg-(--swatch) data-[active=true]:ring-2 data-[active=true]:ring-primary"
            :style="{ '--swatch': preset || 'var(--ui-bg)' }"
            :data-active="current === preset"
            :aria-label="preset ? `Use ${preset}` : 'Use the theme background'"
            :title="preset || 'Theme background'"
            @click="current = preset"
          />
        </div>

        <UColorPicker
          :model-value="current || (isDark ? '#000000' : '#FFFFFF')"
          size="sm"
          class="self-center"
          @pointerdown="dragging = true"
          @update:model-value="onPick"
        />

        <UInput
          v-model="current"
          placeholder="Theme background"
          size="sm"
          class="font-mono"
        />
      </div>
    </template>
  </UPopover>
</template>
