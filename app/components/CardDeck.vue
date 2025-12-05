<script setup lang="ts">
/**
 * CardDeck Komponente
 *
 * Zeigt alle verfügbaren Poker-Karten zum Auswählen an.
 */

import type { PokerValue } from '~/types'
import { POKER_VALUES } from '~/types'

/**
 * Props Definition
 */
interface Props {
  /** Aktuell ausgewählter Wert */
  selectedValue?: PokerValue | null
  /** Verfügbare Kartenwerte */
  values?: readonly PokerValue[]
  /** Sind die Karten deaktiviert? */
  disabled?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  selectedValue: null,
  values: () => POKER_VALUES,
  disabled: false,
})

// Props für Template-Nutzung
const { selectedValue, values, disabled } = _props

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Wird ausgelöst wenn eine Karte ausgewählt wird */
  select: [value: PokerValue]
}>()

/**
 * Behandelt die Kartenauswahl
 */
function handleSelect(value: PokerValue): void {
  emit('select', value)
}
</script>

<template>
  <div class="card-deck">
    <h3 class="text-sm font-medium text-secondary-600 mb-3">
      Wähle deine Schätzung
    </h3>

    <div class="flex flex-wrap gap-2 justify-center">
      <PokerCard
        v-for="value in values"
        :key="value"
        :value="value"
        :selected="selectedValue === value"
        :disabled="disabled"
        @select="handleSelect"
      />
    </div>
  </div>
</template>
