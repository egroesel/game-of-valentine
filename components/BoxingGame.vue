<script setup lang="ts">
import { getLevelConfig } from '~/utils/levels'
import { sendWebhook, generateSessionId } from '~/utils/webhook'

const emit = defineEmits<{
  gameEnd: []
}>()

const config = useRuntimeConfig()
const webhookUrl = config.public.n8nWebhookUrl as string

const threeCanvas = ref<InstanceType<typeof import('./ThreeCanvas.vue').default> | null>(null)

const sessionId = generateSessionId()
const level = ref(1)
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

  // Send webhook
  sendWebhook(webhookUrl, {
    level: level.value,
    success,
    clickCount: clickCount.value,
    timeLimit: levelConfig.value.timeLimit,
    sessionId,
    timestamp: new Date().toISOString(),
  })

  if (success) {
    gameState.value = 'levelComplete'
    setTimeout(() => {
      level.value++
      startCountdown()
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

  // Check win condition
  if (clickCount.value >= levelConfig.value.requiredClicks) {
    endLevel(true)
  }
}

// Input handlers
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

      <!-- Level indicator -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2">
        <div class="bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 text-white font-sans text-sm md:text-base font-semibold">
          Level {{ level }}
        </div>
      </div>

      <!-- Countdown overlay -->
      <div
        v-if="gameState === 'countdown'"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="text-white font-serif text-8xl md:text-9xl animate-pulse">
          {{ countdownNumber > 0 ? countdownNumber : 'Los!' }}
        </span>
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
