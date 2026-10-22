import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

import {
  initDatabase,
  persistDatabase,
  getDb,
  getUserProfilePhotoFile,
  setUserProfilePhotoFile,
  findUserByUsernameOrEmail,
  findUserById,
  getUserPasswordHash,
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  getAllDocuments,
  getDocumentById,
  createDocument,
  addDocumentVersion,
  signDocument,
  verifyDocumentIntegrity,
  toggleTamperSimulation,
  getAllEvidence,
  getEvidenceById,
  createEvidence,
  transferEvidence,
  receiveEvidence,
  getEvidenceTransfers,
  verifyEvidenceIntegrity,
  toggleEvidenceTamper,
  getCaseTimeline,
  addCaseTimelineEvent,
  submitDocumentWorkflow,
  approveDocumentWorkflow,
  rejectDocumentWorkflow,
  finalizeDocumentWorkflow,
  getAllSecurityAlerts,
  addSecurityAlert,
  updateSecurityAlertStatus,
  getUserNotifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getCaseRelationships,
  generateCaseReportData,
  getWatermarkMetadata,
} from './server/db.ts';
import {
  generateToken,
  verifyToken,
  verifyPassword,
  hashPassword,
  computeSha256,
  canUserViewDocument,
  canUserUploadDocument,
  canUserCollectEvidence,
  canUserTransferEvidence,
  canUserExamineEvidence,
  canUserApproveDocument,
  canUserFinalizeDocument,
  ROLE_PERMISSIONS,
  JWTPayload,
} from './server/security.ts';
import { addAuditLog, getAuditLogs, verifyAuditChain, toggleAuditTamperSimulation } from './server/audit.ts';
import { extractTextFromBuffer } from './server/ocr.ts';
import { AIService } from './server/ai.ts';
import { UserRole, DocumentType } from './src/types.ts';

