// src/pages/PastPapersPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { searchPapers, getFilterOptions } from '../api/papersapi';

export default function PastPapersPage({ onOpenPaper }) {
  // Filters
  const [filters, setFilters] = useState({ board: '', classLevel: '', subject: '', year: '' });
  const [query, setQuery]     = useState('');
  const [options, setOptions] = useState({ boards: [], classes: [], subjects: [], years: [] });

  // Results
  const [papers, setPapers]       = useState([]);
  const [page, setPage]           = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // ── Load filter dropdown options on mount ──────────────────────
  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => {/* non-critical */});
  }, []);

  // ── Search function ────────────────────────────────────────────
  const runSearch = useCallback(async (pageNum = 0, append = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchPapers({ ...filters, q: query, page: pageNum, size: 24 });
      setPapers(prev => append ? [...prev, ...res.papers] : res.papers);
      setPage(res.page);
      setHasMore(res.hasMore);
      setTotal(res.totalElements);
    } catch (e) {
      setError('Failed to load papers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, query]);

  // ── Initial load + re-search when filters change ───────────────
  useEffect(() => {
    runSearch(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearchSubmit = () => runSearch(0, false);
  const loadMore = () => runSearch(page + 1, true);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ board: '', classLevel: '', subject: '', year: '' });
    setQuery('');
  };

  const hasActiveFilters = filters.board || filters.classLevel
    || filters.subject || filters.year || query;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Search bar */}
      <div style={s.searchRow}>
        <div style={s.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="#6b6b80" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search papers by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          {query && (
            <button style={s.searchClear} onClick={() => { setQuery(''); runSearch(0, false); }}>✕</button>
          )}
        </div>
        <button style={s.searchBtn} onClick={handleSearchSubmit}>Search</button>
      </div>

      {/* Filter dropdowns */}
      <div style={s.filterRow}>
        <FilterSelect label="Board"   value={filters.board}
                      options={options.boards}
                      onChange={(v) => updateFilter('board', v)} />
        <FilterSelect label="Class"   value={filters.classLevel}
                      options={options.classes} prefix="Class "
                      onChange={(v) => updateFilter('classLevel', v)} />
        <FilterSelect label="Subject" value={filters.subject}
                      options={options.subjects}
                      onChange={(v) => updateFilter('subject', v)} />
        <FilterSelect label="Year"    value={filters.year}
                      options={options.years}
                      onChange={(v) => updateFilter('year', v)} />
        {hasActiveFilters && (
          <button style={s.clearBtn} onClick={clearFilters}>Clear all</button>
        )}
      </div>

      {/* Result count */}
      {!loading && (
        <div style={s.resultCount}>
          {total > 0
            ? `${total} paper${total > 1 ? 's' : ''} found`
            : 'No papers found'}
        </div>
      )}

      {error && <div style={s.errorBanner}>⚠ {error}</div>}

      {/* Loading skeleton */}
      {loading && papers.length === 0 && (
        <div style={s.grid}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={s.skeleton} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && papers.length === 0 && !error && (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>📚</div>
          <div style={s.emptyTitle}>No papers match your filters</div>
          <div style={s.emptySub}>
            {hasActiveFilters
              ? 'Try adjusting or clearing your filters.'
              : 'The archive is being populated. Check back soon.'}
          </div>
          {hasActiveFilters && (
            <button style={s.primaryBtn} onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      )}

      {/* Results grid */}
      {papers.length > 0 && (
        <div style={s.grid}>
          {papers.map(paper => (
            <PaperCard key={paper.paperId} paper={paper}
                       onClick={() => onOpenPaper(paper.paperId)} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div style={s.loadMoreWrap}>
          <button style={s.loadMoreBtn} onClick={loadMore}>Load more papers</button>
        </div>
      )}
      {loading && papers.length > 0 && (
        <div style={s.loadMoreWrap}>
          <span style={s.spinner} /> Loading…
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      `}</style>
    </div>
  );
}

// ── Sub-component: filter dropdown ───────────────────────────────
function FilterSelect({ label, value, options, onChange, prefix = '' }) {
  return (
    <select style={s.filterSelect} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: All</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{prefix}{opt}</option>
      ))}
    </select>
  );
}

// ── Sub-component: paper card ────────────────────────────────────
function PaperCard({ paper, onClick }) {
  return (
    <button style={s.card} onClick={onClick}>
      <div style={s.cardTop}>
        <span style={s.boardBadge}>{paper.board}</span>
        <span style={s.yearBadge}>{paper.year}</span>
      </div>
      <div style={s.cardTitle}>{paper.title}</div>
      <div style={s.cardMeta}>
        <span>Class {paper.classLevel}</span>
        <span style={s.metaDot}>·</span>
        <span>{paper.subject}</span>
      </div>
      <div style={s.cardStats}>
        <span style={s.stat}>📝 {paper.questionCount} Q</span>
        <span style={s.stat}>👁 {paper.viewCount || 0}</span>
        <span style={s.stat}>↓ {paper.downloadCount || 0}</span>
      </div>
      <div style={s.cardCta}>View paper →</div>
    </button>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const s = {
  searchRow: { display: 'flex', gap: 10, marginBottom: 16 },
  searchBox: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1, padding: '12px 0', border: 'none',
    background: 'transparent', color: '#f0f0f8',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  searchClear: {
    background: 'none', border: 'none', color: '#6b6b80',
    cursor: 'pointer', fontSize: 14,
  },
  searchBtn: {
    padding: '0 22px', background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 12, fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },

  filterRow: {
    display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '9px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, color: '#f0f0f8',
    fontSize: 13, fontFamily: 'monospace',
    cursor: 'pointer', outline: 'none',
  },
  clearBtn: {
    padding: '9px 14px', background: 'none',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, color: '#f87171',
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },

  resultCount: {
    fontSize: 12, color: '#6b6b80',
    fontFamily: 'monospace', marginBottom: 16,
  },
  errorBanner: {
    padding: '10px 14px', marginBottom: 16,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', borderRadius: 10,
    fontSize: 13, fontFamily: 'monospace',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 14,
  },

  card: {
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: 18, textAlign: 'left',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, cursor: 'pointer',
    fontFamily: 'inherit', color: '#f0f0f8',
    transition: 'all 0.15s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  boardBadge: {
    fontSize: 10, fontWeight: 700, padding: '3px 8px',
    background: 'rgba(232,255,71,0.12)', color: '#e8ff47',
    borderRadius: 6, fontFamily: 'monospace', letterSpacing: 0.5,
  },
  yearBadge: { fontSize: 12, color: '#6b6b80', fontFamily: 'monospace' },
  cardTitle: {
    fontSize: 14, fontWeight: 700, color: '#f0f0f8',
    lineHeight: 1.4, minHeight: 38,
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: '#9ca3af',
  },
  metaDot: { color: '#4b5563' },
  cardStats: {
    display: 'flex', gap: 12, paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  stat: { fontSize: 11, color: '#6b6b80', fontFamily: 'monospace' },
  cardCta: { fontSize: 12, color: '#e8ff47', fontWeight: 600, marginTop: 2 },

  skeleton: {
    height: 160, borderRadius: 14,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '800px 100%',
    animation: 'shimmer 1.4s infinite',
  },

  emptyState: {
    textAlign: 'center', padding: '60px 24px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 18,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#f0f0f8', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#6b6b80', marginBottom: 20, lineHeight: 1.6 },
  primaryBtn: {
    padding: '10px 20px', background: '#e8ff47', color: '#0a0a0f',
    border: 'none', borderRadius: 10, fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },

  loadMoreWrap: { textAlign: 'center', marginTop: 24 },
  loadMoreBtn: {
    padding: '11px 24px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#f0f0f8',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  spinner: {
    width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#e8ff47',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block', marginRight: 8,
    verticalAlign: 'middle',
  },
};