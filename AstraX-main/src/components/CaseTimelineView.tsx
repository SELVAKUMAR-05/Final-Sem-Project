import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Case, CaseTimelineEvent } from '../types.ts';
import {
  GitCommit,
  Plus,
  Filter,
  User,
  Clock,
  Calendar,
  FileText,
  Shield,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export const CaseTimelineView: React.FC = () => {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [timelineData, setTimelineData] = useState<{
    caseId: number;
    caseNumber: string;
    caseTitle: string;
    events: CaseTimelineEvent[];
  } | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventType: 'WITNESS_STATEMENT_RECORDED',
    title: '',
    description: '',
  });

  useEffect(() => {
    api.getCases().then((list) => {
      setCases(list);
      if (list.length > 0) {
        setSelectedCaseId(list[0].id);
      }
    });
  }, []);

  const loadTimeline = async (caseId: number) => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await api.getCaseTimeline(caseId);
      setTimelineData(data);
    } catch (err) {
      console.error('Failed to load timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadTimeline(selectedCaseId);
    }
  }, [selectedCaseId]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description) return;

    try {
      await api.addCaseTimelineEvent(selectedCaseId, newEvent);
      setShowAddModal(false);
      setNewEvent({
        eventType: 'WITNESS_STATEMENT_RECORDED',
        title: '',
        description: '',
      });
      loadTimeline(selectedCaseId);
    } catch (err: any) {
      alert(err.message || 'Failed to add timeline event');
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'CASE_REGISTERED':
      case 'FIR_FILED':
        return 'valid';
      case 'EVIDENCE_RECOVERED':
      case 'EVIDENCE_TRANSFERRED':
        return 'encrypted';
      case 'FORENSIC_REPORT_ATTACHED':
        return 'signed';
      case 'DOCUMENT_APPROVED':
      case 'CASE_FINALIZED':
        return 'valid';
      default:
        return 'review';
    }
  };

  const filteredEvents = timelineData
    ? timelineData.events.filter((ev) => (filterType === 'ALL' ? true : ev.eventType === filterType))
    : [];

  return (
    <div id="case-timeline-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <GitCommit size={24} color="#1d4ed8" />
            Case Investigation Timeline
          </h1>
          <p>Chronological Evidentiary Milestones &amp; Investigation Log from FIR to Trial</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Case:</span>
            <select
              className="form-select"
              style={{ width: '260px' }}
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(parseInt(e.target.value, 10))}
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.substring(0, 26)}...
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => loadTimeline(selectedCaseId)}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            Add Investigation Event
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '24px' }}>
        <div className="gov-card-body" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Filter size={15} color="#64748b" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Filter Event Milestone:</span>
          {['ALL', 'CASE_REGISTERED', 'FIR_FILED', 'EVIDENCE_RECOVERED', 'FORENSIC_REPORT_ATTACHED', 'DOCUMENT_APPROVED'].map((ft) => (
            <button
              key={ft}
              className={`btn btn-sm ${filterType === ft ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(ft)}
            >
              {ft === 'ALL' ? 'All Milestones' : ft.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      {timelineData && (
        <div className="gov-card">
          <div className="gov-card-header">
            <h2>
              <Calendar size={18} color="#1d4ed8" />
              Investigation Record: {timelineData.caseNumber} &bull; {timelineData.caseTitle}
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {filteredEvents.length} Recorded Events
            </span>
          </div>
          <div className="gov-card-body">
            {filteredEvents.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                No events found matching the selected filter.
              </div>
            ) : (
              <div className="timeline-container">
                {filteredEvents.map((ev, idx) => (
                  <div key={ev.id} className="timeline-event-item">
                    <div className="timeline-node-icon">
                      {idx + 1}
                    </div>
                    <div className="timeline-event-card">
                      <div className="timeline-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ color: '#0b2545' }}>{ev.title}</h4>
                          <span className={`badge-status ${getEventBadgeClass(ev.eventType)}`} style={{ fontSize: '10px' }}>
                            {ev.eventType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="timeline-time">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="timeline-actor">
                        <User size={13} />
                        Officer: {ev.actor} ({ev.actorRole.replace('_', ' ')})
                      </div>

                      <p className="timeline-desc">
                        {ev.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Timeline Event Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>
                <Plus size={18} />
                Record Case Investigation Milestone
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddEvent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Milestone Type *</label>
                  <select
                    className="form-select"
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  >
                    <option value="WITNESS_STATEMENT_RECORDED">Witness Statement Recorded</option>
                    <option value="SUSPECT_INTERROGATED">Suspect Interrogated under Section 161 CrPC</option>
                    <option value="FORENSIC_REPORT_ATTACHED">Forensic Analysis Report Attached</option>
                    <option value="SEARCH_WARRANT_EXECUTED">Search Warrant Executed</option>
                    <option value="CHARGESHEET_DRAFTED">Chargesheet Drafted</option>
                    <option value="COURT_SUMMONS_ISSUED">Court Summons Issued</option>
                    <option value="INVESTIGATION_NOTE">General Investigation Note</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Headline *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Accused admitted to possession of encrypted drive"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Chronology Note *</label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="Provide official investigation details, names, locations, and references..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Commit to Case Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
