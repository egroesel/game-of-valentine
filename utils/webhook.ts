export interface WebhookPayload {
  level: number
  success: boolean
  clickCount: number
  timeLimit: number
  sessionId: string
  timestamp: string
}

export function sendWebhook(url: string, payload: WebhookPayload): void {
  if (!url) return

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Fire-and-forget: don't block gameplay on webhook errors
  })
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
