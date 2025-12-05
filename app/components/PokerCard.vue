<script setup lang="ts">
/**
 * PokerCard Komponente
 *
 * Stellt eine einzelne Poker-Karte dar.
 * Unterstützt Auswahl, Aufdecken und Animationen.
 */

import type { PokerValue } from '~/types'

/**
 * Props Definition
 */
interface Props {
  /** Wert der Karte */
  value: PokerValue
  /** Ist die Karte ausgewählt? */
  selected?: boolean
  /** Ist die Karte aufgedeckt? */
  revealed?: boolean
  /** Ist die Karte deaktiviert? */
  disabled?: boolean
  /** Kleine Kartengröße */
  small?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  revealed: false,
  disabled: false,
  small: false,
})

/**
 * Events Definition
 */
const emit = defineEmits<{
  /** Wird ausgelöst wenn die Karte angeklickt wird */
  select: [value: PokerValue]
}>()

/**
 * Dynamische CSS-Klassen für die Karte
 */
const cardClasses = computed(() => [
  props.small ? 'w-14 h-20' : 'w-20 h-28',
  {
    'poker-card-selected': props.selected,
    'poker-card-revealed': props.revealed,
    'opacity-50 cursor-not-allowed': props.disabled,
    'hover:scale-105': !props.disabled && !props.revealed,
  },
])

/**
 * Behandelt den Klick auf die Karte
 */
function handleClick(): void {
  if (!props.disabled && !props.revealed) {
    emit('select', props.value)
  }
}
</script>

<template>
  <button
    type="button"
    class="poker-card flex items-center justify-center"
    :class="cardClasses"
    :disabled="disabled"
    :aria-pressed="selected"
    :aria-label="`Karte mit Wert ${value}`"
    @click="handleClick"
  >
    <span
      class="font-bold text-secondary-700"
      :class="small ? 'text-lg' : 'text-2xl'"
    >
      {{ value }}
    </span>
  </button>
</template>
