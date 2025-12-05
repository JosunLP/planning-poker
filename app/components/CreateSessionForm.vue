<script setup lang="ts">
/**
 * CreateSessionForm Komponente
 *
 * Formular zum Erstellen einer neuen Planning Poker Session.
 */

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Wird ausgelöst wenn die Session erstellt werden soll */
  create: [sessionName: string, participantName: string]
}>()

/**
 * Formular-Daten
 */
const sessionName = ref('')
const participantName = ref('')

/**
 * Validierung
 */
const isValid = computed(() =>
  sessionName.value.trim().length > 0 &&
  participantName.value.trim().length > 0
)

/**
 * Behandelt das Absenden des Formulars
 */
function handleSubmit(): void {
  if (isValid.value) {
    emit('create', sessionName.value.trim(), participantName.value.trim())
  }
}
</script>

<template>
  <form class="card-container max-w-md mx-auto" @submit.prevent="handleSubmit">
    <h2 class="text-xl font-bold text-secondary-800 mb-6 text-center">
      Neue Session erstellen
    </h2>

    <div class="space-y-4">
      <div>
        <label for="session-name" class="block text-sm font-medium text-secondary-700 mb-1">
          Session-Name
        </label>
        <input
          id="session-name"
          v-model="sessionName"
          type="text"
          class="input"
          placeholder="z.B. Sprint 42 Planning"
          required
        >
      </div>

      <div>
        <label for="participant-name" class="block text-sm font-medium text-secondary-700 mb-1">
          Dein Name
        </label>
        <input
          id="participant-name"
          v-model="participantName"
          type="text"
          class="input"
          placeholder="z.B. Max Mustermann"
          required
        >
      </div>

      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="!isValid"
      >
        <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
        Session erstellen
      </button>
    </div>
  </form>
</template>
