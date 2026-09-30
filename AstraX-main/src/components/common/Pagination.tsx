import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(totalItems, currentPage * itemsPerPage);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        fontSize: '13px',
        color: '#64748b'
      }}
    >
      <div>
        Showing <strong style={{ color: '#0f172a' }}>{startIdx}</strong> to{' '}
        <strong style={{ color: '#0f172a' }}>{endIdx}</strong> of{' '}
        <strong style={{ color: '#0f172a' }}>{totalItems}</strong> records
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#1e293b',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={idx} style={{ padding: '0 6px', color: '#94a3b8' }}>
                ...
              </span>
            );
          }
          const isCurrent = p === currentPage;
          return (
            <button
              key={idx}
              onClick={() => onPageChange(p as number)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: isCurrent ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                background: isCurrent ? '#1d4ed8' : '#ffffff',
                color: isCurrent ? '#ffffff' : '#1e293b',
                fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
