<script setup lang="ts">
import { launchConfetti } from '~/utils/confetti'

type IntroPhase = 'linesIn' | 'linesHold' | 'linesOut' | 'pause' | 'question' | 'choiceActive' | 'confirmed'

const emit = defineEmits<{
  confirmed: []
}>()

const phase = ref<IntroPhase>('linesIn')
const lineVisible = ref([false, false, false, false])
const allLinesVisible = ref(true)
const questionVisible = ref(false)

// Evasive Nein button
const containerRef = ref<HTMLDivElement | null>(null)
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
const neinOffset = ref({ x: 0, y: 0 })
const evadeCount = ref(0)
let stopConfetti: (() => void) | null = null

const lines = [
  'Hey du,',
  'Heute ist Valentinstag … offensichtlich.',
  'Weil du meine Inspiration bist, habe ich etwas für dich gebastelt.',
  'Ich hoffe, es gefällt dir …',
]

// Timing constants – deliberately slow and cinematic
const INITIAL_DELAY = 1500
const FADE_IN_DURATION = 1400
const STAGGER_DELAY = 1600
const HOLD_DURATION = 2800
const FADE_OUT_DURATION = 1400
const PAUSE_DURATION = 1400
const QUESTION_FADE_IN = 1000

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
  // Initial pause – let background settle
  await delay(INITIAL_DELAY)

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

  // Phase 5: Question + buttons appear together
  phase.value = 'question'
  questionVisible.value = true
  await delay(QUESTION_FADE_IN + 200)

  // Phase 6: Choice active (buttons are interactive)
  phase.value = 'choiceActive'
}

// Evasive Nein behavior
function evadeNein() {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const padding = 60
  const maxX = rect.width / 2 - padding
  const maxY = rect.height / 2 - padding

  const range = Math.min(1, 0.5 + evadeCount.value * 0.15)
  neinOffset.value = {
    x: (Math.random() * 2 - 1) * maxX * range,
    y: (Math.random() * 2 - 1) * maxY * range,
  }
  evadeCount.value++
}

function onNeinHover() {
  if (phase.value === 'choiceActive' || phase.value === 'question') {
    evadeNein()
  }
}

function onNeinTouch(e: TouchEvent) {
  if (phase.value === 'choiceActive' || phase.value === 'question') {
    e.preventDefault()
    evadeNein()
  }
}

function onJa() {
  if (phase.value !== 'choiceActive' && phase.value !== 'question') return

  phase.value = 'confirmed'

  // Launch confetti
  nextTick(() => {
    if (confettiCanvas.value) {
      stopConfetti = launchConfetti(confettiCanvas.value, 3500)
    }
  })

  // Let celebration linger, then transition
  setTimeout(() => emit('confirmed'), 4500)
}

onMounted(() => {
  runSequence()
})

onUnmounted(() => {
  clearTimeouts()
  stopConfetti?.()
})
</script>

<template>
  <div
    ref="containerRef"
    class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
  >
    <!-- Background image -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/img/us.jpg)' }"
    />
    <!-- Dark gradient overlay -->
    <div class="absolute inset-0 bg-black/95" />

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-2 px-6 max-w-[38rem] text-center">
      <!-- Text lines (only during line phases) -->
      <template v-if="phase === 'linesIn' || phase === 'linesHold' || phase === 'linesOut' || phase === 'pause'">
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
      </template>

      <!-- Question + Buttons (appear together, hide on confirm) -->
      <template v-if="(phase === 'question' || phase === 'choiceActive') && phase !== 'confirmed'">
        <div
          class="intro-question font-serif text-3xl md:text-5xl tracking-tight text-white"
          :class="{ 'intro-question--visible': questionVisible }"
          :style="{ transitionDuration: `${QUESTION_FADE_IN}ms` }"
        >
          Willst du mein Valentins-Schatz sein?
        </div>

        <!-- Buttons (appear with question) -->
        <div
          class="intro-buttons mt-8 relative flex gap-6 items-center justify-center"
          :class="{ 'intro-buttons--visible': questionVisible }"
          style="min-height: 60px;"
        >
          <button
            class="px-8 py-3 rounded-full bg-white text-black font-sans font-semibold text-lg transition-transform hover:scale-110 active:scale-95 z-10"
            @click="onJa"
          >
            Na gut
          </button>

          <button
            class="px-8 py-3 rounded-full bg-white/20 text-white border border-white/40 font-sans font-semibold text-lg backdrop-blur-sm transition-all duration-200 z-10"
            :style="{
              transform: `translate(${neinOffset.x}px, ${neinOffset.y}px)`,
            }"
            @mouseenter="onNeinHover"
            @touchstart="onNeinTouch"
          >
            Nö
          </button>
        </div>
      </template>

      <!-- Confirmed state: question gone, big celebration -->
      <template v-if="phase === 'confirmed'">
        <div class="flex flex-col items-center gap-6">
          <div class="text-8xl md:text-9xl heart-pop">❤️</div>
          <h1 class="font-serif text-4xl md:text-6xl tracking-tight text-white animate-fade-in">
            Ok, selber Schuld!
          </h1>
        </div>
      </template>
    </div>

    <!-- Confetti canvas -->
    <canvas
      v-if="phase === 'confirmed'"
      ref="confettiCanvas"
      class="absolute inset-0 pointer-events-none z-20"
    />
  </div>
</template>

<style scoped>
.intro-line {
  opacity: 0;
  transform: translateY(18px);
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
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
  transform: scale(0.96) translateY(10px);
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
}
.intro-question--visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.intro-buttons {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
  transition: opacity 800ms ease-out, transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
}
.intro-buttons--visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.heart-pop {
  animation: heartPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes heartPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out 0.3s both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
