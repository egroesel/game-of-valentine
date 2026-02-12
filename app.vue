<script setup lang="ts">
import { getHint, type Hint } from '~/utils/hints'
import { playMusic, fadeMusicVolume, setMusicVolume, getMusicVolume, destroyMusic } from '~/utils/music'
import { setSfxVolume, getSfxVolume } from '~/utils/audio'

type Screen = 'gate' | 'intro' | 'explanation' | 'boxing' | 'hint' | 'end'

const screen = ref<Screen>('gate')
const transitioning = ref(false)
const currentHint = ref<Hint | null>(null)
const collectedHints = ref<Hint[]>([])
const endEntered = ref(false)
const sfxVolume = ref(getSfxVolume())
const musicVolume = ref(getMusicVolume())
const showVolumeSlider = ref(false)
const musicStarted = ref(false)

function onSfxVolumeChange(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  sfxVolume.value = v
  setSfxVolume(v)
}

function onMusicVolumeChange(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  musicVolume.value = v
  setMusicVolume(v)
}

function onGateTap() {
  if (screen.value !== 'gate') return
  musicStarted.value = true
  playMusic(2000) // fade in over 2s
  screen.value = 'intro'
}

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
  // Fade music down for boxing
  fadeMusicVolume(0.12, 1000)
  transitionTo('boxing')
}

function onLevelComplete(level: number) {
  const hint = getHint(level)
  if (hint) {
    currentHint.value = hint
    collectedHints.value.push(hint)
    // Bring music back up for hint screen
    fadeMusicVolume(musicVolume.value, 600)
    screen.value = 'hint'
  }
}

function onHintContinue() {
  // Fade down again for boxing
  fadeMusicVolume(0.12, 600)
  screen.value = 'boxing'
}

function onGameEnd() {
  // Bring music back up for end screen
  fadeMusicVolume(musicVolume.value, 800)
  transitionTo('end', 400)
  setTimeout(() => {
    endEntered.value = true
  }, 1000)
}

function restart() {
  endEntered.value = false
  collectedHints.value = []
  currentHint.value = null
  fadeMusicVolume(musicVolume.value, 600)
  transitionTo('intro')
}

function skipToBoxing(e: KeyboardEvent) {
  if (e.metaKey && e.shiftKey && e.key === 't') {
    e.preventDefault()
    endEntered.value = false
    collectedHints.value = []
    currentHint.value = null
    if (!musicStarted.value) {
      musicStarted.value = true
      playMusic(300)
    }
    fadeMusicVolume(0.12, 300)
    screen.value = 'boxing'
  }
}

onMounted(() => {
  window.addEventListener('keydown', skipToBoxing)
})

onUnmounted(() => {
  window.removeEventListener('keydown', skipToBoxing)
  destroyMusic()
})
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- Fade transition layer -->
    <div
      class="fixed inset-0 z-[100] bg-black pointer-events-none transition-opacity duration-500"
      :class="transitioning ? 'opacity-100' : 'opacity-0'"
    />

    <!-- Gate: tap to start (unlocks audio) -->
    <div
      v-if="screen === 'gate'"
      class="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      @click="onGateTap"
      @touchstart.prevent="onGateTap"
    >
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: 'url(/img/us.jpg)' }"
      />
      <div class="absolute inset-0 bg-black/95" />
      <div class="relative z-10 text-center">
        <p class="font-sans text-white/40 text-sm tracking-widest uppercase gate-pulse">
          Tippe, um zu starten
        </p>
      </div>
    </div>

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

    <!-- Volume controls (bottom-right) -->
    <div class="fixed bottom-4 right-4 z-[90] flex items-center gap-2">
      <!-- Volume sliders -->
      <div
        v-if="showVolumeSlider"
        class="bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-white/50 text-xs w-6">🎵</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="musicVolume"
            class="w-20 h-1 accent-white cursor-pointer"
            @input="onMusicVolumeChange"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-white/50 text-xs w-6">💥</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="sfxVolume"
            class="w-20 h-1 accent-white cursor-pointer"
            @input="onSfxVolumeChange"
          />
        </div>
      </div>
      <!-- Volume button -->
      <button
        class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center text-lg transition-transform hover:scale-110 active:scale-95"
        @click="showVolumeSlider = !showVolumeSlider"
      >
        {{ sfxVolume > 0 || musicVolume > 0 ? '🔊' : '🔇' }}
      </button>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  overflow: hidden;
  background: #000;
}

.gate-pulse {
  animation: gatePulse 2.5s ease-in-out infinite;
}

@keyframes gatePulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.7; }
}
</style>
