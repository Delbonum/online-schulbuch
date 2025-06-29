const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST /login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const { password, ...userData } = user;
    res.json(userData);
  } else {
    res.status(401).json({ error: "Ungültige Anmeldedaten" });
  }
});

// GET progress
app.get("/progress/:username", (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username);

  if (!user || user.role !== "student") {
    return res.status(404).json({ error: "Nicht gefunden" });
  }

  res.json(user.progress || {});
});

// POST progress (mit optionalem Skip der History)
app.post("/progress/:username", (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username && u.role === "student");

  if (!user) return res.status(404).json({ error: "Nicht gefunden" });

  const now = new Date().toISOString();
  const { _skipHistory, ...progressUpdate } = req.body;

  user.progress = { ...user.progress, ...progressUpdate };
  user.history = user.history || {};

  if (!_skipHistory) {
    for (const [key, value] of Object.entries(progressUpdate)) {
      user.history[key] = user.history[key] || [];
      user.history[key].push({
        timestamp: now,
        manual: value === true ? "freigeschaltet" : "gesperrt"
      });
    }
  }

  saveUsers(users);
  res.json({ success: true });
});

// POST Prüfungsversuch
app.post("/progress/:username/recordAttempt", (req, res) => {
  const { levelKey, score, details } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username && u.role === "student");

  if (!user) return res.status(404).json({ error: "Nicht gefunden" });

  const now = new Date().toISOString();
  user.history = user.history || {};
  user.history[levelKey] = user.history[levelKey] || [];

  user.history[levelKey].push({
    timestamp: now,
    score,
    details
  });

  saveUsers(users);
  res.json({ success: true });
});

// GET Prüfungsverlauf
app.get("/progress/:username/history", (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.username === req.params.username);

  if (!user || user.role !== "student") {
    return res.status(404).json({ error: "Nicht gefunden" });
  }

  res.json(user.history || {});
});

// GET Schüler
app.get("/students", (req, res) => {
  const teacher = req.query.teacher;
  const users = loadUsers();

  if (!teacher) {
    return res.status(400).json({ error: "Lehrername fehlt" });
  }

  const students = users.filter(
    (u) => u.role === "student" && u.teacher === teacher
  );

  const data = students.map((s) => ({
    username: s.username,
    progress: s.progress || {},
  }));

  res.json(data);
});

// POST Schüler anlegen
app.post("/students", (req, res) => {
  const { username, password, teacher } = req.body;

  if (!username || !password || !teacher) {
    return res.status(400).json({ error: "Fehlende Felder" });
  }

  const users = loadUsers();

  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: "Benutzername existiert bereits" });
  }

  const newStudent = {
    username,
    password,
    role: "student",
    teacher,
    progress: {},
  };

  users.push(newStudent);
  saveUsers(users);

  res.status(201).json({ success: true, student: { username, progress: {} } });
});

// DELETE Schüler
app.delete("/students/:username", (req, res) => {
  const users = loadUsers();
  const filtered = users.filter(u => u.username !== req.params.username);
  if (filtered.length === users.length) {
    return res.status(404).json({ error: "Schüler nicht gefunden" });
  }
  saveUsers(filtered);
  res.json({ success: true });
});

// PUT Schüler aktualisieren
app.put("/students/:username", (req, res) => {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.username === req.params.username);

  if (idx === -1 || users[idx].role !== "student") {
    return res.status(404).json({ error: "Schüler nicht gefunden" });
  }

  const updated = {
    ...users[idx],
    ...req.body,
  };

  // Prüfe auf Namenskonflikt, wenn Name geändert wurde
  if (updated.username !== users[idx].username) {
    const exists = users.some((u, i) => i !== idx && u.username === updated.username);
    if (exists) {
      return res.status(409).json({ error: "Benutzername bereits vergeben" });
    }
  }

  // Verlauf nur für geänderte Fortschritte protokollieren
  if (req.body.progress) {
    const now = new Date().toISOString();
    updated.history = updated.history || {};

    for (const [key, newValue] of Object.entries(req.body.progress)) {
      const currentValue = users[idx].progress?.[key];

      if (currentValue !== newValue) {
        updated.history[key] = updated.history[key] || [];
        updated.history[key].push({
          timestamp: now,
          manual: newValue === true ? "freigeschaltet" : "gesperrt"
        });
      }
    }
  }

  users[idx] = updated;
  saveUsers(users);
  res.json({ success: true });
});

app.delete("/students/:username/reset", (req, res) => {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.username === req.params.username);

  if (idx === -1 || users[idx].role !== "student") {
    return res.status(404).json({ error: "Schüler nicht gefunden" });
  }

  users[idx].progress = {};
  users[idx].history = {};

  saveUsers(users);
  res.json({ success: true });
});

app.get("/teachers/:teacher/statistics", (req, res) => {
  const { teacher } = req.params;
  const users = loadUsers();
  const students = users.filter(u => u.role === "student" && u.teacher === teacher);

  const progressSummary = { level1: 0, level2: 0, level3: 0 };
  const scoreSummary = { level1: [], level2: [], level3: [] };
  const taskStats = { level1: {}, level2: {}, level3: {} };
  const completionGroups = {
    "Kein Level abgeschlossen": 0,
    "Level 1 abgeschlossen, Level 2 nicht": 0,
    "Level 1 & 2 abgeschlossen, Level 3 nicht": 0,
    "Alle Prüfungen bestanden": 0
  };

  for (const s of students) {
    const p = s.progress || {};
    const h = s.history || {};

    // --- Lernfortschritt
    if (p.level1Passed) progressSummary.level1++;
    if (p.level2Passed) progressSummary.level2++;
    if (p.level3Passed) progressSummary.level3++;

    // --- Bestehensgruppen (für Kuchendiagramm)
    const l1 = !!p.level1Passed;
    const l2 = !!p.level2Passed;
    const l3 = !!p.level3Passed;
    const key = l1 && l2 && l3
      ? "Alle Prüfungen bestanden"
      : l1 && l2
      ? "Level 1 & 2 abgeschlossen, Level 3 nicht"
      : l1
      ? "Level 1 abgeschlossen, Level 2 nicht"
      : "Kein Level abgeschlossen";
    completionGroups[key]++;

    // --- Scores und Aufgaben
    for (const level of [1, 2, 3]) {
      const progressKey = `level${level}`;
      const historyKey = `${progressKey}Passed`;
      const entries = h[historyKey] || [];

      for (const entry of entries) {
        if (typeof entry.score === "number" && entry.manual === undefined) {
          scoreSummary[progressKey].push(entry.score);

          if (Array.isArray(entry.details)) {
            for (const d of entry.details) {
              const t = d.task;
              const correct = !!d.correct;
              if (!taskStats[progressKey][t]) {
                taskStats[progressKey][t] = { correct: 0, wrong: 0 };
              }
              taskStats[progressKey][t][correct ? "correct" : "wrong"]++;
            }
          }
        }
      }
    }
  }

  res.json({
    progressSummary,
    averageScore: {
      level1: average(scoreSummary.level1),
      level2: average(scoreSummary.level2),
      level3: average(scoreSummary.level3)
    },
    taskStats,
    completionGroups
  });
});

function average(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

app.listen(PORT, () => console.log(`Backend läuft auf http://localhost:${PORT}`));
