<script setup lang="ts">
/**
 * JoinSessionForm Component
 *
 * Form for joining an existing Planning Poker session.
 */

import { formatJoinCode, JOIN_CODE_LENGTH } from '~/types/poker';

/**
 * Props Definition
 */
interface Props {
  /** Error message to display */
  error?: string | null
  /** Pre-filled join code (e.g. from URL) */
  initialCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  initialCode: '',
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Emitted when joining a session */
  join: [joinCode: string, participantName: string, asObserver: boolean]
  /** Switch to session creation */
  switchToCreate: []
  /** Error was dismissed */
  clearError: []
}>()

/**
 * Form data
 */
const joinCode = ref(props.initialCode)
const participantName = ref('')
const asObserver = ref(false)

/**
 * Apply initial code when it changes
 */
watch(() => props.initialCode, (newCode) => {
  if (newCode && !joinCode.value) {
    joinCode.value = newCode
  }
})

/**
 * Format join code (uppercase, allowed characters only)
 */
const formattedJoinCode = computed({
  get: () => joinCode.value,
  set: (value: string) => {
    joinCode.value = formatJoinCode(value)
  },
})

/**
 * Validation
 */
const isValid = computed(() =>
  joinCode.value.trim().length === JOIN_CODE_LENGTH &&
  participantName.value.trim().length > 0
)

/**
 * Handles form submission
 */
function handleSubmit(): void {
  if (isValid.value) {
    emit('join', joinCode.value.trim(), participantName.value.trim(), asObserver.value)
  }
}

/**
 * Closes the error message
 */
function handleCloseError(): void {
  emit('clearError')
}
</script>

<template>
  <form class="card-container max-w-md mx-auto" @submit.prevent="handleSubmit">
    <h2 class="text-xl font-bold text-secondary-800 mb-6 text-center">
      Join Session
    </h2>

    <!-- Error message -->
    <div
      v-if="props.error"
      class="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg flex items-center justify-between"
    >
      <span class="text-error-700 text-sm">{{ props.error }}</span>
      <button
        type="button"
        class="text-error-500 hover:text-error-700"
        @click="handleCloseError"
      >
        <Icon name="heroicons:x-mark" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label for="join-code" class="block text-sm font-medium text-secondary-700 mb-1">
          Join Code
        </label>
        <input
          id="join-code"
          v-model="formattedJoinCode"
          type="text"
          class="input text-center text-2xl tracking-widest font-mono uppercase"
          placeholder="ABC123"
          maxlength="6"
          required
        >
        <p class="mt-1 text-xs text-secondary-500">
          6-character code from the session host
        </p>
      </div>

      <div>
        <label for="participant-name-join" class="block text-sm font-medium text-secondary-700 mb-1">
          Your Name
        </label>
        <input
          id="participant-name-join"
          v-model="participantName"
          type="text"
          class="input"
          placeholder="e.g. John Doe"
          required
        >
      </div>

      <div class="flex items-center gap-2">
        <input
          id="as-observer"
          v-model="asObserver"
          type="checkbox"
          class="w-4 h-4 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
        >
        <label for="as-observer" class="text-sm text-secondary-700">
          Join as observer (without voting rights)
        </label>
      </div>

      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="!isValid"
      >
        <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 mr-2" />
        Join
      </button>

      <div class="text-center pt-4 border-t border-secondary-200">
        <p class="text-sm text-secondary-500 mb-2">
          No session yet?
        </p>
        <button
          type="button"
          class="btn-secondary"
          @click="emit('switchToCreate')"
        >
          <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
          Create New Session
        </button>
      </div>
    </div>
  </form>
</template>
