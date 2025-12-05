<script setup lang="ts">
/**
 * StoryPreview Component
 *
 * Modal for displaying story details during voting.
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Props Definition
 */
interface Props {
  /** Story title */
  title: string
  /** Story description (Markdown) */
  description: string | null
  /** Modal visible? */
  visible: boolean
}

const props = defineProps<Props>()

/**
 * Events Definition
 */
const emit = defineEmits<{
  close: []
}>()

/**
 * Parsed and sanitized description
 */
const parsedDescription = computed(() => {
  if (!props.description) return ''
  const rawHtml = marked.parse(props.description) as string
  return DOMPurify.sanitize(rawHtml)
})

/**
 * Close on Escape
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
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-secondary-100">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
                <Icon name="heroicons:document-text" class="w-5 h-5" />
              </div>
              <h3 class="text-lg font-bold text-secondary-900">
                {{ title }}
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
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <!--
              eslint-disable vue/no-v-html
              Reason: HTML is sanitized with DOMPurify to prevent XSS
            -->
            <div
              v-if="description"
              class="prose prose-sm max-w-none"
              v-html="parsedDescription"
            />
            <!-- eslint-enable vue/no-v-html -->
            <p v-else class="text-secondary-500 italic">
              No description available.
            </p>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-secondary-50 border-t border-secondary-100">
            <button
              type="button"
              class="btn-primary w-full"
              @click="emit('close')"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
