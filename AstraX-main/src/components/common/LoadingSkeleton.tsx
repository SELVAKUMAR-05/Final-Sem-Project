import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ height: '48px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '56px',
            borderBottom: i < rows - 1 ? '1px solid #f1f5f9' : 'none',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '16px'
          }}
        >
          <div style={{ width: '20%', height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '35%', height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '15%', height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '15%', height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '15%', height: '14px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '16px', marginBottom: '24px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            height: '110px'
          }}
        >
          <div style={{ width: '40%', height: '12px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '25%', height: '28px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
    </div>
  );
};
