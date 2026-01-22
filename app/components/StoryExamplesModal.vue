<script setup lang="ts">
/**
 * StoryExamplesModal Component
 *
 * Modal displaying example stories as reference for story point estimation.
 * Helps teams calibrate their understanding of story point values.
 */

const { t } = useI18n()

/**
 * Props Definition
 */
interface Props {
  /** Modal visible? */
  visible: boolean
}

const props = defineProps<Props>()

/**
 * Events Definition
 */
const emit = defineEmits<{
  close: []
}>()

/**
 * Currently selected story point category
 */
const selectedPoints = ref<string | null>(null)

/**
 * Story point categories with examples
 */
interface StoryExample {
  title: string
  description: string
  effort: string
  risk: string
}

interface PointCategory {
  value: string
  label: string
  color: string
  bgColor: string
  effort: string
  risk: string
  examples: StoryExample[]
}

const pointCategories = computed<PointCategory[]>(() => [
  {
    value: '0',
    label: '0',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-100',
    effort: t('storyExamples.efforts.minimal'),
    risk: t('storyExamples.risks.none'),
    examples: [
      {
        title: t('storyExamples.examples.0.example1.title'),
        description: t('storyExamples.examples.0.example1.description'),
        effort: '< 15 min',
        risk: t('storyExamples.risks.none'),
      },
      {
        title: t('storyExamples.examples.0.example2.title'),
        description: t('storyExamples.examples.0.example2.description'),
        effort: '< 15 min',
        risk: t('storyExamples.risks.none'),
      },
    ],
  },
  {
    value: '1',
    label: '1',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    effort: t('storyExamples.efforts.verySmall'),
    risk: t('storyExamples.risks.low'),
    examples: [
      {
        title: t('storyExamples.examples.1.example1.title'),
        description: t('storyExamples.examples.1.example1.description'),
        effort: '1-2 h',
        risk: t('storyExamples.risks.low'),
      },
      {
        title: t('storyExamples.examples.1.example2.title'),
        description: t('storyExamples.examples.1.example2.description'),
        effort: '1-2 h',
        risk: t('storyExamples.risks.low'),
      },
    ],
  },
  {
    value: '2',
    label: '2',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    effort: t('storyExamples.efforts.small'),
    risk: t('storyExamples.risks.low'),
    examples: [
      {
        title: t('storyExamples.examples.2.example1.title'),
        description: t('storyExamples.examples.2.example1.description'),
        effort: '2-4 h',
        risk: t('storyExamples.risks.low'),
      },
      {
        title: t('storyExamples.examples.2.example2.title'),
        description: t('storyExamples.examples.2.example2.description'),
        effort: '2-4 h',
        risk: t('storyExamples.risks.low'),
      },
    ],
  },
  {
    value: '3',
    label: '3',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    effort: t('storyExamples.efforts.halfDay'),
    risk: t('storyExamples.risks.moderate'),
    examples: [
      {
        title: t('storyExamples.examples.3.example1.title'),
        description: t('storyExamples.examples.3.example1.description'),
        effort: '4-6 h',
        risk: t('storyExamples.risks.moderate'),
      },
      {
        title: t('storyExamples.examples.3.example2.title'),
        description: t('storyExamples.examples.3.example2.description'),
        effort: '4-6 h',
        risk: t('storyExamples.risks.moderate'),
      },
    ],
  },
  {
    value: '5',
    label: '5',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    effort: t('storyExamples.efforts.oneToTwoDays'),
    risk: t('storyExamples.risks.moderate'),
    examples: [
      {
        title: t('storyExamples.examples.5.example1.title'),
        description: t('storyExamples.examples.5.example1.description'),
        effort: '1-2 d',
        risk: t('storyExamples.risks.moderate'),
      },
      {
        title: t('storyExamples.examples.5.example2.title'),
        description: t('storyExamples.examples.5.example2.description'),
        effort: '1-2 d',
        risk: t('storyExamples.risks.moderate'),
      },
    ],
  },
  {
    value: '8',
    label: '8',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    effort: t('storyExamples.efforts.twoToThreeDays'),
    risk: t('storyExamples.risks.elevated'),
    examples: [
      {
        title: t('storyExamples.examples.8.example1.title'),
        description: t('storyExamples.examples.8.example1.description'),
        effort: '2-3 d',
        risk: t('storyExamples.risks.elevated'),
      },
      {
        title: t('storyExamples.examples.8.example2.title'),
        description: t('storyExamples.examples.8.example2.description'),
        effort: '2-3 d',
        risk: t('storyExamples.risks.elevated'),
      },
    ],
  },
  {
    value: '13',
    label: '13',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    effort: t('storyExamples.efforts.threeToFiveDays'),
    risk: t('storyExamples.risks.high'),
    examples: [
      {
        title: t('storyExamples.examples.13.example1.title'),
        description: t('storyExamples.examples.13.example1.description'),
        effort: '3-5 d',
        risk: t('storyExamples.risks.high'),
      },
      {
        title: t('storyExamples.examples.13.example2.title'),
        description: t('storyExamples.examples.13.example2.description'),
        effort: '3-5 d',
        risk: t('storyExamples.risks.high'),
      },
    ],
  },
  {
    value: '21',
    label: '21',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    effort: t('storyExamples.efforts.oneWeek'),
    risk: t('storyExamples.risks.high'),
    examples: [
      {
        title: t('storyExamples.examples.21.example1.title'),
        description: t('storyExamples.examples.21.example1.description'),
        effort: '1 w',
        risk: t('storyExamples.risks.high'),
      },
      {
        title: t('storyExamples.examples.21.example2.title'),
        description: t('storyExamples.examples.21.example2.description'),
        effort: '1 w',
        risk: t('storyExamples.risks.high'),
      },
    ],
  },
  {
    value: '40',
    label: '40',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    effort: t('storyExamples.efforts.oneToTwoWeeks'),
    risk: t('storyExamples.risks.veryHigh'),
    examples: [
      {
        title: t('storyExamples.examples.40.example1.title'),
        description: t('storyExamples.examples.40.example1.description'),
        effort: '1-2 w',
        risk: t('storyExamples.risks.veryHigh'),
      },
    ],
  },
  {
    value: '100',
    label: '100',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    effort: t('storyExamples.efforts.epic'),
    risk: t('storyExamples.risks.veryHigh'),
    examples: [
      {
        title: t('storyExamples.examples.100.example1.title'),
        description: t('storyExamples.examples.100.example1.description'),
        effort: '2+ w',
        risk: t('storyExamples.risks.veryHigh'),
      },
    ],
  },
  {
    value: '?',
    label: '?',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-100',
    effort: t('storyExamples.efforts.unknown'),
    risk: t('storyExamples.risks.unknown'),
    examples: [
      {
        title: t('storyExamples.examples.unknown.example1.title'),
        description: t('storyExamples.examples.unknown.example1.description'),
        effort: '?',
        risk: '?',
      },
    ],
  },
  {
    value: '☕',
    label: '☕',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    effort: t('storyExamples.efforts.break'),
    risk: '-',
    examples: [
      {
        title: t('storyExamples.examples.coffee.example1.title'),
        description: t('storyExamples.examples.coffee.example1.description'),
        effort: '-',
        risk: '-',
      },
    ],
  },
])

