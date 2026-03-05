import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function JoinWaitlistModal({ isOpen, onClose, onSubmit, isLoading, browserLocation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email) return;

        // Pass the collected data back up to the parent component
        onSubmit({ name, email });
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
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
                                    Enter your details to join the waitlist and get early access.
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

                                    {/* Location is silently passed, no indicator shown as per request */}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 px-5 py-3.5 bg-[#1d1d1f] hover:bg-black transition-colors rounded-xl flex items-center justify-center text-white text-[15px] sm:text-[16px] font-semibold tracking-wide shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Sending Magic Link...' : 'Join Waitlist'}
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
