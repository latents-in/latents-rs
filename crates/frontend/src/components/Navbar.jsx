import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import JoinWaitlistModal from "./JoinWaitlistModal";
import latentsLogo from "../assets/latents.webp";

export default function Navbar() {
    const navigate = useNavigate();
    const [hidden, setHidden] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const location = useLocation();
    const isWaitlistSuccessPage = location.pathname === '/verify';

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const handleJoinSubmit = async ({ name, email, role }) => {
        setIsLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, location: 'Unknown', role }),
            });

            const data = await response.json();

            if (!response.ok && response.status !== 409) {
                throw new Error(data.message || data.error || 'Failed to join waitlist');
            }

            setIsModalOpen(false);
            navigate('/verify', { state: { name, rank: data.rank || 1, role } });
        } catch (error) {
            console.error("Submission error:", error);
            window.dispatchEvent(new CustomEvent('waitlist-submitted', { detail: 'Error: ' + error.message }));
            setIsModalOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: "-100%", opacity: 0 },
                }}
                initial="visible"
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4"
            >
                <div className="flex items-center justify-between px-2 md:px-2 py-2 glass-nav rounded-full shadow-sm pointer-events-auto w-full max-w-5xl bg-white/70 backdrop-blur-xl">
                    {/* Logo */}
                    <Link to="/" className="flex items-center pl-4 pr-6">
                        <span className="font-display font-medium text-2xl tracking-tight flex items-center gap-2">
                            <span className="font-bold leading-normal text-black">
                                Latents
                            </span>
                            <img src={latentsLogo} alt="Latents Logo" className="w-7  object-cover" />

                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-1">
                        {isWaitlistSuccessPage ? (
                            <Link
                                to="/"
                                className="pill-button pill-button-primary px-5 py-2.5 text-[15px] font-bold"
                            >
                                Back to Home
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="pill-button pill-button-primary px-5 py-2.5 text-[15px] font-bold"
                            >
                                Get Early Access
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>

            <JoinWaitlistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleJoinSubmit}
                isLoading={isLoading}
            />
        </>
    );
}
