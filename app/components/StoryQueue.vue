<script setup lang="ts">
/**
 * StoryQueue Component
 *
 * Displays the story queue and allows the host to manage it.
 */

import type { IStory } from '~/types/poker'

/**
 * Props Definition
 */
interface Props {
  /** List of stories */
  stories: IStory[]
  /** Index of current story */
  currentIndex: number
  /** Is the user the host? */
  isHost: boolean
  /** Session status */
  status: 'waiting' | 'voting' | 'revealed' | 'completed'
}

const props = defineProps<Props>()

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Add story */
  addStory: [title: string, description?: string]
  /** Remove story */
  removeStory: [storyId: string]
  /** Start next story */
  nextStory: []
  /** Edit story */
  editStory: [story: IStory]
}>()

/**
 * New story input
 */
const newStoryTitle = ref('')
const newStoryDescription = ref('')
const showAddForm = ref(false)

/**
 * Number of estimated stories
 */
const estimatedCount = computed(() => props.stories.filter(s => s.estimated).length)

/**
 * Remaining stories
 */
const remainingCount = computed(() => props.stories.length - estimatedCount.value)

/**
 * Is there a next story?
 */
const hasNextStory = computed(() => {
  if (props.currentIndex < 0) return props.stories.some(s => !s.estimated)
  return props.stories.slice(props.currentIndex + 1).some(s => !s.estimated)
})

/**
 * Add story
 */
function handleAddStory(): void {
  if (!newStoryTitle.value.trim()) return
  emit('addStory', newStoryTitle.value.trim(), newStoryDescription.value.trim() || undefined)
  newStoryTitle.value = ''
  newStoryDescription.value = ''
  showAddForm.value = false
}
</script>

<template>
  <div class="story-queue bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-2 bg-accent-100 rounded-lg text-accent-600">
          <Icon name="heroicons:queue-list" class="w-5 h-5" />
        </div>
        <h3 class="text-lg font-bold text-secondary-900">
          Story Queue
        </h3>
      </div>
      <div class="text-sm text-secondary-500">
        {{ estimatedCount }}/{{ stories.length }} estimated
      </div>
    </div>

    <!-- Fortschrittsbalken -->
    <div v-if="stories.length > 0" class="mb-4">
      <div class="h-2 bg-secondary-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-green-500 transition-all duration-500"
          :style="{ width: `${(estimatedCount / stories.length) * 100}%` }"
        />
      </div>
    </div>

    <!-- Story Liste -->
    <div v-if="stories.length > 0" class="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
      <div
        v-for="(story, index) in stories"
        :key="story.id"
        class="flex items-center gap-3 p-3 rounded-lg transition-all"
        :class="{
          'bg-primary-50 border border-primary-200': index === currentIndex,
          'bg-green-50 border border-green-200': story.estimated,
          'bg-secondary-50': !story.estimated && index !== currentIndex,
        }"
      >
        <!-- Status Icon -->
        <div class="flex-shrink-0">
          <Icon
            v-if="story.estimated"
            name="heroicons:check-circle"
            class="w-5 h-5 text-green-500"
          />
          <Icon
            v-else-if="index === currentIndex"
            name="heroicons:play-circle"
            class="w-5 h-5 text-primary-500 animate-pulse"
          />
          <Icon
            v-else
            name="heroicons:clock"
            class="w-5 h-5 text-secondary-400"
          />
        </div>

        <!-- Story Info -->
        <div class="flex-1 min-w-0">
          <div class="font-medium text-secondary-800 truncate">
            {{ story.title }}
          </div>
          <div v-if="story.estimated && story.estimatedValue" class="text-xs text-green-600">
            Estimated: {{ story.estimatedValue }}
          </div>
        </div>

        <!-- Actions (nur Host) -->
        <div v-if="isHost && !story.estimated" class="flex gap-1">
          <button
            type="button"
            class="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
            title="Edit"
            @click="emit('editStory', story)"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-1 text-secondary-400 hover:text-red-500 transition-colors"
            title="Remove"
            @click="emit('removeStory', story.id)"
          >
            <Icon name="heroicons:trash" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty queue -->
    <div v-else class="text-center py-6 text-secondary-500">
      <Icon name="heroicons:document-plus" class="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p class="text-sm">No stories yet</p>
    </div>

    <!-- Host Controls -->
    <div v-if="isHost" class="space-y-3 pt-3 border-t border-secondary-100">
      <!-- Add Story Form -->
      <Transition name="slide-up">
        <div v-if="showAddForm" class="space-y-2">
          <input
            v-model="newStoryTitle"
            type="text"
            class="input text-sm"
            placeholder="Story title..."
            @keyup.enter="handleAddStory"
          >
          <textarea
            v-model="newStoryDescription"
            class="input text-sm min-h-[60px] resize-y"
            placeholder="Description (Markdown)..."
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="btn-primary flex-1 text-sm py-1.5"
              :disabled="!newStoryTitle.trim()"
              @click="handleAddStory"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
              Add
            </button>
            <button
              type="button"
              class="btn-secondary text-sm py-1.5"
              @click="showAddForm = false"
            >
              Cancel
            </button>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Action Buttons -->
      <div v-if="!showAddForm" class="flex gap-2">
        <button
          type="button"
          class="btn-secondary flex-1 text-sm"
          @click="showAddForm = true"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
          Add Story
        </button>

        <button
          v-if="hasNextStory && (status === 'revealed' || status === 'waiting')"
          type="button"
          class="btn-primary flex-1 text-sm"
          @click="emit('nextStory')"
        >
          <Icon name="heroicons:forward" class="w-4 h-4 mr-1" />
          {{ currentIndex < 0 ? 'Start' : 'Next Story' }}
        </button>
      </div>

      <!-- Remaining Info -->
      <div v-if="remainingCount > 0" class="text-xs text-secondary-500 text-center">
        {{ remainingCount }} {{ remainingCount === 1 ? 'story' : 'stories' }} remaining
      </div>
    </div>
  </div>
</template>
