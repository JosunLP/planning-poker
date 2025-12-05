<script setup lang="ts">
/**
 * VotingResult Komponente
 *
 * Zeigt die Ergebnisse einer Abstimmungsrunde an.
 */

import type { IParticipant, PokerValue } from '~/types';

/**
 * Props Definition
 */
interface Props {
  /** Liste der Teilnehmer mit ihren Votes */
  participants: IParticipant[]
}

const props = defineProps<Props>()

/**
 * Nur Teilnehmer die abgestimmt haben (keine Beobachter)
 */
const voters = computed(() =>
  props.participants.filter(p => !p.isObserver && p.selectedValue !== null)
)

/**
 * Berechnet den Durchschnitt der numerischen Votes
 */
const average = computed(() => {
  const numericVotes = voters.value
    .map(p => Number.parseFloat(p.selectedValue as string))
    .filter(v => !Number.isNaN(v))

  if (numericVotes.length === 0) return null

  const sum = numericVotes.reduce((a, b) => a + b, 0)
  return (sum / numericVotes.length).toFixed(1)
})

/**
 * Gruppiert Votes nach Wert für die Anzeige
 */
const voteDistribution = computed(() => {
  const distribution = new Map<PokerValue, number>()

  voters.value.forEach((p) => {
    const value = p.selectedValue as PokerValue
    distribution.set(value, (distribution.get(value) || 0) + 1)
  })

  return Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
})

/**
 * Prüft ob Konsens besteht (alle gleich)
 */
const hasConsensus = computed(() => {
  if (voters.value.length < 2) return false
  const firstVoter = voters.value[0]
  if (!firstVoter) return false
  const firstVote = firstVoter.selectedValue
  return voters.value.every(p => p.selectedValue === firstVote)
})
</script>

<template>
  <div class="voting-result card-container">
    <h3 class="text-lg font-semibold text-secondary-800 mb-4">
      Ergebnis
    </h3>

    <!-- Konsens-Anzeige -->
    <div
      v-if="hasConsensus"
      class="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-center"
    >
      <span class="text-success-700 font-medium">
        🎉 Konsens erreicht!
      </span>
    </div>

    <!-- Statistiken -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="text-center p-3 bg-primary-50 rounded-lg">
        <div class="text-2xl font-bold text-primary-700">
          {{ average ?? '-' }}
        </div>
        <div class="text-xs text-primary-600">Durchschnitt</div>
      </div>

      <div class="text-center p-3 bg-secondary-50 rounded-lg">
        <div class="text-2xl font-bold text-secondary-700">
          {{ voters.length }}
        </div>
        <div class="text-xs text-secondary-600">Stimmen</div>
      </div>
    </div>

    <!-- Vote-Verteilung -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-secondary-600">Verteilung</h4>

      <div
        v-for="[value, count] in voteDistribution"
        :key="value"
        class="flex items-center gap-2"
      >
        <PokerCard :value="value" :small="true" :revealed="true" />

        <div class="flex-1 h-6 bg-secondary-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 rounded-full transition-all duration-500"
            :style="{ width: `${(count / voters.length) * 100}%` }"
          />
        </div>

        <span class="text-sm font-medium text-secondary-600 w-8 text-right">
          {{ count }}×
        </span>
      </div>
    </div>
  </div>
</template>
