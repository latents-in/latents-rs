import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Check, Loader2, Download } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// --- Role-Specific SVGs & Themes ---
const ShapeFounder = () => (
    <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[130%] h-[130%] opacity-90 transition-transform duration-1000 ease-out animate-[spin_40s_linear_infinite]">
        <defs>
            <linearGradient id="founderG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#3730A3" />
            </linearGradient>
        </defs>
        <path d="M 50 5 C 65 5, 75 15, 75 30 C 90 30, 95 45, 95 50 C 95 55, 90 70, 75 70 C 75 85, 65 95, 50 95 C 35 95, 25 85, 25 70 C 10 70, 5 55, 5 50 C 5 45, 10 30, 25 30 C 25 15, 35 5, 50 5 Z" fill="url(#founderG)" />
    </svg>
);

const ShapeStudent = () => (
    <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[120%] h-[120%] opacity-90 transition-transform duration-1000 ease-out animate-[spin_30s_linear_infinite_reverse]">
        <defs>
            <linearGradient id="studentG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
        </defs>
        <g fill="url(#studentG)">
            <circle cx="50" cy="15" r="16" />
            <circle cx="75" cy="25" r="16" />
            <circle cx="85" cy="50" r="16" />
            <circle cx="75" cy="75" r="16" />
            <circle cx="50" cy="85" r="16" />
            <circle cx="25" cy="75" r="16" />
            <circle cx="15" cy="50" r="16" />
            <circle cx="25" cy="25" r="16" />
            <circle cx="50" cy="50" r="30" />
        </g>
    </svg>
);

const ShapeArtist = () => (
    <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[120%] h-[120%] opacity-90 transition-transform duration-1000 ease-out animate-[spin_35s_linear_infinite]">
        <defs>
            <linearGradient id="artistG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#9D174D" />
            </linearGradient>
        </defs>
        <g fill="url(#artistG)">
            <circle cx="50" cy="25" r="26" />
            <circle cx="75" cy="50" r="26" />
            <circle cx="50" cy="75" r="26" />
            <circle cx="25" cy="50" r="26" />
            <rect x="25" y="25" width="50" height="50" />
        </g>
    </svg>
);

const ShapeDestiny = () => (
    <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[130%] h-[130%] opacity-90 transition-transform duration-1000 ease-out animate-[spin_25s_linear_infinite_reverse]">
        <defs>
            <linearGradient id="destinyG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
        </defs>
        <path d="M 50 10 C 85 10, 90 40, 90 65 C 90 90, 65 90, 50 90 C 20 90, 10 70, 10 45 C 10 15, 25 10, 50 10 Z" fill="url(#destinyG)" />
    </svg>
);

const ROLES = {
    founder: { id: 'founder', label: 'Founder', accent: '#3730A3', shape: ShapeFounder },
    student: { id: 'student', label: 'Student', accent: '#EA580C', shape: ShapeStudent },
    artist: { id: 'artist', label: 'Artist', accent: '#BE185D', shape: ShapeArtist },
    destiny: { id: 'destiny', label: 'Define your destiny', accent: '#9333EA', shape: ShapeDestiny },
};


