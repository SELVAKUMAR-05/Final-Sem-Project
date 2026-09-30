-- ==============================================================================
-- SEED DATA FOR SECURE LEGAL DMS
-- Passwords hashed using standard BCrypt / PBKDF2
-- Default development passwords:
-- admin@secure-dms.local -> admin123
-- police@secure-dms.local -> police123
-- investigator@secure-dms.local -> invest123
-- forensic@secure-dms.local -> forensic123
-- lawyer@secure-dms.local -> lawyer123
-- court@secure-dms.local -> court123
-- ==============================================================================

USE securedms_db;

-- Insert Seed Users
INSERT INTO users (id, username, email, password, role, full_name, department, badge_number, active) VALUES
(1, 'admin', 'admin@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'ADMIN', 'Dr. Rajesh Sharma', 'NCRB Headquarters - IT & Security', 'NCRB-ADM-001', TRUE),
(2, 'police', 'police@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'POLICE_OFFICER', 'Inspector K. Arumugam', 'Law & Order Police Station, Chennai', 'TN-POL-4412', TRUE),
(3, 'investigator', 'investigator@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'INVESTIGATION_OFFICER', 'DSP Sunita Rao', 'Crime Branch CID / Women Safety Cell', 'CID-IO-8891', TRUE),
(4, 'forensic', 'forensic@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'FORENSIC_OFFICER', 'Dr. Priya Nambiar', 'Central Forensic Science Laboratory (CFSL)', 'CFSL-BIO-2204', TRUE),
(5, 'lawyer', 'lawyer@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'LAWYER', 'Advocate Vikram Malhotra', 'Bar Council & Legal Defense Counsel', 'BAR-DEL-9912', TRUE),
(6, 'court', 'court@secure-dms.local', '$2a$12$e8vEkn8sB3wYwO5tZ6eSye6Q7lqU0T7v6B6Z8L4jH9fQ2pM4uX8qK', 'COURT_OFFICER', 'Registrar Justice Meenakshi Sundaram', 'High Court of Judicature - Registry', 'HC-REG-3001', TRUE);

-- Insert Sample Cases
INSERT INTO cases (id, case_number, title, crime_type, description, location, status, priority, investigating_officer, department, created_by, created_by_id) VALUES
(1, 'CASE-2026-001', 'Commercial Vault Theft & Security Tampering', 'Theft & Burglary', 'Break-in at commercial banking hub with physical bypass of dual-key digital vault. Multi-agency forensic & evidence chain required.', 'Chennai Central Business District', 'UNDER_INVESTIGATION', 'HIGH', 'DSP Sunita Rao', 'Tamil Nadu Police - Crime Investigation Dept', 'Inspector K. Arumugam', 2),
(2, 'CASE-2026-002', 'Financial Phishing & Cyber Extortion Network', 'Cyber Crime', 'Distributed fraud syndicate targeting women entrepreneurs with ransomware threats and fraudulent bank accounts.', 'New Delhi National Capital Region', 'UNDER_INVESTIGATION', 'CRITICAL', 'DSP Sunita Rao', 'NCRB Women Safety & Cyber Cell', 'Dr. Rajesh Sharma', 1),
(3, 'CASE-2026-003', 'Missing Vulnerable Youth Investigation', 'Missing Person', 'Disappearance reported at Central Railway Station. Surveillance footage, transit logs, and telephone CDR being analyzed.', 'Mumbai Suburbs', 'PENDING_REVIEW', 'MEDIUM', 'Inspector K. Arumugam', 'Maharashtra Police - Special Task Force', 'Inspector K. Arumugam', 2);

-- Insert Documents
INSERT INTO documents (id, case_id, document_name, document_type, original_filename, stored_filename, file_path, mime_type, file_size, sha256_hash, version, uploaded_by, uploaded_by_id, encrypted, encryption_algorithm, signed, signature_status, current_status, classification, extracted_text, ocr_extracted) VALUES
(1, 1, 'First Information Report (FIR-44/2026)', 'FIR', 'FIR_VaultTheft_Chennai_signed.pdf', 'DOC-fir-8f92ab3f.pdf', 'storage/cases/CASE-2026-001/DOC-fir-8f92ab3f.pdf', 'application/pdf', 532, 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 1, 'Inspector K. Arumugam', 2, TRUE, 'AES-256-CBC', TRUE, 'SIGNED', 'ACTIVE', 'RESTRICTED', 'National Crime Records Bureau Official First Information Report. FIR No 44/2026.', TRUE),
(2, 1, 'CCTV Security Guard Witness Statement', 'WITNESS_STATEMENT', 'Witness_Statement_RameshKumar_Guard.docx', 'DOC-wit-91b402ef.docx', 'storage/cases/CASE-2026-001/DOC-wit-91b402ef.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 390, '8F434346648F6B96DF89DDA901C5176B10E6D0CEEC3E6A1BEB92AAF5E5E9C5EB', 1, 'DSP Sunita Rao', 3, TRUE, 'AES-256-CBC', TRUE, 'SIGNED', 'ACTIVE', 'RESTRICTED', 'Witness statement under section 161 CrPC. Witness Ramesh Kumar Night Guard.', TRUE),
(3, 1, 'CFSL Digital Forensics Examination Report', 'FORENSIC_REPORT', 'CFSL_Keypad_DigitalForensics_v1.pdf', 'DOC-cfs-7718de1a.pdf', 'storage/cases/CASE-2026-001/DOC-cfs-7718de1a.pdf', 'application/pdf', 440, 'EE26B0DD4AF7E749AA1A8EE3C10AE9923F618980772E473F8819A5D4E2EE78C9', 1, 'Dr. Priya Nambiar', 4, TRUE, 'AES-256-CBC', TRUE, 'SIGNED', 'ACTIVE', 'CONFIDENTIAL', 'Central Forensic Science Laboratory CFSL Cyber & Hardware Forensics.', TRUE);

-- Insert Document Versions
INSERT INTO document_versions (id, document_id, version_number, file_path, stored_filename, sha256_hash, uploaded_by, uploaded_by_id, file_size, change_description) VALUES
(1, 1, 1, 'storage/cases/CASE-2026-001/DOC-fir-8f92ab3f.pdf', 'DOC-fir-8f92ab3f.pdf', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 'Inspector K. Arumugam', 2, 532, 'Initial verified upload & digital registration');

-- Insert Digital Signatures
INSERT INTO digital_signatures (id, document_id, signed_by, signed_by_id, signer_role, document_hash, signature, certificate_issuer, status) VALUES
(1, 1, 'Inspector K. Arumugam', 2, 'POLICE_OFFICER', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', 'NCRB-SIG-ED25519-TktQUi1TSUctRkFJMjAyNi1QUk9PRi1FTkNSWVBUSU9O', 'National Crime Records Bureau Root CA - PKI India', 'SIGNED');

-- Insert Initial Audit Trail
INSERT INTO audit_logs (id, user_id, username, role, action, document_id, case_id, ip_address, description, status) VALUES
(1, 1, 'admin', 'ADMIN', 'LOGIN', NULL, NULL, '10.14.8.102', 'System initialization and security service verification', 'SUCCESS'),
(2, 2, 'police', 'POLICE_OFFICER', 'CASE_CREATED', NULL, 1, '10.22.4.15', 'Registered Case CASE-2026-001: Commercial Vault Theft & Security Tampering', 'SUCCESS'),
(3, 2, 'police', 'POLICE_OFFICER', 'DOCUMENT_UPLOADED', 1, 1, '10.22.4.15', 'Uploaded FIR with SHA-256 integrity verification & AES-256 encryption', 'SUCCESS'),
(4, 2, 'police', 'POLICE_OFFICER', 'DOCUMENT_SIGNED', 1, 1, '10.22.4.15', 'Digitally signed FIR with NCRB Root CA certificate', 'SUCCESS');
