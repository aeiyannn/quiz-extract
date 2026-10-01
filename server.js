'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const HOST = '127.0.0.1';
const PORT = 3000;
const MAX_HISTORY = 500; // bounded in-memory history

// ─── App setup ───────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: false }, // loopback only — no cross-origin needed
});

app.use(express.json({ limit: '128kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory store ─────────────────────────────────────────────────────────
/** @type {Map<string, object>} key = quizId + ':' + id */
const seenKeys = new Map();
/** @type {object[]} newest-last ordered list */
const history = [];

function dedupeKey(record) {
  return `${record.quizId}:${record.id}`;
}

function storeRecord(record) {
  const key = dedupeKey(record);
  if (seenKeys.has(key)) return false; // duplicate
  seenKeys.set(key, true);
  history.push(record);
  // Bound the history to MAX_HISTORY entries
  if (history.length > MAX_HISTORY) {
    const removed = history.shift();
    seenKeys.delete(dedupeKey(removed));
  }
  return true;
}

// ─── Validation ──────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  'id', 'trainerId', 'quizId', 'name', 'email',
  'quizTitle', 'status', 'score', 'totalQuestions',
  'attempts', 'createdAt', 'observedAt',
];

function validate(body) {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object';
  for (const f of REQUIRED_FIELDS) {
    if (body[f] === undefined || body[f] === null) return `Missing field: ${f}`;
  }
  if (!['passed', 'failed'].includes(body.status)) return 'status must be "passed" or "failed"';
  if (typeof body.score !== 'number') return 'score must be a number';
  if (typeof body.totalQuestions !== 'number') return 'totalQuestions must be a number';
  if (typeof body.attempts !== 'number') return 'attempts must be a number';
  return null;
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, count: history.length });
});

app.post('/api/quiz-results', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ ok: false, error: err });

  // Sanitise — pick only known fields; do NOT log names/emails to console
  const record = {
    id:             String(req.body.id),
    trainerId:      String(req.body.trainerId),
    quizId:         String(req.body.quizId),
    name:           String(req.body.name),
    email:          String(req.body.email),
    quizTitle:      String(req.body.quizTitle),
    status:         req.body.status,
    score:          Number(req.body.score),
    totalQuestions: Number(req.body.totalQuestions),
    attempts:       Number(req.body.attempts),
    createdAt:      String(req.body.createdAt),
    observedAt:     String(req.body.observedAt),
  };

  const isNew = storeRecord(record);
  if (!isNew) {
    return res.json({ ok: true, duplicate: true });
  }

  io.emit('quiz-result:new', record);
  console.log(`[server] New result stored (total: ${history.length})`);
  return res.status(201).json({ ok: true, duplicate: false });
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] Client connected: ${socket.id}`);
  // Send full in-memory snapshot to the newly connected client
  socket.emit('quiz-results:snapshot', [...history]);

  socket.on('disconnect', () => {
    console.log(`[socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, HOST, () => {
  console.log(`[server] Listening on http://${HOST}:${PORT}`);
});
