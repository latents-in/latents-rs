import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Check, Loader2 } from 'lucide-react';

export default function WaitlistSuccess() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, registering, success, error
    const [userData, setUserData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // 1. Check if we have a session (means magic link was successful)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;
                if (!session) {
                    throw new Error('No active session found. Please try logging in again.');
                }

                const user = session.user;
                const metadata = user.user_metadata || {};

                setStatus('registering');

                // 2. Register user to our Rust backend to get their Rank
                const API_URL = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${API_URL}/api/waitlist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: user.email,
                        name: metadata.full_name || 'Anonymous',
                        location: metadata.location || 'Unknown'
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // If they are already on the waitlist, our backend will throw a 409 conflict
                    // But let's just pretend it's a success so they get their card anyway
                    if (response.status !== 409) {
                        throw new Error(data.message || data.error || 'Failed to register to waitlist');
                    }
                }

                // 3. Set standard user data for the visual card
                setUserData({
                    name: metadata.full_name || 'Early Adopter',
                    rank: data.rank || 'TBD' // Assuming backend starts returning 'rank'
                });

                setStatus('success');

            } catch (error) {
                console.error('Waitlist verification error:', error);
                setErrorMessage(error.message);
                setStatus('error');
            }
        };

        handleAuth();

        // Listen for auth state changes just in case they just clicked the link
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                handleAuth();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="relative w-full min-h-screen bg-[#FDFDFD] overflow-hidden font-sans flex flex-col items-center justify-center p-6">
            {/* Background Dots */}
            <div className={cn("absolute inset-0 z-0", "[background-size:20px_20px]", "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]")} />
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">

                <AnimatePresence mode="wait">
                    {/* Loading States */}
                    {(status === 'verifying' || status === 'registering') && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center justify-center p-8 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl ring-1 ring-black/[0.04] rounded-3xl w-full"
                        >
                            <Loader2 className="w-10 h-10 text-black animate-spin mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {status === 'verifying' ? 'Verifying Magic Link...' : 'Securing your spot...'}
                            </h2>
                            <p className="text-gray-500 text-center text-sm">
                                Please wait a moment while we process your request.
                            </p>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center p-8 bg-red-50/80 backdrop-blur-2xl border border-red-100 shadow-xl rounded-3xl w-full text-center"
                        >
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-2xl">
                                !
                            </div>
                            <h2 className="text-xl font-bold text-red-900 mb-2">Verification Failed</h2>
                            <p className="text-red-700 text-sm mb-6">{errorMessage}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Return Home
                            </button>
                        </motion.div>
                    )}

                    {/* Success State */}
                    {status === 'success' && userData && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                            className="w-full"
                        >
                            <div className="text-center mb-8">
                                <div className="mx-auto w-16 h-16 bg-green-100/80 rounded-full flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">You're on the list!</h1>
                                <p className="text-gray-500">Your spot has been secured successfully.</p>
                            </div>

                            {/* ✨ PLACEHOLDER FOR USER'S WAITLIST CARD ✨ */}
                            <div className="w-full aspect-[1.6/1] bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col p-8 justify-between text-white">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

                                <div>
                                    <p className="text-gray-400 font-medium text-sm tracking-widest uppercase mb-1">Waitlist Member</p>
                                    <h3 className="text-2xl font-bold font-sans tracking-tight">{userData.name}</h3>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Your Rank</p>
                                        <p className="text-4xl font-bold tabular-nums">#{userData.rank}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 font-mono text-xs mb-1 opacity-50">LATENTS.IO</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
