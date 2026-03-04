import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    return (
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
                    {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-2 hidden md:block" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M11 5H5V19H11V21H3V3H11V5ZM13 19H19V5H13V3H21V21H13V19ZM16 13H8V11H16V13Z" fill="#000000e6" />
                    </svg> */}
                    <span className="font-display font-medium text-2xl tracking-tight text-[#000000e6] flex items-center gap-2">
                        Latents
                    </span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 pr-1">
                    <a
                        href="#wailist"
                        className="pill-button pill-button-primary px-5 py-2.5 text-[15px] font-bold"
                    >
                        Join Waitlist
                    </a>
                </div>
            </div>
        </motion.nav>
    );
}
