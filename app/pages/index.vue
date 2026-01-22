<script setup lang="ts">
/**
 * Index Page
 *
 * Homepage of the Planning Poker application.
 * Enables creating a new session or displays the active session.
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'

const { t } = useI18n()

/**
 * Session composable for state management
 */
const {
  session,
  currentParticipant,
  isHost,
  voters,
  allVotesIn,
  joinCode,
  error,
  connectionStatus,
  createSession,
  joinSession,
  selectCard,
  revealCards,
  startVoting,
  addStory,
  removeStory,
  nextStory,
  resetVoting,
  leaveSession,
  clearError,
} = useSession()

/**
 * Parsed and sanitized Markdown Description
 */
const parsedDescription = computed(() => {
  if (!session.value?.currentStoryDescription) return ''
  const rawHtml = marked.parse(session.value.currentStoryDescription, { async: false }) as string
  return DOMPurify.sanitize(rawHtml)
})

/**
 * Story Preview Modal State
 */
const showStoryPreview = ref(false)

/**
 * Story Examples Modal State
 */
const showStoryExamples = ref(false)

/**
 * Route for Join-Code from URL
 */
const route = useRoute()

/**
 * Current mode: 'create' or 'join'
 */
const mode = ref<'create' | 'join'>('create')

/**
 * Join-Code from URL (for pre-filling)
 */
const initialJoinCode = ref('')

/**
 * Join-Code from URL parameter
 */
onMounted(() => {
  const urlJoinCode = route.query.join as string
  if (urlJoinCode) {
    mode.value = 'join'
    initialJoinCode.value = urlJoinCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  }
})

/**
 * SEO Meta Data
 */
useSeoMeta({
  title: t('app.name') + ' - ' + t('app.tagline'),
  description: t('app.tagline'),
})

/**
 * Handles creating a new session
 */
function handleCreateSession(sessionName: string, participantName: string): void {
  createSession(sessionName, participantName)
}

/**
 * Handles joining a session
 */
function handleJoinSession(code: string, participantName: string, asObserver: boolean): void {
  joinSession(code, participantName, asObserver)
}

/**
 * Switches the mode
 */
