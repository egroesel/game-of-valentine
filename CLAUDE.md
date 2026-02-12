# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Valentine's Day interactive web app combining animated UI sequences with a Three.js arcade mini-game and n8n webhook integration (Telegram notifications). Written in German for the end user.

Deployment target: `https://sophia.grodonkey.com`

Specifications:
- [docs/spec-overview.md](docs/spec-overview.md) — Project overview, tech stack, architecture
- [docs/spec-intro.md](docs/spec-intro.md) — IntroOverlay animation, text choreography, state machine
- [docs/spec-boxing.md](docs/spec-boxing.md) — Three.js scene, physics, animations, input, HUD
- [docs/spec-webhook.md](docs/spec-webhook.md) — n8n webhook payload and integration

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3 Composition API)
- **Language:** TypeScript
- **3D Graphics:** Three.js (client-side only)
- **Styling:** Tailwind CSS
- **Confetti:** Canvas-based particle system (`utils/confetti.ts`)

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix lint issues
```

## Architecture

### Screen Flow (State Machine)

The app progresses through screens managed in `app.vue`:

1. **IntroOverlay** — Animated text sequence + valentine question with evasive "Nö" button, confetti on confirm
2. **GameExplanation** — Rules and instructions before the game starts
3. **BoxingGame** — Click-based reflex game with Three.js scene + HUD overlay
4. **HintOverlay** — Hint reveal after each completed level (hints defined in `utils/hints.ts`)
5. **End screen** — Collected hints summary + restart button

**Dev shortcut:** `Shift+Cmd+T` skips directly to Level 1 (BoxingGame) from any screen.

### Intro State Machine

```ts
type IntroPhase = 'linesIn' | 'linesHold' | 'linesOut' | 'pause' | 'question' | 'choiceActive' | 'confirmed'
```

Transitions are deterministic with specific timing constants defined in `IntroOverlay.vue`. Valentine question + buttons are integrated directly into IntroOverlay (no separate ValentineChoice screen).

### Key Component Responsibilities

- **`BoxingGame.vue`** — Game state (level, timer, clicks), HUD, animated level indicator
- **`ThreeCanvas.vue`** — WebGL renderer, camera, resize handling, game loop. Exposes: `punch()`, `setIntensity()`, `setGameOver()`
- **`useThreeBoxingScene.ts`** — Scene objects, materials, animation system, impact FX

### Data Flow

Input (click/touch) → `BoxingGame` increments counter + calls `three.punch(strength)` → Timer tick updates HUD → Level end shows hint (via `HintOverlay`) → UI transition to next level

### Three.js Scene

- Punching bag: CylinderGeometry with tiled face texture (`bag_faces_tile.jpg`)
- Boxing glove: GLB model (`/public/models/glove.glb`) with primitive sphere fallback
- Damped spring physics for bag wobble (springK=26.0, damping=7.0)
- Procedural punch animation: 0.12s forward (easeOutCubic) + 0.18s return (easeOutBack)
- Level progression: strength multiplier `1 + level*0.08` (capped at 1.35), level 5+ intentionally unbeatable

### Assets

Required in `/public/`:
- `img/us.jpg` — Intro background
- `img/bag_faces_tile.jpg` — Punching bag texture (tileable, 1024-2048px)

Optional:
- `models/glove.glb` — Boxing glove 3D model
All assets have coded fallbacks (solid color materials, primitive geometry, runtime canvas textures).

## Design Conventions

- **Typography:** Serif (Playfair Display / Cormorant Garamond) for headlines, Sans (Inter / DM Sans) for UI/HUD
- **All user-facing text is in German** — preserve exact spelling from spec files
- Three.js runs strictly client-side; use `<ClientOnly>` or equivalent
- Memory cleanup on unmount: dispose renderer, geometries, materials, textures, and remove event listeners
