import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = '638666';

const ROLE_COLORS = {
    founder: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
    student: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
    artist: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500', border: 'border-pink-200' },
};

const getRoleStyle = (role) => {
    const key = (role || '').toLowerCase();
    return ROLE_COLORS[key] || { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' };
};

const formatDateTime = (iso) => {
    const d = new Date(iso);
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${date} · ${hh}:${mm}:${ss}`;
};

const DATE_RANGES = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
];

const inDateRange = (iso, range) => {
    if (range === 'all') return true;
    const d = new Date(iso);
    const now = new Date();
    if (range === 'today') return d.toDateString() === now.toDateString();
    if (range === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
};

const capitalize = (s) => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-0.5 min-w-[120px]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-2xl font-black text-gray-900 tracking-tight">{value}</span>
        {sub && <span className="text-[11px] text-gray-400 font-medium">{sub}</span>}
    </div>
);

// ─── Mobile Entry Card ────────────────────────────────────────────────────────
const MobileCard = ({ entry, index }) => {
    const roleStyle = getRoleStyle(entry.role);
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="p-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[13px] font-black text-gray-600 shrink-0">
                        {(entry.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{entry.name || '—'}</p>
                        <p className="text-[12px] text-gray-400 truncate">{entry.email}</p>
                    </div>
                </div>
                {entry.role && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${roleStyle.bg} ${roleStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                        {entry.role}
                    </span>
                )}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 pl-12">
                <span className="text-[11px] text-gray-400 font-medium truncate">{entry.location || '—'}</span>
                <span className="text-[10px] font-mono text-gray-300 shrink-0">{formatDateTime(entry.created_at)}</span>
            </div>
        </motion.div>
    );
};

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
    const [value, setValue] = useState('');
    const [shake, setShake] = useState(false);
    const [wrong, setWrong] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_authed', '1');
            onUnlock();
        } else {
            setShake(true); setWrong(true); setValue('');
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F7F8] font-sans flex items-center justify-center p-6">
            <motion.div
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-lg font-black tracking-tight text-gray-900">Admin Access</h1>
                        <p className="text-[13px] text-gray-400 mt-1">Enter your password to continue</p>
                    </div>
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                        <input
                            type="password"
                            placeholder="Password"
                            value={value}
                            onChange={e => { setValue(e.target.value); setWrong(false); }}
                            autoFocus
                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-[14px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none transition-colors ${wrong ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 focus:border-gray-400'}`}
                        />
                        {wrong && <p className="text-[12px] text-red-500 font-semibold text-center -mt-1">Incorrect password. Try again.</p>}
                        <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-black text-white text-[14px] font-bold rounded-xl transition-colors">
                            Unlock
                        </button>
                    </form>
                </div>
                <p className="text-center text-[11px] text-gray-400 mt-4 font-medium">Latents · Admin Dashboard</p>
            </motion.div>
        </div>
    );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    useEffect(() => {
        if (!authed) return;
        const load = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${API_URL}/api/waitlist`);
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                setEntries(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [authed]);

    if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const roleOptions = ['all', ...Object.keys(
        entries.reduce((acc, e) => { acc[(e.role || 'Others').toLowerCase()] = 1; return acc; }, {})
    )];

    const filtered = entries
        .filter(e => {
            const q = search.toLowerCase();
            const matchSearch = (
                (e.name || '').toLowerCase().includes(q) ||
                (e.email || '').toLowerCase().includes(q) ||
                (e.role || '').toLowerCase().includes(q) ||
                (e.location || '').toLowerCase().includes(q)
            );
            const entryRole = (e.role || 'Others').toLowerCase();
            const matchRole = roleFilter === 'all' || entryRole === roleFilter;
            const matchDate = inDateRange(e.created_at, dateRange);
            return matchSearch && matchRole && matchDate;
        })
        .sort((a, b) => {
            let aVal = a[sortField] ?? '';
            let bVal = b[sortField] ?? '';
            if (sortField === 'created_at') { aVal = new Date(aVal); bVal = new Date(bVal); }
            else { aVal = aVal.toString().toLowerCase(); bVal = bVal.toString().toLowerCase(); }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ field }) => sortField !== field
        ? <span className="ml-1 opacity-30 text-[10px]">↕</span>
        : <span className="ml-1 text-gray-700 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>;

    const totalRoles = entries.reduce((acc, e) => {
        const r = (e.role || 'Others').toLowerCase();
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});
    const topRole = Object.entries(totalRoles).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return (
        <div className="min-h-screen bg-[#F7F7F8] font-sans">

            {/* ── Top bar ── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-black text-base sm:text-lg tracking-tight text-gray-900">Latents</span>
                        <span className="text-gray-300 font-light">/</span>
                        <span className="text-[12px] sm:text-[13px] font-semibold text-gray-500">Waitlist</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Admin</span>
                        <button
                            onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}
                            className="text-[12px] text-gray-400 hover:text-gray-700 font-semibold transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ── Heading ── */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Waitlist Members</h1>
                    <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1 font-medium">All registered entries, sorted by most recent.</p>
                </div>

                {/* ── Stat cards (horizontally scrollable on mobile) ── */}
                {!loading && !error && (
                    <div className="flex gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                        <StatCard label="Total" value={entries.length} />
                        <StatCard label="Showing" value={filtered.length} sub="filtered" />
                        <StatCard label="Top Role" value={capitalize(topRole)} />
                        {Object.entries(totalRoles).map(([role, count]) => (
                            <StatCard key={role} label={capitalize(role)} value={count} sub="signups" />
                        ))}
                    </div>
                )}

                {/* ── Filter + Table card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Filter Toolbar */}
                    <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col gap-3">

                        {/* Search */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-0">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search name, email, location..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[13px] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                                />
                            </div>
                            <span className="text-[12px] text-gray-400 font-semibold shrink-0">
                                {filtered.length}/{entries.length}
                            </span>
                        </div>

                        {/* Role filter pills (scrollable on mobile) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1 shrink-0">Role</span>
                            {roleOptions.map(r => {
                                const isActive = roleFilter === r;
                                const style = r !== 'all' ? getRoleStyle(r) : null;
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 ${isActive
                                                ? r === 'all'
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : `${style.bg} ${style.text} ${style.border}`
                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                                            }`}
                                    >
                                        {r !== 'all' && isActive && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
                                        {capitalize(r === 'all' ? 'All' : r)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Date range pills (scrollable on mobile) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1 shrink-0">Joined</span>
                            {DATE_RANGES.map(dr => (
                                <button
                                    key={dr.value}
                                    onClick={() => setDateRange(dr.value)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 ${dateRange === dr.value
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    {dr.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading / Error / Empty */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-lg font-black mb-3">!</div>
                            <p className="text-[14px] font-semibold text-gray-700">Failed to load waitlist</p>
                            <p className="text-[12px] text-gray-400 mt-1">{error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                            <p className="text-[14px] font-semibold text-gray-600">No entries found</p>
                            <p className="text-[12px] text-gray-400 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Mobile: card list (< md) ── */}
                            <div className="md:hidden">
                                <AnimatePresence>
                                    {filtered.map((entry, i) => (
                                        <MobileCard key={entry.id} entry={entry} index={i} />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* ── Desktop: table (>= md) ── */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            {[
                                                { label: '#', field: null },
                                                { label: 'Name', field: 'name' },
                                                { label: 'Email', field: 'email' },
                                                { label: 'Role', field: 'role' },
                                                { label: 'Location', field: 'location' },
                                                { label: 'Joined', field: 'created_at' },
                                            ].map(col => (
                                                <th
                                                    key={col.label}
                                                    onClick={col.field ? () => handleSort(col.field) : undefined}
                                                    className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap select-none ${col.field ? 'cursor-pointer hover:text-gray-700 transition-colors' : ''}`}
                                                >
                                                    {col.label}
                                                    {col.field && <SortIcon field={col.field} />}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {filtered.map((entry, i) => {
                                                const roleStyle = getRoleStyle(entry.role);
                                                return (
                                                    <motion.tr
                                                        key={entry.id}
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.012, duration: 0.18 }}
                                                        className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                                                    >
                                                        <td className="px-5 py-4 text-[12px] font-mono font-bold text-gray-300 w-12">{i + 1}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[12px] font-black text-gray-600 shrink-0">
                                                                    {(entry.name || '?')[0].toUpperCase()}
                                                                </div>
                                                                <span className="text-[13px] font-semibold text-gray-800 whitespace-nowrap">{entry.name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-[13px] text-gray-500 font-medium">{entry.email}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {entry.role ? (
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                                                                    {entry.role}
                                                                </span>
                                                            ) : <span className="text-gray-300 text-[13px]">—</span>}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">{entry.location || '—'}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-[12px] font-mono text-gray-400 whitespace-nowrap">{formatDateTime(entry.created_at)}</span>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
