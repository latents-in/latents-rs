import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ───────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = '638666';

const ROLE_COLORS = {
    founder: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    student: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    artist: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
};

const getRoleStyle = (role) => {
    const key = (role || '').toLowerCase();
    return ROLE_COLORS[key] || { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
};

const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col gap-1 min-w-[160px]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
        {sub && <span className="text-[12px] text-gray-400 font-medium">{sub}</span>}
    </div>
);

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
            setShake(true);
            setWrong(true);
            setValue('');
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
                    {/* Lock icon */}
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
                        {wrong && (
                            <p className="text-[12px] text-red-500 font-semibold text-center -mt-1">Incorrect password. Try again.</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-gray-900 hover:bg-black text-white text-[14px] font-bold rounded-xl transition-colors"
                        >
                            Unlock
                        </button>
                    </form>
                </div>

                <p className="text-center text-[11px] text-gray-400 mt-4 font-medium">
                    Latents · Admin Dashboard
                </p>
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
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    // Show password gate if not authenticated
    if (!authed) {
        return <PasswordGate onUnlock={() => setAuthed(true)} />;
    }

    // ── Data fetching
    useEffect(() => {
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
    }, []);

    // ── Sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    // ── Filtering + sorting
    const filtered = entries
        .filter(e => {
            const q = search.toLowerCase();
            return (
                (e.name || '').toLowerCase().includes(q) ||
                (e.email || '').toLowerCase().includes(q) ||
                (e.role || '').toLowerCase().includes(q) ||
                (e.location || '').toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            let aVal = a[sortField] ?? '';
            let bVal = b[sortField] ?? '';
            if (sortField === 'created_at') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <span className="ml-1.5 opacity-30">↕</span>;
        return <span className="ml-1.5 text-gray-700">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const totalRoles = entries.reduce((acc, e) => {
        const r = (e.role || 'Other').toLowerCase();
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});
    const topRole = Object.entries(totalRoles).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return (
        <div className="min-h-screen bg-[#F7F7F8] font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-black text-lg tracking-tight text-gray-900">Latents</span>
                        <span className="text-gray-300 font-light text-lg">/</span>
                        <span className="text-[13px] font-semibold text-gray-500">Waitlist</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            Admin
                        </span>
                        <button
                            onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}
                            className="text-[12px] text-gray-400 hover:text-gray-700 font-semibold transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Waitlist Members</h1>
                    <p className="text-[13px] text-gray-400 mt-1 font-medium">All registered entries, sorted by most recent.</p>
                </div>

                {/* Stats */}
                {!loading && !error && (
                    <div className="flex flex-wrap gap-4 mb-8">
                        <StatCard label="Total Signups" value={entries.length} />
                        <StatCard label="Showing" value={filtered.length} sub="after filter" />
                        <StatCard label="Top Role" value={topRole.charAt(0).toUpperCase() + topRole.slice(1)} sub="most popular" />
                    </div>
                )}

                {/* Search + table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table toolbar */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search name, email, role..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[13px] text-gray-700 font-medium placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                            />
                        </div>
                        <span className="text-[12px] text-gray-400 font-semibold">
                            {filtered.length} of {entries.length} entries
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
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
                                <p className="text-[12px] text-gray-400 mt-1">Try adjusting your search</p>
                            </div>
                        ) : (
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
                                                    transition={{ delay: i * 0.015, duration: 0.2 }}
                                                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                                                >
                                                    {/* Rank */}
                                                    <td className="px-5 py-4 text-[12px] font-mono font-bold text-gray-300 w-12">
                                                        {i + 1}
                                                    </td>
                                                    {/* Name */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[12px] font-black text-gray-600 shrink-0">
                                                                {(entry.name || '?')[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-[13px] font-semibold text-gray-800 whitespace-nowrap">
                                                                {entry.name || '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Email */}
                                                    <td className="px-5 py-4">
                                                        <span className="text-[13px] text-gray-500 font-medium">
                                                            {entry.email}
                                                        </span>
                                                    </td>
                                                    {/* Role */}
                                                    <td className="px-5 py-4">
                                                        {entry.role ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${roleStyle.bg} ${roleStyle.text}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                                                                {entry.role}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 text-[13px]">—</span>
                                                        )}
                                                    </td>
                                                    {/* Location */}
                                                    <td className="px-5 py-4">
                                                        <span className="text-[13px] text-gray-400 font-medium whitespace-nowrap">
                                                            {entry.location || '—'}
                                                        </span>
                                                    </td>
                                                    {/* Created at */}
                                                    <td className="px-5 py-4">
                                                        <span className="text-[13px] font-mono text-gray-400">
                                                            {formatDate(entry.created_at)}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
