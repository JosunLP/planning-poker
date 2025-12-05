<script setup lang="ts">
/**
 * CardDeck Component
 *
 * Displays all available poker cards for selection.
 */

import type { PokerValue } from '~/types'
import { POKER_VALUES } from '~/types'

/**
 * Props Definition
 */
interface Props {
  /** Currently selected value */
  selectedValue?: PokerValue | null
  /** Available card values */
  values?: readonly PokerValue[]
  /** Are the cards disabled? */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedValue: null,
  values: () => POKER_VALUES,
  disabled: false,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Emitted when a card is selected */
  select: [value: PokerValue]
}>()

/**
 * Handles card selection
 */
function handleSelect(value: PokerValue): void {
  emit('select', value)
}
</script>

<template>
  <div class="card-deck">
    <h3 class="text-sm font-medium text-secondary-600 mb-3">
      Choose your estimate
    </h3>

    <div class="flex flex-wrap gap-2 justify-center">
      <PokerCard
        v-for="value in props.values"
        :key="value"
        :value="value"
        :selected="props.selectedValue === value"
        :disabled="props.disabled"
        @select="handleSelect"
      />
    </div>
  </div>
</template>
