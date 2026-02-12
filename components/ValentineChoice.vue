<script setup lang="ts">
const emit = defineEmits<{
  confirmed: []
}>()

const neinRef = ref<HTMLButtonElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const neinOffset = ref({ x: 0, y: 0 })
const evadeCount = ref(0)
const confirmed = ref(false)

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
  setTimeout(() => emit('confirmed'), 800)
}

// Desktop: evade on hover
function onNeinHover() {
  evadeNein()
}

// Mobile: evade on touch
function onNeinTouch(e: TouchEvent) {
  e.preventDefault()
  evadeNein()
}
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

    <div class="relative z-10 flex flex-col items-center gap-8 px-6 max-w-[38rem] text-center">
      <h1 class="font-serif text-3xl md:text-5xl tracking-tight text-white">
        Möchtest du mein Valentin sein?
      </h1>

      <!-- Confirmed state: hearts -->
      <div v-if="confirmed" class="text-6xl animate-bounce">
        ❤️
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
          ref="neinRef"
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
  </div>
</template>