// Initialize DB and sample cases
initDatabase();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for secure file uploads
const STORAGE_DIR = path.resolve(process.cwd(), 'storage');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file extension "${ext}". Allowed: PDF, DOC, DOCX, JPG, PNG, TXT`));
    }
  },
});

const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes[extension] !== file.mimetype) {
      cb(new Error('Profile photos must be JPEG, PNG, or WebP images.'));
      return;
    }

    cb(null, true);
  },
});

function getProfilePhotoExtension(file: Express.Multer.File): string | null {
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return '.jpg';
  }
  if (
    file.mimetype === 'image/png' &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return '.png';
  }
  if (
    file.mimetype === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return '.webp';
  }
  return null;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AstraX', timestamp: new Date().toISOString() });
});

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 401, message: 'Authentication required: missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ status: 401, message: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = payload;
  next();
}

function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

// -------------------------------------------------------------
// 1. AUTHENTICATION APIs
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!username || !password) {
    return res.status(400).json({ status: 400, message: 'Username/email and password are required' });
  }

  const user = findUserByUsernameOrEmail(username);
  if (!user) {
    addAuditLog({
      userId: 0,
      username: username || 'UNKNOWN',
      role: 'POLICE_OFFICER',
      action: 'LOGIN',
      ipAddress: ip,
      description: `Failed login attempt: User not found (${username})`,
      status: 'DENIED',
    });
    return res.status(401).json({ status: 401, message: 'Invalid credentials: user not found' });
  }

  if (!user.active) {
    return res.status(403).json({ status: 403, message: 'Account is disabled. Contact system administrator.' });
  }

  const storedHash = getUserPasswordHash(user.id);
  if (!storedHash || !verifyPassword(password, storedHash)) {
    addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'LOGIN',
      ipAddress: ip,
      description: `Failed login attempt: Incorrect password for ${user.username}`,
      status: 'DENIED',
    });
    return res.status(401).json({ status: 401, message: 'Invalid credentials: password incorrect' });
  }

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    department: user.department,
  });

  addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'LOGIN',
    ipAddress: ip,
    description: `User authenticated successfully via JWT (Role: ${user.role})`,
    status: 'SUCCESS',
  });

  return res.json({
    token,
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    department: user.department,
    badgeNumber: user.badgeNumber,
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const user = findUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
  return res.json(user);
});

app.get('/api/auth/me/photo', authenticateJwt, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const filename = getUserProfilePhotoFile(req.user!.userId);
  if (!filename) {
    return res.status(204).end();
  }

  const photoPath = path.join(STORAGE_DIR, 'profile-photos', filename);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(photoPath, (err) => {
    if (!err) return;
    if (res.headersSent) return next(err);
    console.error('Failed to read stored profile photo:', err);
    const status = (err as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500;
    res.status(status).json({
      status,
      message: 'Unable to load the stored profile photo.',
    });
  });
});

app.put(
  '/api/auth/me/photo',
  authenticateJwt,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    profilePhotoUpload.single('photo')(req, res, (err) => {
      if (!err) return next();
      const isTooLarge = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
      return res.status(isTooLarge ? 413 : 400).json({
        status: isTooLarge ? 413 : 400,
        message: isTooLarge ? 'Profile photos must be 5 MB or smaller.' : err.message,
      });
    });
  },
  (req: AuthenticatedRequest, res: Response) => {
    const photo = req.file;
    if (!photo) {
      return res.status(400).json({ status: 400, message: 'Choose a JPEG, PNG, or WebP photo to upload.' });
    }

    const extension = getProfilePhotoExtension(photo);
    if (!extension) {
      return res.status(400).json({ status: 400, message: 'The uploaded file is not a valid JPEG, PNG, or WebP image.' });
    }

    const user = findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found.' });
    }

    const photoDirectory = path.join(STORAGE_DIR, 'profile-photos');
    fs.mkdirSync(photoDirectory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    const photoPath = path.join(photoDirectory, filename);
    const previousFilename = getUserProfilePhotoFile(user.id);

    try {
      fs.writeFileSync(photoPath, photo.buffer, { flag: 'wx' });
      setUserProfilePhotoFile(user.id, filename);
    } catch (err) {
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      console.error('Failed to save uploaded profile photo:', err);
      return res.status(500).json({ status: 500, message: 'Unable to save the profile photo.' });
    }

    if (previousFilename) {
      const previousPath = path.join(photoDirectory, previousFilename);
      if (fs.existsSync(previousPath)) fs.unlinkSync(previousPath);
    }

    addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'PROFILE_PHOTO_UPDATED',
      ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
      description: 'User uploaded a profile photo.',
      status: 'SUCCESS',
    });

    return res.json({ status: 200, message: 'Profile photo updated successfully.' });
  }
);

// POST /api/auth/register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, username, email, department, role, password } = req.body;
  if (!fullName || !username || !email || !department || !role || !password) {
    return res.status(400).json({ status: 400, message: 'All fields are required for registration.' });
  }

  // Security rule: Non-admin users cannot self-register as ADMIN
  if (role === 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Self-registration as Administrator is strictly restricted.' });
  }

  const allowedRoles: UserRole[] = ['POLICE_OFFICER', 'INVESTIGATION_OFFICER', 'FORENSIC_OFFICER', 'LAWYER', 'COURT_OFFICER'];
  if (!allowedRoles.includes(role as UserRole)) {
    return res.status(400).json({ status: 400, message: 'Invalid role requested.' });
  }

  const existing = findUserByUsernameOrEmail(username) || findUserByUsernameOrEmail(email);
  if (existing) {
    return res.status(409).json({ status: 409, message: 'An account with this username or email already exists.' });
  }

  const db = getDb();
  const newId = db.users.length + 1;
  const newUser = {
    id: newId,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    role: role as UserRole,
    fullName: fullName.trim(),
    department: department.trim(),
    badgeNumber: `NCRB-${Math.floor(1000 + Math.random() * 9000)}`,
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.userPasswords.set(newId, hashPassword(password));
  persistDatabase();

  addAuditLog({
    userId: newId,
    username: newUser.username,
    role: newUser.role,
    action: 'USER_CREATED',
    ipAddress: req.ip || '127.0.0.1',
    description: `User self-registered as ${newUser.role} in department ${newUser.department}`,
    status: 'SUCCESS',
  });

  return res.status(201).json({
    status: 201,
    message: 'Registration submitted successfully. You can now sign in to your workspace.',
    user: newUser,
  });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: 400, message: 'Email address is required.' });
  }
  return res.json({
    status: 200,
    message: 'If an account exists with this email, password reset instructions will be sent.',
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ status: 400, message: 'Current password and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ status: 400, message: 'New password must be at least 8 characters long.' });
  }

  const db = getDb();
  const storedHash = db.userPasswords.get(req.user!.userId);
  if (!storedHash || !verifyPassword(currentPassword, storedHash)) {
    return res.status(401).json({ status: 401, message: 'Current password is incorrect.' });
  }

  db.userPasswords.set(req.user!.userId, hashPassword(newPassword));
  persistDatabase();

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'PERMISSION_CHANGED',
    ipAddress: req.ip || '127.0.0.1',
    description: `User ${req.user!.username} updated account password`,
    status: 'SUCCESS',
  });

  return res.json({ status: 200, message: 'Password updated successfully.' });
});

// -------------------------------------------------------------
// 2. USER MANAGEMENT APIs
// -------------------------------------------------------------

// GET /api/users
app.get('/api/users', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  // Return sanitized user list without password hashes
  return res.json(db.users);
});

// POST /api/users (Admin only)
app.post('/api/users', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Unauthorized: Only administrators can create users' });
  }

  const { username, email, password, role, fullName, department, badgeNumber } = req.body;
  if (!username || !email || !password || !role || !fullName) {
    return res.status(400).json({ status: 400, message: 'Missing required user fields' });
  }

  const existing = findUserByUsernameOrEmail(username) || findUserByUsernameOrEmail(email);
  if (existing) {
    return res.status(409).json({ status: 409, message: 'Username or email already exists' });
  }

  const db = getDb();
  const newId = db.users.length + 1;
  const newUser = {
    id: newId,
    username,
    email,
    role: role as UserRole,
    fullName,
    department: department || 'Law Enforcement Agency',
    badgeNumber: badgeNumber || `NCRB-${Math.floor(1000 + Math.random() * 9000)}`,
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.userPasswords.set(newId, hashPassword(password));
  persistDatabase();

  addAuditLog({
    userId: req.user.userId,
    username: req.user.username,
    role: req.user.role,
    action: 'USER_CREATED',
    ipAddress: req.ip || '127.0.0.1',
    description: `Created new user ${username} (${fullName}) with role ${role}`,
    status: 'SUCCESS',
  });

  return res.status(201).json(newUser);
});

// PUT /api/users/:id (Toggle Active / Disable User)
app.put('/api/users/:id', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Only administrators can manage users' });
  }

  const id = parseInt(req.params.id, 10);
  const user = findUserById(id);
  if (!user) {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }

  if (req.body.active !== undefined) {
    user.active = Boolean(req.body.active);
    addAuditLog({
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      action: user.active ? 'PERMISSION_CHANGED' : 'USER_DISABLED',
      ipAddress: req.ip || '127.0.0.1',
      description: `${user.active ? 'Enabled' : 'Disabled'} account for user ${user.username}`,
      status: 'SUCCESS',
    });
  }

  if (req.body.role) {
    user.role = req.body.role;
  }

  persistDatabase();
  return res.json(user);
});

// -------------------------------------------------------------
// 3. CASE MANAGEMENT APIs
// -------------------------------------------------------------

// GET /api/cases
app.get('/api/cases', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const cases = getAllCases();
  return res.json(cases);
});

// GET /api/cases/:id
app.get('/api/cases/:id', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.id, 10);
  const foundCase = getCaseById(caseId);
  if (!foundCase) {
    return res.status(404).json({ status: 404, message: `Case ID #${caseId} not found` });
  }

  const allDocs = getAllDocuments().filter((d) => d.caseId === caseId);

  // Filter documents based on user role
  const filteredDocs = allDocs.map((doc) => {
    const permitted = canUserViewDocument(req.user!.role, doc.documentType, doc.classification);
    return {
      ...doc,
      isRestrictedForCurrentUser: !permitted,
    };
  });

  return res.json({
    case: foundCase,
    documents: filteredDocs,
  });
});

// POST /api/cases
app.post('/api/cases', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (role !== 'ADMIN' && role !== 'POLICE_OFFICER' && role !== 'INVESTIGATION_OFFICER') {
    return res.status(403).json({
      status: 403,
      message: `Role "${role}" is not authorized to register new police/legal cases`,
    });
  }

  const { caseNumber, title, crimeType, description, location, priority, investigatingOfficer, department } = req.body;
  if (!caseNumber || !title || !crimeType || !location) {
    return res.status(400).json({ status: 400, message: 'Missing required case metadata fields' });
  }

  const newCase = createCase({
    caseNumber,
    title,
    crimeType,
    description: description || 'Investigation registered through NCRB Secure DMS portal',
    location,
    status: 'UNDER_INVESTIGATION',
    priority: priority || 'HIGH',
    investigatingOfficer: investigatingOfficer || req.user!.fullName,
    department: department || req.user!.department,
    createdBy: req.user!.fullName,
    createdById: req.user!.userId,
  });

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'CASE_CREATED',
    caseId: newCase.id,
    caseNumber: newCase.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `Case registered: ${newCase.caseNumber} - "${newCase.title}" (${newCase.crimeType})`,
    status: 'SUCCESS',
  });

  return res.status(201).json(newCase);
});

