<script setup lang="ts">
type Screen = 'intro' | 'choice' | 'boxing' | 'end'

const screen = ref<Screen>('intro')

function onIntroChoice(answer: 'ja' | 'nein') {
  if (answer === 'nein') {
    // Switch to the evasive button screen
    screen.value = 'choice'
  } else {
    screen.value = 'boxing'
  }
}

function onChoiceConfirmed() {
  screen.value = 'boxing'
}

function onGameEnd() {
  screen.value = 'end'
}

function restart() {
  screen.value = 'intro'
}
</script>

<template>
  <div class="min-h-screen bg-black">
    <IntroOverlay
      v-if="screen === 'intro'"
      @choice="onIntroChoice"
    />

    <ValentineChoice
      v-if="screen === 'choice'"
      @confirmed="onChoiceConfirmed"
    />

    <ClientOnly>
      <BoxingGame
        v-if="screen === 'boxing'"
        @game-end="onGameEnd"
      />
    </ClientOnly>

    <!-- End screen -->
    <div
      v-if="screen === 'end'"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: 'url(/img/us.jpg)' }"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/55" />
      <div class="relative z-10 text-center px-6 max-w-[38rem]">
        <h1 class="font-serif text-3xl md:text-5xl tracking-tight text-white mb-6">
          Danke fürs Spielen ❤️
        </h1>
        <p class="font-sans text-lg text-white/80 mb-8">
          Schau auf dein Handy …
        </p>
        <button
          class="px-8 py-3 rounded-full bg-white/20 text-white border border-white/40 font-sans font-semibold text-lg backdrop-blur-sm transition-transform hover:scale-105"
          @click="restart"
        >
          Nochmal spielen
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
