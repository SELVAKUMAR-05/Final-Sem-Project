import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { LegalDocument } from '../types.ts';
import {
  Search,
  FileText,
  Filter,
  Sparkles,
  Download,
  Calendar,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { DocumentDetailModal } from './DocumentDetailModal.tsx';

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [crimeType, setCrimeType] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [results, setResults] = useState<LegalDocument[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSearching(true);
      setHasSearched(true);
      const res = await api.searchDocuments({
        query,
        caseNumber,
        documentType: documentType || undefined,
        crimeType,
        location,
      });
      setResults(res.results);
    } catch (err: any) {
      alert(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setCaseNumber('');
    setDocumentType('');
    setCrimeType('');
    setLocation('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="search-view" id="ncrb-search-view">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gov-navy-950)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={26} color="var(--gov-blue-600)" />
          Advanced Multi-Criteria &amp; OCR Full-Text Intelligence
        </h2>
        <p style={{ color: 'var(--gov-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
          Query across structured metadata and deep OCR extracted document content simultaneously
        </p>
      </div>

      {/* Search Form */}
      <div className="gov-card">
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#d97706" />
              Keyword / Deep OCR Search (Searches title, filename &amp; full OCR body):
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 'forensic analysis', 'jewelry', 'Section 161', 'knife', 'fingerprint', 'custody'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Case Number:</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CASE-2026-001"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Document Category:</label>
              <select
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="FIR">FIR</option>
                <option value="POLICE_REPORT">Police Report</option>
                <option value="INVESTIGATION_REPORT">Investigation Report</option>
                <option value="WITNESS_STATEMENT">Witness Statement</option>
                <option value="CHARGE_SHEET">Charge Sheet</option>
                <option value="COURT_FILING">Court Filing</option>
                <option value="EVIDENCE">Evidence Exhibit</option>
                <option value="FORENSIC_REPORT">CFSL Forensic Report</option>
                <option value="LEGAL_NOTICE">Legal Notice</option>
                <option value="JUDGMENT">Judgment</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Crime Type:</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cyber, Fraud, Burglary"
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Location / Jurisdiction:</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chennai, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn-gov btn-gov-blue" disabled={isSearching}>
              <Search size={16} /> {isSearching ? 'Querying Index...' : 'Execute Intelligent Search'}
            </button>
            <button type="button" className="btn-gov btn-gov-outline" onClick={handleClear}>
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--gov-navy-950)' }}>
              Search Results ({results.length} Matches Found)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
              Searched across OCR textual corpus &amp; metadata
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((doc) => (
              <div
                key={doc.id}
                className="gov-card"
                style={{ marginBottom: 0, padding: '18px 20px', cursor: 'pointer' }}
                onClick={() => setSelectedDoc(doc)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={22} color="var(--gov-blue-600)" />
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--gov-navy-950)' }}>
                        {doc.documentName}
                      </span>
                      <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Case: {doc.caseNumber} &bull; Type: {doc.documentType} &bull; Classification: {doc.classification}
                      </div>
                    </div>
                  </div>

                  <span className="badge-status info">v{doc.version}</span>
                </div>

                {/* OCR snippet highlight */}
                {doc.extractedText && (
                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', color: '#334155', border: '1px solid #e2e8f0', marginTop: '8px', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: 'var(--gov-blue-700)' }}>OCR Match Snippet: </span>
                    {doc.extractedText.slice(0, 220)}...
                  </div>
                )}
              </div>
            ))}

            {results.length === 0 && (
              <div className="gov-card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No documents matched the query. Try adjusting your OCR keyword or clearing location filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
};