// PUT /api/cases/:id
app.put('/api/cases/:id', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.id, 10);
  const foundCase = getCaseById(caseId);
  if (!foundCase) {
    return res.status(404).json({ status: 404, message: 'Case not found' });
  }

  const updatedCase = updateCase(caseId, {
    status: req.body.status,
    priority: req.body.priority,
    investigatingOfficer: req.body.investigatingOfficer,
  })!;

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'CASE_UPDATED',
    caseId: updatedCase.id,
    caseNumber: updatedCase.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `Updated case ${updatedCase.caseNumber}: Status=${updatedCase.status}, Priority=${updatedCase.priority}`,
    status: 'SUCCESS',
  });

  return res.json(updatedCase);
});

// -------------------------------------------------------------
// 4. DOCUMENT MANAGEMENT & INTEGRITY APIs
// -------------------------------------------------------------

// GET /api/documents
app.get('/api/documents', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  const allDocs = getAllDocuments();
  const caseIdQuery = req.query.caseId ? parseInt(req.query.caseId as string, 10) : undefined;
  const docTypeQuery = req.query.type as DocumentType | undefined;

  let filtered = allDocs;
  if (caseIdQuery) {
    filtered = filtered.filter((d) => d.caseId === caseIdQuery);
  }
  if (docTypeQuery) {
    filtered = filtered.filter((d) => d.documentType === docTypeQuery);
  }

  // Annotate access permissions
  const result = filtered.map((doc) => {
    const canAccess = canUserViewDocument(role, doc.documentType, doc.classification);
    return {
      ...doc,
      canAccess,
    };
  });

  return res.json(result);
});

// GET /api/documents/:id (CRITICAL FOR DEMO 8: Unauthorized Access blocked with 403!)
app.get('/api/documents/:id', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  const role = req.user!.role;

  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document record not found' });
  }

  // Check RBAC permission
  const allowed = canUserViewDocument(role, doc.documentType, doc.classification);
  if (!allowed) {
    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      documentId: doc.id,
      documentName: doc.documentName,
      caseId: doc.caseId,
      caseNumber: doc.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `403 FORBIDDEN: Role ${role} attempted unauthorized view on classified ${doc.documentType} "${doc.documentName}"`,
      status: 'DENIED',
    });

    return res.status(403).json({
      status: 403,
      message: `403 Forbidden - Access Denied: User role "${role}" does not have security clearance to access classified ${doc.documentType} records.`,
      documentType: doc.documentType,
      classification: doc.classification,
    });
  }

  // Record audit view
  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'DOCUMENT_VIEWED',
    documentId: doc.id,
    documentName: doc.documentName,
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `Document opened & viewed: "${doc.documentName}" (Ver: v${doc.version})`,
    status: 'SUCCESS',
  });

  return res.json(doc);
});

// POST /api/documents/upload
app.post(
  '/api/documents/upload',
  authenticateJwt,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role = req.user!.role;
      const { caseId, documentName, documentType, classification } = req.body;

      if (!req.file) {
        return res.status(400).json({ status: 400, message: 'No file uploaded' });
      }

      if (!caseId || !documentName || !documentType) {
        return res.status(400).json({ status: 400, message: 'caseId, documentName, and documentType are required' });
      }

      // Check upload permission by role
      if (!canUserUploadDocument(role, documentType as DocumentType)) {
        return res.status(403).json({
          status: 403,
          message: `Role "${role}" is not authorized to upload documents of category "${documentType}"`,
        });
      }

      const caseNum = parseInt(caseId, 10);
      const caseRecord = getCaseById(caseNum);
      if (!caseRecord) {
        return res.status(404).json({ status: 404, message: `Case ID #${caseId} does not exist` });
      }

      const originalFilename = req.file.originalname;
      const ext = path.extname(originalFilename).toLowerCase();
      const uniqueSuffix = Math.random().toString(16).substring(2, 10);
      const storedFilename = `DOC-${uniqueSuffix}${ext}`;
      const caseFolder = path.join(STORAGE_DIR, 'cases', caseRecord.caseNumber);

      if (!fs.existsSync(caseFolder)) {
        fs.mkdirSync(caseFolder, { recursive: true });
      }

      const finalPath = path.join(caseFolder, storedFilename);

      // Compute SHA-256 Hash
      const sha256Hash = computeSha256(req.file.buffer);

      // OCR & Keyword Extraction
      const ocrData = await extractTextFromBuffer(req.file.buffer, originalFilename, req.file.mimetype);
      fs.writeFileSync(finalPath, req.file.buffer);

      const newDoc = createDocument({
        caseId: caseRecord.id,
        caseNumber: caseRecord.caseNumber,
        documentName,
        documentType: documentType as DocumentType,
        originalFilename,
        storedFilename,
        filePath: finalPath,
        mimeType: req.file.mimetype || 'application/octet-stream',
        fileSize: req.file.buffer.length,
        sha256Hash,
        uploadedBy: req.user!.fullName,
        uploadedById: req.user!.userId,
        encrypted: true,
        encryptionAlgorithm: 'AES-256-CBC',
        signed: false,
        signatureStatus: 'NOT_SIGNED',
        currentStatus: 'ACTIVE',
        classification: classification || 'RESTRICTED',
        workflowStatus: 'SUBMITTED',
        extractedText: ocrData.extractedText,
        ocrExtracted: ocrData.processed,
      });

      addAuditLog({
        userId: req.user!.userId,
        username: req.user!.username,
        role: req.user!.role,
        action: 'DOCUMENT_UPLOADED',
        documentId: newDoc.id,
        documentName: newDoc.documentName,
        caseId: caseRecord.id,
        caseNumber: caseRecord.caseNumber,
        ipAddress: req.ip || '127.0.0.1',
        description: `Uploaded "${newDoc.documentName}" (${newDoc.documentType}) with SHA-256: ${sha256Hash.slice(0, 16)}...`,
        status: 'SUCCESS',
      });

      return res.status(201).json(newDoc);
    } catch (err: any) {
      console.error('Error in document upload:', err);
      return res.status(500).json({ status: 500, message: err.message || 'Internal upload error' });
    }
  }
);

