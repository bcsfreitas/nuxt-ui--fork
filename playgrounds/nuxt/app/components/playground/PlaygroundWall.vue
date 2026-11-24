<script setup lang="ts">
// The landing's wall: the Theme Studio's grid tiles without the virtualizer.
// It shows them all anyway, and a virtualized wall needs a measured DOM, so
// the server would paint an empty box that only fills in on hydration.
// Each tile hydrates on its own once it scrolls into view, so a phone only
// pays for the one or two it opens on.
const Input = defineLazyHydrationComponent('visible', () => import('./PlaygroundInput.vue'))
const CommandPalette = defineLazyHydrationComponent('visible', () => import('./PlaygroundCommandPalette.vue'))
const Calendar = defineLazyHydrationComponent('visible', () => import('./PlaygroundCalendar.vue'))
const Notifications = defineLazyHydrationComponent('visible', () => import('./PlaygroundNotifications.vue'))
const Transactions = defineLazyHydrationComponent('visible', () => import('./PlaygroundTransactions.vue'))
const TransferFunds = defineLazyHydrationComponent('visible', () => import('./PlaygroundTransferFunds.vue'))
const InviteTeam = defineLazyHydrationComponent('visible', () => import('./PlaygroundInviteTeam.vue'))
const Analytics = defineLazyHydrationComponent('visible', () => import('./PlaygroundAnalytics.vue'))
const PinInput = defineLazyHydrationComponent('visible', () => import('./PlaygroundPinInput.vue'))
const Dashboard = defineLazyHydrationComponent('visible', () => import('./PlaygroundDashboard.vue'))
const ReportBug = defineLazyHydrationComponent('visible', () => import('./PlaygroundReportBug.vue'))
const Goal = defineLazyHydrationComponent('visible', () => import('./PlaygroundGoal.vue'))
const SavingsTargets = defineLazyHydrationComponent('visible', () => import('./PlaygroundSavingsTargets.vue'))
const Shortcuts = defineLazyHydrationComponent('visible', () => import('./PlaygroundShortcuts.vue'))
const Navigation = defineLazyHydrationComponent('visible', () => import('./PlaygroundNavigation.vue'))
const Empty = defineLazyHydrationComponent('visible', () => import('./PlaygroundEmpty.vue'))
const Announcement = defineLazyHydrationComponent('visible', () => import('./PlaygroundAnnouncement.vue'))
const Tabs = defineLazyHydrationComponent('visible', () => import('./PlaygroundTabs.vue'))
const Contributors = defineLazyHydrationComponent('visible', () => import('./PlaygroundContributors.vue'))
const AuthForm = defineLazyHydrationComponent('visible', () => import('./PlaygroundAuthForm.vue'))
const Prompt = defineLazyHydrationComponent('visible', () => import('./PlaygroundPrompt.vue'))

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
</script>

<template>
  <!-- CSS columns, so the server paints the wall it will keep: the lanes
       follow this box through container queries, not the viewport. -->
  <div class="@container">
    <div class="columns-1 gap-4 p-4 *:mb-4 *:break-inside-avoid @min-[600px]:columns-2 @min-[600px]:p-6 @min-[900px]:columns-3 @min-[1200px]:columns-4">
      <PlaygroundCard v-for="tile in tiles" :key="tile.name">
        <component :is="tile.component" />
      </PlaygroundCard>
    </div>
  </div>
</template>
