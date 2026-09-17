-- KryptoGAME – Datenbankschema für SQLite (lokale Entwicklung und Tests)

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK (role IN ('teacher', 'student')),
    teacher_id    INTEGER NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at    TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_teacher ON users (teacher_id);

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
