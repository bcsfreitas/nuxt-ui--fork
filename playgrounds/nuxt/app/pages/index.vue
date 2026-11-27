<script setup lang="ts">
const { open: codeOpen, toggle: toggleCode } = useCodePanel()
</script>

<template>
  <UDashboardNavbar class="absolute top-0 inset-x-0 lg:border-b-0">
    <template #right>
      <UButton
        icon="i-lucide-code-xml"
        color="neutral"
        :variant="codeOpen ? 'soft' : 'ghost'"
        size="xs"
        :aria-pressed="codeOpen"
        aria-label="Edit page code"
        @click="toggleCode"
      />
    </template>
  </UDashboardNavbar>

  <div class="w-full max-w-(--ui-container) mt-16 space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-2xl font-bold text-primary">
        Playground
      </h1>
      <p class="max-w-sm mx-auto text-muted">
        Explore and test all Nuxt UI components in an interactive environment.
      </p>
    </div>

    <PlaygroundWall />
  </div>
</template>