function switchMode(newMode: 'create' | 'join'): void {
  mode.value = newMode
  clearError()
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-secondary-200/50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Icon name="heroicons:squares-2x2" class="w-8 h-8 text-primary-600" />
            <h1 class="text-xl font-bold text-secondary-800">
              Planning Poker
            </h1>
            <!-- Connection Status -->
            <div
              class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              :class="{
                'bg-success-100 text-success-700': connectionStatus === 'connected',
                'bg-warning-100 text-warning-700': connectionStatus === 'connecting',
                'bg-secondary-100 text-secondary-600': connectionStatus === 'disconnected',
                'bg-error-100 text-error-700': connectionStatus === 'error',
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-success-500': connectionStatus === 'connected',
                  'bg-warning-500 animate-pulse': connectionStatus === 'connecting',
                  'bg-secondary-400': connectionStatus === 'disconnected',
                  'bg-error-500': connectionStatus === 'error',
                }"
              />
              <span class="hidden sm:inline">
                {{ connectionStatus === 'connected' ? t('connection.connected') :
                   connectionStatus === 'connecting' ? t('connection.connecting') :
                   connectionStatus === 'error' ? t('connection.error') : t('connection.disconnected') }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <LanguageSwitcher />
            <div v-if="session" class="text-sm text-secondary-600">
              {{ t('session.info.sessionLabel') }} <span class="font-medium">{{ session.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- No session active - display form -->
      <div v-if="!session" class="py-12">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-secondary-800 mb-2">
            {{ t('home.welcome') }}
          </h2>
          <p class="text-secondary-600">
            {{ t('home.subtitle') }}
          </p>
        </div>

        <!-- Mode Tabs -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex rounded-lg bg-secondary-100 p-1">
            <button
              type="button"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
              :class="mode === 'create'
                ? 'bg-white shadow text-primary-700'
                : 'text-secondary-600 hover:text-secondary-800'"
              @click="switchMode('create')"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 inline mr-1" />
              {{ t('home.newSession') }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
              :class="mode === 'join'
                ? 'bg-white shadow text-primary-700'
                : 'text-secondary-600 hover:text-secondary-800'"
              @click="switchMode('join')"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 inline mr-1" />
              {{ t('home.join') }}
            </button>
          </div>
        </div>

        <!-- Create or Join Form -->
        <CreateSessionForm
          v-if="mode === 'create'"
          @create="handleCreateSession"
        />

        <JoinSessionForm
          v-else
          :error="error"
          :initial-code="initialJoinCode"
          @join="handleJoinSession"
          @switch-to-create="switchMode('create')"
          @clear-error="clearError"
        />

        <!-- Features -->
        <div class="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div class="text-center p-6 bg-white rounded-xl shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="heroicons:users" class="w-6 h-6 text-primary-600" />
            </div>
            <h3 class="font-semibold text-secondary-800 mb-2">{{ t('features.teamEstimation.title') }}</h3>
            <p class="text-sm text-secondary-600">
              {{ t('features.teamEstimation.description') }}
            </p>
          </div>

          <div class="text-center p-6 bg-white rounded-xl shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="heroicons:chart-bar" class="w-6 h-6 text-accent-600" />
            </div>
            <h3 class="font-semibold text-secondary-800 mb-2">{{ t('features.statistics.title') }}</h3>
            <p class="text-sm text-secondary-600">
              {{ t('features.statistics.description') }}
            </p>
          </div>

          <div class="text-center p-6 bg-white rounded-xl shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="heroicons:bolt" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="font-semibold text-secondary-800 mb-2">{{ t('features.quickEasy.title') }}</h3>
            <p class="text-sm text-secondary-600">
              {{ t('features.quickEasy.description') }}
            </p>
          </div>
        </div>

        <!-- Story Examples Button -->
        <div class="mt-8 text-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
            @click="showStoryExamples = true"
          >
            <Icon name="heroicons:book-open" class="w-5 h-5" />
            {{ t('storyExamples.openButton') }}
          </button>
        </div>
      </div>

      <!-- Session active -->
      <div v-else class="grid lg:grid-cols-12 gap-6">
        <!-- Left column: Session info, participants & controls -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Session Info with Join-Code -->
          <SessionInfo
            :session-name="session.name"
            :join-code="joinCode"
            :participant-count="session.participants.length"
            @leave="leaveSession"
          />

          <ParticipantList
            :participants="session.participants"
            :revealed="session.cardsRevealed"
            :current-user-id="currentParticipant?.id"
          />

          <!-- Unified Host Controls -->
          <HostControls
            :is-host="isHost"
            :status="session.status"
            :all-votes-in="allVotesIn"
            :current-story="session.currentStory"
            :story-queue="session.storyQueue"
            :current-story-index="session.currentStoryIndex"
            @start-voting="startVoting"
            @reveal="revealCards"
            @reset="resetVoting"
            @next-story="nextStory"
            @add-story="addStory"
            @remove-story="removeStory"
          />
        </div>

        <!-- Middle column: Main area -->
        <div class="lg:col-span-6">
          <Transition name="slide-up" mode="out-in">
            <!-- Current Story -->
            <div v-if="session.currentStory" class="card-container mb-6">
              <div class="flex items-center justify-between mb-1">
                <div class="text-xs text-secondary-500">{{ t('session.currentStory') }}</div>
                <button
                  v-if="session.currentStoryDescription"
                  type="button"
                  class="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  @click="showStoryPreview = true"
                >
                  <Icon name="heroicons:eye" class="w-3 h-3" />
                  {{ t('session.showDetails') }}
                </button>
              </div>
              <h2 class="text-xl font-bold text-secondary-800 mb-2">
                {{ session.currentStory }}
              </h2>
              <!--
                eslint-disable vue/no-v-html
                Reason: HTML is sanitized with DOMPurify to prevent XSS attacks
              -->
              <div
                v-if="session.currentStoryDescription"
                class="prose prose-sm max-w-none text-secondary-600 bg-secondary-50 p-3 rounded-lg line-clamp-3"
                v-html="parsedDescription"
              />
              <!-- eslint-enable vue/no-v-html -->
            </div>

            <!-- Waiting Status -->
            <div v-else class="card-container mb-6 text-center py-8">
              <Icon name="heroicons:clock" class="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p class="text-secondary-500">
                {{ t('session.waitingForHost') }}
              </p>
            </div>
          </Transition>

          <Transition name="slide-up" mode="out-in">
            <!-- Card selection -->
            <div
              v-if="session.status === 'voting' && !currentParticipant?.isObserver"
              class="card-container"
            >
              <CardDeck
                :selected-value="currentParticipant?.selectedValue ?? null"
                :disabled="session.cardsRevealed"
                @select="selectCard"
              />
              <!-- Story Examples Help Button -->
              <div class="mt-4 text-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-500 hover:text-primary-600 bg-secondary-50 hover:bg-primary-50 rounded-lg transition-colors"
                  @click="showStoryExamples = true"
                >
                  <Icon name="heroicons:book-open" class="w-4 h-4" />
                  {{ t('storyExamples.openButton') }}
                </button>
              </div>
            </div>

            <!-- Observer hint -->
            <div
              v-else-if="currentParticipant?.isObserver"
              class="card-container text-center py-8"
            >
              <Icon name="heroicons:eye" class="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p class="text-secondary-500">
                {{ t('observer.hint') }}
              </p>
            </div>
          </Transition>
        </div>

        <!-- Right column: Results -->
        <div class="lg:col-span-3">
          <Transition name="slide-up" mode="out-in">
            <div v-if="session.cardsRevealed">
              <VotingResult
                :participants="voters"
                :story="session.currentStory"
                :description="session.currentStoryDescription"
              />
            </div>

            <div v-else class="card-container text-center py-8">
              <Icon name="heroicons:eye-slash" class="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p class="text-secondary-500">
                {{ t('results.hiddenUntilReveal') }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="mt-auto py-6 text-center text-sm text-secondary-500">
      <p>
        {{ t('app.name') }} -
        <Icon name="heroicons:heart-solid" class="w-4 h-4 inline text-error-500" />
        Nuxt 3
      </p>
    </footer>

    <!-- Story Preview Modal -->
    <StoryPreview
      v-if="session"
      :visible="showStoryPreview"
      :title="session.currentStory || ''"
      :description="session.currentStoryDescription"
      @close="showStoryPreview = false"
    />

    <!-- Story Examples Modal -->
    <StoryExamplesModal
      :visible="showStoryExamples"
      @close="showStoryExamples = false"
    />
  </div>
</template>
