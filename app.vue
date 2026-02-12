<script setup lang="ts">
import { getHint, type Hint } from '~/utils/hints'

type Screen = 'intro' | 'explanation' | 'boxing' | 'hint' | 'end'

const screen = ref<Screen>('intro')
const transitioning = ref(false)
const currentHint = ref<Hint | null>(null)
const collectedHints = ref<Hint[]>([])
const endEntered = ref(false)

function transitionTo(target: Screen, delayMs = 600) {
  transitioning.value = true
  setTimeout(() => {
    screen.value = target
    transitioning.value = false
  }, delayMs)
}

function onIntroConfirmed() {
  transitionTo('explanation', 800)
}

function onExplanationStart() {
  transitionTo('boxing')
}

function onLevelComplete(level: number) {
  const hint = getHint(level)
  if (hint) {
    currentHint.value = hint
    collectedHints.value.push(hint)
    screen.value = 'hint'
  }
}

function onHintContinue() {
  screen.value = 'boxing'
}

function onGameEnd() {
  transitionTo('end', 400)
  setTimeout(() => {
    endEntered.value = true
  }, 1000)
}

function restart() {
  endEntered.value = false
  collectedHints.value = []
  currentHint.value = null
  transitionTo('intro')
}

function skipToBoxing(e: KeyboardEvent) {
  if (e.metaKey && e.shiftKey && e.key === 't') {
    e.preventDefault()
    endEntered.value = false
    collectedHints.value = []
    currentHint.value = null
    screen.value = 'boxing'
  }
}

onMounted(() => {
  window.addEventListener('keydown', skipToBoxing)
})

onUnmounted(() => {
  window.removeEventListener('keydown', skipToBoxing)
})
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- Fade transition layer -->
    <div
      class="fixed inset-0 z-[100] bg-black pointer-events-none transition-opacity duration-500"
      :class="transitioning ? 'opacity-100' : 'opacity-0'"
    />

    <IntroOverlay
      v-if="screen === 'intro'"
      @confirmed="onIntroConfirmed"
    />

    <GameExplanation
      v-if="screen === 'explanation'"
      @start="onExplanationStart"
    />

    <ClientOnly>
      <BoxingGame
        v-if="screen === 'boxing'"
        :collected-hints="collectedHints"
        @level-complete="onLevelComplete"
        @game-end="onGameEnd"
      />
    </ClientOnly>

    <!-- Hint screen -->
    <HintOverlay
      v-if="screen === 'hint'"
      :hint="currentHint"
      :hint-number="collectedHints.length"
      @continue="onHintContinue"
    />

    <!-- End screen -->
    <div
      v-if="screen === 'end'"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: 'url(/img/us.jpg)' }"
      />
      <div class="absolute inset-0 bg-black/95" />
      <div
        class="relative z-10 text-center px-6 max-w-[38rem] transition-all duration-1000 ease-out"
        :class="endEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h1 class="font-serif text-3xl md:text-5xl tracking-tight text-white mb-6">
          Du Opfer ❤️
        </h1>

        <!-- Show collected hints -->
        <div v-if="collectedHints.length > 0" class="mb-8">
          <p class="font-sans text-sm text-white/50 mb-4 uppercase tracking-wider">
            Deine Hinweise
          </p>
          <div class="flex flex-col gap-3">
            <div
              v-for="(hint, i) in collectedHints"
              :key="i"
              class="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-white/80 font-sans text-base"
            >
              {{ hint.emoji }} {{ hint.text }}
            </div>
          </div>
        </div>

        <p class="font-sans text-lg text-white/80 mb-8">
          Happy Valentinstag LOL!
        </p>
        <button
          class="px-8 py-3 rounded-full bg-white/20 text-white border border-white/40 font-sans font-semibold text-lg backdrop-blur-sm transition-transform hover:scale-105"
          @click="restart"
        >
          Nochmal nochmal
        </button>
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  overflow: hidden;
  background: #000;
}
</style>
