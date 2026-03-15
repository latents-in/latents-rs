import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ROLES = [
    { label: 'Founder', gradient: 'linear-gradient(135deg, #60A5FA, #3730A3)', accent: '#3730A3', bgIdle: 'rgba(96,165,250,0.10)' },
    { label: 'Student', gradient: 'linear-gradient(135deg, #FDE047, #EA580C)', accent: '#EA580C', bgIdle: 'rgba(253,224,71,0.15)' },
    { label: 'Artist', gradient: 'linear-gradient(135deg, #F472B6, #9D174D)', accent: '#BE185D', bgIdle: 'rgba(244,114,182,0.12)' },
    { label: 'Others', gradient: 'linear-gradient(135deg, #2DD4BF, #C084FC, #F43F5E)', accent: '#9333EA', bgIdle: 'rgba(192,132,252,0.12)' },
];

export default function JoinWaitlistModal({ isOpen, onClose, onSubmit, isLoading, browserLocation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [customRole, setCustomRole] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email || !role) return;

        const finalRole = role === 'Others' ? (customRole || 'Others') : role;
        onSubmit({ name, email, role: finalRole });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-100 relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>

                            <div className="p-8">
                                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-2">
                                    Secure Your Spot
                                </h2>
                                <p className="text-[#86868b] text-[15px] mb-6">
                                    Enter your details to get a FREE MONTH of access and a Limited Edition Ticket.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl focus:outline-none bg-gray-50 focus:bg-white text-[15px] sm:text-[16px] text-[#1d1d1f] font-medium placeholder:text-[#86868b] placeholder:font-normal border border-transparent focus:border-gray-300 transition-colors shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl focus:outline-none bg-gray-50 focus:bg-white text-[15px] sm:text-[16px] text-[#1d1d1f] font-medium placeholder:text-[#86868b] placeholder:font-normal border border-transparent focus:border-gray-300 transition-colors shadow-sm"
                                        />
                                    </div>

                                    {/* Role Selector */}
                                    <div className="space-y-2">
                                        <p className="text-[13px] font-semibold text-[#86868b] uppercase tracking-widest ml-1">Choose your persona</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ROLES.map((r) => (
                                                <button
                                                    key={r.label}
                                                    type="button"
                                                    onClick={() => { setRole(r.label); if (r.label !== 'Others') setCustomRole(''); }}
                                                    style={role === r.label
                                                        ? { background: r.gradient, border: 'none' }
                                                        : {}
                                                    }
                                                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${role === r.label
                                                        ? 'text-white shadow-md scale-[1.03]'
                                                        : 'bg-gray-50 text-[#86868b] border-transparent hover:border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>

                                        <AnimatePresence>
                                            {role === 'Others' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <input
                                                        type="text"
                                                        placeholder="Write your own destiny..."
                                                        value={customRole}
                                                        onChange={(e) => setCustomRole(e.target.value)}
                                                        className="w-full mt-2 px-4 py-3 rounded-xl focus:outline-none bg-gray-50 focus:bg-white text-[15px] text-[#1d1d1f] font-medium placeholder:text-[#86868b] placeholder:font-normal border border-transparent focus:border-gray-300 transition-colors shadow-sm"
                                                        autoFocus
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !role}
                                        className="w-full mt-2 px-5 py-3.5 bg-[#1d1d1f] hover:bg-black transition-colors rounded-xl flex items-center justify-center text-white text-[15px] sm:text-[16px] font-semibold tracking-wide shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Joining...' : 'Join Waitlist'}
                                    </button>
                                </form>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
