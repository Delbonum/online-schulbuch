-- KryptoGAME – Datenbankschema für MySQL 5.7+ / MariaDB 10.3+
-- Kann mehrfach ausgeführt werden (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('teacher', 'student') NOT NULL,
    teacher_id    INT UNSIGNED NULL,
    class_id      INT UNSIGNED NULL,
    created_at    DATETIME(3)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    KEY idx_users_teacher (teacher_id),
    KEY idx_users_class (class_id),
    CONSTRAINT fk_users_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
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
