-- KryptoGAME – Datenbankschema für SQLite (lokale Entwicklung und Tests)

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
