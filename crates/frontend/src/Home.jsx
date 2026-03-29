import React, { useState, useCallback, useRef, useEffect } from 'react';

// ── Persistent anonymous session ID ──────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem('latents_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('latents_session_id', id);
  }
  return id;
}

const SESSION_ID = getSessionId();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Micro SVG icons ───────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, fill = 'none', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const SearchIc = p => <Ic {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const ZapIc = p => <Ic {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const GlobeIc = p => <Ic {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.76 0-5 4.48-5 10s2.24 10 5 10 5-4.48 5-10S14.76 2 12 2zM2 12h20" />;
const BriefIc = p => <Ic {...p} d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />;
const AlertIc = p => <Ic {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const TrendIc = p => <Ic {...p} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />;
const HeartIc = p => <Ic {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
const BookmarkIc = p => <Ic {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />;
const ShareIc = p => <Ic {...p} d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />;
const ArrowUpIc = p => <Ic {...p} d="M7 17L17 7M17 7H7M17 7v10" />;
const SparkIc = p => <Ic {...p} d="M12 2l1.5 4.5H18l-3.75 2.75L15.75 14 12 11.25 8.25 14l1.5-4.75L6 6.5h4.5L12 2z" />;
const XClose = p => <Ic {...p} d="M18 6L6 18M6 6l12 12" />;
const ExternalIc = p => <Ic {...p} d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />;
const LoadIc = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Intent / Risk config ──────────────────────────────────────────────────────
const INTENT = {
  news: { label: 'News', color: '#3B82F6', bg: '#EFF6FF', Ic: GlobeIc },
  jobs: { label: 'Jobs', color: '#10B981', bg: '#ECFDF5', Ic: BriefIc },
  incidents: { label: 'Incident', color: '#EF4444', bg: '#FEF2F2', Ic: AlertIc },
  mixed: { label: 'Mixed', color: '#8B5CF6', bg: '#F5F3FF', Ic: TrendIc },
};
const RISK = {
  Low: { color: '#10B981', bg: '#ECFDF5' },
  Medium: { color: '#F59E0B', bg: '#FFFBEB' },
  High: { color: '#EF4444', bg: '#FEF2F2' },
  Critical: { color: '#7C3AED', bg: '#F5F3FF' },
};

// ── Pipeline stages ───────────────────────────────────────────────────────────
const STAGES = [
  { key: 'classify', label: 'Classifying intent…' },
  { key: 'fetch', label: 'Aggregating sources…' },
  { key: 'dedupe', label: 'Deduplicating…' },
  { key: 'summarize', label: 'AI summarizing…' },
  { key: 'cache', label: 'Storing to Supabase & cache…' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Feed Card
// ─────────────────────────────────────────────────────────────────────────────
function FeedCard({ item, selected, onSelect, onInteract }) {
  const intent = INTENT[item.intent] || INTENT.news;
  const risk = RISK[item.risk_level] || RISK.Medium;
  const IntentIcon = intent.Ic;

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCt, setLikeCt] = useState(item.likes_count || 0);
  const [saveCt, setSaveCt] = useState(item.saves_count || 0);

  const handleInteract = useCallback(async (action) => {
    const isOn = action === 'like' ? liked : saved;
    // Optimistic update
    if (action === 'like') { setLiked(v => !v); setLikeCt(c => c + (isOn ? -1 : 1)); }
    else { setSaved(v => !v); setSaveCt(c => c + (isOn ? -1 : 1)); }
    try {
      const res = await fetch(
        `${API_URL}/api/feed/${item.id}/interact?user_id=${SESSION_ID}&action=${action}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data = await res.json();
        if (action === 'like') setLikeCt(data.new_count);
        else setSaveCt(data.new_count);
      }
    } catch { /* revert on error */ }
    onInteract?.(item.id, action);
  }, [liked, saved, item.id, onInteract]);

  const handleShare = () => {
    const text = `${item.title}\n\n${item.bullets?.[0] || ''}\n\n— via Latents Intelligence OS`;
    if (navigator.share) navigator.share({ title: item.title, text });
    else { navigator.clipboard.writeText(text); }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: selected ? '1.5px solid #6366F1' : '1px solid rgba(0,0,0,0.07)',
        boxShadow: selected
          ? '0 0 0 3px rgba(99,102,241,0.08), 0 4px 24px rgba(0,0,0,0.06)'
          : '0 2px 12px rgba(0,0,0,0.04)',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Intent badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, color: intent.color, background: intent.bg,
            padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <IntentIcon size={10} /> {intent.label}
          </span>
          {/* Risk badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, color: risk.color, background: risk.bg,
            padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: risk.color }} />
            {item.risk_level} Risk
          </span>
          {item.cache_status === 'live' && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#10B981', background: '#ECFDF5',
              padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
          color: '#6366F1', background: '#EEF2FF', padding: '3px 10px', borderRadius: 20,
          border: '1px solid rgba(99,102,241,0.15)'
        }}>
          <ArrowUpIc size={11} /> {item.opportunity_score}
        </div>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {item.source || 'Intelligence'}
        </span>
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>·</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.published_at}</span>
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>·</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.source_count} sources</span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.45, margin: '0 0 10px' }}>
        {item.title}
      </h3>

      {/* Regions */}
      {item.regions?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {item.regions.slice(0, 4).map(r => (
            <span key={r} style={{
              fontSize: 11, color: '#6B7280', background: '#F3F4F6',
              padding: '2px 8px', borderRadius: 20, border: '1px solid #E5E7EB'
            }}>
              🌍 {r}
            </span>
          ))}
        </div>
      )}

      {/* Bullets */}
      <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(item.bullets || []).slice(0, selected ? 99 : 2).map((b, i) => (
          <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, display: 'flex', gap: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366F1', marginTop: 7, flexShrink: 0 }} />
            {b}
          </li>
        ))}
        {!selected && (item.bullets || []).length > 2 && (
          <li style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 15, fontWeight: 500 }}>
            +{item.bullets.length - 2} more…
          </li>
        )}
      </ul>

      {/* Why it matters — only when selected */}
      {selected && item.why_it_matters && (
        <div style={{
          background: 'linear-gradient(135deg,#F8FAFF,#FAFBFF)', border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 12
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase',
            letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5
          }}>
            <SparkIc size={10} /> Why This Matters
          </div>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
            {item.why_it_matters}
          </p>
        </div>
      )}

      {/* Source articles — only when selected */}
      {selected && item.articles?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Source Articles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {item.articles.slice(0, 3).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151',
                  textDecoration: 'none', padding: '8px 10px', background: '#F8F9FC', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                <ExternalIc size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{a.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Like / Save / Share */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #F1F5F9', marginTop: 4
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Like */}
          <button onClick={e => { e.stopPropagation(); handleInteract('like'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20,
              border: 'none', background: liked ? '#FEF2F2' : 'transparent', cursor: 'pointer',
              color: liked ? '#EF4444' : '#9CA3AF', fontSize: 12, fontWeight: 500, transition: 'all 0.15s'
            }}>
            <HeartIc size={14} fill={liked ? '#EF4444' : 'none'} />
            {likeCt > 0 && likeCt}
          </button>
          {/* Save */}
          <button onClick={e => { e.stopPropagation(); handleInteract('save'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20,
              border: 'none', background: saved ? '#EEF2FF' : 'transparent', cursor: 'pointer',
              color: saved ? '#6366F1' : '#9CA3AF', fontSize: 12, fontWeight: 500, transition: 'all 0.15s'
            }}>
            <BookmarkIc size={14} fill={saved ? '#6366F1' : 'none'} />
            {saveCt > 0 && saveCt}
          </button>
          {/* Share */}
          <button onClick={e => { e.stopPropagation(); handleShare(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: '#9CA3AF', fontSize: 12, fontWeight: 500, transition: 'all 0.15s'
            }}>
            <ShareIc size={14} /> Share
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ZapIc size={9} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>AI-curated</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [feed, setFeed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searched, setSearched] = useState(false); // has the user searched at least once?
  const stageTimer = useRef(null);
  const inputRef = useRef(null);
  const observerTarget = useRef(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const queryRef = useRef('');

  // Cycle through pipeline stages during fetch
  const startPipelineAnim = () => {
    setStageIdx(0);
    let i = 0;
    stageTimer.current = setInterval(() => {
      i++;
      if (i >= STAGES.length) { clearInterval(stageTimer.current); }
      else setStageIdx(i);
    }, 600);
  };
  const stopPipelineAnim = () => {
    clearInterval(stageTimer.current);
    setStageIdx(-1);
  };

  const fetchFeed = useCallback(async (isLoadMore = false, searchQuery = '') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    queryRef.current = searchQuery;
    
    if (!isLoadMore) {
        if (searchQuery) startPipelineAnim(); // Run anim only if actual search
        pageRef.current = 1;
        hasMoreRef.current = true;
        setFeed([]);
    }

    const targetPage = isLoadMore ? pageRef.current + 1 : 1;
    
    try {
      const res = await fetch(`${API_URL}/api/feed?query=${encodeURIComponent(searchQuery.trim())}&page=${targetPage}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      const data = await res.json();
      hasMoreRef.current = data.has_more;
      
      if (isLoadMore) {
        pageRef.current = targetPage;
        setFeed(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const fresh = data.items.filter(i => !existingIds.has(i.id));
          return [...prev, ...fresh];
        });
      } else {
        if (data.items && data.items.length > 0) {
          setFeed(data.items);
          setSelected(data.items[0].id);
        } else {
          setError(searchQuery ? 'No intelligence found for that query. Try a different topic.' : 'No initial feed found.');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch. Please try again.');
    } finally {
      stopPipelineAnim();
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim() || loadingRef.current) return;
    setSearched(true);
    fetchFeed(false, query);
  };

  useEffect(() => { 
    inputRef.current?.focus(); 
    fetchFeed(false, ''); 
    setSearched(true); 
  }, [fetchFeed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchFeed(true, queryRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { observer.disconnect(); };
  }, [fetchFeed]);

  const filtered = filter === 'all' ? feed : feed.filter(i => i.intent === filter);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'news', label: 'News' },
    { key: 'incidents', label: 'Incidents' },
    { key: 'jobs', label: 'Jobs' },
  ];

  return (
    <div style={{
      display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      background: '#F8F9FC', color: '#0F172A', overflow: 'hidden'
    }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16,
          borderBottom: '1px solid rgba(0,0,0,0.06)', gap: 10
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ZapIc size={14} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>Latents</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>Intelligence OS</div>
          </div>
        </div>

        {/* Filters as nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase',
            letterSpacing: '0.1em', padding: '0 12px', marginBottom: 8
          }}>
            Signal Type
          </div>
          {FILTERS.map(f => {
            const count = f.key === 'all' ? feed.length : feed.filter(i => i.intent === f.key).length;
            return (
              <div key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  background: filter === f.key ? '#6366F1' : 'transparent',
                  color: filter === f.key ? '#fff' : '#6B7280',
                  fontWeight: filter === f.key ? 600 : 500, fontSize: 13, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.background = 'transparent'; }}>
                <span>{f.label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'center', padding: '1px 6px', borderRadius: 20,
                    background: filter === f.key ? 'rgba(255,255,255,0.25)' : '#EEF2FF',
                    color: filter === f.key ? '#fff' : '#6366F1'
                  }}>
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pipeline status */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', background: '#FAFBFF' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Pipeline
          </div>
          {['Intent Classifier', 'Aggregator', 'AI Summarizer', stageIdx >= 4 ? 'Cached ✓' : 'Redis Cache'].map((label, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
              color: (!loading || stageIdx >= i) ? '#10B981' : '#9CA3AF', fontWeight: 500, marginBottom: 5
            }}>
              {(!loading || stageIdx >= i)
                ? <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16,185,129,0.15)', animation: loading && stageIdx === i ? 'pulse 1s infinite' : 'none'
                }} />
                : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5E7EB' }} />
              }
              {label}
            </div>
          ))}
        </div>
      </aside>

      {/* ── FEED ────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, background: 'rgba(248,249,252,0.92)',
          backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 20
        }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Intelligence Feed
          </h1>
          {/* Pipeline stage indicator */}
          {loading && stageIdx >= 0 && (
            <span style={{
              fontSize: 11, color: '#8B5CF6', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <LoadIc size={12} />
              {STAGES[stageIdx]?.label}
            </span>
          )}
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <SearchIc size={14} style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none'
              }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. China chip war, AI jobs India…"
                style={{
                  width: 300, paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  fontSize: 13, borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff',
                  color: '#111', outline: 'none', transition: 'all 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: 'none',
                background: loading || !query.trim() ? '#C7D2FE' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: loading ? 'none' : '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.15s'
              }}>
              {loading ? <LoadIc size={14} /> : <SearchIc size={14} />}
              {loading ? 'Analyzing…' : 'Search'}
            </button>
          </form>
        </header>

        {/* Body */}
        <div style={{ padding: '24px', maxWidth: 760, width: '100%', margin: '0 auto', flex: 1 }}>

          {/* ── Empty State ───────────────────────────────────────────────── */}
          {!searched && feed.length === 0 && (
            <div style={{
              height: '100%', minHeight: 500, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px'
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                boxShadow: '0 8px 32px rgba(99,102,241,0.3)'
              }}>
                <SparkIc size={32} style={{ color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#0F172A' }}>
                What's happening in your world?
              </h2>
              <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, maxWidth: 420, margin: '0 0 24px' }}>
                Search any topic — geopolitics, markets, tech, jobs, incidents — and get an AI-curated situation report in seconds.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
                {['War in Ukraine', 'AI jobs India', 'China chip ban', 'Stock market crash', 'Cybersecurity breach'].map(s => (
                  <button key={s} onClick={() => { setQuery(s); setTimeout(() => handleSearch(), 50); }}
                    style={{
                      fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 20,
                      border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer',
                      transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#9CA3AF' }}>
                {['Intent Classification', 'NewsAPI Aggregation', 'AI Situation Report', 'Supabase Cached'].map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading skeleton ──────────────────────────────────────────── */}
          {loading && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)', padding: '20px', marginBottom: 12 }}>
              <div style={{
                height: 12, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                backgroundSize: '200% 100%', borderRadius: 8, marginBottom: 12, animation: 'shimmer 1.5s infinite'
              }} />
              <div style={{
                height: 20, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                backgroundSize: '200% 100%', borderRadius: 8, marginBottom: 10, width: '80%', animation: 'shimmer 1.5s infinite'
              }} />
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: 12, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                  backgroundSize: '200% 100%', borderRadius: 8, marginBottom: 8, width: `${85 - i * 10}%`,
                  animation: 'shimmer 1.5s infinite'
                }} />
              ))}
            </div>
          )}

          {/* ── Error State ───────────────────────────────────────────────── */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12,
              padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertIc size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 500 }}>{error}</span>
              </div>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <XClose size={14} />
              </button>
            </div>
          )}

          {/* ── Stats bar ────────────────────────────────────────────────── */}
          {feed.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Signals', value: feed.length, color: '#6366F1' },
                { label: 'High Risk', value: feed.filter(i => ['High', 'Critical'].includes(i.risk_level)).length, color: '#EF4444' },
                { label: 'Regions', value: [...new Set(feed.flatMap(i => i.regions || []))].length, color: '#10B981' },
                { label: 'Live', value: feed.filter(i => i.cache_status === 'live').length, color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: '#fff', borderRadius: 12,
                  padding: '10px 14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Feed Cards ───────────────────────────────────────────────── */}
          {searched && feed.length === 0 && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <GlobeIc size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>No results. Try a more specific topic.</p>
            </div>
          )}

          {filtered.map(item => (
            <FeedCard
              key={item.id}
              item={item}
              selected={item.id === selected}
              onSelect={() => setSelected(s => s === item.id ? null : item.id)}
              onInteract={() => { }}
            />
          ))}
          
          {/* Intersection Observer target for infinite scroll */}
          {feed.length > 0 && (
            <div ref={observerTarget} style={{ height: 20, width: '100%', marginBottom: 20 }}></div>
          )}
        </div>
      </main>

      {/* ── DETAIL PANEL ─────────────────────────────────────────────────────── */}
      {selected && (() => {
        const item = feed.find(i => i.id === selected);
        if (!item) return null;
        const risk = RISK[item.risk_level] || RISK.Medium;
        return (
          <aside style={{
            width: 360, background: '#fff', borderLeft: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              height: 56, borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SparkIc size={14} style={{ color: '#6366F1' }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Situation Report</span>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <XClose size={14} />
              </button>
            </div>
            <div style={{ padding: 18, flex: 1 }}>
              {/* Risk */}
              <div style={{
                background: risk.bg, border: `1px solid ${risk.color}22`, borderRadius: 12,
                padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: risk.color, flexShrink: 0, marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: risk.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.risk_level} Risk
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {(item.regions || []).join(' · ') || 'Global'}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, color: '#0F172A', margin: '0 0 14px' }}>
                {item.title}
              </h2>

              {/* Bullets */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Key Updates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(item.bullets || []).map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1
                      }}>
                        {i + 1}
                      </span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Why it matters */}
              {item.why_it_matters && (
                <div style={{
                  background: 'linear-gradient(135deg,#F5F3FF,#F8F9FF)',
                  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 14, marginBottom: 16
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    <SparkIc size={10} /> Why This Matters
                  </div>
                  <p style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.65, margin: 0 }}>
                    {item.why_it_matters}
                  </p>
                </div>
              )}

              {/* Pipeline metadata */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Pipeline Metadata
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Intent', value: item.intent },
                    { label: 'Risk', value: item.risk_level },
                    { label: 'Cache', value: item.cache_status === 'live' ? '🟢 Live' : item.cache_status === 'redis' ? '⚡ Redis' : '🔵 DB' },
                    { label: 'Score', value: item.opportunity_score },
                    { label: 'Sources', value: item.source_count },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#F8F9FC', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginTop: 2, textTransform: 'capitalize' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        );
      })()}

      {/* Global keyframes */}
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
