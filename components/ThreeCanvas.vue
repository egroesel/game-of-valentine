<script setup lang="ts">
import { useThreeBoxingScene } from '~/composables/useThreeBoxingScene'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const scene = useThreeBoxingScene()

defineExpose({
  punch: (strength?: number) => scene.punch(strength),
  setIntensity: (level: number) => scene.setIntensity(level),
  setGameOver: (over: boolean) => scene.setGameOver(over),
})

onMounted(() => {
  if (canvasRef.value) {
    scene.mount(canvasRef.value)
  }
})

onUnmounted(() => {
  scene.unmount()
})
</script>

<template>
  <canvas ref="canvasRef" class="w-full h-full block" />
</template>
