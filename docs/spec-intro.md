# Startsequenz / IntroOverlay

## Hintergrund

* Vollbild-Overlay
* Hintergrundbild: `/public/img/us.jpg`
* Leichter dunkler Gradient-Overlay (`rgba(0,0,0,0.45)`) für bessere Lesbarkeit
* Zentrierte Typografie (max-width begrenzen für schöne Zeilenlänge)
* Responsive & safe-area kompatibel

---

## Text-Choreografie

### Inhalte (rechtschreibkonform, exakt so verwenden)

**Text 1:**
`Hey du,`

**Text 2:**
`Heute ist Valentinstag … offensichtlich.`

**Text 3:**
`Weil du meine Inspiration bist, habe ich etwas für dich gebastelt.`

**Text 4:**
`Ich hoffe, es gefällt dir …`

---

## Animationsablauf (deterministisch implementieren)

### Phase 1 – Staggered Fade In

* Fade-In Dauer pro Zeile: **600ms**
* Stagger Delay zwischen Zeilen: **450ms**
* Animation: opacity 0 → 1 + leichtes translateY(10px → 0)
* Easing: ease-out

Am Ende sind **alle vier Texte gleichzeitig sichtbar**.

---

### Phase 2 – Hold

* Wenn Text 4 vollständig sichtbar ist:
  * **Alle vier bleiben 1200ms stehen**
  * Keine Bewegung

---

### Phase 3 – Gemeinsames Fade Out

* Alle vier Texte gleichzeitig:
  * Dauer: **900ms**
  * opacity 1 → 0
  * leichtes scale(1 → 0.98) optional

---

### Phase 4 – Pause

* Nach vollständigem Fade-Out:
  * **900ms Pause**
  * Nur Hintergrund sichtbar

---

## Frage

Danach erscheint zentriert:

`Möchtest du mein Valentin sein?`

* Fade In: **500ms**
* leichte Scale 0.98 → 1
* Easing: ease-out

---

## Buttons

Nach Erscheinen der Frage:

* Delay: **450ms**
* Zwei Buttons erscheinen (Fade In 350ms + kleiner Pop-Effekt)

Buttons:

* `Ja`
* `Nein`

Sobald Buttons sichtbar sind → State wechselt zu **ValentineChoice aktiv**

---

## State Machine (verbindlich)

```ts
type IntroPhase =
  | 'linesIn'
  | 'linesHold'
  | 'linesOut'
  | 'pause'
  | 'question'
  | 'buttons'
  | 'choiceActive'
```

Transitions müssen deterministisch und cleanup-safe sein.
