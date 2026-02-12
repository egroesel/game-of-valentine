# Webhook-Integration

## Übersicht

Nach jedem Level-Ende oder Game Over wird ein strukturierter POST Request an den n8n Webhook gesendet. n8n verarbeitet das Event und versendet eine passende Telegram-Nachricht mit Hinweisen zum Valentinstagsgeschenk.

---

## Endpoint

```
POST ${NUXT_PUBLIC_N8N_WEBHOOK_URL}
```

Umgebungsvariable wird über Nuxt 3 Runtime Config bereitgestellt.

---

## Payload

```ts
interface WebhookPayload {
  level: number
  success: boolean
  clickCount: number
  timeLimit: number
  sessionId: string
  timestamp: string // ISO 8601
}
```

---

## Auslöser

* **Level geschafft** → `success: true`
* **Level nicht geschafft / Game Over** → `success: false`
* Wird nach jedem Level-Übergang gesendet

---

## Fehlerbehandlung

* Fire-and-forget: Webhook-Fehler sollen das Spiel nicht blockieren
* Optional: Retry einmal bei Netzwerkfehler
* Kein UI-Feedback bei Webhook-Fehler (unsichtbar für Nutzer)
