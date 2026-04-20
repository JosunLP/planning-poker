<script setup lang="ts">
/**
 * HostControls Component
 *
 * Unified control panel for session hosts.
 * Combines story queue management and voting controls.
 */

import type { IStory } from '~/types/poker'

const { t } = useI18n()

/**
 * Props Definition
 */
interface Props {
  /** Is the user the host? */
  isHost: boolean
  /** Current session status */
  status: 'waiting' | 'voting' | 'revealed' | 'completed'
  /** Are all votes in? */
  allVotesIn: boolean
  /** Reveal cards automatically once everyone voted */
  autoReveal: boolean
  /** Current story */
  currentStory?: string | null
  /** Story queue */
  storyQueue: IStory[]
  /** Current story index */
  currentStoryIndex: number
}

const props = withDefaults(defineProps<Props>(), {
  currentStory: null,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  startVoting: [story: string, description?: string]
  reveal: []
  updateAutoReveal: [value: boolean]
  reset: []
  nextStory: []
  addStory: [title: string, description?: string]
  removeStory: [storyId: string]
}>()

/**
 * Modal state
 */
const showAddModal = ref(false)
const addMode = ref<'vote' | 'queue'>('vote')

/**
 * Computed values
 */
const hasStoryQueue = computed(() => props.storyQueue.length > 0)
const estimatedCount = computed(() => props.storyQueue.filter(s => s.estimated).length)
const hasNextStory = computed(() => {
  if (props.currentStoryIndex < 0) return props.storyQueue.some(s => !s.estimated)
  return props.storyQueue.slice(props.currentStoryIndex + 1).some(s => !s.estimated)
})

/**
 * Open modal for adding story
 */
function openAddModal(mode: 'vote' | 'queue'): void {
  addMode.value = mode
  showAddModal.value = true
}

/**
 * Handle story submission from modal
 */
function handleStorySubmit(title: string, description?: string): void {
  if (addMode.value === 'vote') {
    emit('startVoting', title, description)
  } else {
    emit('addStory', title, description)
  }
}
</script>

<template>
  <div v-if="isHost" class="host-controls bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-secondary-100">
      <div class="p-2 bg-white rounded-lg shadow-sm">
        <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 text-primary-600" />
      </div>
      <div>
        <h3 class="font-bold text-secondary-900">{{ t('controls.title') }}</h3>
        <p class="text-xs text-secondary-500">{{ t('controls.hostOnly') }}</p>
      </div>
    </div>

    <!-- Story Queue (if has stories) -->
    <div v-if="hasStoryQueue" class="p-4 border-b border-secondary-100">
      <!-- Progress -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-secondary-700">{{ t('storyQueue.title') }}</span>
        <span class="text-xs text-secondary-500">
          {{ estimatedCount }}/{{ storyQueue.length }} {{ t('storyQueue.estimated') }}
        </span>
      </div>

      <div class="h-2 bg-secondary-100 rounded-full overflow-hidden mb-4">
        <div
          class="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
          :style="{ width: `${storyQueue.length > 0 ? (estimatedCount / storyQueue.length) * 100 : 0}%` }"
        />
      </div>

      <!-- Story List -->
      <div class="space-y-2 max-h-[200px] overflow-y-auto overscroll-contain scrollbar-thin">
        <div
          v-for="(story, index) in storyQueue"
          :key="story.id"
          class="flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm"
          :class="{
            'bg-primary-50 border border-primary-200': index === currentStoryIndex,
            'bg-green-50 border border-green-200': story.estimated && index !== currentStoryIndex,
            'bg-secondary-50 hover:bg-secondary-100': !story.estimated && index !== currentStoryIndex,
          }"
        >
          <!-- Status Icon -->
          <Icon
            v-if="story.estimated"
            name="heroicons:check-circle"
            class="w-4 h-4 text-green-500 flex-shrink-0"
          />
          <Icon
            v-else-if="index === currentStoryIndex"
            name="heroicons:play-circle"
            class="w-4 h-4 text-primary-500 animate-pulse flex-shrink-0"
          />
          <Icon
            v-else
            name="heroicons:clock"
            class="w-4 h-4 text-secondary-400 flex-shrink-0"
          />

          <!-- Story Title -->
          <span class="flex-1 truncate" :class="story.estimated ? 'text-green-700' : 'text-secondary-700'">
            {{ story.title }}
          </span>

          <!-- Estimated Value -->
          <span v-if="story.estimated && story.estimatedValue" class="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
            {{ story.estimatedValue }}
          </span>

          <!-- Remove Button -->
          <button
            v-if="!story.estimated"
            type="button"
            class="p-1 text-secondary-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            :title="t('storyQueue.remove')"
            @click="emit('removeStory', story.id)"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Current Status & Actions -->
    <div class="p-4 space-y-3">
      <label class="flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-3 cursor-pointer">
        <input
          :checked="autoReveal"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          @change="emit('updateAutoReveal', ($event.target as HTMLInputElement).checked)"
        >
        <div class="min-w-0">
          <div class="text-sm font-medium text-secondary-800">
            {{ t('controls.autoReveal') }}
          </div>
          <p class="text-xs text-secondary-500">
            {{ t('controls.autoRevealHint') }}
          </p>
        </div>
      </label>

      <!-- Voting Active -->
      <template v-if="status === 'voting'">
        <div class="p-3 bg-primary-50 rounded-lg border border-primary-100">
          <div class="flex items-center gap-2 text-primary-700">
            <Icon name="heroicons:clock" class="w-4 h-4 animate-pulse" />
            <span class="text-sm font-medium">{{ t('controls.votingInProgress') }}</span>
          </div>
          <p class="text-xs text-primary-600 mt-1 truncate">{{ currentStory }}</p>
        </div>

        <button
          type="button"
          class="btn-primary w-full"
          :class="{ 'animate-pulse': allVotesIn }"
          @click="emit('reveal')"
        >
          <Icon name="heroicons:eye" class="w-5 h-5 mr-2" />
          {{ t('controls.revealCards') }}
          <span v-if="allVotesIn" class="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {{ t('controls.allVotesIn') }}
          </span>
        </button>

        <button
          type="button"
          class="btn-secondary w-full"
          @click="emit('reset')"
        >
          <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
          {{ t('controls.resetVoting') }}
        </button>
      </template>

      <!-- Results Revealed -->
      <template v-else-if="status === 'revealed'">
        <div class="p-3 bg-green-50 rounded-lg border border-green-100">
          <div class="flex items-center gap-2 text-green-700">
            <Icon name="heroicons:check-circle" class="w-4 h-4" />
            <span class="text-sm font-medium">{{ t('controls.votingComplete') }}</span>
          </div>
          <p class="text-xs text-green-600 mt-1 truncate">{{ currentStory }}</p>
        </div>

        <div class="flex gap-2">
          <button
            v-if="hasNextStory"
            type="button"
            class="btn-primary flex-1"
            @click="emit('nextStory')"
          >
            <Icon name="heroicons:forward" class="w-5 h-5 mr-2" />
            {{ t('controls.nextStory') }}
          </button>
          <button
            type="button"
            class="btn-secondary"
            :class="{ 'flex-1': !hasNextStory }"
            @click="emit('reset')"
          >
            <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
            {{ hasNextStory ? '' : t('controls.resetVoting') }}
          </button>
        </div>
      </template>

      <!-- Waiting - Start Voting -->
      <template v-else>
        <div class="flex gap-2">
          <button
            v-if="hasNextStory"
            type="button"
            class="btn-primary flex-1"
            @click="emit('nextStory')"
          >
            <Icon name="heroicons:play" class="w-5 h-5 mr-2" />
            {{ t('controls.startVoting') }}
          </button>
          <button
            v-else
            type="button"
            class="btn-primary flex-1"
            @click="openAddModal('vote')"
          >
            <Icon name="heroicons:play" class="w-5 h-5 mr-2" />
            {{ t('controls.startVoting') }}
          </button>
        </div>
      </template>

      <!-- Add Story Button -->
      <button
        v-if="status !== 'voting'"
        type="button"
        class="btn-secondary w-full"
        @click="openAddModal('queue')"
      >
        <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
        {{ t('storyQueue.addStory') }}
      </button>
    </div>

    <!-- Add Story Modal -->
    <AddStoryModal
      :visible="showAddModal"
      :mode="addMode"
      @close="showAddModal = false"
      @submit="handleStorySubmit"
    />
  </div>
</template>
