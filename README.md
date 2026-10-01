# Saylani SMIT — Quiz Session Timer & Live Results Monitor

A beautiful, full-page **45-minute quiz session timer** with real-time student result alerts, built for **Saylani Mass IT Training (SMIT)** instructors.

## ✨ Features

- **Full-page countdown timer** — animated SVG ring, color changes at 10 min (amber) and 5 min (red)
- **Live student popup** — appears for 5 seconds on each new socket result, then auto-hides
- **SMIT confetti** — dual side-cannons + star burst using official Saylani brand colors on every pass
- **Socket.IO** — real-time results from paired Chrome extension with auto-reconnect
- **Stats cards** — total results, passed, failed, pass rate (live)
- **White + Saylani color system** — blue `#0066CC`, teal `#00897B`, green `#2ECC71`
- **Start screen** — animated wave background, click Start to begin the session

## 🚀 Quick Start

```bash
npm install
node server.js
```

Open **http://127.0.0.1:3000** → click **Start Session**.

## 📡 API

### POST `/api/quiz-results`
Receives quiz result from the Chrome extension:

```json
{
  "id": "<stable LMS result _id>",
  "trainerId": "<trainer id>",
  "quizId": "<quiz id>",
  "name": "<student name>",
  "email": "<student email>",
  "quizTitle": "<quiz title>",
  "status": "passed | failed",
  "score": 26,
  "totalQuestions": 40,
  "attempts": 1,
  "createdAt": "<LMS timestamp>",
  "observedAt": "<extension timestamp>"
}
```

### GET `/health`
Returns `{ ok: true, count: <number of stored results> }`

## 🔌 Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `quiz-results:snapshot` | Server → Client | `Record[]` — full history on connect |
| `quiz-result:new` | Server → Client | `Record` — each new deduplicated result |

## 📁 Structure

```
Quiz/
├── server.js          # Express + Socket.IO backend (127.0.0.1:3000)
├── public/
│   ├── index.html     # Full-page timer UI
│   ├── style.css      # White + Saylani color system
│   └── app.js         # Timer, confetti, popup, socket logic
└── package.json
```

## 🔒 Privacy

- Results stored **in-memory only** (max 500 records, FIFO)
- No names or emails logged to console
- Server binds to `127.0.0.1` — not accessible from other machines
- No third-party data sharing
