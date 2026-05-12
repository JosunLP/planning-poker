<script setup lang="ts">
/**
 * AddStoryModal Component
 *
 * Modal for adding a new story to the queue or starting a vote directly.
 * Supports pasting rich-text content (from Jira, MS Word, etc.) which is
 * automatically converted to Markdown via Turndown.
 */

import type TurndownService from 'turndown'

const { t } = useI18n()

/**
 * Lazy Turndown instance promise for HTML → Markdown conversion
 */
const turndownServicePromise = shallowRef<Promise<TurndownService> | null>(null)

async function getTurndownService(): Promise<TurndownService> {
  turndownServicePromise.value ||= import('turndown')
    .then(({ default: TurndownService }) =>
      new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' }),
    )
    .catch((error) => {
      turndownServicePromise.value = null
      throw error
    })

  return turndownServicePromise.value
}

/**
 * Props Definition
 */
interface Props {
  /** Is the modal visible? */
  visible: boolean
  /** Mode: add to queue or start voting directly */
  mode?: 'queue' | 'vote'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vote',
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  close: []
  submit: [title: string, description?: string]
}>()

/**
 * Form data
 */
const title = ref('')
const description = ref('')

/**
 * Reset form when modal opens
 */
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    title.value = ''
    description.value = ''
  }
})

/**
 * Handle paste into description field.
 * If the clipboard contains HTML (e.g. from Jira, MS Word), convert it to
 * Markdown using Turndown and replace the selection instead of inserting raw HTML.
 */
function insertDescriptionText(target: HTMLTextAreaElement, text: string): void {
  const insertPos = target.selectionStart ?? description.value.length
  const end = target.selectionEnd ?? insertPos
  description.value = description.value.slice(0, insertPos) + text + description.value.slice(end)

  nextTick(() => {
    target.selectionStart = insertPos + text.length
    target.selectionEnd = insertPos + text.length
  })
}

async function handleDescriptionPaste(event: ClipboardEvent): Promise<void> {
  const html = event.clipboardData?.getData('text/html')
  if (!html) return

  event.preventDefault()
  const target = event.target as HTMLTextAreaElement
  const plainText = event.clipboardData?.getData('text/plain') ?? html

  try {
    const markdown = (await getTurndownService()).turndown(html)
    insertDescriptionText(target, markdown)
  }
  catch (error) {
    console.error('Failed to load Turndown for rich-text paste conversion.', error)
    insertDescriptionText(target, plainText)
  }
}

/**
 * Handle form submission
 */
function handleSubmit(): void {
  if (!title.value.trim()) return
  emit('submit', title.value.trim(), description.value.trim() || undefined)
  emit('close')
}

/**
 * Handle escape key
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-secondary-100">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
                <Icon :name="mode === 'queue' ? 'heroicons:queue-list' : 'heroicons:play'" class="w-5 h-5" />
              </div>
              <h3 class="text-lg font-bold text-secondary-900">
                {{ mode === 'queue' ? t('storyQueue.addStory') : t('controls.startVoting') }}
              </h3>
            </div>
            <button
              type="button"
              class="p-2 text-secondary-400 hover:text-secondary-600 transition-colors rounded-lg hover:bg-secondary-100"
              @click="emit('close')"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label for="story-title" class="block text-sm font-medium text-secondary-700 mb-1">
                {{ t('controls.storyTitle') }}
              </label>
              <input
                id="story-title"
                v-model="title"
                type="text"
                class="input"
                :placeholder="t('controls.storyTitlePlaceholder')"
                autofocus
              >
            </div>

            <div>
              <label for="story-description" class="block text-sm font-medium text-secondary-700 mb-1">
                {{ t('controls.description') }}
                <span class="text-secondary-400 font-normal">({{ t('storyQueue.optional') }})</span>
              </label>
              <textarea
                id="story-description"
                v-model="description"
                class="input min-h-[120px] resize-y"
                :placeholder="t('controls.descriptionPlaceholder')"
                @paste="handleDescriptionPaste"
              />
              <p class="mt-1 text-xs text-secondary-500">
                {{ t('storyQueue.markdownSupported') }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="btn-secondary flex-1"
                @click="emit('close')"
              >
                {{ t('storyQueue.cancel') }}
              </button>
              <button
                type="submit"
                class="btn-primary flex-1"
                :disabled="!title.trim()"
              >
                <Icon :name="mode === 'queue' ? 'heroicons:plus' : 'heroicons:play'" class="w-5 h-5 mr-2" />
                {{ mode === 'queue' ? t('storyQueue.addToQueue') : t('controls.startVoting') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