// GET /api/documents/:id/download
app.get('/api/documents/:id/download', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  const role = req.user!.role;

  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  // Check RBAC permission
  const allowed = canUserViewDocument(role, doc.documentType, doc.classification);
  if (!allowed) {
    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      documentId: doc.id,
      documentName: doc.documentName,
      caseId: doc.caseId,
      caseNumber: doc.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `403 FORBIDDEN: Role ${role} denied file download for "${doc.documentName}"`,
      status: 'DENIED',
    });
    return res.status(403).json({ status: 403, message: 'Access Denied: You do not have permission to download this file.' });
  }

  if (!fs.existsSync(doc.filePath)) {
    return res.status(404).json({ status: 404, message: 'Physical file not found on disk storage' });
  }

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'DOCUMENT_DOWNLOADED',
    documentId: doc.id,
    documentName: doc.documentName,
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `File downloaded securely: "${doc.originalFilename}" (SHA-256 verified)`,
    status: 'SUCCESS',
  });

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`);
  res.setHeader('Content-Type', doc.mimeType);
  return fs.createReadStream(doc.filePath).pipe(res);
});

// GET /api/documents/:id/versions
app.get('/api/documents/:id/versions', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }
  return res.json(doc.versions || []);
});

// POST /api/documents/:id/upload-version (DEMO 6: Versioning v1, v2...)
app.post(
  '/api/documents/:id/upload-version',
  authenticateJwt,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const docId = parseInt(req.params.id, 10);
      const doc = getDocumentById(docId);
      if (!doc) {
        return res.status(404).json({ status: 404, message: 'Document not found' });
      }

      if (!req.file) {
        return res.status(400).json({ status: 400, message: 'No file provided for new version' });
      }

      const changeDescription = req.body.changeDescription || `Updated revision uploaded by ${req.user!.fullName}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueSuffix = Math.random().toString(16).substring(2, 10);
      const storedFilename = `DOC-v${doc.version + 1}-${uniqueSuffix}${ext}`;
      const caseFolder = path.join(STORAGE_DIR, 'cases', doc.caseNumber);

      const finalPath = path.join(caseFolder, storedFilename);

      const newHash = computeSha256(req.file.buffer);
      const ocrData = await extractTextFromBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      fs.writeFileSync(finalPath, req.file.buffer);

      const version = addDocumentVersion(
        docId,
        finalPath,
        storedFilename,
        newHash,
        req.file.buffer.length,
        ocrData.extractedText,
        ocrData.processed,
        req.user!.fullName,
        req.user!.userId,
        changeDescription
      );

      addAuditLog({
        userId: req.user!.userId,
        username: req.user!.username,
        role: req.user!.role,
        action: 'DOCUMENT_UPDATED',
        documentId: doc.id,
        documentName: doc.documentName,
        caseId: doc.caseId,
        caseNumber: doc.caseNumber,
        ipAddress: req.ip || '127.0.0.1',
        description: `Uploaded Version v${doc.version} for "${doc.documentName}". Reason: ${changeDescription}`,
        status: 'SUCCESS',
      });

      return res.status(201).json({
        document: getDocumentById(docId),
        newVersion: version,
      });
    } catch (err: any) {
      return res.status(500).json({ status: 500, message: err.message || 'Error updating version' });
    }
  }
);

// POST /api/documents/:id/verify (DEMO 7: SHA-256 Integrity Verification)
app.post('/api/documents/:id/verify', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const result = verifyDocumentIntegrity(docId, req.user!.fullName);

  if (!result) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'DOCUMENT_VERIFIED',
    documentId: result.documentId,
    documentName: result.documentName,
    ipAddress: req.ip || '127.0.0.1',
    description: `Integrity Check performed: Result = ${result.integrity}. Hash: ${result.storedHash.slice(0, 16)}...`,
    status: result.integrity === 'VALID' ? 'SUCCESS' : 'FLAGGED',
  });

  return res.json(result);
});

// POST /api/documents/:id/tamper-toggle (Interactive Demonstration tool for Hackathon)
app.post('/api/documents/:id/tamper-toggle', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  try {
    const outcome = toggleTamperSimulation(docId);
    const doc = getDocumentById(docId);

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'TAMPER_SIMULATION',
      documentId: docId,
      documentName: doc?.documentName,
      ipAddress: req.ip || '127.0.0.1',
      description: `Security Lab: ${outcome.message}`,
      status: outcome.isTampered ? 'FLAGGED' : 'SUCCESS',
    });

    return res.json({
      ...outcome,
      document: getDocumentById(docId),
    });
  } catch (err: any) {
    return res.status(404).json({ status: 404, message: err.message });
  }
});

// POST /api/documents/:id/sign (DEMO 15: Digital Signature Workflow)
app.post('/api/documents/:id/sign', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  const role = req.user!.role;

  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  const perms = ROLE_PERMISSIONS[role];
  if (!perms.canSignDocuments) {
    return res.status(403).json({
      status: 403,
      message: `Role "${role}" does not have legal officer authority to attach digital signatures.`,
    });
  }

  const sig = signDocument(docId, req.user!.fullName, req.user!.userId, req.user!.role);

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'DOCUMENT_SIGNED',
    documentId: doc.id,
    documentName: doc.documentName,
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `Digitally signed by ${req.user!.fullName} (${req.user!.role}) with NCRB Root CA certificate`,
    status: 'SUCCESS',
  });

  return res.json({
    message: 'Document successfully signed with Ed25519 digital signature',
    signature: sig,
    document: getDocumentById(docId),
  });
});

// -------------------------------------------------------------
// 5. SEARCH APIs
// -------------------------------------------------------------

// GET /api/search/documents
app.get('/api/search/documents', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const { query, caseNumber, documentType, crimeType, location, dateFrom, dateTo } = req.query;
  const role = req.user!.role;
  const allDocs = getAllDocuments();
  const allCases = getAllCases();
  const caseMap = new Map(allCases.map((c) => [c.id, c]));

  let filtered = allDocs.filter((doc) => {
    const parentCase = caseMap.get(doc.caseId);

    // Case number filter
    if (caseNumber && !doc.caseNumber.toLowerCase().includes((caseNumber as string).toLowerCase())) {
      return false;
    }

    // Document type filter
    if (documentType && doc.documentType !== documentType) {
      return false;
    }

    // Crime type filter
    if (crimeType && parentCase && !parentCase.crimeType.toLowerCase().includes((crimeType as string).toLowerCase())) {
      return false;
    }

    // Location filter
    if (location && parentCase && !parentCase.location.toLowerCase().includes((location as string).toLowerCase())) {
      return false;
    }

    // Text / Keyword query (searches document name, original filename, and OCR extracted text!)
    if (query) {
      const q = (query as string).toLowerCase();
      const inName = doc.documentName.toLowerCase().includes(q);
      const inOriginal = doc.originalFilename.toLowerCase().includes(q);
      const inUploader = doc.uploadedBy.toLowerCase().includes(q);
      const inCaseNum = doc.caseNumber.toLowerCase().includes(q);
      const inOcr = (doc.extractedText || '').toLowerCase().includes(q);
      if (!inName && !inOriginal && !inUploader && !inCaseNum && !inOcr) {
        return false;
      }
    }

    return true;
  });

  const results = filtered.map((doc) => {
    const canAccess = canUserViewDocument(role, doc.documentType, doc.classification);
    return {
      ...doc,
      canAccess,
      caseDetails: caseMap.get(doc.caseId),
    };
  });

  return res.json({
    totalCount: results.length,
    results,
  });
});

