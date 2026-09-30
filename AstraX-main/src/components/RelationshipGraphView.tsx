import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Case, CaseRelationshipGraphData } from '../types.ts';
import {
  Network,
  RefreshCw,
  Info,
  Package,
  FileText,
  User,
  MapPin,
  Building,
  Briefcase,
} from 'lucide-react';

export const RelationshipGraphView: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [graphData, setGraphData] = useState<CaseRelationshipGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCases().then((list) => {
      setCases(list);
      if (list.length > 0) setSelectedCaseId(list[0].id);
    });
  }, []);

  const loadGraph = async (caseId: number) => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await api.getCaseRelationships(caseId);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load relationship graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) loadGraph(selectedCaseId);
  }, [selectedCaseId]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CASE':
        return '#0b2545';
      case 'EVIDENCE':
        return '#7e22ce';
      case 'DOCUMENT':
        return '#1d4ed8';
      case 'PERSON':
        return '#15803d';
      case 'LOCATION':
        return '#b45309';
      case 'ORGANIZATION':
        return '#0e7490';
      default:
        return '#475569';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'CASE':
        return <Briefcase size={14} color="#ffffff" />;
      case 'EVIDENCE':
        return <Package size={14} color="#ffffff" />;
      case 'DOCUMENT':
        return <FileText size={14} color="#ffffff" />;
      case 'PERSON':
        return <User size={14} color="#ffffff" />;
      case 'LOCATION':
        return <MapPin size={14} color="#ffffff" />;
      default:
        return <Building size={14} color="#ffffff" />;
    }
  };

  // Node position calculation in a radial layout around center
  const getLayoutNodes = () => {
    if (!graphData) return [];
    const width = 640;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2;

    const caseNode = graphData.nodes.find((n) => n.type === 'CASE');
    const otherNodes = graphData.nodes.filter((n) => n.type !== 'CASE');

    const result: any[] = [];
    if (caseNode) {
      result.push({ ...caseNode, x: centerX, y: centerY });
    }

    const radius = 180;
    const count = otherNodes.length;
    otherNodes.forEach((node, idx) => {
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      result.push({ ...node, x, y });
    });

    return result;
  };

  const layoutNodes = getLayoutNodes();
  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));
  const graphEdges = graphData?.edges ?? graphData?.links ?? [];

  return (
    <div id="relationship-graph-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>
            <Network size={24} color="#1d4ed8" />
            Case Entity Relationship Graph
          </h1>
          <p>Interactive Topographic Mapping of Evidentiary Nodes, Suspects, Locations &amp; Documents</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Select Case:</span>
            <select
              className="form-select"
              style={{ width: '260px' }}
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(parseInt(e.target.value, 10))}
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => loadGraph(selectedCaseId)}>
            <RefreshCw size={14} />
            Refresh Graph
          </button>
        </div>
      </div>

      {/* Graph Area & Inspector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* SVG Canvas Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h2>
              <Network size={16} color="#1d4ed8" />
              Graph Topology ({graphData?.nodes.length || 0} Nodes &bull; {graphEdges.length} Links)
            </h2>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0b2545' }}></span> Case
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7e22ce' }}></span> Evidence
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1d4ed8' }}></span> Document
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#15803d' }}></span> Person
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#b45309' }}></span> Location
              </span>
            </div>
          </div>
          <div className="gov-card-body" style={{ padding: '10px', background: '#fafbfc', minHeight: '500px', display: 'flex', justifyContent: 'center' }}>
            <svg width="640" height="480" style={{ overflow: 'visible' }}>
              {/* Edges */}
              {graphEdges.map((edge, idx) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;

                return (
                  <g key={idx}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray={edge.label === 'RECOVERED_AT' ? '4 4' : undefined}
                    />
                    <text
                      x={midX}
                      y={midY - 4}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                      style={{ userSelect: 'none' }}
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {layoutNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const color = getNodeColor(node.type);
                const isCase = node.type === 'CASE';
                const nodeRadius = isCase ? 28 : 20;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: 'pointer' }}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <circle
                      r={nodeRadius}
                      fill={color}
                      stroke={isSelected ? '#f59e0b' : '#ffffff'}
                      strokeWidth={isSelected ? 4 : 2}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                    />
                    <foreignObject x={-10} y={-10} width={20} height={20} style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        {getNodeIcon(node.type)}
                      </div>
                    </foreignObject>
                    <text
                      y={nodeRadius + 14}
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      style={{ userSelect: 'none' }}
                    >
                      {node.label.length > 18 ? `${node.label.substring(0, 16)}...` : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3>
              <Info size={16} color="#1d4ed8" />
              Node Inspector
            </h3>
          </div>
          <div className="gov-card-body">
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span className="badge-pill" style={{ background: getNodeColor(selectedNode.type), color: '#ffffff' }}>
                    {selectedNode.type}
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0b2545', marginTop: '8px' }}>
                    {selectedNode.label}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    ID: {selectedNode.id}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Linked Attributes
                  </span>
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    {Object.entries(selectedNode.properties || {}).map(([k, v]: any) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
                        <strong style={{ color: '#475569' }}>{k}:</strong>
                        <span style={{ color: '#0b2545', maxWidth: '160px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Connected Relations ({graphEdges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length || 0})
                  </span>
                  <ul style={{ listStyle: 'none', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {graphEdges
                      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((e, idx) => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const otherNode = nodeMap.get(otherId);
                        return (
                          <li key={idx} style={{ fontSize: '12px', color: '#334155', background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px' }}>
                            <strong style={{ color: '#1d4ed8' }}>{e.label}:</strong> {otherNode?.label || otherId}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                Click any node in the graph to view properties.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
