# Security Specification & Compliance Architecture
## NCRB Digital Evidence & Document Protection Framework

### 1. Cryptographic Security Standards

1. **Document Hashing (SHA-256 / NIST FIPS 180-4)**:
   - Every file uploaded produces an immutable 256-bit hash.
   - Hash calculations are performed server-side directly on streaming memory buffers prior to writing to disk.
   - Pre-computed hashes are permanently recorded in the `documents` and `document_versions` tables.
   - Any modification of a single byte results in an avalanche effect altering the calculated hex string.

2. **At-Rest Encryption (AES-256-CBC with dynamic IV)**:
   - Sensitive legal evidence files are secured using AES-256 encryption.
   - Each file utilizes a cryptographically random 16-byte initialization vector (IV) to prevent frequency analysis and dictionary attacks.
   - Key storage leverages environment variable decoupling (`DOCUMENT_ENCRYPTION_KEY`), architected for straightforward HSM (Hardware Security Module) integration in production deployments.

3. **In-Transit Encryption**:
   - TLS 1.3 encryption with strict transport security (HSTS) ready.
   - Cross-Origin Resource Sharing (CORS) restricted to verified government hosts.

---

### 2. Defense Against Exploitation Vectors

1. **Path Traversal Mitigation**:
   - Client filenames are never used as file-system paths.
   - Stored filenames are uniformly sanitized and generated with random hexadecimal nonces: `DOC-<nonce>.<ext>`.
   - File directories are partitioned strictly under `storage/cases/<CASE_NUMBER>/`.

2. **Malicious Executable Blocking**:
   - Multi-tier validation checking both MIME type headers and file extensions.
   - Executable formats (`.exe`, `.sh`, `.bat`, `.bin`, `.js`, `.py`) are immediately rejected.
   - Allowed: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.txt`.

3. **Tamper Detection & Audit Logging**:
   - Comprehensive audit logging for all operations.
   - Unauthorized attempts immediately trigger `UNAUTHORIZED_ACCESS_ATTEMPT` audit logs and return `403 Forbidden`.