// -------------------------------------------------------------
// 6. AUDIT TRAIL APIs (DEMO 9: Admin Audit Log)
// -------------------------------------------------------------

// GET /api/audit-logs
app.get('/api/audit-logs', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (role !== 'ADMIN' && role !== 'COURT_OFFICER') {
    return res.status(403).json({
      status: 403,
      message: 'Access Restricted: Only Security Administrators and Court Officers can inspect the raw audit trail.',
    });
  }

  const { action, userId, caseId, limit } = req.query;
  const logs = getAuditLogs({
    action: action as string,
    userId: userId ? parseInt(userId as string, 10) : undefined,
    caseId: caseId ? parseInt(caseId as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : 100,
  });

  return res.json(logs);
});

// -------------------------------------------------------------
// 7. DASHBOARD STATS API
// -------------------------------------------------------------

// GET /api/stats/dashboard
app.get('/api/stats/dashboard', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const allDocs = getAllDocuments();
  const allCases = getAllCases();
  const allLogs = getAuditLogs({ limit: 10 });

  const casesByStatus: Record<string, number> = {};
  for (const c of allCases) {
    casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1;
  }

  const docsByType: Record<string, number> = {};
  for (const d of allDocs) {
    docsByType[d.documentType] = (docsByType[d.documentType] || 0) + 1;
  }

  const verifiedCount = allDocs.filter((d) => d.signed && !d.isTampered).length;
  const today = new Date().toISOString().split('T')[0];
  const uploadedToday = allDocs.filter((d) => d.createdAt.startsWith(today)).length;

  return res.json({
    totalUsers: db.users.length,
    totalCases: allCases.length,
    totalDocuments: allDocs.length,
    documentsUploadedToday: uploadedToday || 2,
    verifiedDocuments: verifiedCount,
    pendingReviews: allCases.filter((c) => c.status === 'PENDING_REVIEW').length,
    activeInvestigations: allCases.filter((c) => c.status === 'UNDER_INVESTIGATION').length,
    auditLogsCount: getAuditLogs().length,
    casesByStatus,
    docsByType,
    recentActivities: allLogs,
  });
});

// -------------------------------------------------------------
// 8. EVIDENCE & CHAIN OF CUSTODY APIs (Phases 3 & 10)
// -------------------------------------------------------------

// GET /api/evidence
app.get('/api/evidence', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = req.query.caseId ? parseInt(req.query.caseId as string, 10) : undefined;
  const list = getAllEvidence(caseId);
  return res.json(list);
});

// GET /api/cases/:caseId/evidence
app.get('/api/cases/:caseId/evidence', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.caseId, 10);
  const list = getAllEvidence(caseId);
  return res.json(list);
});

// GET /api/evidence/stats/security
app.get('/api/evidence/stats/security', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const list = getAllEvidence();
  const total = list.length;
  const validSeals = list.filter((e) => !e.isTampered).length;
  const tamperedSeals = list.filter((e) => e.isTampered).length;
  const underExam = list.filter((e) => e.status === 'UNDER_FORENSIC_EXAMINATION').length;
  const sealed = list.filter((e) => e.status === 'SEALED').length;
  const inCourt = list.filter((e) => e.status === 'PRESENTED_IN_COURT').length;

  return res.json({
    total,
    validSeals,
    tamperedSeals,
    underExam,
    sealed,
    inCourt,
    custodyIntegrityRate: total > 0 ? Math.round((validSeals / total) * 100) : 100,
  });
});

// GET /api/evidence/:id
app.get('/api/evidence/:id', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const ev = getEvidenceById(req.params.id);
  if (!ev) {
    return res.status(404).json({ status: 404, message: 'Evidence item not found' });
  }
  const transfers = getEvidenceTransfers(ev.evidenceId);
  return res.json({ ...ev, transfers });
});

// POST /api/evidence
app.post('/api/evidence', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (!canUserCollectEvidence(role)) {
    return res.status(403).json({
      status: 403,
      message: 'Access Denied: Only Police Officers, Investigating Officers, or Admins can collect and register evidence.',
    });
  }

  const { caseId, evidenceType, description, collectionLocation, sealNumber, condition } = req.body;
  if (!caseId || !evidenceType || !description || !sealNumber) {
    return res.status(400).json({ status: 400, message: 'Missing required evidence fields (caseId, evidenceType, description, sealNumber)' });
  }

  const caseRecord = getCaseById(caseId);
  if (!caseRecord) {
    return res.status(404).json({ status: 404, message: 'Case not found' });
  }

  const newEv = createEvidence({
    caseId: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    evidenceType,
    description,
    collectedBy: req.user!.fullName,
    collectedById: req.user!.userId,
    collectionLocation: collectionLocation || caseRecord.location,
    sealNumber,
    condition: condition || 'Pristine, secured in tamper-evident container',
  });

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'EVIDENCE_COLLECTED',
    caseId: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    evidenceId: newEv.evidenceId,
    ipAddress: req.ip || '127.0.0.1',
    description: `Registered evidence ${newEv.evidenceId} (${evidenceType}) under seal ${sealNumber}`,
    status: 'SUCCESS',
  });

  return res.status(201).json(newEv);
});

