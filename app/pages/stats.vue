<script setup lang="ts">
/**
 * Statistics Page
 *
 * Displays comprehensive statistics for Planning Poker sessions.
 * Includes Quick Stats, Meeting Status, Charts, and Recent Stories.
 */

const { t } = useI18n()

/**
 * Local stats composable
 */
const {
  getQuickStats,
  getMeetingStatus,
  getCardFrequency,
  getPointsTimeSeries,
  getRecentStories,
  getConsensusDistribution,
  getAllSessions,
  clearAllStats,
} = useLocalStats()

/**
 * Session composable for live data
 */
const { session, voters } = useSession()

/**
 * Currently selected session ID (null = all sessions)
 */
const selectedSessionId = ref<string | null>(null)

/**
 * Confirm dialog for clearing stats
 */
const showClearConfirm = ref(false)

/**
 * Quick stats computed
 */
const quickStats = computed(() => getQuickStats(selectedSessionId.value ?? undefined))

/**
 * Meeting status computed
 */
const meetingStatus = computed(() => getMeetingStatus(session.value, voters.value))

/**
 * Card frequency computed
 */
const cardFrequency = computed(() => getCardFrequency(selectedSessionId.value ?? undefined))

/**
 * Points time series computed
 */
const pointsTimeSeries = computed(() => getPointsTimeSeries(selectedSessionId.value ?? undefined))

/**
 * Consensus distribution computed
 */
const consensusDistribution = computed(() => getConsensusDistribution(selectedSessionId.value ?? undefined))

/**
 * Recent stories computed
 */
const recentStories = computed(() => getRecentStories(selectedSessionId.value ?? undefined, 10))

/**
 * All sessions for filter dropdown
 */
const allSessions = computed(() => getAllSessions())

/**
 * Handle clear stats
 */
function handleClearStats(): void {
  clearAllStats()
  showClearConfirm.value = false
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('stats.time.justNow')
  if (minutes < 60) return t('stats.time.minutesAgo', { count: minutes })
  if (hours < 24) return t('stats.time.hoursAgo', { count: hours })
  return t('stats.time.daysAgo', { count: days })
}

/**
 * SEO Meta
 */