// --- Interactive 3D Stamp Component ---
const InteractiveStamp = ({ name, roleId, customRole, number, date }) => {
    const cardRef = React.useRef(null);
    const [transform, setTransform] = useState('');
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const activeRole = ROLES[roleId] || ROLES.founder;
    const displayNumber = number.toString().padStart(3, '0');

    // Determine display title — always show customRole if provided
    const displayTitle = customRole || activeRole.label;

    const ShapeComponent = activeRole.shape;

    const handleMove = (clientX, clientY) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlare({ x: glareX, y: glareY, opacity: 0.15 });
    };

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

    const handleEnter = () => setIsHovered(true);

    const handleLeave = () => {
        setIsHovered(false);
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
        setGlare({ ...glare, opacity: 0 });
    };

    return (
        <div
            className="relative flex items-center justify-center p-8 transition-all duration-500 ease-out"
            style={{ perspective: '1000px' }}
        >
            {/* Shadow Layer */}
            <div
                className="absolute w-[320px] h-[460px] bg-black/50 blur-2xl rounded-xl transition-all duration-300 pointer-events-none"
                style={{
                    transform: isHovered ? 'translateY(20px) scale(0.95)' : 'translateY(10px) scale(0.9)',
                    opacity: isHovered ? 0.8 : 0.5
                }}
            />

            {/* The Stamp */}
            <div
                id="waitlist-card-export"
                ref={cardRef}
                onMouseMove={onMouseMove}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onTouchMove={onTouchMove}
                onTouchStart={handleEnter}
                onTouchEnd={handleLeave}
                onTouchCancel={handleLeave}
                className="relative w-[340px] h-[480px] transition-transform duration-200 ease-out will-change-transform z-10 touch-none"
                style={{
                    transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Outer Perforated Wrapper (Pure White) */}
                <div
                    className="absolute inset-0 bg-white rounded-[2px]"
                    style={{
                        WebkitMaskImage: 'radial-gradient(circle, transparent 4px, black 4.5px)',
                        WebkitMaskSize: '16px 16px',
                        WebkitMaskPosition: '-8px -8px',
                        maskImage: 'radial-gradient(circle, transparent 4px, black 4.5px)',
                        maskSize: '16px 16px',
                        maskPosition: '-8px -8px',
                    }}
                />

                {/* Inner Card (Solid, protects text from mask) */}
                <div id="waitlist-card-export" className="absolute inset-[10px] overflow-hidden rounded-md bg-[#FAFAFA] shadow-[inset_0_0_20px_rgba(0,0,0,0.03)]">

                    {/* Colorful Role Shape Background */}
                    <ShapeComponent />

                    {/* Dynamic Glare Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-50"
                        style={{
                            opacity: glare.opacity,
                            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9) 0%, transparent 60%)`,
                        }}
                    />

                    {/* Content Container */}
                    <div
                        className="absolute inset-0 flex flex-col justify-between p-8 z-20 pointer-events-none"
                        style={{ transform: 'translateZ(30px)' }}
                    >
                        {/* Top Section */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col drop-shadow-md">
                                <span className="font-mono text-[10px] tracking-[0.2em] font-bold mb-1 text-gray-800">
                                    {date}
                                </span>
                                <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-gray-900">
                                    LATENTS.IN
                                </span>
                            </div>
                            <Command size={18} className="text-gray-800 drop-shadow-md" />
                        </div>

                        {/* Middle Typography */}
                        <div className="flex flex-col mt-12 mb-auto" style={{ transform: 'translateZ(40px)' }}>
                            <h2 className="font-sans font-black text-5xl leading-[0.9] tracking-tighter mb-4 text-gray-900 break-words drop-shadow-lg">
                                {name || 'Latent'}
                            </h2>
                            <p className="font-mono text-xs uppercase tracking-[0.15em] font-bold text-gray-800 drop-shadow-md">
                                {displayTitle}
                            </p>
                        </div>

                        {/* Bottom Badges */}
                        <div className="flex items-end justify-between w-full" style={{ transform: 'translateZ(20px)' }}>
                            <div className="flex flex-col gap-4">
                                <div className="flex -space-x-3 drop-shadow-md">
                                    <div
                                        className="w-12 h-12 rounded-full border-[2px] flex items-center justify-center rotate-[-10deg] bg-white/40 backdrop-blur-md z-10"
                                        style={{ borderColor: activeRole.accent }}
                                    >
                                        <div className="text-[8px] font-black tracking-tight text-center leading-[1.1] uppercase" style={{ color: activeRole.accent }}>
                                            First<br />Mover
                                        </div>
                                    </div>
                                    <div
                                        className="w-12 h-12 rounded-full border-[2px] flex items-center justify-center bg-white/40 backdrop-blur-md z-0"
                                        style={{ borderColor: activeRole.accent }}
                                    >
                                        <div className="text-sm font-black tracking-tighter" style={{ color: activeRole.accent }}>
                                            #{displayNumber}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Number Indicator */}
                            <div className="flex flex-col items-end text-right">
                                <span className="font-mono text-[9px] tracking-[0.15em] text-gray-500 uppercase font-bold">
                                    Waitlist Rank
                                </span>
                                <div className="font-mono text-2xl font-black tracking-tighter text-gray-900 drop-shadow-md leading-tight">
                                    #{displayNumber}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default function WaitlistSuccess() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, registering, success, error
    const [userData, setUserData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // With PKCE flow, Supabase redirects with ?code= in the URL.
                // We must exchange the code for a session before calling getSession().
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');

                if (code) {
                    // Exchange the PKCE code for a session
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) throw exchangeError;
                    // Clean the URL so the code isn't re-used on refresh
                    window.history.replaceState({}, '', '/verify');
                }

                // 1. Check if we have a session (means magic link was successful)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;
                if (!session) {
                    throw new Error('No active session found. Please try logging in again.');
                }

                const user = session.user;
                const metadata = user.user_metadata || {};

                // Read role/name from localStorage (saved before magic link was sent)
                // This is more reliable than metadata for existing Supabase users
                const pendingRole = localStorage.getItem('latents_pending_role');
                const pendingName = localStorage.getItem('latents_pending_name');
                // Clean up localStorage after reading
                localStorage.removeItem('latents_pending_role');
                localStorage.removeItem('latents_pending_name');

                const resolvedRole = pendingRole || metadata.role || null;
                const resolvedName = pendingName || metadata.full_name || 'Early Adopter';

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
                        name: resolvedName,
                        location: metadata.location || 'Unknown',
                        role: resolvedRole,
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
                    name: resolvedName,
                    rank: data.rank || 1,
                    role: resolvedRole || data.role || null,
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
                                <h1
                                    className="text-3xl font-bold mb-3"
                                    style={{
                                        background: 'linear-gradient(135deg, #059669, #10b981, #34d399)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    Congratulations<span style={{ WebkitTextFillColor: '#F59E0B', color: '#F59E0B' }}>✨</span>
                                </h1>
                                <p className="text-gray-700 font-medium text-[15px] leading-relaxed max-w-xs mx-auto">
                                    You'll be among the first{' '}
                                    <strong className="font-black text-gray-900">1,000</strong>{' '}
                                    <span className="font-semibold tracking-wide">PEOPLE</span>{' '}to receive a{' '}
                                    <strong className="font-black uppercase text-gray-900">Free Month</strong>{' '}of access.
                                </p>
                            </div>

                            {/* Interactive Waitlist Card */}
                            <div className="flex flex-col items-center justify-center w-full mt-4">
                                <InteractiveStamp
                                    name={userData.name}
                                    roleId={(() => {
                                        const r = (userData.role || '').toLowerCase();
                                        if (r === 'founder') return 'founder';
                                        if (r === 'student') return 'student';
                                        if (r === 'artist') return 'artist';
                                        return 'destiny';
                                    })()}
                                    customRole={(userData.role || 'FIRST MOVER').toUpperCase()}
                                    number={userData.rank}
                                    date={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                />

                                {/* Confetti animation on success */}
                                <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
                                    <DotLottieReact
                                        src="https://lottie.host/b28550e9-dcdb-4ee8-a17d-65fedf2c4864/nAQ6bL4EgY.lottie"
                                        autoplay
                                        loop={false}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>

                                <div className="flex gap-3 mt-6 w-full max-w-[340px] justify-center">
                                    <button
                                        onClick={async () => {
                                            const element = document.getElementById('waitlist-card-export');
                                            if (!element) return;
                                            try {
                                                const domtoimage = (await import('dom-to-image-more')).default;
                                                const dataUrl = await domtoimage.toPng(element, {
                                                    quality: 1,
                                                    scale: 4,
                                                    bgcolor: '#FAFAFA',
                                                    width: element.offsetWidth,
                                                    height: element.offsetHeight,
                                                    style: {
                                                        transform: 'none',
                                                        borderRadius: '6px',
                                                        overflow: 'hidden',
                                                    }
                                                });
                                                const link = document.createElement('a');
                                                link.download = `latents-stamp-${userData.rank}.png`;
                                                link.href = dataUrl;
                                                link.click();
                                            } catch (err) {
                                                console.error('Failed to download', err);
                                                alert('Download failed. Please try again.');
                                            }
                                        }}
                                        className="flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-all shadow-lg"
                                    >
                                        <Download size={16} />
                                        <span>Download Stamp</span>
                                    </button>
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
