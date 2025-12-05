<script setup lang="ts">
/**
 * ParticipantList Komponente
 *
 * Zeigt alle Teilnehmer einer Session mit ihrem Voting-Status an.
 */

import type { IParticipant } from '~/types';

/**
 * Props Definition
 */
interface Props {
  /** Liste der Teilnehmer */
  participants: IParticipant[]
  /** Sind die Karten aufgedeckt? */
  revealed?: boolean
  /** ID des aktuellen Nutzers */
  currentUserId?: string
}

const props = withDefaults(defineProps<Props>(), {
  revealed: false,
  currentUserId: '',
})

/**
 * Sortiert Teilnehmer: Aktuelle zuerst, dann alphabetisch
 */
const sortedParticipants = computed(() => {
  return [...props.participants].sort((a, b) => {
    // Aktueller Nutzer zuerst
    if (a.id === props.currentUserId) return -1
    if (b.id === props.currentUserId) return 1
    // Dann alphabetisch
    return a.name.localeCompare(b.name)
  })
})

/**
 * Ermittelt den Anzeigestatus für einen Teilnehmer
 */
function getVoteStatus(participant: IParticipant): string {
  if (participant.isObserver) return '👀'
  if (participant.selectedValue === null) return '🤔'
  if (props.revealed) return participant.selectedValue
  return '✓'
}

/**
 * CSS-Klassen für den Vote-Badge
 */
function getVoteBadgeClasses(participant: IParticipant): string[] {
  const base = ['min-w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm']

  if (participant.isObserver) {
    return [...base, 'bg-secondary-100 text-secondary-500']
  }

  if (participant.selectedValue === null) {
    return [...base, 'bg-warning-100 text-warning-700']
  }

  if (props.revealed) {
    return [...base, 'bg-primary-100 text-primary-700']
  }

  return [...base, 'bg-success-100 text-success-700']
}
</script>

<template>
  <div class="participant-list">
    <h3 class="text-sm font-medium text-secondary-600 mb-3">
      Teilnehmer ({{ participants.length }})
    </h3>

    <ul class="space-y-2">
      <li
        v-for="participant in sortedParticipants"
        :key="participant.id"
        class="flex items-center justify-between p-2 rounded-lg bg-secondary-50"
        :class="{ 'ring-2 ring-primary-300': participant.id === currentUserId }"
      >
        <div class="flex items-center gap-2">
          <span
            class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium"
          >
            {{ participant.name.charAt(0).toUpperCase() }}
          </span>
          <span class="font-medium text-secondary-800">
            {{ participant.name }}
            <span v-if="participant.id === currentUserId" class="text-xs text-secondary-500">
              (Du)
            </span>
          </span>
        </div>

        <span :class="getVoteBadgeClasses(participant)">
          {{ getVoteStatus(participant) }}
        </span>
      </li>
    </ul>

    <div v-if="participants.length === 0" class="text-center py-4 text-secondary-400">
      Noch keine Teilnehmer
    </div>
  </div>
</template>
