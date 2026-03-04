import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '../lib/utils';
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

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setStatus('');

        try {
            // Use relative URL when frontend and API are same origin
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus(data.error || 'Something went wrong.');
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatus('Failed to connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen bg-[#FDFDFD] overflow-hidden font-sans flex flex-col items-center justify-center">

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

            {/* Central Content — always visible, centered */}
            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto px-6">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[38px] sm:text-[48px] md:text-[52px] lg:text-[62px] font-bold tracking-tighter text-black leading-[1.05] mb-4"
                >
                    All <span className="text-gray-300 font-medium tracking-tight">[Hidden]</span> Opportunities.<br />
                    One Place.
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                    className="text-[#86868b] text-[15px] sm:text-[17px] font-medium tracking-tight mb-8"
                >
                    Stop consuming,{' '}
                    <span className="text-[#1d1d1f] font-semibold">Start Acting.</span>
                </motion.p>

                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    onSubmit={handleSubmit}
                    className="relative w-full max-w-[460px] mx-auto p-1.5 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                >
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-5 pr-[120px] py-3 rounded-full focus:outline-none bg-transparent text-[15px] sm:text-[17px] text-[#1d1d1f] font-medium placeholder:text-[#86868b] placeholder:font-normal"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 sm:px-5 h-[42px] bg-[#1d1d1f] hover:bg-black hover:scale-105 active:scale-95 transition-all duration-300 rounded-full flex items-center justify-center text-white text-[13px] sm:text-[15px] font-semibold tracking-wide shadow-sm disabled:opacity-75 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Joining...' : 'Join Waitlist'}
                    </button>
                </motion.form>

                {/* Status Message */}
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 text-[14px] font-medium tracking-tight px-4 py-2 rounded-full border backdrop-blur-md ${status === 'success'
                            ? 'bg-green-50/80 text-green-700 border-green-200'
                            : 'bg-red-50/80 text-red-700 border-red-200'
                            }`}
                    >
                        {status === 'success' ? 'Thanks for joining our waitlist!' : status}
                    </motion.div>
                )}
            </div>


            {/* ============================================================ */}
            {/* DECORATIVE PNGs — responsive positioning and sizing            */}
            {/* ============================================================ */}

            {/* Six Image - Centre-Right Top */}
            <motion.div
                initial={{ opacity: 0, x: 80, y: -20, rotate: -15 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 5 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[3%] right-[-5%] md:top-[6%] md:left-[55%] md:right-auto z-0 md:z-20"
            >
                <img src={six} alt="six" className="w-[140px] md:w-[280px] lg:w-[320px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)] opacity-50 md:opacity-100" />
            </motion.div>

            {/* Twitter & Seven Image */}
            <motion.div
                initial={{ opacity: 0, x: 100, y: 0, rotate: 15 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: -14 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[18%] right-[-10%] md:top-[22%] md:left-[77%] md:right-auto z-0 md:z-20"
            >
                <img src={seven} alt="Twitter" className="w-[130px] md:w-[260px] lg:w-[300px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)] opacity-50 md:opacity-100" />
            </motion.div>

            {/* Email & Eight Image */}
            <motion.div
                initial={{ opacity: 0, x: 120, y: 20, rotate: -10 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 10 }}
                transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[40%] right-[-5%] md:top-[47%] md:left-[75%] md:right-auto z-0 md:z-20"
            >
                <img src={eight} alt="Email" className="w-[110px] md:w-[220px] lg:w-[250px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)] opacity-40 md:opacity-100" />
            </motion.div>

            {/* Opportunity & Nine Image */}
            <motion.div
                initial={{ opacity: 0, x: 90, y: 40, rotate: 20 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 8 }}
                transition={{ duration: 1, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[60%] right-[5%] md:top-[62%] md:left-[65%] md:right-auto z-0 md:z-20"
            >
                <img src={nine} alt="Opportunity" className="w-[120px] md:w-[220px] lg:w-[250px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)] opacity-50 md:opacity-100" />
            </motion.div>

            {/* ===== TILTED MARQUEE STRIP ===== */}
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
                    <div aria-hidden className="flex gap-6 animate-marquee whitespace-nowrap shrink-0 px-4">
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

            {/* Ten / Newspaper Image - Bottom Right */}
            <motion.div
                initial={{ opacity: 0, x: 150, y: 80, rotate: 10 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-[-5%] right-[-10%] md:bottom-0 md:right-0 z-20"
            >
                <img src={ten} alt="Newspaper" className="w-[180px] md:w-[300px] lg:w-[400px] drop-shadow-[0px_-20px_40px_rgba(0,0,0,0.15)] opacity-80 md:opacity-100" />
            </motion.div>

            {/* Ground Breaker & Five Image */}
            <motion.div
                initial={{ opacity: 0, x: -80, y: -20, rotate: -25 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: -3 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[5%] left-[-5%] md:top-[8%] md:left-[20%] z-0 md:z-10"
            >
                <img src={five} alt="Ground Breaker" className="w-[120px] md:w-[200px] lg:w-[240px] drop-shadow-[0px_10px_10px_rgba(139,32,21,0.8)] opacity-60 md:opacity-100" />
            </motion.div>

            {/* SeriesA Image */}
            <motion.div
                initial={{ opacity: 0, x: -100, y: 0, rotate: 25 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 10 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[20%] left-[-2%] md:top-[25%] md:left-[3%] z-0 md:z-20"
            >
                <img src={one} alt="SeriesA" className="w-[130px] md:w-[230px] lg:w-[270px] drop-shadow-[0px_25px_40px_rgba(0,0,0,0.15)] opacity-50 md:opacity-100" />
            </motion.div>

            {/* Find Accelerators Image */}
            <motion.div
                initial={{ opacity: 0, x: -120, y: 20, rotate: -20 }}
                animate={{ opacity: 1, x: 0, y: 50, rotate: -6 }}
                transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[40%] left-[-8%] md:top-[48%] md:left-[6%] z-0 md:z-20"
            >
                <img src={four} alt="findAccelerators" className="w-[120px] md:w-[210px] lg:w-[255px] drop-shadow-[0px_25px_20px_rgba(0,0,0,0.4)] opacity-40 md:opacity-100" />
            </motion.div>

            {/* Show Me & Three Image */}
            <motion.div
                initial={{ opacity: 0, x: -90, y: 60, rotate: 15 }}
                animate={{ opacity: 1, x: 0, y: 20, rotate: 7 }}
                transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[65%] left-[0%] md:top-[65%] md:left-[25%] z-0 md:z-20"
            >
                <img src={three} alt="ShowMe" className="w-[150px] md:w-[300px] lg:w-[380px] drop-shadow-[0px_25px_20px_rgba(0,0,0,0.3)] opacity-60 md:opacity-100" />
            </motion.div>

            {/* Dollar Image - Bottom Left */}
            <motion.div
                initial={{ opacity: 0, x: -150, y: 280, rotate: -15 }}
                animate={{ opacity: 1, x: 0, y: 150, rotate: 30 }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-5 left-[-5%] md:left-10 z-20"
            >
                <img src={dollarImg} alt="Dollar" className="w-[140px] md:w-[260px] lg:w-[340px] drop-shadow-[0px_-20px_40px_rgba(0,0,0,0.12)] opacity-80 md:opacity-100" />
            </motion.div>

            {/* Lottie Animation */}
            <motion.div
                initial={{ opacity: 0, x: 100, y: 100 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="absolute md:bottom-[0%] right-[-5%] bottom-[-2%] md:left-[8%] md:right-auto w-32 md:w-48 lg:w-64 z-20 pointer-events-none"
            >
                <DotLottieReact
                    src="https://lottie.host/7a69ede1-1eca-49b8-82f7-17a0e04f68b4/aVFlcIgc4F.lottie"
                    loop
                    autoplay
                />
            </motion.div>

        </div>
    );
}
