<script setup lang="ts">
/**
 * PokerCard Component
 *
 * Represents a single poker card.
 * Supports selection, revealing and animations.
 */

import type { PokerValue } from '~/types'

/**
 * Props Definition
 */
interface Props {
  /** Value of the card */
  value: PokerValue
  /** Is the card selected? */
  selected?: boolean
  /** Is the card revealed? */
  revealed?: boolean
  /** Is the card disabled? */
  disabled?: boolean
  /** Small card size */
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
  /** Emitted when the card is clicked */
  select: [value: PokerValue]
}>()

/**
 * Dynamic CSS classes for the card
 */
const cardClasses = computed(() => [
  props.small ? 'w-14 h-20' : 'w-20 h-28',
  {
    'transform transition-all duration-200 ease-out': true,
    'hover:-translate-y-1 hover:shadow-lg': !props.disabled && !props.revealed && !props.selected,
    'ring-2 ring-primary-500 -translate-y-2 shadow-xl bg-primary-50': props.selected,
    'bg-white shadow-md border border-secondary-200': !props.selected && !props.revealed,
    'bg-secondary-100': props.revealed,
    'opacity-50 cursor-not-allowed': props.disabled,
  },
])

/**
 * Handles click on the card
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
    class="poker-card relative flex items-center justify-center rounded-xl select-none"
    :class="cardClasses"
    :disabled="disabled"
    :aria-pressed="selected"
    :aria-label="`Card with value ${value}`"
    @click="handleClick"
  >
    <!-- Card Pattern/Decoration -->
    <div class="absolute inset-2 border-2 border-dashed border-secondary-100 rounded-lg pointer-events-none" />

    <span
      class="font-bold text-secondary-800 z-10"
      :class="small ? 'text-xl' : 'text-3xl'"
    >
      {{ value }}
    </span>
  </button>
</template>
