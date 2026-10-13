# AstraX — Secure Evidence & Legal Document Management
### Organization: Ministry of Home Affairs (MHA), Government of India
### Department: National Crime Records Bureau (NCRB), Women Safety Division
### Category: Software | Theme: Miscellaneous
**Tagline:** *"Secure Documents. Trusted Evidence. Faster Justice."*

---

## 1. Problem Statement
Current legal and investigation document workflows across police departments, forensics laboratories, and judiciary suffer from:
- Vulnerability of physical paper files to tampering, loss, or unauthorized viewing.
- Fragmented, unencrypted digital storage across different agencies without unified custody.
- Inability to verify whether a court-submitted evidence document was modified post-FIR.
- Lack of immutable audit trails proving who viewed, downloaded, or updated sensitive documents.
- Significant delays in trial proceedings due to slow document retrieval.

## 2. Proposed Solution
AstraX Evidence Wallet is a full-stack, enterprise-grade, cryptographically fortified document management platform. It delivers:
- **Confidentiality:** Role-Based Access Control (RBAC) preventing unauthorized access (e.g. defense counsel viewing unfiled internal police drafts).
- **Integrity:** Automated SHA-256 document hashing on upload with instantaneous disk-level verification and tamper alerts.
- **Authenticity:** PKI digital signature workflow for police officers, investigators, and court registrars.
- **Accountability:** Non-repudiable audit logging recording IP addresses, user IDs, and timestamps for every read, write, download, and verification action.
- **Availability & Fast Retrieval:** Multi-parameter search with OCR text extraction for instant document lookup.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Public Sans & JetBrains Mono typography, custom government design system (No Tailwind CSS, clean custom CSS), Lucide icons, Motion transitions.
- **Backend:** Express & Node.js (with full Spring Boot reference architecture in `backend/` for Java deployments), REST APIs, Multer multipart handler.
- **Database:** MySQL 8.0 schema & seed scripts (`database/schema.sql`, `database/data.sql`).
- **Security:** JWT Authentication, PBKDF2/BCrypt hashing, AES-256-CBC encryption, SHA-256 cryptographic digests, Ed25519 digital signature simulation.
- **Document Processing:** OCR text extraction interface, MIME-type and extension validation, unique server-side filename generation.
- **DevOps:** Docker, Docker Compose (`docker-compose.yml`), automated health-checks.

---

## 4. Demo User Credentials (Pre-Seeded)

| Role | Email / Username | Development Password | Key Permissions |
|---|---|---|---|
| **ADMIN** | `admin@secure-dms.local` | `admin123` | Full system access, audit trails, user management |
| **POLICE_OFFICER** | `police@secure-dms.local` | `police123` | Case creation, FIR & report upload, digital signing |
| **INVESTIGATION_OFFICER** | `investigator@secure-dms.local` | `invest123` | Investigation reports, witness statements, versioning |
| **FORENSIC_OFFICER** | `forensic@secure-dms.local` | `forensic123` | CFSL forensic reports, evidence hash verification |
| **LAWYER** | `lawyer@secure-dms.local` | `lawyer123` | Court filings, legal notices (internal police docs blocked) |
| **COURT_OFFICER** | `court@secure-dms.local` | `court123` | Charge sheets, court filings, judicial judgments |

---

## 5. Hackathon Demonstration Guide (DEMO 1 - DEMO 9)

Use the built-in **"Hackathon Demo Guide"** tab in the application, or test via APIs:
1. **DEMO 1 - Admin Login & Dashboard:** Log in as `admin`. View global case counters, documents uploaded today, and live audit telemetry.
2. **DEMO 2 - Create Case:** Create a new case (e.g. `CASE-2026-004`).
3. **DEMO 3 - Police Officer Uploads FIR:** Switch to `police`. Upload an FIR. System generates SHA-256, assigns secure storage name, and writes audit record.
4. **DEMO 4 - Investigator Search:** Switch to `investigator`. Perform multi-criteria search by keyword or OCR content.
5. **DEMO 5 - Document Download with Audit:** Download or view a document. Verify audit log captures `DOCUMENT_DOWNLOADED`.
6. **DEMO 6 - Version Control:** Upload a revision for an existing document. System preserves Version 1 and creates Version 2 with change descriptions.
7. **DEMO 7 - Integrity Verification (Valid):** Open Integrity Verifier. Run SHA-256 test. Green banner: *"Document integrity valid"*.
8. **DEMO 8 - Unauthorized Access Blocking:** Switch role to `LAWYER`. Attempt to view or download a restricted internal police document or CFSL report. System returns `403 Forbidden - Access Denied` and logs the incident.
9. **DEMO 9 - Admin Audit Trail:** Switch back to `ADMIN`. Open Audit Trail. Filter and export non-repudiable audit logs.

---

## 6. Local Quickstart

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (Optional for containerized run)

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Optional: configure OpenRouter for open-ended AI answers
#    Copy .env.example to .env and set OPENROUTER_API_KEY.

# 3. Run the full-stack development server (Express + Vite on Port 3000)
npm run dev
```
Open browser at `http://localhost:3000`.

Without `OPENROUTER_API_KEY`, the assistant uses its limited local vault analyzer and cannot answer general questions. `OPENROUTER_MODEL` is optional and defaults to `openrouter/free`.

### Running with Docker Compose
```bash
docker compose up --build
```

---

## 7. License & Attribution
Designed for hackathon and innovation presentation under Ministry of Home Affairs & National Crime Records Bureau guidelines.
