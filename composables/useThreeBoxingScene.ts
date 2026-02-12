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
  const gloveRestPos = new THREE.Vector3(0.8, 1.05, 1.2)
  const gloveRestRot = new THREE.Euler(0, -0.4, 0)
  const punchDir = new THREE.Vector3(-0.55, 0, -0.85).normalize()

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

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambient)

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
    directionalLight.position.set(2.5, 4, 2.5)
    scene.add(directionalLight)

    const point = new THREE.PointLight(0xffffff, 0.6)
    point.position.set(-2, 2, 2)
    scene.add(point)

    // Floor
    const floorGeo = new THREE.PlaneGeometry(10, 10)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.add(floor)

    // Fog
    scene.fog = new THREE.Fog(0x000000, 5, 12)

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
        texture.repeat.set(2.2, 1.2)
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

    // Chain (cosmetic)
    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8)
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
    const chain = new THREE.Mesh(chainGeo, chainMat)
    chain.position.set(0, 2.3, 0)
    scene.add(chain)
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

    const textureLoader = new THREE.TextureLoader()
    const spriteMat = new THREE.SpriteMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })

    textureLoader.load(
      '/img/hit_flash.png',
      (texture) => {
        spriteMat.map = texture
        spriteMat.needsUpdate = true
      },
      undefined,
      () => {
        // No texture fallback: plain colored sprite
      },
    )

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
