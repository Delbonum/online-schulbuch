-- Schulbuch-API (Konten, Klassen, KryptoGAME) – Datenbankschema für MySQL 5.7+ / MariaDB 10.3+
-- Kann mehrfach ausgeführt werden (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('teacher', 'student') NOT NULL,
    teacher_id    INT UNSIGNED NULL,
    class_id      INT UNSIGNED NULL,
    is_master     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    KEY idx_users_teacher (teacher_id),
    KEY idx_users_class (class_id),
    CONSTRAINT fk_users_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_requests (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(128) NOT NULL,
    school        VARCHAR(128) NOT NULL,
    city          VARCHAR(128) NOT NULL,
    email         VARCHAR(190) NOT NULL,
    status        ENUM('pending', 'approved', 'rejected') NOT NULL,
    token         CHAR(32)     NOT NULL,
    created_at    DATETIME(3)  NOT NULL,
    decided_at    DATETIME(3)  NULL,
    decided_by    INT UNSIGNED NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_requests_token (token),
    KEY idx_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    teacher_id INT UNSIGNED NOT NULL,
    name       VARCHAR(64)  NOT NULL,
    created_at DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_classes_teacher_name (teacher_id, name),
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_optional_levels (
    class_id INT UNSIGNED      NOT NULL,
    level    SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (class_id, level),
    CONSTRAINT fk_optional_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS level_progress (
    user_id   INT UNSIGNED      NOT NULL,
    level     SMALLINT UNSIGNED NOT NULL,
    passed_at DATETIME(3)       NOT NULL,
    PRIMARY KEY (user_id, level),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED      NOT NULL,
    level      SMALLINT UNSIGNED NOT NULL,
    score      TINYINT UNSIGNED  NOT NULL,
    details    TEXT              NOT NULL,
    created_at DATETIME(3)       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_attempts_user_level (user_id, level),
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progress_log (
    id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED      NOT NULL,
    level      SMALLINT UNSIGNED NOT NULL,
    action     ENUM('freigeschaltet', 'gesperrt') NOT NULL,
    actor_id   INT UNSIGNED      NULL,
    created_at DATETIME(3)       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_log_user_level (user_id, level),
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_log_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username   VARCHAR(64)  NOT NULL,
    ip         VARCHAR(45)  NOT NULL,
    created_at DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_login_username (username, created_at),
    KEY idx_login_ip (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Live-Werkzeuge (/werkzeuge/…): Umfragen, Wortwolken, Quiz, Evaluationen (Spalte kind). Fragen und Einstellungen
-- stehen als JSON im Eintrag; jede Durchführung speichert eine Kopie davon, damit spätere Änderungen alte
-- Ergebnisse nicht verfälschen.
CREATE TABLE IF NOT EXISTS poll_polls (
    id         INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    teacher_id INT UNSIGNED      NOT NULL,
    kind       VARCHAR(16)       NOT NULL DEFAULT 'poll',
    title      VARCHAR(200)      NOT NULL,
    mode       VARCHAR(16)       NOT NULL,
    countdown  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    questions  MEDIUMTEXT        NOT NULL,
    settings   TEXT              NULL,
    source     VARCHAR(255)      NULL,
    created_at DATETIME(3)       NOT NULL,
    updated_at DATETIME(3)       NOT NULL,
    active_at  DATETIME(3)       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_poll_teacher (teacher_id),
    KEY idx_poll_active (active_at),
    CONSTRAINT fk_poll_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_runs (
    id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    poll_id        INT UNSIGNED      NOT NULL,
    code           CHAR(6)           NULL,
    kind           VARCHAR(16)       NOT NULL DEFAULT 'poll',
    phase          VARCHAR(16)       NOT NULL DEFAULT 'open',
    mode           VARCHAR(16)       NOT NULL,
    countdown      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    questions      MEDIUMTEXT        NOT NULL,
    settings       TEXT              NULL,
    current_question SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    question_since DATETIME(3)       NOT NULL,
    started_at     DATETIME(3)       NOT NULL,
    ended_at       DATETIME(3)       NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_run_code (code),
    KEY idx_run_poll (poll_id),
    CONSTRAINT fk_run_poll FOREIGN KEY (poll_id) REFERENCES poll_polls (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_answers (
    run_id      INT UNSIGNED NOT NULL,
    participant CHAR(16)     NOT NULL,
    question    VARCHAR(16)  NOT NULL,
    answer_value DOUBLE      NOT NULL,
    text_value  TEXT         NULL,
    answer_ms   INT          NULL,
    created_at  DATETIME(3)  NOT NULL,
    PRIMARY KEY (run_id, participant, question),
    CONSTRAINT fk_answer_run FOREIGN KEY (run_id) REFERENCES poll_runs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz: Spielnamen der Teilnehmenden (frei gewählt, nur für die Rangliste)
CREATE TABLE IF NOT EXISTS poll_players (
    run_id      INT UNSIGNED NOT NULL,
    participant CHAR(16)     NOT NULL,
    nickname    VARCHAR(40)  NOT NULL,
    joined_at   DATETIME(3)  NOT NULL,
    PRIMARY KEY (run_id, participant),
    UNIQUE KEY uq_player_name (run_id, nickname),
    CONSTRAINT fk_player_run FOREIGN KEY (run_id) REFERENCES poll_runs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evaluation: wer schon abgegeben hat – ohne Verbindung zu den (anonym gespeicherten) Antworten
CREATE TABLE IF NOT EXISTS poll_submissions (
    run_id      INT UNSIGNED NOT NULL,
    participant CHAR(16)     NOT NULL,
    PRIMARY KEY (run_id, participant),
    CONSTRAINT fk_submission_run FOREIGN KEY (run_id) REFERENCES poll_runs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
