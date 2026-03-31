import React, { useState, useCallback, useRef, useEffect } from 'react';

// ── Session ───────────────────────────────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem('latents_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('latents_session_id', id); }
  return id;
}
const SESSION_ID = getSessionId();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, fill = 'none', stroke = 'currentColor', sw = '1.8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ZapIc = p => <Ic {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const GlobeIc = p => <Ic {...p} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.76 0-5 4.48-5 10s2.24 10 5 10 5-4.48 5-10S14.76 2 12 2zM2 12h20" />;
const BriefIc = p => <Ic {...p} d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />;
const AlertIc = p => <Ic {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const TrendIc = p => <Ic {...p} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />;
const HeartIc = p => <Ic {...p} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
const BookmarkIc = p => <Ic {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />;
const ShareIc = p => <Ic {...p} d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />;
const SparkIc = p => <Ic {...p} d="M12 2l1.5 4.5H18l-3.75 2.75L15.75 14 12 11.25 8.25 14l1.5-4.75L6 6.5h4.5L12 2z" />;
const XClose = p => <Ic {...p} d="M18 6L6 18M6 6l12 12" />;
const FeedIc = p => <Ic {...p} d="M3 4h18M3 9h18M3 14h12M3 19h8" />;
const SavesIc = p => <Ic {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />;
const FolderIc = p => <Ic {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />;
const ChevronR = p => <Ic {...p} d="M9 18l6-6-6-6" />;
const LoadIc = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'lc-spin 0.75s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Config ────────────────────────────────────────────────────────────────────
const INTENT = {
  news: { label: 'News', color: '#3B82F6', bg: '#EFF6FF', Ic: GlobeIc },
  jobs: { label: 'Jobs', color: '#10B981', bg: '#ECFDF5', Ic: BriefIc },
  incidents: { label: 'Incident', color: '#EF4444', bg: '#FEF2F2', Ic: AlertIc },
  mixed: { label: 'Mixed', color: '#475569', bg: '#F1F5F9', Ic: TrendIc },
};
const RISK = {
  Low: { color: '#10B981' },
  Medium: { color: '#F59E0B' },
  High: { color: '#EF4444' },
  Critical: { color: '#7C3AED' },
};
const STAGES = [
  { key: 'classify', label: 'Classifying intent…' },
  { key: 'fetch', label: 'Aggregating sources…' },
  { key: 'dedupe', label: 'Deduplicating…' },
  { key: 'summarize', label: 'AI summarizing…' },
  { key: 'cache', label: 'Caching results…' },
];
const PLACEHOLDERS = [
  'Search market shifts in renewable energy…',
  'Find hiring signals at Series B startups…',
  'Track regulatory news in fintech…',
  'Discover partnership opportunities in AI…',
  'Monitor supply chain incidents in APAC…',
];
const TABS = [
  { key: 'for_you', label: 'For You' },
  { key: 'ground', label: 'Breaking' },
  { key: 'plus', label: 'This Month' },
  { key: 'long', label: 'Long Shots' },
];

// ── Global CSS (injected once) ────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes lc-spin       { to { transform: rotate(360deg); } }
  @keyframes lc-ripple     { 0%{transform:translate(-50%,-50%) scale(0);opacity:.3} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
  @keyframes lc-waveIn     { from{transform:translateX(-50%) translateY(14px) scale(.98);opacity:0} to{transform:translateX(-50%) translateY(0) scale(1);opacity:1} }
  @keyframes lc-ph-fade    { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lc-dot-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
  @keyframes shimmer       { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes drawer-in     { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes fade-in       { from{opacity:0} to{opacity:1} }
  @keyframes slide-up      { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes sheet-up      { from{transform:translateY(100%)} to{transform:translateY(0)} }

  body { margin:0; font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; }

  .lc-form {
    position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
    width:calc(100% - 32px); max-width:740px; z-index:20;
    font-family:'Inter',sans-serif;
    animation:lc-waveIn .42s cubic-bezier(.22,1,.36,1) both;
  }
  .lc-wrap {
    position:relative; border-radius:20px;
    background:rgba(255,255,255,.97);
    border:1px solid #e2e8f0;
    padding:14px 15px 12px;
    display:flex; flex-direction:column; gap:10px;
    box-shadow:0 8px 40px rgba(15,23,42,.10),0 2px 8px rgba(15,23,42,.06);
    transition:border-color .22s,box-shadow .22s;
    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); overflow:hidden;
  }
  .lc-wrap.active { border-color:#cbd5e1; box-shadow:0 12px 48px rgba(15,23,42,.13),0 3px 10px rgba(15,23,42,.07); }
  .lc-mesh { position:absolute;inset:0;border-radius:20px;pointer-events:none;
    background:radial-gradient(ellipse at 0% 0%,rgba(241,245,249,.6) 0%,transparent 55%),
               radial-gradient(ellipse at 100% 100%,rgba(226,232,240,.4) 0%,transparent 50%); }
  .lc-header { display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1; }
  .lc-brand { display:flex;align-items:center;gap:9px; }
  .lc-brand img { width:26px;height:26px;object-fit:contain;border-radius:7px; }
  .lc-title { font-size:12.5px;font-weight:800;color:#0f172a;letter-spacing:-.02em;line-height:1; }
  .lc-sub   { font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px; }
  .lc-hint  { display:flex;align-items:center;gap:5px;font-size:11px;color:#94a3b8;font-weight:500;user-select:none; }
  .lc-kbd   { background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:1px 5px;font-size:10px;font-weight:700;color:#64748b; }
  .lc-divider { height:1px;background:linear-gradient(90deg,transparent,#e8edf3 25%,#e8edf3 75%,transparent);position:relative;z-index:1; }
  .lc-input-row { display:flex;align-items:center;gap:9px;position:relative;z-index:1; }
  .lc-field { flex:1 1 0;min-width:0;display:flex;align-items:center;gap:9px;padding:10px 13px;border-radius:12px;border:1px solid #e8edf5;background:#f8fafc;transition:border-color .2s,box-shadow .2s; }
  .lc-wrap.active .lc-field { border-color:#cbd5e1;box-shadow:inset 0 1px 2px rgba(15,23,42,.04); }
  .lc-search-icon { flex-shrink:0;color:#94a3b8; }
  .lc-input-wrapper { flex:1;min-width:0;position:relative;height:20px;display:flex;align-items:center; }
  .lc-ph { position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;font-size:13.5px;font-weight:500;color:#94a3b8;pointer-events:none;white-space:nowrap;overflow:hidden;letter-spacing:-.01em;transition:opacity .26s,transform .26s; }
  .lc-ph.hidden  { opacity:0;transform:translateY(-2px); }
  .lc-ph.visible { opacity:1;transform:translateY(0);animation:lc-ph-fade .28s ease; }
  .lc-input { width:100%;border:none;outline:none;background:transparent;font-family:'Inter',inherit;font-size:13.5px;font-weight:500;color:#0f172a;letter-spacing:-.01em;line-height:1;position:relative;z-index:1;caret-color:#0f172a; }
  .lc-controls { display:flex;align-items:center;gap:7px;flex-shrink:0; }
  .lc-status { display:flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;border:1px solid #e8edf5;background:#f8fafc;font-size:11px;font-weight:700;color:#64748b;white-space:nowrap;font-family:'Inter',inherit; }
  .lc-status-dot { width:6px;height:6px;border-radius:50%; }
  .lc-dot { display:inline-block;width:3.5px;height:3.5px;border-radius:50%;background:#f59e0b;animation:lc-dot-bounce 1s ease-in-out infinite; }
  .lc-dot:nth-child(2){ animation-delay:.15s; }
  .lc-dot:nth-child(3){ animation-delay:.30s; }
  .lc-send { position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:999px;border:none;cursor:pointer;font-family:'Inter',inherit;font-size:13px;font-weight:700;letter-spacing:-.01em;transition:transform .14s,box-shadow .2s;white-space:nowrap; }
  .lc-send:not(:disabled):hover  { transform:translateY(-1px); }
  .lc-send:not(:disabled):active { transform:scale(.97); }
  .lc-send:disabled { cursor:not-allowed; }
  .lc-send-ripple { position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.35);top:50%;left:50%;transform:translate(-50%,-50%) scale(0);pointer-events:none; }
  .lc-send-ripple.go { animation:lc-ripple .5s cubic-bezier(.22,1,.36,1) forwards; }

  .drawer-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:200;animation:fade-in .22s ease;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px); }
  .drawer { position:fixed;left:0;top:0;bottom:0;width:290px;background:#fff;z-index:201;display:flex;flex-direction:column;box-shadow:20px 0 60px rgba(0,0,0,.18);animation:drawer-in .28s cubic-bezier(.22,1,.36,1); }

  .mob-action-fab { position:fixed;bottom:96px;right:18px;z-index:19;width:48px;height:48px;border-radius:16px;background:#0f172a;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 24px rgba(15,23,42,.28);transition:transform .15s; }
  .mob-action-fab:active { transform:scale(.93); }

  .feed-tabs { display:flex;overflow-x:auto;scrollbar-width:none; }
  .feed-tabs::-webkit-scrollbar { display:none; }

  @media (max-width:768px) {
    .desktop-sidebar  { display:none !important; }
    .desktop-actions  { display:none !important; }
    .mob-hamburger    { display:flex !important; }
    .mob-action-fab   { display:flex !important; }
    .lc-hint          { display:none !important; }
    .lc-status        { display:none !important; }
    .lc-form          { width:calc(100% - 20px);bottom:10px; }
    .lc-wrap          { border-radius:18px;padding:12px 12px 10px; }
    .lc-send          { padding:10px 13px; }
    .lc-field         { padding:9px 10px; }
    .lc-divider, .lc-sub { display:none !important; }
  }
  @media (max-width:420px) {
    .lc-title { font-size:12px; }
    .lc-input { font-size:13px; }
    .lc-ph    { font-size:12.5px; }
  }
`;

// ── Animated placeholder ──────────────────────────────────────────────────────
function AnimatedPlaceholder({ active }) {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (active) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => { setIdx(i => (i + 1) % PLACEHOLDERS.length); setShow(true); }, 280);
    }, 3400);
    return () => clearInterval(id);
  }, [active]);
  return <span className={`lc-ph ${show ? 'visible' : 'hidden'}`}>{PLACEHOLDERS[idx]}</span>;
}

// ── Composer ──────────────────────────────────────────────────────────────────
function LatentsCopilot({ query, setQuery, onSubmit, loading, inputRef }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState(false);
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return; injected.current = true;
    const el = document.createElement('style'); el.id = 'latents-css'; el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  const isActive = focused || hovered;
  const canSend = query.trim().length > 0 && !loading;

  const handleSubmit = e => {
    e.preventDefault(); if (!canSend) return;
    setRipple(true); setTimeout(() => setRipple(false), 520); onSubmit(e);
  };

  return (
    <form className="lc-form" onSubmit={handleSubmit}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`lc-wrap ${isActive ? 'active' : ''}`}>
        <div className="lc-mesh" />
        <div className="lc-header">
          <div className="lc-brand">
            <img src="/latents.webp" alt="Latents" />
            <div>
              <div className="lc-title">Latents Copilot</div>
              <div className="lc-sub">Conversational intelligence &amp; actions</div>
            </div>
          </div>
          <div className="lc-hint"><span className="lc-kbd">↵</span><span>to send</span></div>
        </div>
        <div className="lc-divider" />
        <div className="lc-input-row">
          <div className="lc-field">
            <svg className="lc-search-icon" width={15} height={15} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <div className="lc-input-wrapper">
              {!query && <AnimatedPlaceholder active={focused} />}
              <input ref={inputRef} className="lc-input" value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                maxLength={400} autoComplete="off" spellCheck={false} />
            </div>
          </div>
          <div className="lc-controls">
            <div className="lc-status">
              {loading
                ? <><span className="lc-dot" /><span className="lc-dot" /><span className="lc-dot" /><span style={{ marginLeft: 3 }}>Working</span></>
                : <><span className="lc-status-dot" style={{ background: '#10b981' }} /> Ready</>}
            </div>
            <button type="submit" className="lc-send" disabled={!canSend} style={{
              background: canSend ? 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)' : '#e2e8f0',
              color: canSend ? '#fff' : '#94a3b8',
              boxShadow: canSend ? '0 6px 20px rgba(15,23,42,.26)' : 'none',
            }}>
              <span className={`lc-send-ripple${ripple ? ' go' : ''}`} />
              {loading
                ? <LoadIc size={14} />
                : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
              {loading ? 'Searching' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────────
function SidebarContent({ savedBullets, onSavedClick, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="/latents.webp" alt="Latents" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 9 }} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.02em', color: '#0f172a' }}>Latents</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 8 }}>
            <XClose size={17} />
          </button>
        )}
      </div>

      <button style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        border: 'none', borderRadius: 13, padding: '11px 14px',
        fontWeight: 700, color: '#fff', cursor: 'pointer', fontSize: 13,
        letterSpacing: '-.01em', marginBottom: 18,
        boxShadow: '0 4px 14px rgba(15,23,42,.22)', fontFamily: 'inherit',
      }}>
        <ZapIc size={14} stroke="#fff" /> New Action
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 20 }}>
        {[
          { label: 'My Feed', Icon: FeedIc, active: true },
          { label: 'Saves', Icon: SavesIc, active: false },
          { label: 'Folders', Icon: FolderIc, active: false },
        ].map(nav => (
          <div key={nav.label} style={{
            padding: '10px 12px', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 10,
            background: nav.active ? '#f1f5f9' : 'transparent', cursor: 'pointer', transition: 'background .15s',
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: nav.active ? '#e2e8f0' : '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: nav.active ? '#0f172a' : '#94a3b8' }}>
              <nav.Icon size={13} />
            </span>
            <span style={{ fontWeight: 600, fontSize: 13, color: nav.active ? '#0f172a' : '#64748b', flex: 1 }}>{nav.label}</span>
            {nav.active && <ChevronR size={13} stroke="#cbd5e1" />}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '.08em', marginBottom: 8, paddingLeft: 2 }}>SAVED BULLETS</div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {savedBullets.length === 0
          ? <div style={{ fontSize: 12, color: '#cbd5e1', padding: '8px 2px' }}>Save a bullet to see it here.</div>
          : savedBullets.map(ch => (
            <div key={ch.bullet_key} onClick={() => { onSavedClick(ch); onClose?.(); }} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 10px', borderRadius: 11, background: '#f8fafc',
              border: '1px solid #f1f5f9', cursor: 'pointer',
            }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#475569', flexShrink: 0 }}>
                {ch.parent_title?.[0]?.toUpperCase() || 'S'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{ch.bullet}</div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'capitalize', marginTop: 1 }}>{ch.intent || 'news'}</div>
              </div>
            </div>
          ))}
      </div>

      <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#475569' }}>
          {SESSION_ID.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>You</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Anonymous session</div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, savedBullets, onSavedClick }) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <SidebarContent savedBullets={savedBullets} onSavedClick={onSavedClick} onClose={onClose} />
      </div>
    </>
  );
}

// ── Bullet Card ───────────────────────────────────────────────────────────────
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
      const res = await fetch(`${API_URL}/api/feed/${bullet.parent_id}/interact?user_id=${SESSION_ID}&action=${action}&bullet_index=${bullet.bullet_index}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (action === 'like') setLikeCt(data.new_count); else setSaveCt(data.new_count);
        onInteract?.(bullet, action, data.toggled_off, data.new_count);
      }
    } catch { }
  }, [liked, saved, bullet, onInteract]);

  const handleShare = () => {
    const text = `${bullet.bullet}\n\n${bullet.summary || ''}\n\nSource: ${bullet.source || ''}`;
    if (navigator.share) navigator.share({ title: bullet.parent_title, text, url: bullet.source_url || undefined });
    else navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '15px 16px', boxShadow: '0 2px 12px rgba(15,23,42,.05)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow .2s,transform .2s', animation: 'slide-up .3s ease both' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,.05)'; e.currentTarget.style.transform = ''; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: intent.bg, color: intent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IntentIcon size={14} />
          </span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{bullet.parent_title}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{bullet.published_at}</div>
          </div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: risk.color, flexShrink: 0, paddingTop: 2 }}>{bullet.risk_level}</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.45 }}>{bullet.bullet}</div>

      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{bullet.summary}</div>

      {bullet.source && (
        <a href={bullet.source_url || '#'} target={bullet.source_url ? '_blank' : '_self'} rel="noreferrer"
          style={{ fontSize: 11.5, color: '#64748b', textDecoration: bullet.source_url ? 'underline' : 'none' }}>
          {bullet.source}
        </a>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 9 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            {
              label: 'Like', active: liked, color: '#ef4444', count: likeCt, onClick: () => handleInteract('like'),
              icon: <HeartIc size={14} fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#94a3b8'} />
            },
            {
              label: 'Save', active: saved, color: '#0f172a', count: saveCt, onClick: () => handleInteract('save'),
              icon: <BookmarkIc size={14} fill={saved ? '#0f172a' : 'none'} stroke={saved ? '#0f172a' : '#94a3b8'} />
            },
            {
              label: 'Share', active: false, color: '#94a3b8', count: 0, onClick: handleShare,
              icon: <ShareIc size={14} stroke="#94a3b8" />
            },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: 8, color: btn.active ? btn.color : '#94a3b8', fontSize: 12, fontWeight: 600, transition: 'background .15s', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {btn.icon}
              {btn.active ? Math.max(btn.count ?? 0, 1) : (btn.count > 0 ? btn.count : '')}
            </button>
          ))}
        </div>
        {bullet.opportunity_score != null && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Score {bullet.opportunity_score}</span>
        )}
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [feed, setFeed] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState('for_you');
  const [showActions, setShowActions] = useState(true);
  const [savedModal, setSavedModal] = useState(null);
  const [savedBulletsState, setSavedBulletsState] = useState([]);
  const [likedSet, setLikedSet] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState(false);

  const stageTimer = useRef(null);
  const inputRef = useRef(null);
  const observerTarget = useRef(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const queryRef = useRef('');

  const FEED_KEY = `latents_feed_${SESSION_ID}`;
  const SAVED_KEY = `latents_saved_${SESSION_ID}`;
  const LIKED_KEY = `latents_liked_${SESSION_ID}`;

  const updateSaved = updater => setSavedBulletsState(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
    return next;
  });
  const updateLiked = updater => setLikedSet(prev => {
    const next = typeof updater === 'function' ? updater(new Set(prev)) : new Set(updater);
    try { localStorage.setItem(LIKED_KEY, JSON.stringify([...next])); } catch { }
    return next;
  });
  const cacheFeed = items => { try { localStorage.setItem(FEED_KEY, JSON.stringify({ items, ts: Date.now() })); } catch { } };

  useEffect(() => {
    try {
      const c = localStorage.getItem(FEED_KEY); if (c) { const p = JSON.parse(c); if (p?.items?.length) { setFeed(p.items); setSearched(true); } }
      const s = localStorage.getItem(SAVED_KEY); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setSavedBulletsState(p); }
      const l = localStorage.getItem(LIKED_KEY); if (l) { const p = JSON.parse(l); if (Array.isArray(p)) setLikedSet(new Set(p)); }
    } catch { }
    inputRef.current?.focus();
  }, []);

  const startStages = () => {
    setStageIdx(0); let i = 0;
    stageTimer.current = setInterval(() => { i++; if (i >= STAGES.length) clearInterval(stageTimer.current); else setStageIdx(i); }, 600);
  };
  const stopStages = () => { clearInterval(stageTimer.current); setStageIdx(-1); };

  const hoursAgo = item => {
    const raw = item?.published_at || ''; if (!raw) return null;
    const cleaned = raw.replace('·', '').replace(/\s+/g, ' ').trim();
    const withYear = /\d{4}/.test(cleaned) ? cleaned : `${cleaned} ${new Date().getUTCFullYear()}`;
    const d = Date.parse(withYear); if (isNaN(d)) return null;
    return (Date.now() - d) / 3600000;
  };

  const bucketedFeed = useCallback((list, bucket) => {
    if (bucket === 'for_you') return list;
    return list.filter(item => {
      const h = hoursAgo(item); if (h === null) return false;
      if (bucket === 'ground') return h <= 8;
      if (bucket === 'plus') return h >= 504 && h <= 672;
      return h > 672;
    });
  }, []);

  const fetchFeed = useCallback(async (isMore = false, q = '') => {
    if (loadingRef.current) return;
    loadingRef.current = true; setLoading(true); setError(null); queryRef.current = q;
    if (!isMore) { if (q) startStages(); pageRef.current = 1; hasMoreRef.current = true; setFeed([]); }
    const page = isMore ? pageRef.current + 1 : 1;
    try {
      const res = await fetch(`${API_URL}/api/feed?query=${encodeURIComponent(q.trim())}&page=${page}`, { headers: { 'x-user-id': SESSION_ID } });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
      const data = await res.json();
      hasMoreRef.current = data.has_more;
      if (isMore) {
        pageRef.current = page;
        setFeed(prev => { const ids = new Set(prev.map(i => i.id)); const fresh = data.items.filter(i => !ids.has(i.id)); const next = [...prev, ...fresh]; cacheFeed(next); return next; });
      } else {
        if (data.items?.length) { setFeed(data.items); cacheFeed(data.items); }
        else setError(q ? 'No intelligence found. Try a different topic.' : 'No feed found.');
      }
    } catch (e) { setError(e.message || 'Failed to fetch.'); }
    finally { stopStages(); loadingRef.current = false; setLoading(false); }
  }, []);

  const handleSearch = e => {
    e?.preventDefault();
    if (!query.trim() || loadingRef.current) return;
    setSearched(true); fetchFeed(false, query);
  };

  const handleInteract = (item, action, toggledOff, newCount) => {
    if (action === 'save') {
      if (toggledOff) updateSaved(prev => prev.filter(b => b.bullet_key !== item.bullet_key));
      else {
        const entry = { bullet_key: item.bullet_key, parent_id: item.parent_id, parent_title: item.parent_title, bullet: item.bullet, summary: item.summary, source: item.source, source_url: item.source_url, published_at: item.published_at, intent: item.intent, risk_level: item.risk_level, bullet_index: item.bullet_index };
        updateSaved(prev => prev.some(b => b.bullet_key === item.bullet_key) ? prev : [entry, ...prev]);
      }
    }
    if (action === 'like') {
      if (toggledOff) updateLiked(prev => { prev.delete(item.bullet_key); return prev; });
      else updateLiked(prev => { prev.add(item.bullet_key); return prev; });
    }
    setFeed(prev => prev.map(f => {
      if (f.id !== item.parent_id) return f;
      const bd = f.bullet_details?.map((b, i) => i !== item.bullet_index ? b : { ...b, saved: action === 'save' ? !toggledOff : b?.saved, liked: action === 'like' ? !toggledOff : b?.liked, saves_count: action === 'save' && typeof newCount === 'number' ? newCount : b?.saves_count, likes_count: action === 'like' && typeof newCount === 'number' ? newCount : b?.likes_count });
      return { ...f, saved: action === 'save' ? !toggledOff : f.saved, liked: action === 'like' ? !toggledOff : f.liked, saves_count: action === 'save' && typeof newCount === 'number' ? newCount : f.saves_count, likes_count: action === 'like' && typeof newCount === 'number' ? newCount : f.likes_count, bullet_details: bd || f.bullet_details };
    }));
  };

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (!searched) return;
      if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) fetchFeed(true, queryRef.current);
    }, { threshold: 0.1 });
    if (observerTarget.current) obs.observe(observerTarget.current);
    return () => obs.disconnect();
  }, [fetchFeed, searched]);

  const savedSet = new Set(savedBulletsState.map(b => b.bullet_key));
  const makeBullets = list => list.flatMap(item => {
    const details = item.bullet_details?.length ? item.bullet_details : (item.bullets || []).map(b => ({ bullet: b, summary: item.why_it_matters }));
    return details.map((b, idx) => ({
      ...item, parent_id: item.id, parent_title: item.title,
      bullet: b.bullet || b, summary: b.summary || b.bullet || b,
      bullet_key: `${item.id}-${idx}`, bullet_index: idx,
      saved: savedSet.has(`${item.id}-${idx}`) || (b.saved ?? item.saved),
      liked: likedSet.has(`${item.id}-${idx}`) || (b.liked ?? item.liked),
      likes_count: b.likes_count ?? item.likes_count,
      saves_count: b.saves_count ?? item.saves_count,
    }));
  });

  const displayed = bucketedFeed(feed, tab);
  const bulletFeed = makeBullets(displayed);
  const savedBullets = savedBulletsState.length ? savedBulletsState : makeBullets(feed).filter(b => b.saved);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", background: '#f8fafc', color: '#0f172a' }}>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: 256, flexShrink: 0, background: '#fff', borderRight: '1px solid #f1f5f9', boxShadow: '4px 0 20px rgba(15,23,42,.04)', overflowY: 'auto' }}>
        <SidebarContent savedBullets={savedBullets} onSavedClick={setSavedModal} onClose={null} />
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} savedBullets={savedBullets} onSavedClick={setSavedModal} />

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <header style={{ padding: '14px 18px 0', background: '#fff', borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Hamburger (mobile only via CSS) */}
              <button className="mob-hamburger" onClick={() => setDrawerOpen(true)}
                style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: 9, color: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="15" y2="18" />
                </svg>
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>Your Feed</h1>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{feed.length} opportunities</div>
              </div>
            </div>
            <button onClick={() => setShowActions(v => !v)} style={{ border: '1px solid #e8edf5', background: '#f8fafc', borderRadius: 11, padding: '8px 13px', fontWeight: 700, fontSize: 12.5, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-.01em', fontFamily: 'inherit' }}>
              <SparkIc size={13} /> {showActions ? 'Hide Actions' : 'Actions'}
            </button>
          </div>
          <div className="feed-tabs">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', background: 'none', padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', color: tab === t.key ? '#0f172a' : '#94a3b8', borderBottom: tab === t.key ? '2px solid #0f172a' : '2px solid transparent', transition: 'color .15s,border-color .15s', flexShrink: 0, fontFamily: 'inherit' }}>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* Feed scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 160px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)' }}>
          {loading && [1, 2].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 18 }}>
              {[60, 85, 70].map((w, j) => (
                <div key={j} style={{ height: j === 0 ? 13 : 11, borderRadius: 8, width: `${w}%`, background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite', marginBottom: j < 2 ? 8 : 0 }} />
              ))}
            </div>
          ))}

          {stageIdx >= 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12.5, color: '#475569', fontWeight: 600 }}>
              <LoadIc size={14} /> {STAGES[stageIdx]?.label}
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {displayed.length === 0 && !loading && !error && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px 20px' }}>
              <div style={{ fontSize: 28, marginBottom: 10, opacity: .4 }}>✦</div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Ask Latents below to get started.</p>
            </div>
          )}

          {bulletFeed.map(b => <BulletCard key={b.bullet_key} bullet={b} onInteract={handleInteract} />)}
          {tab === 'for_you' && feed.length > 0 && <div ref={observerTarget} style={{ height: 40 }} />}
        </div>

        {/* Composer */}
        <LatentsCopilot query={query} setQuery={setQuery} onSubmit={handleSearch} loading={loading} inputRef={inputRef} />

        {/* Mobile Action FAB */}
        <button className="mob-action-fab" onClick={() => setActionSheet(true)}>
          <SparkIc size={17} stroke="#fff" />
        </button>
      </main>

      {/* Desktop Action Center */}
      {showActions && (
        <aside className="desktop-actions" style={{ width: 296, flexShrink: 0, background: '#fff', borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(15,23,42,.04)' }}>
          <div style={{ padding: '20px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, letterSpacing: '-.02em' }}>
              <SparkIc size={14} /> Action Center
            </div>
            <button onClick={() => setShowActions(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 7 }}>
              <XClose size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 18px' }}>
            {['Review', 'Ongoing', 'Done'].map((l, i) => (
              <button key={l} style={{ border: 'none', background: 'none', padding: '11px 12px', fontWeight: 700, fontSize: 12.5, color: i === 0 ? '#0f172a' : '#94a3b8', cursor: 'pointer', borderBottom: i === 0 ? '2px solid #0f172a' : '2px solid transparent', letterSpacing: '-.01em', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 20 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>No review actions</div>
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>Save bullets from your feed to draft responses here.</div>
          </div>
        </aside>
      )}

      {/* Mobile Action Bottom Sheet */}
      {actionSheet && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.42)', zIndex: 200, animation: 'fade-in .22s ease', backdropFilter: 'blur(3px)' }} onClick={() => setActionSheet(false)} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 201, borderRadius: '22px 22px 0 0', padding: '16px 18px 40px', boxShadow: '0 -16px 60px rgba(15,23,42,.15)', animation: 'sheet-up .28s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}>
                <SparkIc size={15} /> Action Center
              </div>
              <button onClick={() => setActionSheet(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                <XClose size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {['Review', 'Ongoing', 'Done'].map(l => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderRadius: 13, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: '#1e293b' }}>{l}</span>
                  <ChevronR size={14} stroke="#cbd5e1" />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>No active actions yet</div>
            </div>
          </div>
        </>
      )}

      {/* Saved bullet modal */}
      {savedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16, animation: 'fade-in .2s ease' }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: '22px 22px 26px', boxShadow: '0 30px 80px rgba(0,0,0,.2)', border: '1px solid #f1f5f9', maxHeight: '85vh', overflowY: 'auto', animation: 'slide-up .26s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>{savedModal.bullet}</h3>
              <button onClick={() => setSavedModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, flexShrink: 0 }}>
                <XClose size={16} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>{savedModal.published_at}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '.07em', marginBottom: 6 }}>SUMMARY</div>
            <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5, marginBottom: 16 }}>{savedModal.summary}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '.07em', marginBottom: 6 }}>SOURCE</div>
            <a href={savedModal.source_url || '#'} target={savedModal.source_url ? '_blank' : '_self'} rel="noreferrer"
              style={{ color: '#0f172a', textDecoration: 'underline', fontSize: 13 }}>
              {savedModal.source || 'Source link'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
