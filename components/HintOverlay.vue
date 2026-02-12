<script setup lang="ts">
import type { Hint } from '~/utils/hints'

const props = defineProps<{
  hint: Hint | null
  hintNumber: number
}>()

const emit = defineEmits<{
  continue: []
}>()

const entered = ref(false)
const showButton = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    entered.value = true
  })
  setTimeout(() => {
    showButton.value = true
  }, 1600)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-black" />

    <div
      class="relative z-10 flex flex-col items-center gap-6 px-6 max-w-[34rem] text-center transition-all duration-1000 ease-out"
      :class="entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
    >
      <p class="font-sans text-sm text-white/40 uppercase tracking-wider">
        Hinweis {{ props.hintNumber }}
      </p>

      <div class="text-5xl mb-1">
        {{ props.hint?.emoji }}
      </div>

      <p class="font-serif text-2xl md:text-3xl text-white leading-relaxed">
        {{ props.hint?.text }}
      </p>

      <button
        class="mt-6 px-10 py-3 rounded-full bg-white/15 text-white border border-white/30 font-sans font-semibold text-lg backdrop-blur-sm transition-all duration-500"
        :class="showButton ? 'opacity-100 translate-y-0 hover:scale-105 active:scale-95' : 'opacity-0 translate-y-4 pointer-events-none'"
        @click="emit('continue')"
      >
        Weiter spielen
      </button>
    </div>
  </div>
</template>
