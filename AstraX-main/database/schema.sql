-- ==============================================================================
-- SECURE DIGITAL DOCUMENT MANAGEMENT SYSTEM (LEGAL & INVESTIGATION DOCUMENTS)
-- National Crime Records Bureau (NCRB), Women Safety Division
-- Ministry of Home Affairs, Government of India
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS securedms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE securedms_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM(
        'ADMIN',
        'POLICE_OFFICER',
        'INVESTIGATION_OFFICER',
        'FORENSIC_OFFICER',
        'LAWYER',
        'COURT_OFFICER'
    ) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    badge_number VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_active (active)
) ENGINE=InnoDB;

-- 2. CASES TABLE
CREATE TABLE IF NOT EXISTS cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(150) NOT NULL,
    status ENUM(
        'UNDER_INVESTIGATION',
        'PENDING_REVIEW',
        'CHARGE_SHEET_FILED',
        'IN_COURT',
        'CLOSED'
    ) DEFAULT 'UNDER_INVESTIGATION',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH',
    investigating_officer VARCHAR(100),
    department VARCHAR(150),
    created_by VARCHAR(100) NOT NULL,
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_case_status (status),
    INDEX idx_case_priority (priority),
    INDEX idx_case_crime_type (crime_type)
) ENGINE=InnoDB;

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type ENUM(
        'FIR',
        'POLICE_REPORT',
        'INVESTIGATION_REPORT',
        'WITNESS_STATEMENT',
        'CHARGE_SHEET',
        'COURT_FILING',
        'EVIDENCE',
        'FORENSIC_REPORT',
        'LEGAL_NOTICE',
        'JUDGMENT',
        'OTHER'
    ) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    version INT DEFAULT 1,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_by_id BIGINT NOT NULL,
    encrypted BOOLEAN DEFAULT TRUE,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-CBC',
    signed BOOLEAN DEFAULT FALSE,
    signature_status ENUM('SIGNED', 'NOT_SIGNED', 'SIGNATURE_INVALID') DEFAULT 'NOT_SIGNED',
    current_status ENUM('ACTIVE', 'ARCHIVED', 'SEALED') DEFAULT 'ACTIVE',
    classification ENUM('CONFIDENTIAL', 'RESTRICTED', 'PUBLIC_RECORD') DEFAULT 'RESTRICTED',
    extracted_text LONGTEXT,
    ocr_extracted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_doc_case (case_id),
    INDEX idx_doc_type (document_type),
    INDEX idx_doc_hash (sha256_hash)
) ENGINE=InnoDB;

-- 4. DOCUMENT VERSIONS TABLE
CREATE TABLE IF NOT EXISTS document_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_by_id BIGINT NOT NULL,
    file_size BIGINT NOT NULL,
    change_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_doc_version (document_id, version_number)
) ENGINE=InnoDB;

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action ENUM(
        'LOGIN',
        'LOGOUT',
        'CASE_CREATED',
        'CASE_UPDATED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_VIEWED',
        'DOCUMENT_DOWNLOADED',
        'DOCUMENT_UPDATED',
        'DOCUMENT_DELETED',
        'DOCUMENT_SHARED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_SIGNED',
        'USER_CREATED',
        'USER_DISABLED',
        'PERMISSION_CHANGED',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'TAMPER_SIMULATION'
    ) NOT NULL,
    document_id BIGINT,
    case_id BIGINT,
    ip_address VARCHAR(45) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('SUCCESS', 'DENIED', 'FLAGGED') DEFAULT 'SUCCESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB;

-- 6. DIGITAL SIGNATURES TABLE
CREATE TABLE IF NOT EXISTS digital_signatures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    signed_by VARCHAR(100) NOT NULL,
    signed_by_id BIGINT NOT NULL,
    signer_role VARCHAR(50) NOT NULL,
    document_hash CHAR(64) NOT NULL,
    signature TEXT NOT NULL,
    certificate_issuer VARCHAR(255) NOT NULL,
    status ENUM('SIGNED', 'NOT_SIGNED', 'SIGNATURE_INVALID') DEFAULT 'SIGNED',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (signed_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_sig_doc (document_id)
) ENGINE=InnoDB;

-- 7. CASE USERS (ACCESS CONTROL MAPPING)
CREATE TABLE IF NOT EXISTS case_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    access_level ENUM('READ_ONLY', 'READ_WRITE', 'CASE_OWNER') DEFAULT 'READ_ONLY',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_case_user (case_id, user_id)
) ENGINE=InnoDB;
