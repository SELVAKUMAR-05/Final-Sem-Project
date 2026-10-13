import { 
  User, 
  Case, 
  LegalDocument, 
  DocumentVersion, 
  AuditLog, 
  IntegrityCheckResult, 
  DashboardStats,
  Evidence,
  EvidenceTransfer,
  CaseTimelineEvent,
  SecurityAlert,
  Notification,
  CaseRelationshipGraphData,
  AuditVerificationResult
} from '../types.ts';

const TOKEN_KEY = 'ncrb_dms_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, set Content-Type JSON
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const error: any = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; userId: number; username: string; role: any; fullName: string; department: string }> {
    const res = await request<{ token: string; userId: number; username: string; role: any; fullName: string; department: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    setStoredToken(res.token);
    return res;
  },

  async register(userData: {
    fullName: string;
    username: string;
    email: string;
    department: string;
    role: string;
    password: string;
  }): Promise<{ status: number; message: string; user: User }> {
    return request<{ status: number; message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async forgotPassword(email: string): Promise<{ status: number; message: string }> {
    return request<{ status: number; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ status: number; message: string }> {
    return request<{ status: number; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async globalSearch(q: string): Promise<{
    cases: Case[];
    documents: LegalDocument[];
    evidence: Evidence[];
    people: Array<{ id: number; fullName: string; username: string; department: string; role: string; badgeNumber?: string }>;
  }> {
    return request(`/api/global-search?q=${encodeURIComponent(q)}`);
  },

  async getCurrentUser(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request<User[]>('/api/users');
  },

  async createUser(userData: any): Promise<User> {
    return request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async toggleUserActive(userId: number, active: boolean): Promise<User> {
    return request<User>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  },

  // Cases
  async getCases(): Promise<Case[]> {
    return request<Case[]>('/api/cases');
  },

  async getCaseById(id: number): Promise<{ case: Case; documents: LegalDocument[] }> {
    return request<{ case: Case; documents: LegalDocument[] }>(`/api/cases/${id}`);
  },

  async createCase(caseData: Partial<Case>): Promise<Case> {
    return request<Case>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  async updateCase(id: number, data: Partial<Case>): Promise<Case> {
    return request<Case>(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Documents
  async getDocuments(caseId?: number, type?: string): Promise<LegalDocument[]> {
    const params = new URLSearchParams();
    if (caseId) params.append('caseId', caseId.toString());
    if (type) params.append('type', type);
    return request<LegalDocument[]>(`/api/documents?${params.toString()}`);
  },

  async getDocumentById(id: number): Promise<LegalDocument> {
    return request<LegalDocument>(`/api/documents/${id}`);
  },

  async uploadDocument(formData: FormData): Promise<LegalDocument> {
    return request<LegalDocument>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadDocumentVersion(docId: number, formData: FormData): Promise<{ document: LegalDocument; newVersion: DocumentVersion }> {
    return request<{ document: LegalDocument; newVersion: DocumentVersion }>(`/api/documents/${docId}/upload-version`, {
      method: 'POST',
      body: formData,
    });
  },

  async getDocumentVersions(docId: number): Promise<DocumentVersion[]> {
    return request<DocumentVersion[]>(`/api/documents/${docId}/versions`);
  },

  async verifyDocumentIntegrity(docId: number): Promise<IntegrityCheckResult> {
    return request<IntegrityCheckResult>(`/api/documents/${docId}/verify`, {
      method: 'POST',
    });
  },

  async toggleTamperSimulation(docId: number): Promise<{ isTampered: boolean; message: string; document: LegalDocument }> {
    return request<{ isTampered: boolean; message: string; document: LegalDocument }>(`/api/documents/${docId}/tamper-toggle`, {
      method: 'POST',
    });
  },

  async signDocument(docId: number): Promise<{ message: string; signature: any; document: LegalDocument }> {
    return request<{ message: string; signature: any; document: LegalDocument }>(`/api/documents/${docId}/sign`, {
      method: 'POST',
    });
  },

  // Document Workflow
  async submitDocumentWorkflow(docId: number): Promise<LegalDocument> {
    return request<LegalDocument>(`/api/documents/${docId}/submit`, { method: 'POST' });
  },

  async approveDocumentWorkflow(docId: number): Promise<LegalDocument> {
    return request<LegalDocument>(`/api/documents/${docId}/approve`, { method: 'POST' });
  },

  async rejectDocumentWorkflow(docId: number, reason: string): Promise<LegalDocument> {
    return request<LegalDocument>(`/api/documents/${docId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async finalizeDocumentWorkflow(docId: number): Promise<LegalDocument> {
    return request<LegalDocument>(`/api/documents/${docId}/finalize`, { method: 'POST' });
  },

  // Document Preview with Watermark & RBAC
  async getSecureDocumentPreview(docId: number): Promise<{
    document: LegalDocument;
    content: string;
    watermark: { watermarkText: string; metadataLines: string[] };
  }> {
    return request(`/api/documents/${docId}/preview-secure`);
  },

  getDownloadUrl(docId: number): string {
    const token = getStoredToken();
    return `/api/documents/${docId}/download?token=${encodeURIComponent(token || '')}`;
  },

  getWatermarkedDownloadUrl(docId: number): string {
    const token = getStoredToken();
    return `/api/documents/${docId}/download-watermarked?token=${encodeURIComponent(token || '')}`;
  },

  // AI Document Intelligence
  async getAIDocumentSummary(docId: number): Promise<any> {
    return request(`/api/documents/${docId}/ai-summary`, { method: 'POST' });
  },

  async askAssistant(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{ reply: string; source: 'openrouter' | 'local' }> {
    return request('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  async classifyDocumentAI(docId: number): Promise<any> {
    return request(`/api/documents/${docId}/ai-classify`, { method: 'POST' });
  },

  // Evidence & Chain of Custody
  async getEvidence(caseId?: number): Promise<Evidence[]> {
    const params = new URLSearchParams();
    if (caseId) params.append('caseId', caseId.toString());
    return request<Evidence[]>(`/api/evidence?${params.toString()}`);
  },

  async getEvidenceById(id: number | string): Promise<Evidence & { transfers: EvidenceTransfer[] }> {
    return request<Evidence & { transfers: EvidenceTransfer[] }>(`/api/evidence/${id}`);
  },

  async getEvidenceSecurityStats(): Promise<{
    total: number;
    validSeals: number;
    tamperedSeals: number;
    underExam: number;
    sealed: number;
    inCourt: number;
    custodyIntegrityRate: number;
  }> {
    return request('/api/evidence/stats/security');
  },

  async createEvidence(data: {
    caseId: number;
    evidenceType: string;
    description: string;
    collectionLocation?: string;
    sealNumber: string;
    condition?: string;
  }): Promise<Evidence> {
    return request<Evidence>('/api/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async transferEvidence(evidenceId: string, data: {
    toUser: string;
    toRole: string;
    transferReason: string;
    location?: string;
    conditionBefore?: string;
    conditionAfter?: string;
    signature?: string;
  }): Promise<EvidenceTransfer> {
    return request<EvidenceTransfer>(`/api/evidence/${evidenceId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async receiveEvidence(evidenceId: string, data: {
    verifiedSeal: boolean;
    notes?: string;
  }): Promise<Evidence> {
    return request<Evidence>(`/api/evidence/${evidenceId}/receive`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getEvidenceChain(evidenceId: string): Promise<{
    evidence: Evidence;
    chainOfCustody: EvidenceTransfer[];
    totalTransfers: number;
    currentCustodian: string;
    currentCustodianRole: string;
    status: string;
  }> {
    return request(`/api/evidence/${evidenceId}/chain`);
  },

  async verifyEvidenceIntegrity(evidenceId: string): Promise<{
    evidenceId: string;
    status: 'VALID' | 'TAMPERED';
    storedHash: string;
    calculatedHash: string;
    message: string;
  }> {
    return request(`/api/evidence/${evidenceId}/verify`, { method: 'POST' });
  },

  async toggleEvidenceTamper(evidenceId: string): Promise<{ isTampered: boolean; message: string }> {
    return request(`/api/evidence/${evidenceId}/toggle-tamper`, { method: 'POST' });
  },

  // Case Investigation Timeline
  async getCaseTimeline(caseId: number): Promise<{
    caseId: number;
    caseNumber: string;
    caseTitle: string;
    events: CaseTimelineEvent[];
  }> {
    return request(`/api/cases/${caseId}/timeline`);
  },

  async addCaseTimelineEvent(caseId: number, data: {
    eventType: string;
    title: string;
    description: string;
    timestamp?: string;
  }): Promise<CaseTimelineEvent> {
    return request<CaseTimelineEvent>(`/api/cases/${caseId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Case Relationships Graph
  async getCaseRelationships(caseId: number): Promise<CaseRelationshipGraphData> {
    return request<CaseRelationshipGraphData>(`/api/cases/${caseId}/relationships`);
  },

  // Case Report Generator (11 Sections)
  async getCaseReport(caseId: number): Promise<any> {
    return request(`/api/cases/${caseId}/report`);
  },

  // Security Alerts
  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    return request<SecurityAlert[]>('/api/security/alerts');
  },

  async updateSecurityAlertStatus(id: number, status: string): Promise<SecurityAlert> {
    return request<SecurityAlert>(`/api/security/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async simulateSecurityAlert(data?: any): Promise<SecurityAlert> {
    return request<SecurityAlert>('/api/security/simulate-alert', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  // In-App Notifications
  async getNotifications(): Promise<Notification[]> {
    return request<Notification[]>('/api/notifications');
  },

  async markNotificationRead(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' });
  },

  // Chained Audit Logs & Integrity Verification
  async getAuditLogs(filter?: { action?: string; limit?: number }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filter?.action) params.append('action', filter.action);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    return request<AuditLog[]>(`/api/audit-logs?${params.toString()}`);
  },

  async verifyAuditChain(): Promise<AuditVerificationResult> {
    return request<AuditVerificationResult>('/api/audit-logs/verify-chain', { method: 'POST' });
  },

  async simulateAuditTamper(targetId?: number): Promise<{ isTampered: boolean; message: string }> {
    return request<{ isTampered: boolean; message: string }>('/api/audit-logs/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    });
  },

  // Search
  async searchDocuments(params: {
    query?: string;
    caseNumber?: string;
    documentType?: string;
    crimeType?: string;
    location?: string;
  }): Promise<{ totalCount: number; results: LegalDocument[] }> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.caseNumber) searchParams.append('caseNumber', params.caseNumber);
    if (params.documentType) searchParams.append('documentType', params.documentType);
    if (params.crimeType) searchParams.append('crimeType', params.crimeType);
    if (params.location) searchParams.append('location', params.location);

    return request<{ totalCount: number; results: LegalDocument[] }>(`/api/search/documents?${searchParams.toString()}`);
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/stats/dashboard');
  },
};
