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
const CornerDownLeftIc = p => <Ic {...p} d="M19 19H7V7M7 19l7-7" />;
const PaperclipIc = p => <Ic {...p} d="M21.44 11.05l-7.78 7.78a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.49a2 2 0 0 1-2.83-2.83l7.78-7.78" />;
const MicIc = p => <Ic {...p} d="M12 1.5a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 1.5z" />;
const ImageIc = p => <Ic {...p} d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm3 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm13 8l-6-6-4 4-3-3-4 5" />;
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
  mixed: { label: 'Mixed', color: '#111827', bg: '#E5E7EB', Ic: TrendIc },
};
const RISK = {
  Low: { color: '#10B981', bg: '#ECFDF5' },
  Medium: { color: '#F59E0B', bg: '#FFFBEB' },
  High: { color: '#EF4444', bg: '#FEF2F2' },
  Critical: { color: '#111827', bg: '#E5E7EB' },
};

const STAGES = [
  { key: 'classify', label: 'Classifying intent…' },
  { key: 'fetch', label: 'Aggregating sources…' },
  { key: 'dedupe', label: 'Deduplicating…' },
  { key: 'summarize', label: 'AI summarizing…' },
  { key: 'cache', label: 'Storing to Supabase & cache…' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bullet Card (independent like/share/save)
// ─────────────────────────────────────────────────────────────────────────────
function BulletCard({ bullet, onInteract }) {
  const intent = INTENT[bullet.intent] || INTENT.news;
  const risk = RISK[bullet.risk_level] || RISK.Medium;
  const IntentIcon = intent.Ic;

  const [liked, setLiked] = useState(bullet.liked || false);
  const [saved, setSaved] = useState(bullet.saved || false);
  const [likeCt, setLikeCt] = useState(bullet.likes_count || 0);
  const [saveCt, setSaveCt] = useState(bullet.saves_count || 0);

  const handleInteract = useCallback(async (action) => {
    const isOn = action === 'like' ? liked : saved;
    if (action === 'like') { setLiked(v => !v); setLikeCt(c => c + (isOn ? -1 : 1)); }
    else { setSaved(v => !v); setSaveCt(c => c + (isOn ? -1 : 1)); }
    try {
      const res = await fetch(
        `${API_URL}/api/feed/${bullet.parent_id}/interact?user_id=${SESSION_ID}&action=${action}`,
        { method: 'POST' }
      );
        if (res.ok) {
          const data = await res.json();
          if (action === 'like') setLikeCt(data.new_count);
          else setSaveCt(data.new_count);
          onInteract?.(bullet, action, data.toggled_off, data.new_count);
        }
    } catch { /* ignore */ }
  }, [liked, saved, bullet, onInteract]);

  const handleShare = () => {
    const text = `${bullet.bullet}\n\n${bullet.summary || ''}\n\nSource: ${bullet.source || ''}`;
    if (navigator.share) navigator.share({ title: bullet.parent_title, text, url: bullet.source_url || undefined });
    else navigator.clipboard.writeText(text);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid #e3e7f2',
      padding: '16px 18px', boxShadow: '0 6px 22px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 30, height: 30, borderRadius: 10, background: intent.bg, color: intent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            <IntentIcon size={13} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{bullet.parent_title}</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>{bullet.published_at}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: risk.color }}>{bullet.risk_level}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#111827' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{bullet.bullet}</div>
      </div>
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{bullet.summary}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280' }}>
        <a href={bullet.source_url || '#'} target={bullet.source_url ? '_blank' : '_self'} rel="noreferrer" style={{ color: '#0f172a', textDecoration: bullet.source_url ? 'underline' : 'none' }}>
          {bullet.source || 'Source'}
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eef0f5', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handleInteract('like')} style={{ border: 'none', background: 'transparent', color: liked ? '#ef4444' : '#9ca3af', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>
            <HeartIc size={14} fill={liked ? '#ef4444' : 'none'} /> {likeCt > 0 && likeCt}
          </button>
          <button onClick={() => handleInteract('save')} style={{ border: 'none', background: 'transparent', color: saved ? '#111827' : '#9ca3af', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>
            <BookmarkIc size={14} fill={saved ? '#111827' : 'none'} /> {saveCt > 0 && saveCt}
          </button>
          <button onClick={handleShare} style={{ border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>
            <ShareIc size={14} /> Share
          </button>
        </div>
        <span style={{ fontSize: 11, color: '#6b7280' }}>Oppty {bullet.opportunity_score}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [feed, setFeed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState('for_you');
  const [channels, setChannels] = useState([]);
  const [showActions, setShowActions] = useState(true);
  const [savedModal, setSavedModal] = useState(null);

  const stageTimer = useRef(null);
  const inputRef = useRef(null);
  const observerTarget = useRef(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const queryRef = useRef('');

  const FEED_CACHE_KEY = `latents_feed_${SESSION_ID}`;
  const CHANNELS_KEY = `latents_channels_${SESSION_ID}`;

  const saveChannels = (list) => {
    setChannels(list);
    try { localStorage.setItem(CHANNELS_KEY, JSON.stringify(list)); } catch { }
  };

  const addChannelFromItem = (item) => {
    if (!item) return;
    setChannels(prev => {
      if (prev.some(c => c.id === item.id)) return prev;
      const next = [...prev, { id: item.id, title: item.title, intent: item.intent }];
      try { localStorage.setItem(CHANNELS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const removeChannel = (id) => {
    setChannels(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem(CHANNELS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const cacheFeed = (items) => {
    try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ items, ts: Date.now() })); } catch { }
  };

  const loadCached = () => {
    try {
      const cached = localStorage.getItem(FEED_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.items?.length) {
          setFeed(parsed.items);
          setSelected(parsed.items[0]?.id || null);
          setSearched(true);
        }
      }
      const ch = localStorage.getItem(CHANNELS_KEY);
      if (ch) setChannels(JSON.parse(ch));
    } catch { /* ignore */ }
  };

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

  const hoursAgo = (item) => {
    const raw = item?.published_at || '';
    if (!raw) return null;
    const cleaned = raw.replace('·', '').replace(/\s+/g, ' ').trim();
    const withYear = cleaned.match(/\d{4}/) ? cleaned : `${cleaned} ${new Date().getUTCFullYear()}`;
    const date = Date.parse(withYear);
    if (Number.isNaN(date)) return null;
    return (Date.now() - date) / (1000 * 60 * 60);
  };

  const bucketedFeed = useCallback((list, bucket) => {
    if (bucket === 'for_you') return list;
    return list.filter(item => {
      const hrs = hoursAgo(item);
      if (hrs === null) return false;
      if (bucket === 'ground') return hrs <= 8;
      if (bucket === 'plus') return hrs >= 24 * 21 && hrs <= 24 * 28;
      return hrs > 24 * 28;
    });
  }, []);

  const fetchFeed = useCallback(async (isLoadMore = false, searchQuery = '') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    queryRef.current = searchQuery;

    if (!isLoadMore) {
      if (searchQuery) startPipelineAnim();
      pageRef.current = 1;
      hasMoreRef.current = true;
      setFeed([]);
    }

    const targetPage = isLoadMore ? pageRef.current + 1 : 1;

    try {
      const res = await fetch(`${API_URL}/api/feed?query=${encodeURIComponent(searchQuery.trim())}&page=${targetPage}`, {
        headers: { 'x-user-id': SESSION_ID }
      });
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
          const next = [...prev, ...fresh];
          cacheFeed(next);
          return next;
        });
      } else {
        if (data.items && data.items.length > 0) {
          setFeed(data.items);
          cacheFeed(data.items);
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

  const handleInteract = (item, action, toggledOff, newCount) => {
    if (action === 'save') {
      if (toggledOff) removeChannel(item.parent_id);
      else addChannelFromItem({ id: item.parent_id, title: item.parent_title, intent: item.intent });
    }
    setFeed(prev => prev.map(f => {
      if (f.id !== item.parent_id) return f;
      return {
        ...f,
        saved: action === 'save' ? !toggledOff : f.saved,
        liked: action === 'like' ? !toggledOff : f.liked,
        saves_count: action === 'save' && typeof newCount === 'number' ? newCount : f.saves_count,
        likes_count: action === 'like' && typeof newCount === 'number' ? newCount : f.likes_count,
      };
    }));
  };

  useEffect(() => {
    loadCached();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (!searched) return;
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchFeed(true, queryRef.current);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { observer.disconnect(); };
  }, [fetchFeed, searched]);

  const displayed = bucketedFeed(feed, tab);
  const savedItems = feed.filter(f => f.saved);
  const bulletFeed = displayed.flatMap(item => {
    const details = item.bullet_details && item.bullet_details.length > 0
      ? item.bullet_details
      : (item.bullets || []).map(b => ({ bullet: b, summary: item.why_it_matters }));
    return details.map((b, idx) => ({
      ...item,
      parent_id: item.id,
      parent_title: item.title,
      bullet: b.bullet || b,
      summary: b.summary || b.bullet || b,
      bullet_key: `${item.id}-${idx}`
    }));
  });

  return (
    <div style={{
      display: 'flex', height: '100vh', fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      background: 'radial-gradient(circle at 20% 20%, #f8f9fb 0, #f5f6f8 35%, #eef0f3 100%)',
      color: '#0F172A', overflow: 'hidden'
    }}>

      {/* Left rail */}
      <aside style={{
        width: 260, background: 'linear-gradient(180deg,#ffffff 0%,#f4f6fb 100%)', borderRight: '1px solid #e5e8f0',
        display: 'flex', flexDirection: 'column', padding: '18px 16px', gap: 14,
        boxShadow: '8px 0 24px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>Latents</div>

          <img src="/latents.webp" alt="Latents" style={{ width: 26, height: 26, objectFit: 'contain' }} />
        </div>

        <button style={{
          display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '10px 12px', fontWeight: 600, color: '#0f172a', cursor: 'pointer'
        }}>
          <ZapIc size={14} /> New Action
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'My Feed' }, { label: 'Saves' }, { label: 'Folders' }].map(nav => (
            <div key={nav.label} style={{
              padding: '10px 12px', borderRadius: 10, display: 'flex', alignItems: 'center',
              gap: 10, color: '#4b5563', background: nav.label === 'My Feed' ? '#eef1f7' : 'transparent',
              fontWeight: 600, fontSize: 13
            }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8ebf3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {nav.label === 'My Feed' ? '🤖' : nav.label === 'Saves' ? '★' : '⧉'}
              </span>
              {nav.label}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginTop: 6 }}>SAVED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
          {savedItems.length === 0 && (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Save a feed to see it here.</div>
          )}
          {savedItems.map(ch => (
            <div key={ch.id} onClick={() => setSavedModal(ch)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 10, background: '#f8f9fb', border: '1px solid #eef0f5', cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#fff', border: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4b5563'
                }}>
                  {ch.title?.[0]?.toUpperCase() || 'S'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>{ch.intent || 'news'}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e1' }}>Saved</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #eef0f5', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 12, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#374151' }}>
            {SESSION_ID.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>You</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Session</div>
          </div>
        </div>
      </aside>

      {/* Center column */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <header style={{ padding: '18px 24px 10px', borderBottom: '1px solid #eceff3', background: '#f6f7fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Your Feed</h1>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{feed.length} new opportunities</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
              {[
                { key: 'for_you', label: 'For You' },
                { key: 'ground', label: 'Ground Breakers' },
                { key: 'plus', label: 'Plus Ones' },
                { key: 'long', label: 'Long Shots' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  border: 'none', background: 'none', paddingBottom: 8, borderBottom: tab === t.key ? '2px solid #111827' : '2px solid transparent',
                  color: tab === t.key ? '#111827' : '#9ca3af', cursor: 'pointer'
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowActions(v => !v)} style={{
            border: '1px solid #e5e7eb', background: '#fff', borderRadius: 12, padding: '8px 12px', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 6
          }}>
            {showActions ? 'Close Actions' : 'Open Actions'}
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 160px', gap: 12, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,rgba(255,255,255,0.65) 0%,rgba(250,252,255,0.9) 60%,rgba(247,248,252,0.9) 100%)' }}>
          {loading && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: 18 }}>
              <div style={{ height: 14, borderRadius: 10, background: 'linear-gradient(90deg,#f3f4f6 0%,#e5e7eb 50%,#f3f4f6 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ height: 10 }} />
              <div style={{ height: 12, borderRadius: 10, width: '80%', background: 'linear-gradient(90deg,#f3f4f6 0%,#e5e7eb 50%,#f3f4f6 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, padding: 14, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {displayed.length === 0 && !loading && !error && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '80px 0' }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>No results yet. Ask Latents below to get started.</p>
            </div>
          )}

          {bulletFeed.map(b => (
            <BulletCard key={b.bullet_key} bullet={b} onInteract={handleInteract} />
          ))}

          {tab === 'for_you' && feed.length > 0 && (
            <div ref={observerTarget} style={{ height: 40 }} />
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSearch} style={{
          position: 'absolute', bottom: 12,
          left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 780,  // align with feed column width
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,248,255,0.96) 100%)',
          borderRadius: 24,
          padding: '18px 20px',
          boxShadow: '0 26px 70px rgba(22,33,78,0.22)',
          border: '1.5px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', gap: 12,
          backdropFilter: 'blur(18px)',
          outline: '1px solid rgba(255,255,255,0.6)',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/latents.webp" alt="Latents" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', color: '#0f172a' }}>Latents Copilot</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Conversational search & actions</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CornerDownLeftIc /> Enter to send
            </span>
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 0', minWidth: 0,
              padding: '11px 12px', borderRadius: 16, border: '1px solid #e3e7f2', background: '#fff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
            }}>
              <SearchIc size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask Latents to search, draft, or take action…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#0f172a', background: 'transparent', paddingLeft: 6 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: loading ? '#f59e0b' : '#10b981' }} />
                {loading ? 'Generating' : 'Ready'}
              </div>
              <button type="submit" disabled={loading || !query.trim()} style={{
                background: loading || !query.trim() ? '#e5e7eb' : '#111827',
                color: loading || !query.trim() ? '#4b5563' : '#fff', border: 'none', borderRadius: 999, padding: '12px 18px', fontWeight: 800,
                letterSpacing: '0.02em',
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: loading ? 'none' : '0 10px 24px rgba(17,24,39,0.25)'
              }}>
                {loading ? <LoadIc size={14} /> : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Action center */}
      {showActions && (
        <aside style={{ width: 320, background: 'linear-gradient(180deg,#f9fafc 0%,#f0f2f8 100%)', borderLeft: '1px solid #e3e7f2', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15,23,42,0.06)' }}>
          <div style={{ padding: '18px 18px 0', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SparkIc size={14} style={{ color: '#111827' }} /> Action Center
          </div>
          <div style={{ display: 'flex', gap: 18, padding: '8px 18px 16px', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
            <span style={{ borderBottom: '2px solid #111827', paddingBottom: 8 }}>Review</span>
            <span>Ongoing</span>
            <span>Done</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af'
            }}>✓</div>
            <div style={{ fontWeight: 700, color: '#1f2937' }}>No review actions</div>
            <div style={{ fontSize: 12 }}>Review actions from your feed to start drafting responses.</div>
          </div>
        </aside>
      )}

      {savedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '90%', maxWidth: 720, background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.25)', border: '1px solid #e5e7eb', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{savedModal.title}</h3>
              <button onClick={() => setSavedModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
                <XClose size={16} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{savedModal.published_at}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(savedModal.bullet_details || []).map((b, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>{b.bullet}</div>
                  <div style={{ color: '#374151', lineHeight: 1.6 }}>{b.summary}</div>
                </div>
              ))}
              {savedModal.articles?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>Sources</div>
                  {savedModal.articles.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '6px 0', color: '#0f172a', textDecoration: 'none' }}>
                      {a.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
