<script setup lang="ts">
import { defineAsyncComponent, inject } from 'vue'

// The landing's wall: the Theme Studio's grid tiles without the virtualizer.
// Plain async components (not Nuxt's lazy hydration) because the Vue playground renders this page too.
const Input = defineAsyncComponent(() => import('./PlaygroundInput.vue'))
const CommandPalette = defineAsyncComponent(() => import('./PlaygroundCommandPalette.vue'))
const Calendar = defineAsyncComponent(() => import('./PlaygroundCalendar.vue'))
const Notifications = defineAsyncComponent(() => import('./PlaygroundNotifications.vue'))
const Transactions = defineAsyncComponent(() => import('./PlaygroundTransactions.vue'))
const TransferFunds = defineAsyncComponent(() => import('./PlaygroundTransferFunds.vue'))
const InviteTeam = defineAsyncComponent(() => import('./PlaygroundInviteTeam.vue'))
const Analytics = defineAsyncComponent(() => import('./PlaygroundAnalytics.vue'))
const PinInput = defineAsyncComponent(() => import('./PlaygroundPinInput.vue'))
const Dashboard = defineAsyncComponent(() => import('./PlaygroundDashboard.vue'))
const ReportBug = defineAsyncComponent(() => import('./PlaygroundReportBug.vue'))
const Goal = defineAsyncComponent(() => import('./PlaygroundGoal.vue'))
const SavingsTargets = defineAsyncComponent(() => import('./PlaygroundSavingsTargets.vue'))
const Shortcuts = defineAsyncComponent(() => import('./PlaygroundShortcuts.vue'))
const Navigation = defineAsyncComponent(() => import('./PlaygroundNavigation.vue'))
const Empty = defineAsyncComponent(() => import('./PlaygroundEmpty.vue'))
const Announcement = defineAsyncComponent(() => import('./PlaygroundAnnouncement.vue'))
const Tabs = defineAsyncComponent(() => import('./PlaygroundTabs.vue'))
const Contributors = defineAsyncComponent(() => import('./PlaygroundContributors.vue'))
const AuthForm = defineAsyncComponent(() => import('./PlaygroundAuthForm.vue'))
const Prompt = defineAsyncComponent(() => import('./PlaygroundPrompt.vue'))

const tiles = [
  { name: 'input', component: Input },
  { name: 'command-palette', component: CommandPalette },
  { name: 'calendar', component: Calendar },
  { name: 'notifications', component: Notifications },
  { name: 'transactions', component: Transactions },
  { name: 'transfer-funds', component: TransferFunds },
  { name: 'invite-team', component: InviteTeam },
  { name: 'analytics', component: Analytics },
  { name: 'pin-input', component: PinInput },
  { name: 'dashboard', component: Dashboard },
  { name: 'report-bug', component: ReportBug },
  { name: 'goal', component: Goal },
  { name: 'savings-targets', component: SavingsTargets },
  { name: 'shortcuts', component: Shortcuts },
  { name: 'navigation', component: Navigation },
  { name: 'empty', component: Empty },
  { name: 'announcement', component: Announcement },
  { name: 'tabs', component: Tabs },
  { name: 'contributors', component: Contributors },
  { name: 'auth-form', component: AuthForm },
  { name: 'prompt', component: Prompt }
]

// Only the Nuxt playground in dev provides the code panel
const editable = inject('code-panel', false)
const { openFile } = useCodePanel()

// `transfer-funds` lives in `PlaygroundTransferFunds.vue`
function fileOf(name: string) {
  return `Playground${name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}.vue`
}
</script>

<template>
  <!-- CSS columns, so the server paints the wall it will keep: the lanes
       follow this box through container queries, not the viewport. -->
  <div class="@container">
    <div class="columns-1 gap-4 p-4 *:mb-4 *:break-inside-avoid @min-[600px]:columns-2 @min-[600px]:p-6 @min-[900px]:columns-3 @min-[1200px]:columns-4">
      <PlaygroundCard
        v-for="tile in tiles"
        :key="tile.name"
        :data-tile="tile.name"
        class="group/tile"
      >
        <UButton
          v-if="editable"
          label="Edit code"
          icon="i-lucide-code"
          color="neutral"
          variant="outline"
          size="xs"
          class="absolute top-2 end-2 z-10 opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100"
          @click="openFile(fileOf(tile.name))"
        />
        <component :is="tile.component" />
      </PlaygroundCard>
    </div>
  </div>
</template>
