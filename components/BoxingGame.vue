<script setup lang="ts">
import { getLevelConfig } from '~/utils/levels'
import { getHint } from '~/utils/hints'
import type { Hint } from '~/utils/hints'

const props = defineProps<{
  collectedHints: Hint[]
}>()

const emit = defineEmits<{
  levelComplete: [level: number]
  gameEnd: []
}>()

const threeCanvas = ref<InstanceType<typeof import('./ThreeCanvas.vue').default> | null>(null)

const level = ref(props.collectedHints.length + 1)
const clickCount = ref(0)
const timeLeft = ref(0)
const gameState = ref<'countdown' | 'playing' | 'levelComplete' | 'gameOver'>('countdown')
const countdownNumber = ref(3)

let timerInterval: ReturnType<typeof setInterval> | null = null

const levelConfig = computed(() => getLevelConfig(level.value))
const formattedTime = computed(() => timeLeft.value.toFixed(1))

function startCountdown() {
  gameState.value = 'countdown'
  countdownNumber.value = 3
  const countInterval = setInterval(() => {
    countdownNumber.value--
    if (countdownNumber.value <= 0) {
      clearInterval(countInterval)
      startLevel()
    }
  }, 800)
}

function startLevel() {
  gameState.value = 'playing'
  clickCount.value = 0
  timeLeft.value = levelConfig.value.timeLimit
  threeCanvas.value?.setIntensity(level.value)

  timerInterval = setInterval(() => {
    timeLeft.value = Math.max(0, timeLeft.value - 0.1)

    if (timeLeft.value <= 0) {
      endLevel(false)
    }
  }, 100)
}

function endLevel(success: boolean) {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  if (success) {
    gameState.value = 'levelComplete'
    const completedLevel = level.value
    const hasHint = getHint(completedLevel) !== null

    setTimeout(() => {
      if (hasHint) {
        // Emit to parent to show hint, parent will re-mount us for next level
        emit('levelComplete', completedLevel)
      } else {
        // No more hints, just advance
        level.value++
        startCountdown()
      }
    }, 1500)
  } else {
    gameState.value = 'gameOver'
    threeCanvas.value?.setGameOver(true)
    setTimeout(() => {
      emit('gameEnd')
    }, 2500)
  }
}

function onPunch() {
  if (gameState.value !== 'playing') return

  clickCount.value++
  threeCanvas.value?.punch(1.0)

  if (clickCount.value >= levelConfig.value.requiredClicks) {
    endLevel(true)
  }
}

function onMouseDown(e: MouseEvent) {
  e.preventDefault()
  onPunch()
}

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  onPunch()
}

function onContextMenu(e: Event) {
  e.preventDefault()
}

onMounted(() => {
  window.addEventListener('contextmenu', onContextMenu)
  startCountdown()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('contextmenu', onContextMenu)
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black select-none"
    @mousedown="onMouseDown"
    @touchstart.passive="onTouchStart"
  >
    <!-- Three.js Canvas -->
    <ClientOnly>
      <ThreeCanvas ref="threeCanvas" />
    </ClientOnly>

    <!-- HUD Overlay -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Timer -->
      <div class="absolute top-4 left-4 md:top-6 md:left-6">
        <div class="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 text-white font-sans text-sm md:text-base tabular-nums">
          ⏱ {{ formattedTime }}s
        </div>
      </div>

      <!-- Click counter -->
      <div class="absolute top-4 right-4 md:top-6 md:right-6">
        <div class="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 text-white font-sans text-sm md:text-base tabular-nums">
          👊 {{ clickCount }} / {{ levelConfig.requiredClicks }}
        </div>
      </div>

      <!-- Level indicator (animates from center to HUD) -->
      <div
        class="level-indicator absolute left-1/2 text-white font-sans font-semibold"
        :class="gameState === 'countdown' ? 'level-indicator--center' : 'level-indicator--hud'"
      >
        <div class="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 whitespace-nowrap">
          Level {{ level }}
        </div>
      </div>

      <!-- Countdown overlay -->
      <div
        v-if="gameState === 'countdown'"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-4">
          <!-- spacer so countdown sits below the level label -->
          <div class="h-10" />
          <span class="text-white font-serif text-8xl md:text-9xl animate-pulse">
            {{ countdownNumber > 0 ? countdownNumber : 'Los!' }}
          </span>
        </div>
      </div>

      <!-- Level complete overlay -->
      <div
        v-if="gameState === 'levelComplete'"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center">
          <div class="text-white font-serif text-4xl md:text-6xl mb-2">Geschafft!</div>
          <div class="text-white/70 font-sans text-lg">Nächstes Level …</div>
        </div>
      </div>

      <!-- Game over overlay -->
      <div
        v-if="gameState === 'gameOver'"
        class="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-600"
      >
        <div class="text-center">
          <div class="text-white font-serif text-4xl md:text-6xl mb-2">Game Over</div>
          <div class="text-white/70 font-sans text-lg">Level {{ level }} – {{ clickCount }} Schläge</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-indicator {
  transition: top 0.7s cubic-bezier(0.25, 0.1, 0.25, 1),
              transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1),
              font-size 0.7s cubic-bezier(0.25, 0.1, 0.25, 1);
  z-index: 10;
}

.level-indicator--center {
  top: calc(50% - 60px);
  transform: translateX(-50%) translateY(-50%);
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .level-indicator--center {
    font-size: 1.875rem;
  }
}

.level-indicator--hud {
  top: 1rem;
  transform: translateX(-50%);
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .level-indicator--hud {
    top: 1.5rem;
    font-size: 1rem;
  }
}
</style>
