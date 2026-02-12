const MUSIC_SRC = '/audio/last_train_home.m4a'

let audio: HTMLAudioElement | null = null
let _musicVolume = 0.6

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = _musicVolume
  }
  return audio
}

/** Start or resume music playback, optionally fading in from silence */
export function playMusic(fadeInMs = 0) {
  const a = getAudio()
  if (fadeInMs > 0) {
    a.volume = 0
    a.play()
      .then(() => fadeMusicVolume(_musicVolume, fadeInMs))
      .catch(() => {
        // Autoplay blocked — caller should handle retry
      })
  } else {
    a.volume = _musicVolume
    a.play().catch(() => {})
  }
}

/** Returns true if audio is currently playing */
export function isMusicPlaying(): boolean {
  return !!audio && !audio.paused
}

/** Pause music */
export function pauseMusic() {
  audio?.pause()
}

/** Set music volume (0–1) */
export function setMusicVolume(v: number) {
  _musicVolume = Math.max(0, Math.min(1, v))
  if (audio) audio.volume = _musicVolume
}

/** Get current music volume */
export function getMusicVolume(): number {
  return _musicVolume
}

/** Fade volume to target over duration (ms) */
export function fadeMusicVolume(target: number, durationMs = 800) {
  if (!audio) return
  const start = audio.volume
  const diff = target - start
  const steps = 20
  const stepMs = durationMs / steps
  let step = 0

  const interval = setInterval(() => {
    step++
    const t = step / steps
    const v = start + diff * t
    if (audio) audio.volume = Math.max(0, Math.min(1, v))
    if (step >= steps) {
      clearInterval(interval)
      _musicVolume = target
    }
  }, stepMs)
}

/** Clean up */
export function destroyMusic() {
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
}
