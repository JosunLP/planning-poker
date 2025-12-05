<script setup lang="ts">
/**
 * JoinSessionForm Komponente
 *
 * Formular zum Beitreten einer bestehenden Planning Poker Session.
 */

/**
 * Props Definition
 */
interface Props {
  /** Fehler-Nachricht zum Anzeigen */
  error?: string | null
  /** Vorausgefüllter Join-Code (z.B. aus URL) */
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
  /** Wird ausgelöst wenn einer Session beigetreten werden soll */
  join: [joinCode: string, participantName: string, asObserver: boolean]
  /** Wechsel zur Session-Erstellung */
  switchToCreate: []
  /** Fehler wurde geschlossen */
  clearError: []
}>()

/**
 * Formular-Daten
 */
const joinCode = ref(props.initialCode)
const participantName = ref('')
const asObserver = ref(false)

/**
 * Initialen Code übernehmen wenn er sich ändert
 */
watch(() => props.initialCode, (newCode) => {
  if (newCode && !joinCode.value) {
    joinCode.value = newCode
  }
})

/**
 * Join-Code formatieren (Großbuchstaben, nur erlaubte Zeichen)
 */
const formattedJoinCode = computed({
  get: () => joinCode.value,
  set: (value: string) => {
    // Nur erlaubte Zeichen, max 6 Zeichen
    joinCode.value = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
  },
})

/**
 * Validierung
 */
const isValid = computed(() =>
  joinCode.value.trim().length === 6 &&
  participantName.value.trim().length > 0
)

/**
 * Behandelt das Absenden des Formulars
 */
function handleSubmit(): void {
  if (isValid.value) {
    emit('join', joinCode.value.trim(), participantName.value.trim(), asObserver.value)
  }
}

/**
 * Schließt die Fehlermeldung
 */
function handleCloseError(): void {
  emit('clearError')
}
</script>

<template>
  <form class="card-container max-w-md mx-auto" @submit.prevent="handleSubmit">
    <h2 class="text-xl font-bold text-secondary-800 mb-6 text-center">
      Session beitreten
    </h2>

    <!-- Fehlermeldung -->
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
          Join-Code
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
          6-stelliger Code vom Session-Host
        </p>
      </div>

      <div>
        <label for="participant-name-join" class="block text-sm font-medium text-secondary-700 mb-1">
          Dein Name
        </label>
        <input
          id="participant-name-join"
          v-model="participantName"
          type="text"
          class="input"
          placeholder="z.B. Max Mustermann"
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
          Als Beobachter beitreten (ohne Stimmrecht)
        </label>
      </div>

      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="!isValid"
      >
        <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 mr-2" />
        Beitreten
      </button>

      <div class="text-center pt-4 border-t border-secondary-200">
        <p class="text-sm text-secondary-500 mb-2">
          Noch keine Session?
        </p>
        <button
          type="button"
          class="btn-secondary"
          @click="emit('switchToCreate')"
        >
          <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
          Neue Session erstellen
        </button>
      </div>
    </div>
  </form>
</template>
