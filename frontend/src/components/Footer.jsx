import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Mail, MapPin, Phone, Github, Twitter, Facebook, Instagram } from 'lucide-react';
import kyanonLogo from '../assets/kyanon.png';
import niieLogo from '../assets/NIIE.webp';
import nttuLogo from '../assets/NTTU.webp';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-20 w-full overflow-hidden border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-3xl">
            {/* Gradient Glow */}
            <div className="absolute -top-px left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">

                    {/* Left: Logos (NTTU, NIIE, QuizVibe, Kyanon) */}
                    <div className="flex flex-row items-center justify-center md:justify-start gap-[18px] overflow-visible">
                        {/* NTTU & NIIE Group */}
                        <div className="flex items-center gap-3 shrink-0">
                            <a href="https://ntt.edu.vn/" target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105 active:scale-95">
                                <img
                                    src={nttuLogo}
                                    alt="NTTU"
                                    className="h-7 md:h-10 w-auto object-contain brightness-110"
                                />
                            </a>
                            <a href="https://niie.edu.vn/" target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105 active:scale-95">
                                <img
                                    src={niieLogo}
                                    alt="NIIE"
                                    className="h-9 md:h-11 w-auto object-contain brightness-110"
                                />
                            </a>
                        </div>

                        {/* QuizVibe Group */}
                        <div className="flex items-center gap-2 px-[18px] border-x border-slate-800/50 leading-none shrink-0">
                            <BrainCircuit className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                            <span className="text-base md:text-lg font-bold tracking-tight text-white hidden sm:inline">
                                QuizVibe<span className="text-blue-500">.</span>
                            </span>
                        </div>

                        {/* Kyanon Group */}
                        <div className="flex items-center shrink-0">
                            <a href="https://kyanon.digital/" target="_blank" rel="noopener noreferrer" className="block transition-transform hover:scale-105 active:scale-95">
                                <img
                                    src={kyanonLogo}
                                    alt="Kyanon Digital"
                                    className="h-7 md:h-9 w-auto object-contain brightness-110"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Center: Copyright */}
                    <div className="flex justify-center items-center">
                        <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">
                            © 2026 QuizVibe AI. All rights reserved.
                        </p>
                    </div>

                    {/* Right: Support Links */}
                    <div className="flex justify-center md:justify-end items-center">
                        <ul className="flex flex-row items-center gap-x-4 lg:gap-x-6 text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">
                            <li><Link to="/contact" className="transition hover:text-blue-400">Liên hệ</Link></li>
                            <li><Link to="/privacy" className="transition hover:text-blue-400">Bảo mật</Link></li>
                            <li><Link to="/terms" className="transition hover:text-blue-400">Điều khoản</Link></li>
                        </ul>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;
