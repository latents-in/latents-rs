import React from 'react';
import { motion } from 'framer-motion';

export default function Features() {
    const flags = [
        "Developer in India 🇮🇳", "Export agent from China 🇨🇳", "UX designer in Argentina 🇦🇷",
        "Support in Philippines 🇵🇭", "Import agent from Nigeria 🇳🇬", "Design firm from Singapore 🇸🇬",
        "Property agent in the UAE 🇦🇪", "Accounting in Cayman Islands 🇰🇾", "Brand designer in Ukraine 🇺🇦",
        "Startup in US 🇺🇸"
    ];

    return (
        <section className="py-24 bg-black text-white relative font-sans">
            <div className="max-w-5xl mx-auto px-4 md:px-6">

                {/* Value Prop 1 */}
                <div className="mb-32">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-display font-medium tracking-tight mb-8 leading-[1.1]"
                    >
                        We exist to make getting <br className="hidden md:block" />
                        paid faster, easier and <br className="hidden md:block" />
                        cheaper in any currency <br className="hidden md:block" />
                        you want.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-[20px] text-[#888888] max-w-2xl font-normal leading-relaxed mb-8"
                    >
                        Let your customers pay in dollars, euros or stablecoins (more coming soon).
                        And, of course, get paid in whatever way works best for you.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <button className="pill-button pill-button-primary px-6 py-3 text-[15px]">
                            Make an invoice
                        </button>
                    </motion.div>
                </div>

                {/* Pricing Card */}
                <div className="mb-32">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-12"
                    >
                        With simple pricing
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="acctual-card p-10 md:p-14 max-w-2xl bg-[#0A0A0A] relative overflow-hidden group"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-10 mb-10">
                            <div>
                                <p className="text-[#888888] font-medium mb-2 uppercase tracking-widest text-sm">Invoicing</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl md:text-8xl font-display font-medium">1%</span>
                                </div>
                                <p className="text-[#888888] mt-2">per payment</p>
                                <p className="text-[#555555] text-sm mt-1">0% on same method & currency</p>
                            </div>
                            <div>
                                <button className="pill-button pill-button-secondary px-8 py-4 text-[16px]">
                                    Get started
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-[#888888] font-medium mb-4 uppercase tracking-widest text-sm">Usage</p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-[17px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                        Unlimited invoices
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-[#888888] font-medium mb-4 uppercase tracking-widest text-sm">Features</p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-[17px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                        Flexible payment options (1%)
                                    </li>
                                    <li className="flex items-center gap-3 text-[17px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                        Automated QBO/Xero sync
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Marquee Section */}
                <div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="text-3xl md:text-5xl font-display font-medium tracking-tight mb-12 leading-[1.2]"
                    >
                        Euros, Dollars, Yens, USDC, <br className="hidden md:block" />
                        USDT… we do it all and we <br className="hidden md:block" />
                        do it fast.
                    </motion.h2>
                </div>
            </div>

            {/* CSS Marquee */}
            <div className="w-full overflow-hidden flex whitespace-nowrap mt-10 py-6 border-y border-white/5 bg-[#050505]">
                <div className="animate-marquee flex gap-12 px-6 items-center">
                    {[...flags, ...flags].map((flag, i) => (
                        <span key={i} className="text-xl md:text-2xl font-medium text-[#888] hover:text-white transition-colors cursor-default">
                            {flag}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
