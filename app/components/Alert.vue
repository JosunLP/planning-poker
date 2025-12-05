<script setup lang="ts">
/**
 * Alert Component
 *
 * Reusable alert box for notifications.
 * Used for content integration.
 */

/**
 * Available alert variants
 */
type AlertVariant = 'info' | 'success' | 'warning' | 'error'

/**
 * Props Definition
 */
interface Props {
  /** Color/variant of the alert */
  color?: AlertVariant | string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'info',
})

/**
 * Mapping of variants to Tailwind classes
 */
const variantClasses: Record<AlertVariant, string> = {
  info: 'border-primary-500 bg-primary-50 text-primary-800',
  success: 'border-green-500 bg-green-50 text-green-800',
  warning: 'border-amber-500 bg-amber-50 text-amber-800',
  error: 'border-error-500 bg-error-50 text-error-800',
}

/**
 * Computes CSS classes based on variant
 */
const alertClasses = computed(() => {
  const variant = props.color as AlertVariant
  if (variantClasses[variant]) {
    return variantClasses[variant]
  }
  // Fallback for custom colors
  return 'bg-white'
})

/**
 * Inline style for custom colors
 */
const customStyle = computed(() => {
  const variant = props.color as AlertVariant
  if (!variantClasses[variant]) {
    return { borderColor: props.color }
  }
  return {}
})
</script>

<template>
  <div
    class="flex items-center p-4 border-2 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :class="alertClasses"
    :style="customStyle"
    role="alert"
  >
    <slot />
  </div>
</template>
