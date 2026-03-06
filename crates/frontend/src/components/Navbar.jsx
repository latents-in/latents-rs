import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Link } from "react-router-dom";
import JoinWaitlistModal from "./JoinWaitlistModal";

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        // Save to localStorage so WaitlistSuccess can pick it up after redirect
        if (role) localStorage.setItem('latents_pending_role', role);
        if (name) localStorage.setItem('latents_pending_name', name);

        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                data: { full_name: name, role: role || 'Unknown' },
                emailRedirectTo: `${window.location.origin}/verify`,
            },
        });
        if (error) throw error;
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
                        <span className="font-display font-medium text-2xl tracking-tight text-[#000000e6] flex items-center gap-2">
                            Latents
                        </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-1">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="pill-button pill-button-primary px-5 py-2.5 text-[15px] font-bold"
                        >
                            Get Early Access
                        </button>
                    </div>
                </div>
            </motion.nav>

            <JoinWaitlistModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleJoinSubmit}
            />
        </>
    );
}
