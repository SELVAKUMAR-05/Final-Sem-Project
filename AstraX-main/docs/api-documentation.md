# REST API Documentation
## NCRB Secure Digital Document Management System

All protected endpoints require HTTP Header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. Authentication Endpoints

#### POST `/api/auth/login`
- **Description**: Authenticate user and issue JWT token.
- **Request Body**:
```json
{
  "username": "police@secure-dms.local",
  "password": "police123"
}
```
- **Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 2,
  "username": "police",
  "role": "POLICE_OFFICER",
  "fullName": "Inspector K. Arumugam",
  "department": "Law & Order Police Station, Chennai"
}
```

#### GET `/api/auth/me`
- **Description**: Get active user identity.
- **Response** `200 OK`: Returns user profile.

---

### 2. Case Management Endpoints

#### GET `/api/cases`
- **Description**: List investigation and legal cases.

#### POST `/api/cases`
- **Description**: Register new police or legal investigation case.
- **Roles**: `ADMIN`, `POLICE_OFFICER`, `INVESTIGATION_OFFICER`.
- **Request Body**:
```json
{
  "caseNumber": "CASE-2026-004",
  "title": "Counterfeit Currency Trafficking",
  "crimeType": "Economic Offence",
  "location": "Hyderabad",
  "priority": "HIGH",
  "description": "Cross-border counterfeit currency distribution ring."
}
```

---

### 3. Document Endpoints

#### GET `/api/documents`
- **Query params**: `caseId`, `type`.

#### GET `/api/documents/:id`
- **Description**: Retrieve document record with role check.
- **Notice**: Returns `403 Forbidden` if user role is unapproved (e.g. `LAWYER` accessing internal police records).

#### POST `/api/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**: `caseId`, `documentName`, `documentType`, `classification`, `file`.

#### POST `/api/documents/:id/upload-version`
- **Content-Type**: `multipart/form-data`
- **Fields**: `changeDescription`, `file`.

#### POST `/api/documents/:id/verify`
- **Description**: Perform cryptographic SHA-256 integrity audit against physical disk bytes.
- **Response** `200 OK`:
```json
{
  "documentId": 1,
  "documentName": "FIR-44/2026",
  "storedHash": "E3B0C44298FC1C...",
  "calculatedHash": "E3B0C44298FC1C...",
  "integrity": "VALID",
  "algorithm": "SHA-256 (NIST FIPS 180-4)",
  "checkedAt": "2026-09-04T03:50:00.000Z"
}
```

#### POST `/api/documents/:id/sign`
- **Description**: Attach official digital signature to document.

---

### 4. Audit & Search

#### GET `/api/audit-logs`
- **Roles**: `ADMIN`, `COURT_OFFICER`.
- **Query params**: `action`, `userId`, `caseId`, `limit`.

#### GET `/api/search/documents`
- **Query params**: `query`, `caseNumber`, `documentType`, `crimeType`, `location`.
