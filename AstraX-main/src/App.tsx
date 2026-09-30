import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './components/common/Toast.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { Login } from './pages/auth/Login.tsx';
import { Register } from './pages/auth/Register.tsx';
import { ForgotPassword } from './pages/auth/ForgotPassword.tsx';

// Dynamic Modern Pages
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { CasesPage } from './pages/cases/CasesPage.tsx';
import { CaseDetailPage } from './pages/cases/CaseDetailPage.tsx';
import { DocumentsPage } from './pages/documents/DocumentsPage.tsx';
import { DocumentDetailPage } from './pages/documents/DocumentDetailPage.tsx';
import { EvidencePage } from './pages/evidence/EvidencePage.tsx';
import { EvidenceDetailPage } from './pages/evidence/EvidenceDetailPage.tsx';
import { AuditLogsPage } from './pages/audit/AuditLogsPage.tsx';
import { SecurityPage } from './pages/security/SecurityPage.tsx';
import { NotificationsPage } from './pages/notifications/NotificationsPage.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';
import { SettingsPage } from './pages/settings/SettingsPage.tsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.tsx';

// Specialized Operational Views
import { EvidenceChainView } from './components/EvidenceChainView.tsx';
import { CaseTimelineView } from './components/CaseTimelineView.tsx';
import { RelationshipGraphView } from './components/RelationshipGraphView.tsx';
import { CaseReportView } from './components/CaseReportView.tsx';
import { IntegrityLab } from './components/IntegrityLab.tsx';
import { DigitalSignatureView } from './components/DigitalSignatureView.tsx';
import { SearchView } from './components/SearchView.tsx';
import { HackathonDemoGuide } from './components/HackathonDemoGuide.tsx';
import { DocumentUploadModal } from './components/DocumentUploadModal.tsx';
import { LegalDocument } from './types.ts';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const [targetIntegrityDoc, setTargetIntegrityDoc] = useState<LegalDocument | null>(null);
  const [targetEvidenceId, setTargetEvidenceId] = useState<string | undefined>(undefined);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  const handleGoToIntegrity = (doc: LegalDocument) => {
    setTargetIntegrityDoc(doc);
    navigate('/integrity-lab');
  };

  const handleSelectEvidenceForChain = (evId: string) => {
    setTargetEvidenceId(evId);
    navigate('/evidence-chain');
  };

  const handleNavigateTab = (tab: string) => {
    if (tab === 'upload') {
      setShowUploadModal(true);
    } else {
      navigate(`/${tab.replace(/_/g, '-')}`);
    }
  };

  return (
    <>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard & Operations Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Cases Registry & Detail Routes */}
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <CasesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:caseId"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <CaseDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Documents Registry & Detail Routes */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <DocumentsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:documentId"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <DocumentDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Evidence Registry & Detail Routes */}
        <Route
          path="/evidence"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <EvidencePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/evidence/:evidenceId"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <EvidenceDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Chain of Custody visualizer */}
        <Route
          path="/evidence-chain"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <EvidenceChainView initialEvidenceId={targetEvidenceId} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Timeline & Graph */}
        <Route
          path="/timeline"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <CaseTimelineView />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/graph"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <RelationshipGraphView />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Security & Audit Ledger */}
        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <SecurityPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <AuditLogsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Section 65B Reports & Digital Signatures */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <CaseReportView />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signatures"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <DigitalSignatureView />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Integrity Lab & Search */}
        <Route
          path="/integrity-lab"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <IntegrityLab initialDocument={targetIntegrityDoc} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <SearchView />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Notifications & Settings */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* User Administration & Profile */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <AdminUsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <AdminUsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Demo Guide */}
        <Route
          path="/guide"
          element={
            <ProtectedRoute>
              <AppLayout onOpenUploadModal={() => setShowUploadModal(true)}>
                <HackathonDemoGuide setActiveTab={handleNavigateTab} />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global Document Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            navigate('/documents');
          }}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
