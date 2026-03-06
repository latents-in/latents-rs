import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import JoinWaitlistModal from './JoinWaitlistModal';

import one from '../assets/1.webp';
import four from '../assets/4.webp';
import five from '../assets/5.webp';
import three from '../assets/3.webp';
import six from '../assets/6.webp';
import seven from '../assets/7.webp';
import eight from '../assets/8.webp';
import nine from '../assets/9.webp';
import ten from '../assets/10.webp';
import dollarImg from '../assets/dollar.webp';
import loaderVideo from '../assets/loader.webm';

export default function LandingPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [browserLocation, setBrowserLocation] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Preload images
    useEffect(() => {
        const imageUrls = [one, three, four, five, six, seven, eight, nine, ten, dollarImg];

        let loadedCount = 0;

        imageUrls.forEach(url => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === imageUrls.length) {
                    setImagesLoaded(true);
                }
            };
            // In case an image fails to load, we still want to proceed eventually
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === imageUrls.length) {
                    setImagesLoaded(true);
                }
            };
            img.src = url;
        });
    }, []);

    // Try to get browser geolocation on component mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Get location from coordinates using reverse geocoding
                    fetchLocationFromCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.log('Browser geolocation denied or failed:', error);
                    // Location will be detected server-side from IP
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        }
    }, []);

    // Fetch location from coordinates using a free reverse geocoding API
    const fetchLocationFromCoords = async (lat, lon) => {
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (response.ok) {
                const data = await response.json();
                const locationParts = [];
                if (data.city) locationParts.push(data.city);
                if (data.principalSubdivision) locationParts.push(data.principalSubdivision);
                if (data.countryName) locationParts.push(data.countryName);

                if (locationParts.length > 0) {
                    setBrowserLocation(locationParts.join(', '));
                }
            }
        } catch (error) {
            console.log('Failed to get location from coordinates:', error);
        }
    };

    const handleJoinSubmit = async ({ name, email, role }) => {
        setIsLoading(true);
        setStatus('');

        try {
            // Use browser location if available, otherwise just 'Unknown'
            const locationToSend = browserLocation || 'Unknown';

            // Save role + name in localStorage so WaitlistSuccess can read them
            // after the magic link redirect (Supabase doesn't always update
            // existing user metadata on repeat OTP sign-ins)
            if (role) localStorage.setItem('latents_pending_role', role);
            if (name) localStorage.setItem('latents_pending_name', name);

            // Send Magic Link via Supabase Auth
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    // Send user metadata to Supabase so we have it after they click the link
                    data: {
                        full_name: name,
                        location: locationToSend,
                        role: role || 'Unknown',
                    },
                    // Redirect back to home so we can intercept the auth change and register them
                    emailRedirectTo: `${window.location.origin}/verify`
                }
            });

            if (error) throw error;

            setStatus('magic_link_sent');
            setIsModalOpen(false);
        } catch (error) {
            console.error("Submission error:", error);
            setStatus('Failed to send magic link: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!imagesLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <video
                    src={loaderVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-24 h-24 md:w-32 md:h-32 object-contain"
                />
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen bg-[#FDFDFD] overflow-hidden font-sans flex flex-col items-center justify-center">
            {/* Background Content Wrapper - blurs when modal is open */}
            <div className={cn(
                "absolute inset-0 z-0 transition-all duration-700",
                isModalOpen ? "blur-[12px] brightness-75 scale-[0.98]" : "blur-0 brightness-100 scale-100"
            )}>
                {/* ====== ACETERNITY DOT BACKGROUND ====== */}
                <div
                    className={cn(
                        "absolute inset-0 z-0",
                        "[background-size:20px_20px]",
                        "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]"
                    )}
                />
                {/* Radial gradient mask for faded center look */}
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

                {/* Decorative Elements - blurs with wrapper */}
                {/* Six Image */}
                <motion.div
                    initial={{ opacity: 0, x: 80, y: -20, rotate: -15 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: 5 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[10%] right-[0%] md:top-[6%] md:left-[55%] md:right-auto z-10 md:z-20"
                >
                    <img src={six} alt="six" className="w-[140px] md:w-[280px] lg:w-[320px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)]" />
                </motion.div>

                {/* Twitter & Seven Image */}
                <motion.div
                    initial={{ opacity: 0, x: 100, y: 0, rotate: 15 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: -14 }}
                    transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[22%] right-[-5%] md:top-[22%] md:left-[77%] md:right-auto z-10 md:z-20"
                >
                    <img src={seven} alt="Twitter" className="w-[160px] md:w-[260px] lg:w-[300px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)]" />
                </motion.div>

                {/* Email & Eight Image */}
                <motion.div
                    initial={{ opacity: 0, x: 120, y: 20, rotate: -10 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: 10 }}
                    transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[40%] right-[-5%] md:top-[47%] md:left-[75%] md:right-auto z-10 md:z-20"
                >
                    <img src={eight} alt="Email" className="w-[110px] md:w-[220px] lg:w-[250px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)]" />
                </motion.div>

                {/* Opportunity & Nine Image */}
                <motion.div
                    initial={{ opacity: 0, x: 90, y: 40, rotate: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: 8 }}
                    transition={{ duration: 1, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[60%] right-[5%] md:top-[62%] md:left-[65%] md:right-auto z-10 md:z-20"
                >
                    <img src={nine} alt="Opportunity" className="w-[120px] md:w-[220px] lg:w-[250px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)]" />
                </motion.div>

                {/* Tilted Marquee */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.8 }}
                    className="absolute top-[75%] md:top-[74%] right-[-20%] md:right-[-10%] w-[180%] overflow-hidden z-10 -rotate-[10deg] origin-bottom-right pointer-events-none"
                >
                    <div className="flex gap-0 overflow-hidden py-1">
                        <div className="flex gap-6 animate-marquee whitespace-nowrap shrink-0 px-4">
                            {['Series A Announced', 'Hidden Opportunities', 'Find Accelerators', 'Ground Breakers', 'YC W26', 'Latents', 'Deal Flow', 'Missed Chances', 'OpenAI $40B', 'Investor Outreach', 'Stealth Mode', 'Term Sheet', 'Venture Capital', 'Seed Round'].map((t, i) => {
                                const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500'];
                                const dotColor = colors[i % colors.length];
                                return (
                                    <span key={i} className="inline-flex items-center gap-1.5 md:gap-2 bg-[#F0F0F0] text-[#B0B0B0] text-[11px] md:text-[13px] font-semibold tracking-widest uppercase px-3 md:px-5 py-1.5 md:py-2 rounded-full border border-[#E0E0E0]">
                                        <span className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${dotColor} inline-block shrink-0`} />
                                        {t}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Ten / Newspaper Image */}
                <motion.div
                    initial={{ opacity: 0, x: 150, y: 80, rotate: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                    transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-0 right-0 z-20"
                >
                    <img src={ten} alt="Newspaper" className="w-[320px] md:w-[300px] lg:w-[450px] drop-shadow-[-20px_40px_50px_rgba(156,163,175,1)]" />
                </motion.div>

                {/* Other assets... (compressed for brevity in replacement) */}
                <motion.div
                    initial={{ opacity: 0, x: -80, y: -20, rotate: -25 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: -3 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[10%] left-[2%] md:top-[8%] md:left-[20%] z-10"
                >
                    <img src={five} alt="Ground Breaker" className="w-[120px] md:w-[200px] lg:w-[240px] drop-shadow-[0px_10px_10px_rgba(139,32,21,0.8)]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -100, y: 0, rotate: 25 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: 10 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[20%] left-[-2%] md:top-[25%] md:left-[3%] z-10 md:z-20"
                >
                    <img src={one} alt="SeriesA" className="w-[130px] md:w-[230px] lg:w-[270px] drop-shadow-[0px_25px_30px_rgba(156,163,175,0.8)]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -120, y: 20, rotate: -20 }}
                    animate={{ opacity: 1, x: 0, y: 50, rotate: -6 }}
                    transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[40%] left-[-8%] md:top-[48%] md:left-[6%] z-10 md:z-20"
                >
                    <img src={four} alt="findAccelerators" className="w-[120px] md:w-[210px] lg:w-[255px] drop-shadow-[0px_25px_20px_rgba(0,0,0,0.4)]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -90, y: 60, rotate: 15 }}
                    animate={{ opacity: 1, x: 0, y: 20, rotate: 7 }}
                    transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-[65%] left-[0%] md:top-[65%] md:left-[25%] z-10 md:z-20"
                >
                    <img src={three} alt="ShowMe" className="w-[250px] md:w-[300px] lg:w-[380px] drop-shadow-[0px_25px_20px_rgba(0,0,0,0.3)]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -150, y: 280, rotate: -15 }}
                    animate={{ opacity: 1, x: 0, y: 150, rotate: 30 }}
                    transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-5 left-[-5%] md:left-10 z-20"
                >
                    <img src={dollarImg} alt="Dollar" className="w-[140px] md:w-[260px] lg:w-[340px] drop-shadow-[0px_-20px_40px_rgba(0,0,0,0.12)]" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 100, y: 100 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-[0%] left-[1%] md:bottom-[0%] md:left-[8%] md:right-auto w-40 md:w-48 lg:w-64 z-20 pointer-events-none"
                >
                    <DotLottieReact
                        src="https://lottie.host/7a69ede1-1eca-49b8-82f7-17a0e04f68b4/aVFlcIgc4F.lottie"
                        loop
                        autoplay
                    />
                </motion.div>
            </div>

            {/* Central Content — also blurs but stays separately handled from modal */}
            <div className={cn(
                "relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto px-6 transition-all duration-700",
                isModalOpen ? "blur-[8px] scale-[0.98] brightness-75" : "blur-0 scale-100 brightness-100"
            )}>
                <motion.h1
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[38px] sm:text-[48px] md:text-[52px] lg:text-[62px] font-bold tracking-tighter text-black leading-[1.05] mb-4"
                >
                    All <span className="text-gray-300 font-medium tracking-tight">[Hidden]</span> Opportunities.<br />
                    One Place.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                    className="text-[#86868b] text-[15px] sm:text-[17px] font-medium tracking-tight mb-8"
                >
                    Stop consuming,{' '}
                    <span className="text-[#1d1d1f] font-semibold">Start Acting.</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-[300px] mx-auto"
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full px-8 py-4 bg-[#1d1d1f] hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-full flex items-center justify-center text-white text-[16px] sm:text-[18px] font-bold tracking-wide shadow-lg border border-black/10"
                    >
                        Get Early Access
                    </button>

                    <p className="text-[12px] text-gray-400 mt-4 font-medium flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Secured by Magic Link
                    </p>
                </motion.div>

                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-6 text-[15px] font-medium tracking-tight px-6 py-3 rounded-full border backdrop-blur shadow-sm ${status === 'magic_link_sent'
                                ? 'bg-green-50/90 text-green-800 border-green-200'
                                : 'bg-red-50/90 text-red-800 border-red-200'
                                }`}
                        >
                            {status === 'magic_link_sent'
                                ? <span>✨ Magic link sent! Check your inbox — <strong>don't forget to look in your Promotions tab</strong> if you don't see it.</span>
                                : status}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal - rendered outside the blurred containers */}
            <JoinWaitlistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleJoinSubmit}
                isLoading={isLoading}
                browserLocation={browserLocation}
            />
        </div>
    );
}

