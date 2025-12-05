<script setup lang="ts">
/**
 * VotingResult Component
 *
 * Displays the results of a voting round.
 */

import { marked } from 'marked';
import type { IParticipant, PokerValue } from '~/types';

/**
 * Props Definition
 */
interface Props {
  /** List of participants with their votes */
  participants: IParticipant[]
  /** Story that was estimated */
  story?: string | null
  /** Story description */
  description?: string | null
}

const props = defineProps<Props>()

/**
 * Parsed Markdown Description
 */
const parsedDescription = computed(() => {
  if (!props.description) return ''
  return marked.parse(props.description) as string
})

/**
 * Only participants who voted (no observers)
 */
const voters = computed(() =>
  props.participants.filter(p => !p.isObserver && p.selectedValue !== null)
)

/**
 * Calculates the average of numeric votes
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
 * Calculates the median of numeric votes
 */
const median = computed(() => {
  const numericVotes = voters.value
    .map(p => Number.parseFloat(p.selectedValue as string))
    .filter(v => !Number.isNaN(v))
    .sort((a, b) => a - b)

  if (numericVotes.length === 0) return null

  const mid = Math.floor(numericVotes.length / 2)
  if (numericVotes.length % 2 !== 0) {
    return numericVotes[mid]?.toFixed(1) ?? null
  }

  const left = numericVotes[mid - 1]
  const right = numericVotes[mid]
  if (left === undefined || right === undefined) return null
  return ((left + right) / 2).toFixed(1)
})

/**
 * Groups votes by value for display
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
 * Checks if there is consensus (all votes equal)
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
  <div class="voting-result bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
    <div class="flex items-center gap-2 mb-4">
      <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
        <Icon name="heroicons:chart-pie" class="w-5 h-5" />
      </div>
      <h3 class="text-lg font-bold text-secondary-900">
        Result
      </h3>
    </div>

    <!-- Story Info -->
    <div v-if="story" class="mb-6 p-4 bg-white border border-secondary-200 rounded-xl shadow-sm">
      <div class="text-xs text-secondary-500 mb-1">Voting for</div>
      <h3 class="text-lg font-bold text-secondary-800 mb-2">{{ story }}</h3>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        v-if="description"
        class="prose prose-sm max-w-none text-secondary-600 bg-secondary-50 p-3 rounded-lg"
        v-html="parsedDescription"
      />
    </div>

    <!-- Consensus display -->
    <div
      v-if="hasConsensus"
      class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center shadow-sm"
    >
      <div class="text-3xl mb-2">🎉</div>
      <span class="text-green-800 font-bold text-lg">
        Consensus reached!
      </span>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
        <div class="text-2xl font-bold text-primary-600 mb-0.5">
          {{ average ?? '-' }}
        </div>
        <div class="text-[10px] font-medium text-primary-500 uppercase tracking-wider">Average</div>
      </div>

      <div class="text-center p-3 bg-accent-50 rounded-xl border border-accent-100">
        <div class="text-2xl font-bold text-accent-600 mb-0.5">
          {{ median ?? '-' }}
        </div>
        <div class="text-[10px] font-medium text-accent-500 uppercase tracking-wider">Median</div>
      </div>

      <div class="text-center p-3 bg-secondary-50 rounded-xl border border-secondary-100">
        <div class="text-2xl font-bold text-secondary-700 mb-0.5">
          {{ voters.length }}
        </div>
        <div class="text-[10px] font-medium text-secondary-500 uppercase tracking-wider">Votes</div>
      </div>
    </div>

    <!-- Vote distribution -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-secondary-600">Distribution</h4>

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