useSeoMeta({
  title: `${t('stats.title')} - ${t('app.name')}`,
  description: t('stats.subtitle'),
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-secondary-200/50">
      <div class="container mx-auto px-4 py-3 sm:py-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <NuxtLink to="/" class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <Icon name="heroicons:squares-2x2" class="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <h1 class="text-lg sm:text-xl font-bold text-secondary-800">
                Planning Poker
              </h1>
            </NuxtLink>
            <span class="text-secondary-400 hidden sm:inline">/</span>
            <h2 class="text-base sm:text-lg font-semibold text-secondary-600 hidden sm:block">
              {{ t('stats.title') }}
            </h2>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <LanguageSwitcher />
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <Icon name="heroicons:arrow-left" class="w-4 h-4" />
              <span class="hidden xs:inline">{{ t('stats.backToSession') }}</span>
              <span class="xs:hidden">{{ t('nav.back') }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Page Title & Filter -->
      <div class="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-secondary-800">{{ t('stats.title') }}</h1>
          <p class="text-sm sm:text-base text-secondary-600 mt-1">{{ t('stats.subtitle') }}</p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <!-- Session Filter -->
          <select
            v-model="selectedSessionId"
            class="w-full sm:w-auto px-3 sm:px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option :value="null">{{ t('stats.filter.allSessions') }}</option>
            <option
              v-for="sess in allSessions"
              :key="sess.sessionId"
              :value="sess.sessionId"
            >
              {{ sess.sessionName }}
            </option>
          </select>

          <!-- Clear Stats Button -->
          <button
            type="button"
            class="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm font-medium text-error-600 bg-error-50 hover:bg-error-100 rounded-lg transition-colors"
            @click="showClearConfirm = true"
          >
            <Icon name="heroicons:trash" class="w-4 h-4 inline mr-1" />
            {{ t('stats.clearStats') }}
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <section class="mb-6 sm:mb-8">
        <h2 class="text-base sm:text-lg font-semibold text-secondary-700 mb-3 sm:mb-4">
          <Icon name="heroicons:bolt" class="w-5 h-5 inline mr-2 text-primary-500" />
          {{ t('stats.quickStats.title') }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <!-- Total Stories -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="p-1.5 sm:p-2 bg-primary-100 rounded-lg flex-shrink-0">
                <Icon name="heroicons:document-text" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              </div>
              <div class="min-w-0">
                <div class="text-lg sm:text-2xl font-bold text-secondary-800">{{ quickStats.totalStories }}</div>
                <div class="text-xs text-secondary-500 truncate">{{ t('stats.quickStats.totalStories') }}</div>
              </div>
            </div>
          </div>

          <!-- Average Points -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="p-1.5 sm:p-2 bg-accent-100 rounded-lg flex-shrink-0">
                <Icon name="heroicons:calculator" class="w-4 h-4 sm:w-5 sm:h-5 text-accent-600" />
              </div>
              <div class="min-w-0">
                <div class="text-lg sm:text-2xl font-bold text-secondary-800">{{ quickStats.averagePoints.toFixed(1) }}</div>
                <div class="text-xs text-secondary-500 truncate">{{ t('stats.quickStats.averagePoints') }}</div>
              </div>
            </div>
          </div>

          <!-- Consensus Rate -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="p-1.5 sm:p-2 bg-success-100 rounded-lg flex-shrink-0">
                <Icon name="heroicons:check-circle" class="w-4 h-4 sm:w-5 sm:h-5 text-success-600" />
              </div>
              <div class="min-w-0">
                <div class="text-lg sm:text-2xl font-bold text-secondary-800">{{ quickStats.consensusRate.toFixed(0) }}%</div>
                <div class="text-xs text-secondary-500 truncate">{{ t('stats.quickStats.consensusRate') }}</div>
              </div>
            </div>
          </div>

          <!-- Avg Voters -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="p-1.5 sm:p-2 bg-warning-100 rounded-lg flex-shrink-0">
                <Icon name="heroicons:users" class="w-4 h-4 sm:w-5 sm:h-5 text-warning-600" />
              </div>
              <div class="min-w-0">
                <div class="text-lg sm:text-2xl font-bold text-secondary-800">{{ quickStats.averageVotersPerStory.toFixed(1) }}</div>
                <div class="text-xs text-secondary-500 truncate">{{ t('stats.quickStats.avgVoters') }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Meeting Status (only if session is active) -->
      <section v-if="session" class="mb-6 sm:mb-8">
        <h2 class="text-base sm:text-lg font-semibold text-secondary-700 mb-3 sm:mb-4">
          <Icon name="heroicons:signal" class="w-5 h-5 inline mr-2 text-success-500" />
          {{ t('stats.meetingStatus.title') }}
        </h2>
        <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-4 sm:p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <!-- Status -->
            <div>
              <div class="text-xs text-secondary-500 mb-1">{{ t('stats.meetingStatus.status') }}</div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-success-500': meetingStatus.status === 'voting',
                    'bg-warning-500': meetingStatus.status === 'revealed',
                    'bg-secondary-400': meetingStatus.status === 'waiting',
                    'bg-primary-500': meetingStatus.status === 'completed',
                  }"
                />
                <span class="font-medium text-secondary-800 capitalize">{{ meetingStatus.status }}</span>
              </div>
            </div>

            <!-- Current Story -->
            <div>
              <div class="text-xs text-secondary-500 mb-1">{{ t('stats.meetingStatus.currentStory') }}</div>
              <div class="font-medium text-secondary-800 truncate">
                {{ meetingStatus.currentStory || t('stats.meetingStatus.noStory') }}
              </div>
            </div>

            <!-- Participation -->
            <div>
              <div class="text-xs text-secondary-500 mb-1">{{ t('stats.meetingStatus.participation') }}</div>
              <div class="font-medium text-secondary-800">{{ meetingStatus.participationRate.toFixed(0) }}%</div>
            </div>

            <!-- Participants -->
            <div>
              <div class="text-xs text-secondary-500 mb-1">{{ t('stats.meetingStatus.participants') }}</div>
              <div class="font-medium text-secondary-800">{{ meetingStatus.participantsOnline }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts -->
      <section class="mb-6 sm:mb-8">
        <h2 class="text-base sm:text-lg font-semibold text-secondary-700 mb-3 sm:mb-4">
          <Icon name="heroicons:chart-bar" class="w-5 h-5 inline mr-2 text-accent-500" />
          {{ t('stats.charts.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Line Chart: Points over time -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <h3 class="text-xs sm:text-sm font-medium text-secondary-600 mb-2 sm:mb-3">{{ t('stats.charts.pointsOverTime') }}</h3>
            <div class="h-48 sm:h-56">
              <ClientOnly>
                <StatsLineChart :data="pointsTimeSeries" />
                <template #fallback>
                  <div class="h-full flex items-center justify-center text-secondary-400">
                    <Icon name="heroicons:chart-bar" class="w-8 h-8 animate-pulse" />
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>

          <!-- Bar Chart: Card frequency -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4">
            <h3 class="text-xs sm:text-sm font-medium text-secondary-600 mb-2 sm:mb-3">{{ t('stats.charts.cardFrequency') }}</h3>
            <div class="h-48 sm:h-56">
              <ClientOnly>
                <StatsBarChart :data="cardFrequency" />
                <template #fallback>
                  <div class="h-full flex items-center justify-center text-secondary-400">
                    <Icon name="heroicons:chart-bar" class="w-8 h-8 animate-pulse" />
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>

          <!-- Doughnut Chart: Consensus -->
          <div class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4 md:col-span-2 lg:col-span-1">
            <h3 class="text-xs sm:text-sm font-medium text-secondary-600 mb-2 sm:mb-3">{{ t('stats.charts.consensusDistribution') }}</h3>
            <div class="h-48 sm:h-56">
              <ClientOnly>
                <StatsDoughnutChart
                  :consensus="consensusDistribution.consensus"
                  :no-consensus="consensusDistribution.noConsensus"
                />
                <template #fallback>
                  <div class="h-full flex items-center justify-center text-secondary-400">
                    <Icon name="heroicons:chart-pie" class="w-8 h-8 animate-pulse" />
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Stories -->
      <section>
        <h2 class="text-base sm:text-lg font-semibold text-secondary-700 mb-3 sm:mb-4">
          <Icon name="heroicons:clock" class="w-5 h-5 inline mr-2 text-warning-500" />
          {{ t('stats.recentStories.title') }}
        </h2>

        <div v-if="recentStories.length === 0" class="bg-white rounded-xl shadow-sm border border-secondary-100 p-6 sm:p-8 text-center">
          <Icon name="heroicons:inbox" class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-secondary-300" />
          <p class="text-sm sm:text-base text-secondary-500">{{ t('stats.recentStories.noStories') }}</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="story in recentStories"
            :key="story.id"
            class="bg-white rounded-xl shadow-sm border border-secondary-100 p-3 sm:p-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-medium text-secondary-800 text-sm sm:text-base line-clamp-2 sm:truncate">{{ story.story }}</h4>
                  <!-- Consensus badge (mobile: inline) -->
                  <div
                    v-if="story.hasConsensus"
                    class="sm:hidden flex-shrink-0 px-2 py-0.5 bg-success-100 text-success-700 text-xs font-medium rounded-full"
                  >
                    {{ t('results.consensus') }}
                  </div>
                </div>
                <p class="text-xs text-secondary-500 mt-0.5">{{ formatRelativeTime(story.timestamp) }}</p>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <!-- Stats -->
                <div class="flex items-center gap-4 sm:gap-3 text-sm">
                  <div class="text-center">
                    <div class="font-semibold text-secondary-700 text-sm">{{ story.average?.toFixed(1) ?? '-' }}</div>
                    <div class="text-xs text-secondary-400">{{ t('results.average') }}</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-secondary-700 text-sm">{{ story.median?.toFixed(1) ?? '-' }}</div>
                    <div class="text-xs text-secondary-400">{{ t('results.median') }}</div>
                  </div>
                  <div class="text-center">
                    <div class="font-semibold text-secondary-700 text-sm">{{ story.voterCount }}</div>
                    <div class="text-xs text-secondary-400">{{ t('results.votes') }}</div>
                  </div>
                </div>

                <!-- Consensus badge (desktop) -->
                <div
                  v-if="story.hasConsensus"
                  class="hidden sm:block px-2 py-1 bg-success-100 text-success-700 text-xs font-medium rounded-full"
                >
                  {{ t('results.consensus') }}
                </div>
              </div>
            </div>

            <!-- Vote distribution mini bar -->
            <div class="mt-2 sm:mt-3 flex gap-0.5 sm:gap-1 h-1.5 sm:h-2 rounded-full overflow-hidden bg-secondary-100">
              <div
                v-for="(dist, index) in story.distribution"
                :key="dist.value"
                class="h-full transition-all"
                :style="{
                  width: `${dist.percentage}%`,
                  backgroundColor: `hsl(${240 - index * 30}, 70%, 60%)`,
                }"
                :title="`${dist.value}: ${dist.count}× (${dist.percentage.toFixed(1)}%)`"
              />
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="mt-auto py-6 text-center text-sm text-secondary-500">
      <p>
        {{ t('app.name') }} -
        <Icon name="heroicons:heart-solid" class="w-4 h-4 inline text-error-500" />
        Nuxt 4
      </p>
    </footer>

    <!-- Clear Confirm Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showClearConfirm"
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          @click.self="showClearConfirm = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-error-100 rounded-full">
                <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-error-600" />
              </div>
              <h3 class="text-lg font-bold text-secondary-800">{{ t('stats.clearConfirm.title') }}</h3>
            </div>
            <p class="text-secondary-600 mb-6">{{ t('stats.clearConfirm.message') }}</p>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-secondary-600 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors"
                @click="showClearConfirm = false"
              >
                {{ t('stats.clearConfirm.cancel') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
                @click="handleClearStats"
              >
                {{ t('stats.clearConfirm.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
