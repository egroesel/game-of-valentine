# Projektbeschreibung

Dieses Projekt ist eine interaktive Valentinstags-Webanwendung, entwickelt mit **Nuxt 3 (Vue 3 + TypeScript)** und einer integrierten **Three.js WebGL-Szene**.

Die Anwendung kombiniert animierte UI-Sequenzen mit einem Arcade-Mini-Game und externer Automatisierung via **n8n Webhook (Telegram-Integration)**.

---

## Ziel

Die App führt den Nutzer durch eine emotionale Intro-Sequenz, eine spielerische Entscheidung („Ja/Nein") und anschließend ein reflexbasiertes Mini-Game.

Nach jedem Spiel-Event werden strukturierte Daten an einen **n8n Webhook** gesendet, der automatisiert Telegram-Nachrichten mit Hinweisen zum Valentinstagsgeschenk verschickt.

Deployment-Ziel:
`https://sophia.grodonkey.com`

---

## Technologiestack

* Nuxt 3 (Vue 3 Composition API)
* TypeScript
* Three.js (Client-Side Rendering)
* Tailwind CSS
* n8n Webhook Integration
* Telegram (via n8n Workflow)

---

## Hauptfunktionen

### 1. Animierte Intro-Sequenz

* Vollbild-Hintergrundbild
* Sequenzielles Einblenden mehrerer Textzeilen
* Gemeinsames Ausblenden
* Übergang zur Entscheidungsfrage

Details: [spec-intro.md](spec-intro.md)

### 2. Interaktive Entscheidung

* Frage: „Möchtest du mein Valentin sein?"
* „Nein"-Button weicht aus (Desktop) bzw. repositioniert sich (Mobile)
* „Ja"-Button startet Spielsequenz mit visuellen Effekten

Details: [spec-intro.md](spec-intro.md)

### 3. Mini-Game (Three.js)

* Klick-basiertes Reflexspiel
* Spieler steuert einen Boxhandschuh
* Boxsack mit personalisierter Textur
* Countdown + Schlagzähler (HUD Overlay)
* Mehrstufiges Level-System
* Ab Level 5 bewusst nicht schaffbar

Details: [spec-boxing.md](spec-boxing.md)

### 4. Webhook-Integration

Details: [spec-webhook.md](spec-webhook.md)

---

## Architekturprinzipien

* Klare State-Machine für Screen-Phasen
* Three.js strikt client-side
* Saubere Trennung zwischen:
  * UI-Logik
  * Game-State
  * Rendering-Engine
  * Webhook-Kommunikation
* Memory- und Event-Cleanup beim Unmount
* Mobile-optimiert

---

## Typografie & Look

### Zielästhetik

Romantisch-modern, nicht kitschig: klare Sans für UI + elegante Serif für Headlines.

### Vorschlag (ohne externe Fonts, optional mit Google Fonts)

* Headline (Frage + Punchlines): **Serif**, z. B. `Playfair Display` oder `Cormorant Garamond`
* UI / Buttons / HUD: **Sans**, z. B. `Inter` oder `DM Sans`

Tailwind Beispiel:

* Headline: `font-serif text-3xl md:text-5xl tracking-tight`
* Body: `text-base md:text-lg leading-relaxed`
* HUD: `font-sans text-sm md:text-base tabular-nums`
* Buttons: `font-sans font-semibold`

### Layout Empfehlungen

* Textblock max-width: `max-w-[32rem]` bis `max-w-[42rem]`
* Intro-Zeilen als Stack, zentriert, mit `gap-2`
* Hintergrundfoto: `background-size: cover; background-position: center;`
* Lesbarkeit: Gradient Overlay + leichter Blur:
  * Overlay: `bg-gradient-to-b from-black/50 via-black/35 to-black/55`
  * optional: `backdrop-blur-[1px]` nur auf Textcontainer, nicht fullscreen (Performance)

---

## Kernidee

Eine spielerische, technisch anspruchsvolle Web-Erfahrung, die Romantik, Humor und Gamification kombiniert — inklusive automatisierter Echtzeit-Kommunikation über Telegram.
