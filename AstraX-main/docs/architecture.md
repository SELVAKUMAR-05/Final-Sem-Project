# System Architecture & Technical Specification
## Secure Digital Document Management System for Legal and Investigation Documents
**Ministry of Home Affairs | National Crime Records Bureau (NCRB) - Women Safety Division**

---

### 1. High-Level Architectural Model

The system enforces a multi-tier, defense-in-depth architecture adhering to Indian Evidence Act Section 65B requirements for digital admissibility, NIST SP 800-57 cryptographic hygiene, and ISO/IEC 27001 audit standards.

```
+-------------------------------------------------------------------------+
|                         PRESENTATION LAYER                              |
|   React.js Client (Public Sans UI, Government Theme, Role-Driven)       |
+------------------------------------+------------------------------------+
                                     | HTTPS / TLS 1.3 / Bearer JWT
                                     v
+-------------------------------------------------------------------------+
|                     APPLICATION & REST API GATEWAY                      |
|  - Rate Limiter & Helmet Security Headers                               |
|  - JWT Authentication Filter & Token Lifecycle Manager                   |
|  - Role-Based Access Control (RBAC) Enforcement Engine                  |
+--------------------+-------------------------------+--------------------+
                     |                               |
                     v                               v
+--------------------+--------------+   +------------+--------------------+
|       CORE BUSINESS SERVICES      |   |    SECURITY & CRYPTO ENGINE     |
| - Case Management Service         |   | - SHA-256 Digest Generator      |
| - Document Lifecycle & Versioning |   | - AES-256-CBC Encryption Layer  |
| - Digital Signature Engine        |   | - Ed25519 PKI Signature Asserter|
| - OCR & Text Indexing Engine      |   | - Tamper Detection & Auditor    |
+--------------------+--------------+   +---------------------------------+
                     |
                     v
+--------------------+----------------------------------------------------+
|                         PERSISTENCE LAYER                               |
| - Relational Metadata Store: MySQL 8.0 (Users, Cases, Docs, Audits)     |
| - Encrypted Local Storage / Cloud S3: Nonce-Chained Storage Path        |
+-------------------------------------------------------------------------+
```

---

### 2. Role-Based Access Control (RBAC) Matrix

| User Role | Case Creation | View All Cases | Upload FIR/Reports | Upload Forensics | Court Filings | Sign Docs | Audit Trail Access |
|---|---|---|---|---|---|---|---|
| **ADMIN** | YES | YES | YES | YES | YES | YES | **FULL (Read-Only)** |
| **POLICE_OFFICER** | YES | Assigned Only | YES (FIR/Police) | NO | NO | YES | Own activity only |
| **INVESTIGATION_OFFICER** | YES | Assigned Only | YES (Reports/Statements) | Evidence Only | NO | YES | Own activity only |
| **FORENSIC_OFFICER** | NO | Assigned Only | NO | **YES (CFSL/Lab)** | NO | YES | Own activity only |
| **LAWYER** | NO | Permitted Only | NO | NO | Legal Notices | NO | **RESTRICTED** |
| **COURT_OFFICER** | NO | YES | NO | NO | **Judgments/Orders** | YES | Court Logs |

---

### 3. Cryptographic Chain of Custody

1. **Upload Phase**:
   - File stream intercepted by Multer memory buffer.
   - Buffer passed to SHA-256 hashing engine (`crypto.createHash('sha256')`).
   - Suffix-sanitized storage filename generated (`DOC-xxxxxxxx.ext`).
   - File written to isolated `storage/cases/CASE-XXX/` directory.
   - Hash, timestamp, uploader ID, and AES-256 metadata recorded in database.
   - System audit trail logs `DOCUMENT_UPLOADED`.

2. **Verification Phase**:
   - On request, disk binary is read and re-hashed using SHA-256.
   - If `Live_Hash === Registered_Hash`, status returned is `VALID (GREEN)`.
   - If byte disparity detected, status immediately flagged as `TAMPERED (RED)` and security incident alert is dispatched.

3. **Digital Signature Phase**:
   - Authorized officer signs using key pair linked to their badge & department.
   - Cryptographic signature bound to document's unique SHA-256 hash.
