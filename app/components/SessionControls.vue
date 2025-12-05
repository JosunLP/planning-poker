<script setup lang="ts">
/**
 * SessionControls Komponente
 *
 * Steuerelemente für den Host der Session.
 */

/**
 * Props Definition
 */
interface Props {
  /** Ist der Nutzer der Host? */
  isHost: boolean
  /** Aktueller Session-Status */
  status: 'waiting' | 'voting' | 'revealed' | 'completed'
  /** Sind alle Votes abgegeben? */
  allVotesIn: boolean
  /** Aktuelle Story */
  currentStory?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  currentStory: null,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Startet eine neue Abstimmungsrunde */
  startVoting: [story: string]
  /** Deckt die Karten auf */
  reveal: []
  /** Setzt die Runde zurück */
  reset: []
}>()

/**
 * Story-Input Wert
 */
const storyInput = ref('')

/**
 * Startet die Abstimmung
 */
function handleStartVoting(): void {
  if (storyInput.value.trim()) {
    emit('startVoting', storyInput.value.trim())
    storyInput.value = ''
  }
}
</script>

<template>
  <div v-if="props.isHost" class="session-controls card-container">
    <h3 class="text-lg font-semibold text-secondary-800 mb-4">
      Session-Steuerung
    </h3>

    <!-- Neue Runde starten -->
    <div v-if="props.status === 'waiting' || props.status === 'revealed'" class="space-y-3">
      <div>
        <label for="story-input" class="block text-sm font-medium text-secondary-700 mb-1">
          Story / Task
        </label>
        <input
          id="story-input"
          v-model="storyInput"
          type="text"
          class="input"
          placeholder="z.B. User Story #123"
          @keyup.enter="handleStartVoting"
        >
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :disabled="!storyInput.trim()"
        @click="handleStartVoting"
      >
        <Icon name="heroicons:play" class="w-5 h-5 mr-2" />
        Neue Runde starten
      </button>
    </div>

    <!-- Aktive Abstimmung -->
    <div v-else-if="props.status === 'voting'" class="space-y-3">
      <div class="p-3 bg-primary-50 rounded-lg">
        <div class="text-xs text-primary-600 mb-1">Aktuelle Story</div>
        <div class="font-medium text-primary-800">{{ props.currentStory }}</div>
      </div>

      <button
        type="button"
        class="btn-primary w-full"
        :class="{ 'animate-pulse': props.allVotesIn }"
        @click="emit('reveal')"
      >
        <Icon name="heroicons:eye" class="w-5 h-5 mr-2" />
        Karten aufdecken
        <span v-if="props.allVotesIn" class="ml-2 text-xs">(Alle haben gewählt!)</span>
      </button>

      <button
        type="button"
        class="btn-secondary w-full"
        @click="emit('reset')"
      >
        <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
        Zurücksetzen
      </button>
    </div>
  </div>
</template>
