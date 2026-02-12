import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { easeOutCubic, easeOutBack } from '~/utils/easing'

interface BagPhysics {
  rotX: number
  rotZ: number
  velX: number
  velZ: number
}

export function useThreeBoxingScene() {
  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let animationId: number | null = null

  let bag: THREE.Mesh | null = null
  let glove: THREE.Object3D | null = null
  let directionalLight: THREE.DirectionalLight | null = null
  let hitFlash: THREE.Sprite | null = null

  const bagPhysics: BagPhysics = { rotX: 0, rotZ: 0, velX: 0, velZ: 0 }
  const SPRING_K = 26.0
  const DAMPING = 7.0
  const MAX_ROT = 0.35

  // Punch animation state
  let isPunching = false
  let punchTime = 0
  const PUNCH_FORWARD = 0.12
  const PUNCH_RETURN = 0.18
  const PUNCH_TOTAL = PUNCH_FORWARD + PUNCH_RETURN
  const PUNCH_DISTANCE = 0.75
  let lastPunchVisual = 0
  const PUNCH_COOLDOWN = 80

  // Glove positions
  const gloveRestPos = new THREE.Vector3(0.55, 1.05, 1.2)
  const gloveRestRot = new THREE.Euler(Math.PI / 4, -0.6, 0)
  const punchDir = new THREE.Vector3(-0.30, 0, -0.85).normalize()

  // Camera shake
  const cameraBasePos = new THREE.Vector3(0.0, 1.4, 4.2)
  let shakeIntensity = 0

  // Level intensity
  let strengthMultiplier = 1.0
  let isGameOver = false

  let clock: THREE.Clock

  function mount(canvas: HTMLCanvasElement) {
    clock = new THREE.Clock()

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    // Scene
    scene = new THREE.Scene()

    // Camera
    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.copy(cameraBasePos)
    camera.lookAt(0, 1.1, 0)

    // Lights – gym atmosphere with warm overhead + cool fill
    const ambient = new THREE.AmbientLight(0x404050, 0.4)
    scene.add(ambient)

    directionalLight = new THREE.DirectionalLight(0xffe8c0, 1.3)
    directionalLight.position.set(2, 5, 3)
    scene.add(directionalLight)

    const fillLight = new THREE.PointLight(0x8090b0, 0.5)
    fillLight.position.set(-3, 2.5, 2)
    scene.add(fillLight)

    // Overhead gym lights (warm hanging lamps)
    const lamp1 = new THREE.PointLight(0xffcc77, 0.8, 8)
    lamp1.position.set(0, 3.8, 0)
    scene.add(lamp1)

    const lamp2 = new THREE.PointLight(0xffcc77, 0.4, 6)
    lamp2.position.set(-3, 3.8, -2)
    scene.add(lamp2)

    const lamp3 = new THREE.PointLight(0xffcc77, 0.4, 6)
    lamp3.position.set(3, 3.8, -2)
    scene.add(lamp3)

    // Boxing hall environment
    createGymEnvironment()

    // Fog – subtle depth
    scene.fog = new THREE.Fog(0x0a0a12, 6, 16)

    // Punching bag
    createBag()

    // Glove (try GLB, fallback to primitive)
    createGlove()

    // Hit flash sprite
    createHitFlash()

    // Resize
    window.addEventListener('resize', onResize)

    // Start render loop
    animate()
  }

  function createGymEnvironment() {
    if (!scene) return

    // --- Floor: dark wood planks ---
    const floorGeo = new THREE.PlaneGeometry(14, 14)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a1f16,
      roughness: 0.85,
      metalness: 0.0,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.add(floor)

    const wallColor = 0x1a1520
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })

    // --- Back wall ---
    const backWallGeo = new THREE.PlaneGeometry(14, 5)
    const backWall = new THREE.Mesh(backWallGeo, wallMat)
    backWall.position.set(0, 2.5, -5)
    scene.add(backWall)

    // --- Side walls ---
    const sideWallGeo = new THREE.PlaneGeometry(10, 5)
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat.clone())
    leftWall.position.set(-7, 2.5, 0)
    leftWall.rotation.y = Math.PI / 2
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat.clone())
    rightWall.position.set(7, 2.5, 0)
    rightWall.rotation.y = -Math.PI / 2
    scene.add(rightWall)

    // --- Ceiling ---
    const ceilingGeo = new THREE.PlaneGeometry(14, 10)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x121018,
      roughness: 0.95,
      side: THREE.DoubleSide,
    })
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 4
    scene.add(ceiling)

    // --- Hanging lamp fixtures (visual) ---
    const lampGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.1, 16)
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 })
    const lampPositions = [[0, 3.95, 0], [-3, 3.95, -2], [3, 3.95, -2]]
    for (const [x, y, z] of lampPositions) {
      const lampShade = new THREE.Mesh(lampGeo, lampMat)
      lampShade.position.set(x, y, z)
      scene.add(lampShade)

      // Wire
      const wireGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4)
      const wireMat = new THREE.MeshStandardMaterial({ color: 0x444444 })
      const wire = new THREE.Mesh(wireGeo, wireMat)
      wire.position.set(x, 4.07, z)
      scene.add(wire)
    }

    // --- Ceiling beam (horizontal bar where bag hangs) ---
    const beamGeo = new THREE.BoxGeometry(3, 0.12, 0.12)
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.position.set(0, 3.9, 0)
    scene.add(beam)

    // --- Back wall accent: horizontal stripe ---
    const stripeGeo = new THREE.PlaneGeometry(13.8, 0.15)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      roughness: 0.5,
      emissive: 0x330808,
    })
    const stripe = new THREE.Mesh(stripeGeo, stripeMat)
    stripe.position.set(0, 1.5, -4.98)
    scene.add(stripe)

    // --- Ropes along back wall (gym vibe) ---
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xcc8833, roughness: 0.7 })
    for (let i = 0; i < 3; i++) {
      const ropeGeo = new THREE.CylinderGeometry(0.015, 0.015, 8, 8)
      const rope = new THREE.Mesh(ropeGeo, ropeMat)
      rope.rotation.z = Math.PI / 2
      rope.position.set(0, 0.8 + i * 0.4, -4.9)
      scene.add(rope)
    }

    // --- Rope posts ---
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 })
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8)
    for (const x of [-4, 4]) {
      const post = new THREE.Mesh(postGeo, postMat)
      post.position.set(x, 0.9, -4.9)
      scene.add(post)
    }
  }

  function createBag() {
    if (!scene) return

    const geo = new THREE.CylinderGeometry(0.45, 0.45, 1.7, 32, 1)
    const textureLoader = new THREE.TextureLoader()

    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc8844,
      roughness: 0.7,
      metalness: 0.0,
    })

    // Try loading texture
    textureLoader.load(
      '/img/bag_faces_tile.jpg',
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(4.5, 2.5)
        mat.map = texture
        mat.needsUpdate = true
      },
      undefined,
      () => {
        // Fallback: solid color already set
      },
    )

    bag = new THREE.Mesh(geo, mat)
    bag.position.set(0, 1.05, 0)
    scene.add(bag)

    // Chain from bag to ceiling beam
    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8)
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
    const chain = new THREE.Mesh(chainGeo, chainMat)
    chain.position.set(0, 2.9, 0)
    scene.add(chain)

    // Mounting plate
    const mountGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16)
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.2 })
    const mount = new THREE.Mesh(mountGeo, mountMat)
    mount.position.set(0, 1.92, 0)
    scene.add(mount)
  }

  function createGlove() {
    if (!scene) return

    const loader = new GLTFLoader()
    loader.load(
      '/models/glove.glb',
      (gltf) => {
        glove = gltf.scene
        glove.position.copy(gloveRestPos)
        glove.rotation.copy(gloveRestRot)
        glove.scale.setScalar(0.3)
        scene!.add(glove)
      },
      undefined,
      () => {
        // Fallback: primitive glove
        createPrimitiveGlove()
      },
    )
  }

  function createPrimitiveGlove() {
    if (!scene) return

    const group = new THREE.Group()
    const fistGeo = new THREE.SphereGeometry(0.22, 16, 16)
    const fistMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 })
    const fist = new THREE.Mesh(fistGeo, fistMat)
    group.add(fist)

    const wristGeo = new THREE.BoxGeometry(0.18, 0.28, 0.18)
    const wristMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, roughness: 0.5 })
    const wrist = new THREE.Mesh(wristGeo, wristMat)
    wrist.position.set(0, -0.22, 0)
    group.add(wrist)

    group.position.copy(gloveRestPos)
    group.rotation.copy(gloveRestRot)
    glove = group
    scene.add(glove)
  }

  function createHitFlash() {
    if (!scene) return

    // Generate radial gradient texture at runtime
    const size = 128
    const canvas2d = document.createElement('canvas')
    canvas2d.width = size
    canvas2d.height = size
    const ctx = canvas2d.getContext('2d')!
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,200,1)')
    gradient.addColorStop(0.3, 'rgba(255,220,100,0.8)')
    gradient.addColorStop(1, 'rgba(255,180,50,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas2d)

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    hitFlash = new THREE.Sprite(spriteMat)
    hitFlash.scale.set(0, 0, 0)
    hitFlash.position.set(0.15, 1.1, 0.5)
    scene.add(hitFlash)
  }

  function punch(strength: number = 1.0) {
    const now = performance.now()

    // Visual cooldown
    if (now - lastPunchVisual < PUNCH_COOLDOWN) return
    lastPunchVisual = now

    const s = strength * strengthMultiplier

    // Start glove animation
    isPunching = true
    punchTime = 0

    // Bag impact
    const impulse = 0.22 * s
    bagPhysics.velX += (Math.random() * 0.6 - 0.3) * impulse
    bagPhysics.velZ += -1.0 * impulse

    // Camera shake
    shakeIntensity = 0.015 * s

    // Hit flash
    triggerHitFlash()
  }

  let flashTime = 0
  let flashActive = false

  function triggerHitFlash() {
    flashActive = true
    flashTime = 0
  }

  function updateHitFlash(dt: number) {
    if (!hitFlash || !flashActive) return

    flashTime += dt
    const mat = hitFlash.material as THREE.SpriteMaterial

    if (flashTime < 0.08) {
      const t = flashTime / 0.08
      const scale = easeOutCubic(t) * 1.2
      hitFlash.scale.set(scale, scale, scale)
      mat.opacity = 1
    } else if (flashTime < 0.2) {
      const t = (flashTime - 0.08) / 0.12
      mat.opacity = 1 - t
      hitFlash.scale.set(1.2, 1.2, 1.2)
    } else {
      mat.opacity = 0
      hitFlash.scale.set(0, 0, 0)
      flashActive = false
    }
  }

  function updateBagPhysics(dt: number) {
    if (!bag) return

    // Damped spring
    bagPhysics.velX += (-SPRING_K * bagPhysics.rotX - DAMPING * bagPhysics.velX) * dt
    bagPhysics.velZ += (-SPRING_K * bagPhysics.rotZ - DAMPING * bagPhysics.velZ) * dt
    bagPhysics.rotX += bagPhysics.velX * dt
    bagPhysics.rotZ += bagPhysics.velZ * dt

    // Clamp
    bagPhysics.rotX = Math.max(-MAX_ROT, Math.min(MAX_ROT, bagPhysics.rotX))
    bagPhysics.rotZ = Math.max(-MAX_ROT, Math.min(MAX_ROT, bagPhysics.rotZ))

    bag.rotation.x = bagPhysics.rotX
    bag.rotation.z = bagPhysics.rotZ

    // Slight position offset
    bag.position.x = bagPhysics.rotZ * 0.15
    bag.position.z = bagPhysics.rotZ * 0.10
  }

  function updateGloveAnimation(dt: number) {
    if (!glove || !isPunching) return

    punchTime += dt

    if (punchTime <= PUNCH_FORWARD) {
      // Phase A: forward
      const t = easeOutCubic(punchTime / PUNCH_FORWARD)
      const offset = punchDir.clone().multiplyScalar(PUNCH_DISTANCE * t)
      glove.position.copy(gloveRestPos).add(offset)

      // Rotation
      glove.rotation.set(
        gloveRestRot.x + (-0.12 * t),
        gloveRestRot.y + (-0.08 * t),
        gloveRestRot.z + (0.10 * t),
      )
    } else if (punchTime <= PUNCH_TOTAL) {
      // Phase B: return with overshoot
      const t = easeOutBack((punchTime - PUNCH_FORWARD) / PUNCH_RETURN)
      const offset = punchDir.clone().multiplyScalar(PUNCH_DISTANCE * (1 - t))
      glove.position.copy(gloveRestPos).add(offset)

      glove.rotation.set(
        gloveRestRot.x + (-0.12 * (1 - t)),
        gloveRestRot.y + (-0.08 * (1 - t)),
        gloveRestRot.z + (0.10 * (1 - t)),
      )
    } else {
      // Done
      isPunching = false
      glove.position.copy(gloveRestPos)
      glove.rotation.copy(gloveRestRot)
    }
  }

  function updateCameraShake(dt: number) {
    if (!camera) return

    if (shakeIntensity > 0.0005) {
      camera.position.set(
        cameraBasePos.x + (Math.random() - 0.5) * shakeIntensity,
        cameraBasePos.y + (Math.random() - 0.5) * shakeIntensity,
        cameraBasePos.z + (Math.random() - 0.5) * shakeIntensity,
      )
      // Exponential decay
      shakeIntensity *= Math.exp(-12 * dt)
    } else {
      shakeIntensity = 0
      camera.position.copy(cameraBasePos)
    }
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    if (!renderer || !scene || !camera) return

    const dt = Math.min(clock.getDelta(), 0.05) // Cap dt to avoid spiral

    updateBagPhysics(dt)
    updateGloveAnimation(dt)
    updateCameraShake(dt)
    updateHitFlash(dt)

    renderer.render(scene, camera)
  }

  function onResize() {
    if (!renderer || !camera) return
    const canvas = renderer.domElement
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  function setIntensity(level: number) {
    strengthMultiplier = Math.min(1 + level * 0.08, 1.35)
  }

  function setGameOver(over: boolean) {
    isGameOver = over

    if (over && directionalLight) {
      // Dim lights over 600ms via animation
      const startIntensity = directionalLight.intensity
      const startTime = performance.now()
      const dimDuration = 600

      function dimStep() {
        if (!directionalLight) return
        const elapsed = performance.now() - startTime
        const t = Math.min(elapsed / dimDuration, 1)
        directionalLight.intensity = startIntensity * (1 - t * 0.7)
        if (t < 1) requestAnimationFrame(dimStep)
      }
      dimStep()

      // Increase damping to let bag settle
      bagPhysics.velX *= 0.5
      bagPhysics.velZ *= 0.5
    }
  }

  function unmount() {
    if (animationId !== null) cancelAnimationFrame(animationId)
    window.removeEventListener('resize', onResize)

    // Dispose scene
    scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })

    renderer?.dispose()
    renderer = null
    scene = null
    camera = null
    bag = null
    glove = null
  }

  return { mount, unmount, punch, setIntensity, setGameOver }
}
