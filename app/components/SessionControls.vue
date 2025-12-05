<script setup lang="ts">
/**
 * SessionControls Component
 *
 * Control elements for the session host.
 */

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
  /** Current story */
  currentStory?: string | null
  /** Is there a story queue? */
  hasStoryQueue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentStory: null,
  hasStoryQueue: false,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Starts a new voting round */
  startVoting: [story: string, description?: string]
  /** Reveals the cards */
  reveal: []
  /** Resets the round */
  reset: []
  /** Next story from queue */
  nextStory: []
}>()

/**
 * Story input value
 */
const storyInput = ref('')
const descriptionInput = ref('')

/**
 * Starts the voting
 */
function handleStartVoting(): void {
  if (storyInput.value.trim()) {
    emit('startVoting', storyInput.value.trim(), descriptionInput.value.trim() || undefined)
    storyInput.value = ''
    descriptionInput.value = ''
  }
}
</script>

<template>
  <div v-if="props.isHost" class="session-controls bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center gap-2 mb-4">
      <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
        <Icon name="heroicons:adjustments-horizontal" class="w-5 h-5" />
      </div>
      <h3 class="text-lg font-bold text-secondary-900">
        Controls
      </h3>
    </div>

    <!-- Start new round (only when no story queue) -->
    <div v-if="(props.status === 'waiting' || props.status === 'revealed') && !props.hasStoryQueue" class="space-y-3">
      <div>
        <label for="story-input" class="block text-sm font-medium text-secondary-700 mb-1">
          Story / Task
        </label>
        <input
          id="story-input"
          v-model="storyInput"
          type="text"
          class="input"
          placeholder="e.g. User Story #123"
          @keyup.enter="handleStartVoting"
        >
      </div>

      <div>
        <label for="story-desc" class="block text-sm font-medium text-secondary-700 mb-1">
          Description (Markdown)
        </label>
        <textarea
          id="story-desc"
          v-model="descriptionInput"
          class="input min-h-[100px] resize-y"
          placeholder="Story details..."
        />
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :disabled="!storyInput.trim()"
        @click="handleStartVoting"
      >
        <Icon name="heroicons:play" class="w-5 h-5 mr-2" />
        Start New Round
      </button>
    </div>

    <!-- Waiting for start (with story queue) -->
    <div v-else-if="props.status === 'waiting' && props.hasStoryQueue" class="text-center py-4">
      <Icon name="heroicons:queue-list" class="w-8 h-8 text-secondary-300 mx-auto mb-2" />
      <p class="text-sm text-secondary-500">
        Use the Story Queue to start the next round.
      </p>
    </div>

    <!-- Active voting -->
    <div v-else-if="props.status === 'voting'" class="space-y-3">
      <div class="p-3 bg-primary-50 rounded-lg">
        <div class="text-xs text-primary-600 mb-1">Current Story</div>
        <div class="font-medium text-primary-800">{{ props.currentStory }}</div>
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :class="{ 'animate-pulse': props.allVotesIn }"
        @click="emit('reveal')"
      >
        <Icon name="heroicons:eye" class="w-5 h-5 mr-2" />
        Reveal Cards
        <span v-if="props.allVotesIn" class="ml-2 text-xs">(Everyone has voted!)</span>
      </button>

      <button
        type="button"
        class="btn-secondary w-full"
        @click="emit('reset')"
      >
        <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
        Reset
      </button>
    </div>

    <!-- Results shown (with story queue) -->
    <div v-else-if="props.status === 'revealed' && props.hasStoryQueue" class="space-y-3">
      <div class="p-3 bg-green-50 rounded-lg border border-green-200">
        <div class="text-xs text-green-600 mb-1">Voting completed</div>
        <div class="font-medium text-green-800">{{ props.currentStory }}</div>
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        @click="emit('nextStory')"
      >
        <Icon name="heroicons:forward" class="w-5 h-5 mr-2" />
        Next Story
      </button>

      <button
        type="button"
        class="btn-secondary w-full"
        @click="emit('reset')"
      >
        <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
        Vote Again
      </button>
    </div>
  </div>
</template>