/**
 * Currently selected category details
 */
const selectedCategory = computed(() => {
  return pointCategories.value.find(c => c.value === selectedPoints.value)
})

/**
 * Close on Escape
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close')
  }
}

/**
 * Reset selection when modal opens
 */
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    selectedPoints.value = null
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="emit('close')"
        />

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-secondary-100 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
                <Icon name="heroicons:book-open" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-secondary-900">
                  {{ t('storyExamples.title') }}
                </h3>
                <p class="text-sm text-secondary-500">
                  {{ t('storyExamples.subtitle') }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="p-2 text-secondary-400 hover:text-secondary-600 transition-colors rounded-lg hover:bg-secondary-100"
              @click="emit('close')"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            <!-- Story Point Selector -->
            <div class="md:w-64 border-b md:border-b-0 md:border-r border-secondary-100 p-4 flex-shrink-0 overflow-y-auto">
              <div class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-3">
                {{ t('storyExamples.selectPoints') }}
              </div>
              <div class="grid grid-cols-4 md:grid-cols-2 gap-2">
                <button
                  v-for="category in pointCategories"
                  :key="category.value"
                  type="button"
                  class="p-3 rounded-xl border-2 transition-all text-center"
                  :class="[
                    selectedPoints === category.value
                      ? `${category.bgColor} border-current ${category.color} shadow-md`
                      : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50',
                  ]"
                  @click="selectedPoints = category.value"
                >
                  <div class="text-xl font-bold" :class="selectedPoints === category.value ? category.color : 'text-secondary-700'">
                    {{ category.label }}
                  </div>
                  <div class="text-xs text-secondary-500 hidden md:block mt-1">
                    {{ category.effort }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Examples Display -->
            <div class="flex-1 p-6 overflow-y-auto">
              <Transition name="fade" mode="out-in">
                <!-- No selection -->
                <div v-if="!selectedCategory" class="text-center py-12">
                  <Icon name="heroicons:hand-raised" class="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <p class="text-secondary-500">
                    {{ t('storyExamples.selectPrompt') }}
                  </p>
                </div>

                <!-- Selected category -->
                <div v-else :key="selectedCategory.value">
                  <!-- Category Header -->
                  <div class="flex items-center gap-4 mb-6">
                    <div
                      class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                      :class="[selectedCategory.bgColor, selectedCategory.color]"
                    >
                      {{ selectedCategory.label }}
                    </div>
                    <div>
                      <div class="text-lg font-bold text-secondary-800">
                        {{ selectedCategory.label }} {{ selectedCategory.value !== '?' && selectedCategory.value !== '☕' ? t('storyExamples.points') : '' }}
                      </div>
                      <div class="flex gap-4 text-sm text-secondary-600">
                        <span class="flex items-center gap-1">
                          <Icon name="heroicons:clock" class="w-4 h-4" />
                          {{ selectedCategory.effort }}
                        </span>
                        <span class="flex items-center gap-1">
                          <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
                          {{ t('storyExamples.riskLabel') }}: {{ selectedCategory.risk }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Examples -->
                  <div class="space-y-4">
                    <div
                      v-for="(example, index) in selectedCategory.examples"
                      :key="index"
                      class="bg-secondary-50 rounded-xl p-4"
                    >
                      <h4 class="font-semibold text-secondary-800 mb-2 flex items-center gap-2">
                        <Icon name="heroicons:document-text" class="w-4 h-4 text-primary-500" />
                        {{ example.title }}
                      </h4>
                      <p class="text-secondary-600 text-sm">
                        {{ example.description }}
                      </p>
                    </div>
                  </div>

                  <!-- Hint -->
                  <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div class="flex items-start gap-3">
                      <Icon name="heroicons:light-bulb" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p class="text-sm text-blue-700">
                        {{ t('storyExamples.hint') }}
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-secondary-100 flex-shrink-0">
            <div class="flex justify-end">
              <button
                type="button"
                class="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors"
                @click="emit('close')"
              >
                {{ t('storyExamples.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
