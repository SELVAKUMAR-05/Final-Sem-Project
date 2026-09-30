import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Case, DocumentType } from '../types.ts';
import {
  UploadCloud,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedCaseId?: number;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  onClose,
  onSuccess,
  preselectedCaseId,
}) => {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | ''>(preselectedCaseId || '');
  const [documentName, setDocumentName] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>('FIR');
  const [classification, setClassification] = useState<'RESTRICTED' | 'CONFIDENTIAL' | 'PUBLIC_RECORD'>('RESTRICTED');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        const caseList = await api.getCases();
        setCases(caseList);
        if (!selectedCaseId && caseList.length > 0) {
          setSelectedCaseId(caseList[0].id);
        }
      } catch (e) {
        console.error('Failed to load cases in upload modal', e);
      }
    }
    loadCases();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg(`Invalid file type "${fileName}". Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT.`);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 25MB security limit defined in application.properties.');
      return;
    }

    setFile(selectedFile);
    if (!documentName) {
      // Auto populate document name from filename
      setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCaseId || !documentName) {
      setErrorMsg('Please select a file, target case, and document title.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('caseId', selectedCaseId.toString());
      formData.append('documentName', documentName);
      formData.append('documentType', documentType);
      formData.append('classification', classification);
      formData.append('file', file);

      const createdDoc = await api.uploadDocument(formData);
      setSuccessMsg(`Document successfully uploaded and hashed! SHA-256: ${createdDoc.sha256Hash.slice(0, 16)}...`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Check role permissions or file size.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 120 }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={22} color="var(--gov-blue-600)" />
            <span className="modal-title">Secure Legal Document Ingress (DEMO 3)</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="gov-alert danger">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="gov-alert success">
                <CheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Target Case Selection */}
            <div className="form-group">
              <label className="form-label">Associate with Investigation Case:</label>
              <select
                className="form-select"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                required
              >
                <option value="">-- Select Target Case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - {c.title} ({c.crimeType})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Title */}
            <div className="form-group">
              <label className="form-label">Official Document Title:</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. First Information Report (FIR-45/2026)"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
              />
            </div>

            {/* Document Category & Classification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Document Category:</label>
                <select
                  className="form-select"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                >
                  <option value="FIR">FIR (First Information Report)</option>
                  <option value="POLICE_REPORT">Police Report</option>
                  <option value="INVESTIGATION_REPORT">Investigation Report</option>
                  <option value="WITNESS_STATEMENT">Witness Statement (Sec 161 CrPC)</option>
                  <option value="CHARGE_SHEET">Charge Sheet (Sec 173 CrPC)</option>
                  <option value="COURT_FILING">Court Filing / Motion</option>
                  <option value="EVIDENCE">Evidence Exhibit</option>
                  <option value="FORENSIC_REPORT">CFSL Forensic Lab Report</option>
                  <option value="LEGAL_NOTICE">Legal Notice</option>
                  <option value="JUDGMENT">Court Judgment / Order</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Security Classification:</label>
                <select
                  className="form-select"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as any)}
                >
                  <option value="RESTRICTED">Restricted (Police &amp; IO)</option>
                  <option value="CONFIDENTIAL">Confidential (CFSL &amp; Classified)</option>
                  <option value="PUBLIC_RECORD">Public Record (Disclosed Court File)</option>
                </select>
              </div>
            </div>

            {/* Drag and drop file zone */}
            <div className="form-group">
              <label className="form-label">Select Evidence / Document File:</label>
              <div
                className={`file-dropzone ${isDragging ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('hidden-file-input')?.click()}
              >
                <input
                  id="hidden-file-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                />
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <FileText size={32} color="var(--gov-blue-600)" />
                    <div style={{ fontWeight: 700, color: 'var(--gov-navy-950)' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
                      {(file.size / 1024).toFixed(2)} KB &bull; Ready for SHA-256 Hashing &amp; AES Encryption
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={32} color="#94a3b8" />
                    <div style={{ fontWeight: 600, color: 'var(--gov-navy-950)' }}>
                      Drag &amp; drop document file here, or browse
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
                      Supported: PDF, DOC, DOCX, JPG, PNG, TXT (Max 25MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--gov-text-muted)' }}>
              <Lock size={14} color="#059669" />
              <span>
                System automatically executes: <strong>Sanitized filename generation (DOC-xxxx)</strong>, <strong>SHA-256 digest computation</strong>, <strong>AES-256-CBC encryption</strong>, and <strong>OCR metadata parsing</strong>.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-gov btn-gov-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gov btn-gov-blue"
              disabled={isUploading || !file}
            >
              {isUploading ? 'Hashing & Encrypting...' : 'Upload & Hash Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
