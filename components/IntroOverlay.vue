<script setup lang="ts">
type IntroPhase = 'linesIn' | 'linesHold' | 'linesOut' | 'pause' | 'question' | 'buttons' | 'choiceActive'

const emit = defineEmits<{
  choice: [answer: 'ja' | 'nein']
}>()

const phase = ref<IntroPhase>('linesIn')
const lineVisible = ref([false, false, false, false])
const allLinesVisible = ref(true)
const questionVisible = ref(false)
const buttonsVisible = ref(false)

const lines = [
  'Hey du,',
  'Heute ist Valentinstag … offensichtlich.',
  'Weil du meine Inspiration bist, habe ich etwas für dich gebastelt.',
  'Ich hoffe, es gefällt dir …',
]

// Timing constants from spec
const FADE_IN_DURATION = 600
const STAGGER_DELAY = 450
const HOLD_DURATION = 1200
const FADE_OUT_DURATION = 900
const PAUSE_DURATION = 900
const QUESTION_FADE_IN = 500
const BUTTON_DELAY = 450

let timeouts: ReturnType<typeof setTimeout>[] = []

function clearTimeouts() {
  timeouts.forEach(clearTimeout)
  timeouts = []
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    timeouts.push(setTimeout(resolve, ms))
  })
}

async function runSequence() {
  // Phase 1: Staggered fade in
  phase.value = 'linesIn'
  for (let i = 0; i < lines.length; i++) {
    lineVisible.value[i] = true
    if (i < lines.length - 1) await delay(STAGGER_DELAY)
  }
  // Wait for last line's fade-in to complete
  await delay(FADE_IN_DURATION)

  // Phase 2: Hold
  phase.value = 'linesHold'
  await delay(HOLD_DURATION)

  // Phase 3: Fade out all
  phase.value = 'linesOut'
  allLinesVisible.value = false
  await delay(FADE_OUT_DURATION)

  // Phase 4: Pause
  phase.value = 'pause'
  await delay(PAUSE_DURATION)

  // Phase 5: Question
  phase.value = 'question'
  questionVisible.value = true
  await delay(QUESTION_FADE_IN + BUTTON_DELAY)

  // Phase 6: Buttons
  phase.value = 'buttons'
  buttonsVisible.value = true
  await delay(350) // button fade-in duration

  // Phase 7: Choice active
  phase.value = 'choiceActive'
}

onMounted(() => {
  runSequence()
})

onUnmounted(() => {
  clearTimeouts()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
    <!-- Background image -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/img/us.jpg)' }"
    />
    <!-- Dark gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/55" />

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-2 px-6 max-w-[38rem] text-center">
      <!-- Text lines -->
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="intro-line font-serif text-2xl md:text-4xl tracking-tight text-white leading-relaxed"
        :class="{
          'intro-line--visible': lineVisible[i],
          'intro-line--hidden': !allLinesVisible,
        }"
        :style="{ transitionDuration: lineVisible[i] && allLinesVisible ? `${FADE_IN_DURATION}ms` : `${FADE_OUT_DURATION}ms` }"
      >
        {{ line }}
      </div>

      <!-- Question -->
      <div
        v-if="phase === 'question' || phase === 'buttons' || phase === 'choiceActive'"
        class="intro-question mt-8 font-serif text-3xl md:text-5xl tracking-tight text-white"
        :class="{ 'intro-question--visible': questionVisible }"
        :style="{ transitionDuration: `${QUESTION_FADE_IN}ms` }"
      >
        Möchtest du mein Valentin sein?
      </div>

      <!-- Buttons -->
      <div
        v-if="phase === 'buttons' || phase === 'choiceActive'"
        class="intro-buttons mt-8 flex gap-6"
        :class="{ 'intro-buttons--visible': buttonsVisible }"
      >
        <button
          class="px-8 py-3 rounded-full bg-white text-black font-sans font-semibold text-lg transition-transform hover:scale-105 active:scale-95"
          @click="emit('choice', 'ja')"
        >
          Ja
        </button>
        <button
          class="px-8 py-3 rounded-full bg-white/20 text-white border border-white/40 font-sans font-semibold text-lg backdrop-blur-sm transition-transform hover:scale-105"
          @click="emit('choice', 'nein')"
        >
          Nein
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.intro-line {
  opacity: 0;
  transform: translateY(10px);
  transition-property: opacity, transform;
  transition-timing-function: ease-out;
}
.intro-line--visible {
  opacity: 1;
  transform: translateY(0);
}
.intro-line--hidden {
  opacity: 0;
  transform: scale(0.98);
  transition-timing-function: ease-in-out;
}

.intro-question {
  opacity: 0;
  transform: scale(0.98);
  transition-property: opacity, transform;
  transition-timing-function: ease-out;
}
.intro-question--visible {
  opacity: 1;
  transform: scale(1);
}

.intro-buttons {
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 350ms ease-out, transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.intro-buttons--visible {
  opacity: 1;
  transform: scale(1);
}
</style>
