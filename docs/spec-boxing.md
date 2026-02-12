# Three.js Boxing Scene – Technische Spezifikation

## Ziele

* Jeder Klick steuert einen **Boxhandschuh**, der einen **Boxsack** schlägt.
* Boxsack hat eine **gekachelte Textur** mit vielen Gesichtern.
* HUD: **oben links Zeit**, **oben rechts Schläge** (als HTML Overlay).
* Animationsgefühl: "snappy", arcade-like, visuell befriedigend.

---

## Architektur / Komponenten

**Komponenten**

* `BoxingGame.vue`
  Verantwortlich für Game State (Level, Timer, Klicks), HUD, Webhook calls.
* `ThreeCanvas.vue`
  Kümmert sich um Renderer, Kamera, Resize, Game Loop. Exponiert Methoden: `punch()`, `setIntensity()`, `setGameOver()`.
* `useThreeBoxingScene.ts` (Composables/Module)
  Erstellt Szeneobjekte, Material, Animation System, Impact FX.

**Datenfluss**

* Input (click/touch) → `BoxingGame` erhöht Counter + ruft `three.punch(strength)` auf.
* Timer tick → HUD update
* Level end → Webhook → UI Transition / next level

---

## Szene-Setup

### Renderer

* `WebGLRenderer({ antialias: true, alpha: true })`
* `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
* `renderer.outputColorSpace = SRGBColorSpace`
* `renderer.toneMapping = ACESFilmicToneMapping` (optional, looks nicer)
* Canvas fullscreen im Game Screen

### Kamera

* `PerspectiveCamera(fov=45, aspect, near=0.1, far=100)`
* Position: `camera.position.set(0.0, 1.4, 4.2)`
* LookAt: `camera.lookAt(0, 1.1, 0)`

### Szene / Atmosphäre

* Hintergrund: dunkler Verlauf (im CSS) oder `scene.background = new Color(...)` optional.
* Boden: Plane mit leichtem Roughness (oder einfach dunkel)
* Optional: subtiler Nebel `Fog(0x000000, 5, 12)` (wenn's gut aussieht)

---

## Objekte & Materialien

### Boxsack (Hauptziel)

* Geometrie: `CylinderGeometry(radiusTop=0.45, radiusBottom=0.45, height=1.7, radialSegments=32, heightSegments=1)`
* Position: `bag.position.set(0, 1.05, 0)`
* Material: `MeshStandardMaterial`
  * map: `bag_faces_tile.jpg` (kachelbar!)
  * `map.wrapS = map.wrapT = RepeatWrapping`
  * `map.repeat.set(2.2, 1.2)` (feintunen)
  * roughness: 0.7
  * metalness: 0.0
  * normalMap optional (Leather normal) falls verfügbar

**Aufhängung** (optional)

* kleines Top-Cap + Kette (cosmetic), aber nicht nötig.

### Boxhandschuh

Option A (Fallback schnell):

* `SphereGeometry(0.22)` + kleine "Wrist" Box
* Material: `MeshStandardMaterial({ color: red-ish, roughness: 0.4 })`

Option B (hübsch):

* GLB Model importieren (z. B. `/public/models/glove.glb`)
* Falls GLB fehlt: automatisch auf Option A fallback.

Position (Ruhepose):

* `glove.position.set(0.8, 1.05, 1.2)` (rechts vorne)
* Rotation leicht zum Sack: `glove.rotation.set(0, -0.4, 0)`

---

## Licht

Minimal-Setup:

* `AmbientLight(white, 0.45)`
* `DirectionalLight(white, 1.1)` Position: `(2.5, 4, 2.5)` Cast shadows optional
* `PointLight(white, 0.6)` Position: `(-2, 2, 2)` als Fill

Shadows nur wenn Performance ok:

* `renderer.shadowMap.enabled = true`
* Bag/Glove cast + floor receive

---

## HUD (HTML Overlay, nicht Three.js)

In `BoxingGame.vue` über dem Canvas:

* Timer: top-left (`fixed`/`absolute`), `tabular-nums` für ruhige Ziffern
* Click counter: top-right

Beispiel Styles:

* Container: `absolute inset-0 pointer-events-none`
* HUD Pills: `bg-black/40 backdrop-blur-sm rounded-2xl px-4 py-2 text-white`

---

## Input Spezifikation

### Desktop

* Zähle **left + right click**
* `window.addEventListener('mousedown', onMouseDown, { passive: true })`
* `window.addEventListener('contextmenu', e => e.preventDefault())`

### Mobile

* `touchstart` auf Game Container zählt als Punch
* Multi-touch ignorieren (immer +1)

### Anti-Spam (optional)

Damit Animation nicht komplett überläuft:

* Input zählt **immer**, aber Animation triggert mit Cooldown:
  * max 12 Punch-Animations pro Sekunde (≈ 80ms cooldown)
  * Klickcounter bleibt dennoch exakt.

---

## Punch- & Impact-Animationen (mit Parametern)

Wir nutzen ein **kleines "procedural animation" System** (kein schweres Rig nötig). Kern: ein kurzer Jab nach vorne, Rückkehr mit Overshoot + Sack-Wobble.

### Zeitbasis

* Punch Dauer: `punchT = 0.12s` (vor) + `returnT = 0.18s` (zurück) → total `0.30s`
* Cooldown für Visual Punch: `0.08s`

### Easing-Kurven (implementierbar als Funktionen)

**easeOutCubic**
`f(t)=1-(1-t)^3`

**easeInOutQuad**
`t<0.5 ? 2t^2 : 1 - (-2t+2)^2/2`

**easeOutBack** (kleiner "snap")
`c1=1.70158; c3=c1+1; f(t)=1 + c3*(t-1)^3 + c1*(t-1)^2`

Diese Kurven sind bewusst gewählt: Punch fühlt sich "snappy" an.

---

### Handschuh-Animation

**Ruheposition**: `p0 = (0.8, 1.05, 1.2)`
**Zielposition** (Impact): Richtung Sack, z. B. `pHit = (0.25, 1.05, 0.35)`
(Die Werte hängen von Kamera/Bag ab; implementiere als Vektor: von glove → bag plus offset)

**Algorithmus**

* Beim Punch Start:
  * `startPos = glove.position`
  * `targetPos = startPos + punchDir * punchDistance`
  * `punchDistance = 0.75` (skalierbar per strength)
* Phase A (0 → 0.12s): Position lerpen mit `easeOutCubic`
* Phase B (0.12 → 0.30s): zurück zu `startPos` mit `easeOutBack` (leichtes Overshoot)

**Rotation**

* Beim Vorstoß leicht "reindrehen":
  * `rotStart = glove.rotation`
  * `rotHit = rotStart + (x: -0.12, y: -0.08, z: 0.10)` (je nach Setup)
* Rotation lerpen synchron mit Position (Phase A/B)

**Kamerashake**

* Bei Impact (einmalig, bei t≈0.12s):
  * `camera.position += smallRandomVec * 0.015 * strength`
  * Dann in 120ms zurück dampen (exponentiell)

---

### Boxsack-Wobble (physikalisch plausibel, aber leicht)

Wir simulieren Sack-Schwingen als **damped spring** auf Rotation um X/Z.

State:

* `bagRotVelX, bagRotVelZ`
* `bagRotX, bagRotZ`

Beim Impact:

* `impulse = 0.22 * strength` (tune)
* `bagRotVelX += (random(-0.3,0.3)) * impulse`
* `bagRotVelZ += (-1.0) * impulse` (vom Punch nach hinten)

Update pro Frame (dt):

* `springK = 26.0`
* `damping = 7.0`
* `bagRotVel += (-springK * bagRot - damping * bagRotVel) * dt`
* `bagRot += bagRotVel * dt`
* Clamp: `bagRot` max `0.35 rad` (damit's nicht absurd wird)

Optional: leichter Positions-Offset:

* `bag.position.x = bagRotZ * 0.15`
* `bag.position.z = 0 + bagRotZ * 0.10`

---

### Impact FX (sehr empfehlenswert)

**1) Hit Flash**

* Ein kleines Plane/Sprite am Kontaktpunkt:
  * Scale: 0 → 1.2 in 80ms (easeOutCubic)
  * Opacity: 1 → 0 in 120ms
* Additiv (transparent) Material

**2) Partikel Mini-Burst (optional)**

* 12–20 kleine Sprites, radial
* Lebensdauer 200–350ms
* Nur wenn Performance ok

---

## Level-Feedback in Szene

Damit Level spürbar schwerer wirkt (ohne nur Zahlen):

* Je höher Level:
  * etwas mehr Kamera-Shake pro Impact (max +30%)
  * etwas "härterer" Sack-Impulse (min +10%)
  * aber niemals so stark, dass es störend wird

Exponiere: `setIntensity(level: number)`:

* `strengthBase = 1 + level*0.08` (cap 1.35)

---

## Game Over Szeneffekt

Wenn Game Over:

* Licht dimmen über 600ms (Directional intensity runter)
* Hintergrund dunkler (CSS overlay)
* Bag wobbles auslaufen lassen (damping hoch)
* Optional: Text "Game Over" overlay

---

## Asset-Anforderungen

Minimal:

* `/public/img/us.jpg`
* `/public/img/bag_faces_tile.jpg` (kachelbar, quadratisch ideal 1024/2048)

Optional:

* `/public/models/glove.glb`
* `/public/img/hit_flash.png`

Fallbacks:

* Wenn Textur fehlt → simple color material
* Wenn GLB fehlt → primitive glove

---

## Performance & Cleanup

* Game Loop nur aktiv, wenn `Playing` Screen aktiv
* On unmount:
  * `renderer.dispose()`
  * `geometry.dispose()`, `material.dispose()`, `texture.dispose()`
  * remove event listeners (mousedown/touchstart/resize/contextmenu)
* Resize: `camera.aspect`, `camera.updateProjectionMatrix()`, `renderer.setSize()`

---

## Exposed API (zwischen UI und Szene)

`useThreeBoxingScene` gibt zurück:

* `mount(canvasEl)`
* `unmount()`
* `punch(strength?: number)` // triggers glove animation + impact
* `setIntensity(level: number)`
* `setGameOver(isOver: boolean)`
