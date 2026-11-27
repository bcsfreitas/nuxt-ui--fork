<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()

const { components, groups, items } = useNavigation()

useHead({
  title: 'Nuxt UI - Playground',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Explore and test all Nuxt UI components in an interactive environment' }
  ],
  htmlAttrs: {
    lang: 'en',
    dir: computed(() => appConfig.dir)
  }
})

provide('components', components)

const { open: codeOpen } = useCodePanel()
const showCode = computed(() => codeOpen.value && (route.path === '/' || (route.path.startsWith('/components/') && !route.path.startsWith('/components/sidebar'))))

// Lets the home wall offer "Edit code" on its tiles, only where the code panel can save
provide('code-panel', import.meta.dev)

const { style: backgroundStyle } = usePlaygroundBackground()
</script>

<template>
  <UApp :toaster="appConfig.toaster" :dir="appConfig.dir">
    <UDashboardGroup unit="rem">
      <UDashboardSidebar
        class="bg-elevated/25"
        resizable
        collapsible
        :toggle="{ size: 'sm', variant: 'outline', class: 'ring-default' }"
      >
        <template #header="{ collapsed }">
          <NuxtLink to="/" class="text-highlighted inline-flex" aria-label="Home">
            <Logo class="h-5 w-auto" :collapsed="collapsed" />
          </NuxtLink>

          <div v-if="!collapsed" class="flex items-center ms-auto">
            <ThemeDropdown />

            <BackgroundPicker />

            <UColorModeButton />
          </div>
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton :collapsed="collapsed" />

          <UNavigationMenu :collapsed="collapsed" :items="items" orientation="vertical" />

          <USeparator type="dashed" />

          <UNavigationMenu :collapsed="collapsed" :items="components" orientation="vertical" />
        </template>
      </UDashboardSidebar>

      <NuxtPage v-if="route.path.startsWith('/components/sidebar')" />
      <UDashboardPanel
        v-else
        :id="showCode ? 'preview' : undefined"
        :key="showCode ? 'split' : 'full'"
        :resizable="showCode"
        :default-size="showCode ? 48 : undefined"
        :min-size="24"
        :max-size="90"
        class="bg-(--playground-bg-light) dark:bg-(--playground-bg-dark)"
        :style="backgroundStyle"
        :ui="{
          body: [
            route.path.startsWith('/components') && 'mt-16',
            route.path.startsWith('/components/scroll-area') && 'p-0!'
          ]
        }"
      >
        <template #body>
          <div class="flex flex-col items-center justify-center min-h-full shrink-0" data-copy-element-area>
            <NuxtPage />
          </div>
        </template>
      </UDashboardPanel>

      <CodePanel v-if="showCode" />

      <UDashboardSearch :groups="groups" :fuse="{ resultLimit: 100 }" />
    </UDashboardGroup>

    <AlloDials />

    <CopyElementOverlay />
  </UApp>
</template>
