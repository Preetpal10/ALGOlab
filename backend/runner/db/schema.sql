-- =============================================================================
-- ALGOLAB — MySQL Database Schema (Phase 15)
--
-- Persistent storage for User Authentication, Submission History, and
-- Problem Progress Tracking.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS algolab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE algolab;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Sessions Table (Persistent server-managed sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Submissions Table (Authoritative server-judged submissions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(64) NOT NULL,
  source_code MEDIUMTEXT NOT NULL,
  verdict VARCHAR(32) NOT NULL,
  passed_tests INT NOT NULL DEFAULT 0,
  total_tests INT NOT NULL DEFAULT 0,
  execution_time_ms INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_submissions_user_created (user_id, created_at DESC),
  INDEX idx_submissions_problem (problem_id),
  INDEX idx_submissions_verdict (verdict)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Problem Progress Table (Per-user solve tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problem_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(64) NOT NULL,
  is_solved BOOLEAN NOT NULL DEFAULT FALSE,
  first_solved_at DATETIME NULL,
  last_attempt_at DATETIME NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_problem (user_id, problem_id),
  INDEX idx_progress_user (user_id),
  INDEX idx_progress_user_solved (user_id, is_solved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Lab States Table (Account-associated cross-device lab working state)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lab_id VARCHAR(64) NOT NULL,
  state_json MEDIUMTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_lab (user_id, lab_id),
  INDEX idx_lab_states_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