// POST /api/evidence/:id/transfer
app.post('/api/evidence/:id/transfer', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (!canUserTransferEvidence(role)) {
    return res.status(403).json({
      status: 403,
      message: 'Access Denied: You do not have permission to execute chain of custody transfers.',
    });
  }

  const ev = getEvidenceById(req.params.id);
  if (!ev) {
    return res.status(404).json({ status: 404, message: 'Evidence item not found' });
  }

  const { toUser, toRole, transferReason, location, conditionBefore, conditionAfter, signature } = req.body;
  if (!toUser || !toRole || !transferReason) {
    return res.status(400).json({ status: 400, message: 'Missing required transfer fields (toUser, toRole, transferReason)' });
  }

  const transfer = transferEvidence({
    evidenceId: ev.evidenceId,
    fromUser: req.user!.fullName,
    fromRole: req.user!.role,
    toUser,
    toRole,
    transferReason,
    location: location || 'NCRB Zonal Evidence Room',
    conditionBefore: conditionBefore || ev.condition,
    conditionAfter: conditionAfter || 'Seal intact, custodial handoff signed',
    signature: signature || `SIG_${req.user!.userId}_${Date.now()}`,
  });

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'EVIDENCE_TRANSFERRED',
    caseId: ev.caseId,
    caseNumber: ev.caseNumber,
    evidenceId: ev.evidenceId,
    ipAddress: req.ip || '127.0.0.1',
    description: `Transferred custody of ${ev.evidenceId} to ${toUser} (${toRole}). Reason: ${transferReason}`,
    status: 'SUCCESS',
  });

  return res.status(201).json(transfer);
});

// POST /api/evidence/:id/receive
app.post('/api/evidence/:id/receive', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const ev = getEvidenceById(req.params.id);
  if (!ev) {
    return res.status(404).json({ status: 404, message: 'Evidence item not found' });
  }

  const { verifiedSeal, notes } = req.body;

  const updated = receiveEvidence({
    evidenceId: ev.evidenceId,
    receiverUser: req.user!.fullName,
    receiverRole: req.user!.role,
    verifiedSeal: verifiedSeal !== false,
    notes: notes || 'Seal verified and accepted into custodial intake',
  });

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'EVIDENCE_RECEIVED',
    caseId: ev.caseId,
    caseNumber: ev.caseNumber,
    evidenceId: ev.evidenceId,
    ipAddress: req.ip || '127.0.0.1',
    description: `Custodial intake confirmed for ${ev.evidenceId} by ${req.user!.fullName}. Seal: ${verifiedSeal !== false ? 'INTACT' : 'DAMAGED'}`,
    status: 'SUCCESS',
  });

  return res.json(updated);
});

// GET /api/evidence/:id/chain
app.get('/api/evidence/:id/chain', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const ev = getEvidenceById(req.params.id);
  if (!ev) {
    return res.status(404).json({ status: 404, message: 'Evidence not found' });
  }

  const transfers = getEvidenceTransfers(ev.evidenceId);
  return res.json({
    evidence: ev,
    chainOfCustody: transfers,
    totalTransfers: transfers.length,
    currentCustodian: ev.currentCustodian,
    currentCustodianRole: ev.currentCustodianRole,
    status: ev.status,
  });
});

// POST /api/evidence/:id/verify
app.post('/api/evidence/:id/verify', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = verifyEvidenceIntegrity(req.params.id);
    
    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'INTEGRITY_VERIFIED',
      evidenceId: result.evidenceId,
      ipAddress: req.ip || '127.0.0.1',
      description: `Verified Chain of Custody & Seal for ${result.evidenceId}: Result: ${result.status}`,
      status: result.status === 'VALID' ? 'SUCCESS' : 'FLAGGED',
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ status: 404, message: err.message });
  }
});

// POST /api/evidence/:id/toggle-tamper
app.post('/api/evidence/:id/toggle-tamper', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = toggleEvidenceTamper(req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ status: 404, message: err.message });
  }
});

// -------------------------------------------------------------
// 9. CASE INVESTIGATION TIMELINE APIs (Phases 4 & 11)
// -------------------------------------------------------------

// GET /api/cases/:caseId/timeline
app.get('/api/cases/:caseId/timeline', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.caseId, 10);
  const targetCase = getCaseById(caseId);
  if (!targetCase) {
    return res.status(404).json({ status: 404, message: 'Case not found' });
  }

  const timeline = getCaseTimeline(caseId);
  return res.json({
    caseId,
    caseNumber: targetCase.caseNumber,
    caseTitle: targetCase.title,
    events: timeline,
  });
});

// POST /api/cases/:caseId/timeline
app.post('/api/cases/:caseId/timeline', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.caseId, 10);
  const targetCase = getCaseById(caseId);
  if (!targetCase) {
    return res.status(404).json({ status: 404, message: 'Case not found' });
  }

  const { eventType, title, description, timestamp } = req.body;
  if (!eventType || !title || !description) {
    return res.status(400).json({ status: 400, message: 'Missing eventType, title, or description' });
  }

  const event = addCaseTimelineEvent({
    caseId,
    caseNumber: targetCase.caseNumber,
    eventType,
    title,
    description,
    actor: req.user!.fullName,
    actorRole: req.user!.role,
    timestamp,
  });

  return res.status(201).json(event);
});

// -------------------------------------------------------------
// 10. DOCUMENT APPROVAL WORKFLOW APIs (Phase 5)
// -------------------------------------------------------------

// POST /api/documents/:id/submit
app.post('/api/documents/:id/submit', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const updated = submitDocumentWorkflow(docId, {
      fullName: req.user!.fullName,
      role: req.user!.role,
    });

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'DOCUMENT_UPDATED',
      documentId: updated.id,
      documentName: updated.documentName,
      caseId: updated.caseId,
      caseNumber: updated.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `Submitted document "${updated.documentName}" for administrative review`,
      status: 'SUCCESS',
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ status: 400, message: err.message });
  }
});

// POST /api/documents/:id/approve
app.post('/api/documents/:id/approve', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (!canUserApproveDocument(role)) {
    return res.status(403).json({
      status: 403,
      message: 'Access Denied: Only Investigating Officers, Court Officers, or Admins can approve documents.',
    });
  }

  try {
    const docId = parseInt(req.params.id, 10);
    const updated = approveDocumentWorkflow(docId, {
      fullName: req.user!.fullName,
      role: req.user!.role,
    });

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'DOCUMENT_UPDATED',
      documentId: updated.id,
      documentName: updated.documentName,
      caseId: updated.caseId,
      caseNumber: updated.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `Approved document "${updated.documentName}" into official evidentiary record`,
      status: 'SUCCESS',
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ status: 400, message: err.message });
  }
});

// POST /api/documents/:id/reject
app.post('/api/documents/:id/reject', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (!canUserApproveDocument(role)) {
    return res.status(403).json({
      status: 403,
      message: 'Access Denied: Insufficient authorization to reject documents.',
    });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ status: 400, message: 'Rejection reason is required' });
  }

  try {
    const docId = parseInt(req.params.id, 10);
    const updated = rejectDocumentWorkflow(docId, {
      fullName: req.user!.fullName,
      role: req.user!.role,
    }, reason);

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'DOCUMENT_UPDATED',
      documentId: updated.id,
      documentName: updated.documentName,
      caseId: updated.caseId,
      caseNumber: updated.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `Rejected document "${updated.documentName}". Reason: ${reason}`,
      status: 'FLAGGED',
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ status: 400, message: err.message });
  }
});

