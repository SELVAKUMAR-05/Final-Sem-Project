import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './components/common/Toast.tsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.tsx';
import { LegalDocument } from './types.ts';

const AppLayout = lazy(() => import('./components/layout/AppLayout.tsx').then((module) => ({ default: module.AppLayout })));
const Login = lazy(() => import('./pages/auth/Login.tsx').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register.tsx').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.tsx').then((module) => ({ default: module.ForgotPassword })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.tsx').then((module) => ({ default: module.DashboardPage })));
const CasesPage = lazy(() => import('./pages/cases/CasesPage.tsx').then((module) => ({ default: module.CasesPage })));
const CaseDetailPage = lazy(() => import('./pages/cases/CaseDetailPage.tsx').then((module) => ({ default: module.CaseDetailPage })));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage.tsx').then((module) => ({ default: module.DocumentsPage })));
const DocumentDetailPage = lazy(() => import('./pages/documents/DocumentDetailPage.tsx').then((module) => ({ default: module.DocumentDetailPage })));
const EvidencePage = lazy(() => import('./pages/evidence/EvidencePage.tsx').then((module) => ({ default: module.EvidencePage })));
const EvidenceDetailPage = lazy(() => import('./pages/evidence/EvidenceDetailPage.tsx').then((module) => ({ default: module.EvidenceDetailPage })));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage.tsx').then((module) => ({ default: module.AuditLogsPage })));
const SecurityPage = lazy(() => import('./pages/security/SecurityPage.tsx').then((module) => ({ default: module.SecurityPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage.tsx').then((module) => ({ default: module.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage.tsx').then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage.tsx').then((module) => ({ default: module.SettingsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.tsx').then((module) => ({ default: module.AdminUsersPage })));
const EvidenceChainView = lazy(() => import('./components/EvidenceChainView.tsx').then((module) => ({ default: module.EvidenceChainView })));
const CaseTimelineView = lazy(() => import('./components/CaseTimelineView.tsx').then((module) => ({ default: module.CaseTimelineView })));
const RelationshipGraphView = lazy(() => import('./components/RelationshipGraphView.tsx').then((module) => ({ default: module.RelationshipGraphView })));
const CaseReportView = lazy(() => import('./components/CaseReportView.tsx').then((module) => ({ default: module.CaseReportView })));
const IntegrityLab = lazy(() => import('./components/IntegrityLab.tsx').then((module) => ({ default: module.IntegrityLab })));
const DigitalSignatureView = lazy(() => import('./components/DigitalSignatureView.tsx').then((module) => ({ default: module.DigitalSignatureView })));
const SearchView = lazy(() => import('./components/SearchView.tsx').then((module) => ({ default: module.SearchView })));
const HackathonDemoGuide = lazy(() => import('./components/HackathonDemoGuide.tsx').then((module) => ({ default: module.HackathonDemoGuide })));
const DocumentUploadModal = lazy(() => import('./components/DocumentUploadModal.tsx').then((module) => ({ default: module.DocumentUploadModal })));

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
      <Suspense fallback={<div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>Loading...</div>}>
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
            <ProtectedRoute allowedRoles={['ADMIN']}>
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
      </Suspense>
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
