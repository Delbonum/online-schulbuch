-- Schulbuch-API (Konten, Klassen, KryptoGAME) – Datenbankschema für SQLite (lokale Entwicklung und Tests)

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK (role IN ('teacher', 'student')),
    teacher_id    INTEGER NULL REFERENCES users (id) ON DELETE CASCADE,
    class_id      INTEGER NULL,
    is_master     INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_teacher ON users (teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON users (class_id);

CREATE TABLE IF NOT EXISTS teacher_requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    full_name     TEXT    NOT NULL,
    school        TEXT    NOT NULL,
    city          TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    status        TEXT    NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    token         TEXT    NOT NULL UNIQUE,
    created_at    TEXT    NOT NULL,
    decided_at    TEXT    NULL,
    decided_by    INTEGER NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON teacher_requests (status);

CREATE TABLE IF NOT EXISTS classes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       TEXT    NOT NULL COLLATE NOCASE,
    created_at TEXT    NOT NULL,
    UNIQUE (teacher_id, name)
);

CREATE TABLE IF NOT EXISTS class_optional_levels (
    class_id INTEGER NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
    level    INTEGER NOT NULL,
    PRIMARY KEY (class_id, level)
);

CREATE TABLE IF NOT EXISTS level_progress (
    user_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    level     INTEGER NOT NULL,
    passed_at TEXT    NOT NULL,
    PRIMARY KEY (user_id, level)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    level      INTEGER NOT NULL,
    score      INTEGER NOT NULL,
    details    TEXT    NOT NULL,
    created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_level ON quiz_attempts (user_id, level);

CREATE TABLE IF NOT EXISTS progress_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    level      INTEGER NOT NULL,
    action     TEXT    NOT NULL CHECK (action IN ('freigeschaltet', 'gesperrt')),
    actor_id   INTEGER NULL REFERENCES users (id) ON DELETE SET NULL,
    created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_log_user_level ON progress_log (user_id, level);

CREATE TABLE IF NOT EXISTS login_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL COLLATE NOCASE,
    ip         TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_username ON login_attempts (username, created_at);
CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts (ip, created_at);

-- Werkzeug „Umfragen“ (siehe schema.mysql.sql)
CREATE TABLE IF NOT EXISTS poll_polls (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind       TEXT    NOT NULL DEFAULT 'poll',
    title      TEXT    NOT NULL,
    mode       TEXT    NOT NULL,
    countdown  INTEGER NOT NULL DEFAULT 0,
    questions  TEXT    NOT NULL,
    settings   TEXT    NULL,
    source     TEXT    NULL,
    created_at TEXT    NOT NULL,
    updated_at TEXT    NOT NULL,
    active_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_poll_teacher ON poll_polls (teacher_id);
CREATE INDEX IF NOT EXISTS idx_poll_active ON poll_polls (active_at);

CREATE TABLE IF NOT EXISTS poll_runs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id        INTEGER NOT NULL REFERENCES poll_polls (id) ON DELETE CASCADE,
    code           TEXT    NULL UNIQUE,
    kind           TEXT    NOT NULL DEFAULT 'poll',
    phase          TEXT    NOT NULL DEFAULT 'open',
    mode           TEXT    NOT NULL,
    countdown      INTEGER NOT NULL DEFAULT 0,
    questions      TEXT    NOT NULL,
    settings       TEXT    NULL,
    current_question INTEGER NOT NULL DEFAULT 0,
    question_since TEXT    NOT NULL,
    started_at     TEXT    NOT NULL,
    ended_at       TEXT    NULL
);
CREATE INDEX IF NOT EXISTS idx_run_poll ON poll_runs (poll_id);

CREATE TABLE IF NOT EXISTS poll_answers (
    run_id      INTEGER NOT NULL REFERENCES poll_runs (id) ON DELETE CASCADE,
    participant TEXT    NOT NULL,
    question    TEXT    NOT NULL,
    answer_value REAL    NOT NULL,
    text_value  TEXT    NULL,
    answer_ms   INTEGER NULL,
    created_at  TEXT    NOT NULL,
    PRIMARY KEY (run_id, participant, question)
);

CREATE TABLE IF NOT EXISTS poll_players (
    run_id      INTEGER NOT NULL REFERENCES poll_runs (id) ON DELETE CASCADE,
    participant TEXT    NOT NULL,
    nickname    TEXT    NOT NULL COLLATE NOCASE,
    joined_at   TEXT    NOT NULL,
    PRIMARY KEY (run_id, participant),
    UNIQUE (run_id, nickname)
);

CREATE TABLE IF NOT EXISTS poll_submissions (
    run_id      INTEGER NOT NULL REFERENCES poll_runs (id) ON DELETE CASCADE,
    participant TEXT    NOT NULL,
    PRIMARY KEY (run_id, participant)
);

CREATE TABLE IF NOT EXISTS modem_links (
    code       TEXT NOT NULL PRIMARY KEY,
    token_a    TEXT NOT NULL,
    token_b    TEXT NULL,
    seen_a     TEXT NOT NULL,
    seen_b     TEXT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS modem_frames (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL REFERENCES modem_links (code) ON DELETE CASCADE,
    to_side    TEXT    NOT NULL,
    payload    TEXT    NOT NULL,
    created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_modem_frames ON modem_frames (code, to_side, id);

-- Terminbuchung (/werkzeuge/termine/): Lehrkräfte bieten Zeiträume an, Schülerinnen und Schüler buchen ohne Konto
-- einen Termin. Termine samt Namen werden 30 Tage nach dem letzten Tag gelöscht.
CREATE TABLE IF NOT EXISTS termin_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code        TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    mode        TEXT    NOT NULL DEFAULT 'fifo',
    settings    TEXT    NOT NULL,
    periods     TEXT    NOT NULL,
    blocked     TEXT    NOT NULL DEFAULT '[]',
    is_open     INTEGER NOT NULL DEFAULT 1,
    last_day    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_termin_teacher ON termin_events (teacher_id);

CREATE TABLE IF NOT EXISTS termin_bookings (
    event_id    INTEGER NOT NULL REFERENCES termin_events (id) ON DELETE CASCADE,
    slot        TEXT    NOT NULL,
    seat        INTEGER NOT NULL,
    participant TEXT    NULL,
    name        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    PRIMARY KEY (event_id, slot, seat),
    UNIQUE (event_id, participant)
);

-- Rollenspiel „Nachrichten im Netzwerk“ (/informatik/werkzeuge/netzwerk-rollenspiel/): Wer den QR-Code scannt,
-- bekommt zufällig eine freie Rolle. Gespeichert wird nur, welche Rollennummer welche zufällige Browser-Kennung hat
-- (keine Namen). Runden werden 60 Tage nach der letzten Änderung gelöscht.
CREATE TABLE IF NOT EXISTS rollenspiel_runden (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code        TEXT    NOT NULL UNIQUE,
    settings    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rollenspiel_teacher ON rollenspiel_runden (teacher_id);

CREATE TABLE IF NOT EXISTS rollenspiel_rollen (
    runde_id    INTEGER NOT NULL REFERENCES rollenspiel_runden (id) ON DELETE CASCADE,
    nr          INTEGER NOT NULL,
    participant TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    PRIMARY KEY (runde_id, nr),
    UNIQUE (runde_id, participant)
);