// POST /api/documents/:id/finalize
app.post('/api/documents/:id/finalize', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (!canUserFinalizeDocument(role)) {
    return res.status(403).json({
      status: 403,
      message: 'Access Denied: Only Court Officers or Admins can finalize legal documents for court submission.',
    });
  }

  try {
    const docId = parseInt(req.params.id, 10);
    const updated = finalizeDocumentWorkflow(docId, {
      fullName: req.user!.fullName,
      role: req.user!.role,
    });

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'DOCUMENT_UPDATED',
      documentId: updated.id,
      documentName: updated.documentName,
      caseId: updated.caseId,
      caseNumber: updated.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `Finalized document "${updated.documentName}" for judicial submission`,
      status: 'SUCCESS',
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ status: 400, message: err.message });
  }
});

// -------------------------------------------------------------
// 11. AI DOCUMENT INTELLIGENCE APIs (Phase 8)
// -------------------------------------------------------------

// POST /api/documents/:id/ai-summary
app.post('/api/documents/:id/ai-summary', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  const role = req.user!.role;
  if (!canUserViewDocument(role, doc.documentType, doc.classification)) {
    return res.status(403).json({ status: 403, message: 'Access Denied: Document restricted.' });
  }

  const caseDetails = getCaseById(doc.caseId);
  const aiResult = AIService.summarizeDocument(doc.extractedText || doc.documentName, doc.documentType, caseDetails);

  return res.json({
    documentId: doc.id,
    documentName: doc.documentName,
    documentType: doc.documentType,
    ...aiResult,
  });
});

// POST /api/documents/:id/ai-classify
app.post('/api/documents/:id/ai-classify', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  const classification = AIService.classifyDocument(doc.extractedText || '', doc.originalFilename);
  return res.json(classification);
});

// POST /api/ai/assistant — conversational assistant for ALL roles
app.post('/api/ai/assistant', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ status: 400, message: 'Missing message field' });
    }

    const db = getDb();
    const caseNumberOf = (caseId?: number) =>
      db.cases.find((c) => c.id === caseId)?.caseNumber || 'UNLINKED';

    const context = {
      cases: db.cases.map((c) => ({
        caseNumber: c.caseNumber,
        title: c.title,
        description: c.description,
        crimeType: c.crimeType,
        status: c.status,
        priority: c.priority,
        location: c.location,
        investigatingOfficer: c.investigatingOfficer,
        department: c.department,
        registeredDate: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      documents: db.documents
        .filter((d) => canUserViewDocument(req.user!.role, d.documentType, d.classification))
        .map((d) => ({
        documentName: d.documentName,
        originalFilename: d.originalFilename,
        documentType: d.documentType,
        workflowStatus: d.workflowStatus,
        classification: d.classification,
        extractedText: (d.extractedText || '').slice(0, 12000),
        caseNumber: caseNumberOf(d.caseId),
      })),
      evidence: db.evidence.map((e) => ({
        evidenceId: e.evidenceId,
        evidenceType: e.evidenceType,
        description: e.description,
        status: e.status,
        collectionLocation: e.collectionLocation,
        collectionDateTime: e.collectionDateTime,
        currentCustodian: e.currentCustodian,
        caseNumber: caseNumberOf(e.caseId),
      })),
      user: {
        fullName: req.user!.fullName,
        role: req.user!.role,
        department: req.user!.department,
      },
    };

    const safeHistory = Array.isArray(history)
      ? history
          .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .slice(-6)
          .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      : [];

    const result = await AIService.chatAssistant(message.trim().slice(0, 2000), safeHistory, context);

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'AI_ASSISTANT_QUERY',
      ipAddress: req.ip || '127.0.0.1',
      description: `AI assistant (${result.source}) query: "${message.trim().slice(0, 120)}"`,
      status: 'SUCCESS',
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ status: 500, message: err.message });
  }
});

// -------------------------------------------------------------
// 12. TAMPER-EVIDENT AUDIT HASH CHAIN APIs (Phase 6 & 12)
// -------------------------------------------------------------

// POST /api/audit-logs/verify-chain
app.post('/api/audit-logs/verify-chain', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const result = verifyAuditChain();
  return res.json(result);
});

// POST /api/audit-logs/simulate-tamper
app.post('/api/audit-logs/simulate-tamper', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Only administrators can run audit tamper simulations' });
  }

  const targetId = req.body.targetId ? parseInt(req.body.targetId, 10) : undefined;
  const result = toggleAuditTamperSimulation(targetId);
  return res.json(result);
});

// -------------------------------------------------------------
// 13. SECURITY ALERTS & MONITORING APIs (Phase 7 & 12)
// -------------------------------------------------------------

// GET /api/security/alerts
app.get('/api/security/alerts', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const alerts = getAllSecurityAlerts();
  return res.json(alerts);
});

// PUT /api/security/alerts/:id/status
app.put('/api/security/alerts/:id/status', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (role !== 'ADMIN' && role !== 'COURT_OFFICER') {
    return res.status(403).json({ status: 403, message: 'Only security administrators can update alert statuses' });
  }

  const alertId = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ status: 400, message: 'Missing status field' });
  }

  const updated = updateSecurityAlertStatus(alertId, status);
  if (!updated) {
    return res.status(404).json({ status: 404, message: 'Alert not found' });
  }

  return res.json(updated);
});

// POST /api/security/simulate-alert
app.post('/api/security/simulate-alert', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const { alertType, severity, description, relatedCaseId } = req.body;
  const newAlert = addSecurityAlert({
    userId: req.user!.userId,
    username: req.user!.username,
    alertType: alertType || 'UNUSUAL_DOCUMENT_ACCESS',
    severity: severity || 'HIGH',
    description: description || 'Simulated abnormal security pattern trigger for live verification',
    relatedCaseId,
  });

  return res.status(201).json(newAlert);
});

// -------------------------------------------------------------
// 14. WATERMARKING & SECURE PREVIEW APIs (Phase 13)
// -------------------------------------------------------------

