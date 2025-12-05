<script setup lang="ts">
/**
 * Counter Component
 *
 * Simple demo component for content integration.
 * Shows a counter with increment/decrement buttons.
 */

/**
 * Reactive counter value
 */
const count = ref(0)

/**
 * Increases the counter by 1
 */
function increment(): void {
  count.value++
}

/**
 * Decreases the counter by 1
 */
function decrement(): void {
  count.value--
}
</script>

<template>
  <div class="inline-flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-secondary-200">
    <button
      class="w-10 h-10 rounded-lg bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-bold transition-colors"
      aria-label="Decrease"
      @click="decrement"
    >
      −
    </button>

    <span class="text-xl font-bold text-secondary-800 min-w-12 text-center">
      {{ count }}
    </span>

    <button
      class="w-10 h-10 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 font-bold transition-colors"
      aria-label="Increase"
      @click="increment"
    >
      +
    </button>
  </div>
</template>
