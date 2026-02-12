interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotSpeed: number
  life: number
  maxLife: number
  shape: 'rect' | 'circle'
}

const COLORS = [
  '#ff6b8a', '#ff4d6d', '#c9184a', '#ff85a1',
  '#ffd6e0', '#ffb3c6', '#ff0a54', '#ff477e',
  '#ffc2d4', '#fff0f3',
]

export function launchConfetti(canvas: HTMLCanvasElement, duration = 2500): () => void {
  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles: Particle[] = []
  let animId: number
  let spawning = true
  const startTime = performance.now()

  function spawnBurst(count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const speed = 4 + Math.random() * 8
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }
  }

  // Initial burst
  spawnBurst(80)

  function animate() {
    const elapsed = performance.now() - startTime

    // Continuous gentle spawning
    if (spawning && elapsed < duration) {
      if (Math.random() < 0.4) {
        spawnBurst(3)
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life += 1 / 60
      p.vy += 0.15 // gravity
      p.vx *= 0.99 // air resistance
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotSpeed

      const lifeRatio = p.life / p.maxLife
      const alpha = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1

      if (p.life >= p.maxLife || p.y > canvas.height + 20) {
        particles.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    if (particles.length > 0 || elapsed < duration) {
      animId = requestAnimationFrame(animate)
    }
  }

  animId = requestAnimationFrame(animate)

  // Stop spawning after duration
  setTimeout(() => { spawning = false }, duration)

  return () => {
    cancelAnimationFrame(animId)
  }
}