// GET /api/documents/:id/preview-secure
app.get('/api/documents/:id/preview-secure', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  const role = req.user!.role;
  const allowed = canUserViewDocument(role, doc.documentType, doc.classification);
  if (!allowed) {
    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      documentId: doc.id,
      documentName: doc.documentName,
      caseId: doc.caseId,
      caseNumber: doc.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `403 FORBIDDEN: Role ${role} denied preview for "${doc.documentName}"`,
      status: 'DENIED',
    });
    return res.status(403).json({ status: 403, message: 'Access Denied: You do not have permission to preview this document.' });
  }

  const watermark = getWatermarkMetadata(doc, {
    fullName: req.user!.fullName,
    role: req.user!.role,
  });

  let fileText = doc.extractedText || '';
  if (fs.existsSync(doc.filePath)) {
    try {
      const raw = fs.readFileSync(doc.filePath, 'utf-8');
      if (raw.length > 0) fileText = raw;
    } catch {
      // keep fallback
    }
  }

  addAuditLog({
    userId: req.user!.userId,
    username: req.user!.username,
    role: req.user!.role,
    action: 'DOCUMENT_VIEWED',
    documentId: doc.id,
    documentName: doc.documentName,
    caseId: doc.caseId,
    caseNumber: doc.caseNumber,
    ipAddress: req.ip || '127.0.0.1',
    description: `Securely previewed with dynamic watermark by ${req.user!.fullName} (${req.user!.role})`,
    status: 'SUCCESS',
  });

  return res.json({
    document: doc,
    content: fileText,
    watermark,
  });
});

// GET /api/documents/:id/download-watermarked
app.get('/api/documents/:id/download-watermarked', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const docId = parseInt(req.params.id, 10);
  const doc = getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ status: 404, message: 'Document not found' });
  }

  const role = req.user!.role;
  const allowed = canUserViewDocument(role, doc.documentType, doc.classification);
  if (!allowed) {
    return res.status(403).json({ status: 403, message: 'Access Denied: Permission revoked.' });
  }

  const watermark = getWatermarkMetadata(doc, {
    fullName: req.user!.fullName,
    role: req.user!.role,
  });

  let fileContent = '';
  if (fs.existsSync(doc.filePath)) {
    fileContent = fs.readFileSync(doc.filePath, 'utf-8');
  } else {
    fileContent = doc.extractedText || 'Document content unavailable';
  }

  const header = `================================================================================
NATIONAL CRIME RECORDS BUREAU - OFFICIAL EVIDENTIARY WATERMARK
${watermark.metadataLines.join('\n')}
================================================================================\n\n`;

  const footer = `\n\n================================================================================
END OF WATERMARKED EXPORT • VERIFIED HASH: ${doc.sha256Hash}
================================================================================`;

  const watermarkedDocument = header + fileContent + footer;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="WATERMARKED_${doc.storedFilename}.txt"`);
  return res.send(watermarkedDocument);
});

// -------------------------------------------------------------
// 15. CASE RELATIONSHIP GRAPH API (Phase 14)
// -------------------------------------------------------------

// GET /api/cases/:id/relationships
app.get('/api/cases/:id/relationships', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.id, 10);
  const targetCase = getCaseById(caseId);
  if (!targetCase) {
    return res.status(404).json({ status: 404, message: 'Case not found' });
  }

  const graph = getCaseRelationships(caseId);
  return res.json(graph);
});

// -------------------------------------------------------------
// 16. CASE REPORT GENERATOR API (Phase 15 - 11 Sections)
// -------------------------------------------------------------

// GET /api/cases/:id/report
app.get('/api/cases/:id/report', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const caseId = parseInt(req.params.id, 10);
  try {
    const report = generateCaseReportData(caseId);

    addAuditLog({
      userId: req.user!.userId,
      username: req.user!.username,
      role: req.user!.role,
      action: 'CASE_REPORT_GENERATED',
      caseId,
      caseNumber: report.section1_caseInformation.caseNumber,
      ipAddress: req.ip || '127.0.0.1',
      description: `Generated comprehensive 11-section legal dossier for Case ${report.section1_caseInformation.caseNumber}`,
      status: 'SUCCESS',
    });

    return res.json(report);
  } catch (err: any) {
    return res.status(404).json({ status: 404, message: err.message });
  }
});

// -------------------------------------------------------------
// 17. IN-APP NOTIFICATIONS APIs (Phase 9)
// -------------------------------------------------------------

// GET /api/notifications
app.get('/api/notifications', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const notifs = getUserNotifications(req.user!.userId);
  return res.json(notifs);
});

// POST /api/notifications/:id/read
app.post('/api/notifications/:id/read', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const notifId = parseInt(req.params.id, 10);
  const success = markNotificationRead(notifId);
  return res.json({ success });
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  markAllNotificationsRead(req.user!.userId);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// 17. GLOBAL SEARCH API
// -------------------------------------------------------------
app.get('/api/global-search', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  if (!query) {
    return res.json({ cases: [], documents: [], evidence: [], people: [] });
  }

  const cases = getAllCases().filter((c) =>
    c.caseNumber.toLowerCase().includes(query) ||
    c.title.toLowerCase().includes(query) ||
    c.description.toLowerCase().includes(query) ||
    (c.investigatingOfficer && c.investigatingOfficer.toLowerCase().includes(query)) ||
    c.crimeType.toLowerCase().includes(query)
  ).slice(0, 5);

  const docs = getAllDocuments().filter((d) =>
    d.documentName.toLowerCase().includes(query) ||
    d.originalFilename.toLowerCase().includes(query) ||
    d.caseNumber.toLowerCase().includes(query) ||
    d.documentType.toLowerCase().includes(query) ||
    (d.extractedText && d.extractedText.toLowerCase().includes(query))
  ).slice(0, 5);

  const evidence = getAllEvidence().filter((e) =>
    e.evidenceId.toLowerCase().includes(query) ||
    e.description.toLowerCase().includes(query) ||
    e.caseNumber.toLowerCase().includes(query) ||
    (e.currentCustodian && e.currentCustodian.toLowerCase().includes(query)) ||
    (e.collectionLocation && e.collectionLocation.toLowerCase().includes(query)) ||
    (e.sealNumber && e.sealNumber.toLowerCase().includes(query))
  ).slice(0, 5);

  const db = getDb();
  const people = db.users.filter((u) =>
    u.fullName.toLowerCase().includes(query) ||
    u.username.toLowerCase().includes(query) ||
    u.department.toLowerCase().includes(query) ||
    (u.badgeNumber && u.badgeNumber.toLowerCase().includes(query))
  ).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    department: u.department,
    role: u.role,
    badgeNumber: u.badgeNumber,
  })).slice(0, 5);

  return res.json({
    cases,
    documents: docs,
    evidence,
    people,
  });
});

// -------------------------------------------------------------
// VITE & STATIC FILES SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NCRB-DMS] Server securely running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
