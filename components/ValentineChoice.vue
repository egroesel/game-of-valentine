<script setup lang="ts">
import { launchConfetti } from '~/utils/confetti'

const emit = defineEmits<{
  confirmed: []
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
const neinOffset = ref({ x: 0, y: 0 })
const evadeCount = ref(0)
const confirmed = ref(false)
const entered = ref(false)
let stopConfetti: (() => void) | null = null

function evadeNein() {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const padding = 60
  const maxX = rect.width / 2 - padding
  const maxY = rect.height / 2 - padding

  // Increasingly desperate evasion
  const range = Math.min(1, 0.5 + evadeCount.value * 0.15)
  neinOffset.value = {
    x: (Math.random() * 2 - 1) * maxX * range,
    y: (Math.random() * 2 - 1) * maxY * range,
  }
  evadeCount.value++
}

function onJa() {
  confirmed.value = true
  // Launch confetti after next tick (canvas needs to mount)
  nextTick(() => {
    if (confettiCanvas.value) {
      stopConfetti = launchConfetti(confettiCanvas.value, 2200)
    }
  })
  setTimeout(() => emit('confirmed'), 2800)
}

onUnmounted(() => {
  stopConfetti?.()
})

// Desktop: evade on hover
function onNeinHover() {
  evadeNein()
}

// Mobile: evade on touch
function onNeinTouch(e: TouchEvent) {
  e.preventDefault()
  evadeNein()
}

onMounted(() => {
  // Smooth entrance: delay before elements become interactive
  requestAnimationFrame(() => {
    entered.value = true
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
  >
    <!-- Background -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/img/us.jpg)' }"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/55" />

    <div
      class="relative z-10 flex flex-col items-center gap-8 px-6 max-w-[38rem] text-center transition-all duration-700 ease-out"
      :class="entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <h1 class="font-serif text-3xl md:text-5xl tracking-tight text-white">
        Möchtest du mein Valentin sein?
      </h1>

      <!-- Confirmed state: confetti handled by parent, show heart -->
      <div
        v-if="confirmed"
        class="flex flex-col items-center gap-4"
      >
        <div class="text-7xl heart-pop">
          ❤️
        </div>
        <p class="font-sans text-lg text-white/80 animate-fade-in">
          Das wusste ich doch!
        </p>
      </div>

      <!-- Buttons -->
      <div v-else class="relative flex gap-6 items-center justify-center" style="min-height: 120px;">
        <button
          class="px-8 py-3 rounded-full bg-white text-black font-sans font-semibold text-lg transition-transform hover:scale-110 active:scale-95 z-10"
          @click="onJa"
        >
          Ja
        </button>

        <button
          class="px-8 py-3 rounded-full bg-white/20 text-white border border-white/40 font-sans font-semibold text-lg backdrop-blur-sm transition-all duration-200 z-10"
          :style="{
            transform: `translate(${neinOffset.x}px, ${neinOffset.y}px)`,
          }"
          @mouseenter="onNeinHover"
          @touchstart="onNeinTouch"
        >
          Nein
        </button>
      </div>
    </div>

    <!-- Confetti canvas -->
    <canvas
      v-if="confirmed"
      ref="confettiCanvas"
      class="absolute inset-0 pointer-events-none z-20"
    />
  </div>
</template>

<style scoped>
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
