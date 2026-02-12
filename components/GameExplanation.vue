<script setup lang="ts">
const emit = defineEmits<{
  start: []
}>()

const entered = ref(false)
const showButton = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    entered.value = true
  })
  setTimeout(() => {
    showButton.value = true
  }, 1800)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 bg-black" />

    <div
      class="relative z-10 flex flex-col items-center gap-6 px-6 max-w-[36rem] text-center transition-all duration-1000 ease-out"
      :class="entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
    >
      <div class="text-6xl mb-2">🥊</div>

      <h1 class="font-serif text-3xl md:text-4xl tracking-tight text-white">
        Aber zuerst …
      </h1>

      <p class="font-sans text-lg text-white/75 leading-relaxed">
        Ich habe ein kleines Spiel für dich vorbereitet. Schlage so oft du kannst auf den Boxsack – bevor die Zeit abläuft!
      </p>

      <p class="font-sans text-lg text-white/40 mt-2">
        Nach jedem Level bekommst du einen Hinweis zu deinem Geschenk …
      </p>

      <div class="flex flex-col items-center gap-3 mt-2">
        <div class="flex items-center gap-3 text-white/60 font-sans text-sm">
          <span>👆</span>
          <span>Tippen / Klicken = Schlagen</span>
        </div>
        <div class="flex items-center gap-3 text-white/60 font-sans text-sm">
          <span>⏱</span>
          <span>Schlag genug, bevor die Zeit abläuft</span>
        </div>
        <div class="flex items-center gap-3 text-white/60 font-sans text-sm">
          <span>📈</span>
          <span>Es wird mit jedem Level schwerer</span>
        </div>
      </div>

      <button
        class="mt-4 px-10 py-3 rounded-full bg-white text-black font-sans font-semibold text-lg transition-all duration-500"
        :class="showButton ? 'opacity-100 translate-y-0 hover:scale-105 active:scale-95' : 'opacity-0 translate-y-4 pointer-events-none'"
        @click="emit('start')"
      >
        Los geht's!
      </button>
    </div>
  </div>
</template>
