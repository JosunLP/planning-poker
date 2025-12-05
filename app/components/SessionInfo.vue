<script setup lang="ts">
/**
 * SessionInfo Komponente
 *
 * Zeigt Session-Informationen inkl. Join-Code an.
 * Ermöglicht das Kopieren des Join-Codes.
 */

/**
 * Props Definition
 */
interface Props {
  /** Name der Session */
  sessionName: string
  /** Join-Code zum Teilen */
  joinCode: string | null
  /** Anzahl der Teilnehmer */
  participantCount: number
}

const props = defineProps<Props>()

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Session verlassen */
  leave: []
}>()

/**
 * Status für Kopier-Feedback
 */
const copied = ref(false)

/**
 * Kopiert den Join-Code in die Zwischenablage
 */
async function copyJoinCode(): Promise<void> {
  if (!props.joinCode) return

  try {
    await navigator.clipboard.writeText(props.joinCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch {
    // Fallback für ältere Browser
    console.warn('Clipboard API nicht verfügbar')
  }
}

/**
 * Generiert einen Share-Link
 */
const shareLink = computed(() => {
  if (!props.joinCode) return ''

  if (import.meta.client) {
    return `${window.location.origin}?join=${props.joinCode}`
  }
  return ''
})

/**
 * Teilt die Session (Web Share API)
 */
async function shareSession(): Promise<void> {
  if (!import.meta.client || !navigator.share) {
    await copyJoinCode()
    return
  }

  try {
    await navigator.share({
      title: `Planning Poker: ${props.sessionName}`,
      text: `Tritt meiner Planning Poker Session bei! Code: ${props.joinCode}`,
      url: shareLink.value,
    })
  }
  catch {
    // Benutzer hat abgebrochen
  }
}
</script>

<template>
  <div class="card-container">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-secondary-800">
        {{ sessionName }}
      </h3>
      <span class="text-sm text-secondary-500">
        {{ participantCount }} Teilnehmer
      </span>
    </div>

    <!-- Join-Code -->
    <div v-if="joinCode" class="mb-4">
      <div class="text-xs text-secondary-500 mb-1">Join-Code</div>
      <div class="flex items-center gap-2">
        <div
          class="flex-1 bg-secondary-100 rounded-lg px-4 py-3 text-center font-mono text-2xl tracking-widest text-primary-700 font-bold"
        >
          {{ joinCode }}
        </div>
        <button
          type="button"
          class="btn-secondary p-3"
          :title="copied ? 'Kopiert!' : 'Code kopieren'"
          @click="copyJoinCode"
        >
          <Icon
            :name="copied ? 'heroicons:check' : 'heroicons:clipboard'"
            class="w-5 h-5"
            :class="copied ? 'text-success-600' : ''"
          />
        </button>
        <button
          type="button"
          class="btn-secondary p-3"
          title="Session teilen"
          @click="shareSession"
        >
          <Icon name="heroicons:share" class="w-5 h-5" />
        </button>
      </div>
      <p class="mt-2 text-xs text-secondary-500 text-center">
        Teile diesen Code mit deinem Team
      </p>
    </div>

    <!-- Session verlassen -->
    <button
      type="button"
      class="w-full text-sm text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg py-2 transition-colors"
      @click="emit('leave')"
    >
      <Icon name="heroicons:arrow-left-on-rectangle" class="w-4 h-4 inline mr-1" />
      Session verlassen
    </button>
  </div>
</template>
