import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Shield } from 'lucide-react';
import kyanonLogo from '../assets/kyanon.png';
import niieLogo from '../assets/NIIE.webp';
import nttuLogo from '../assets/NTTU.webp';

/**
 * GameFooter — Footer riêng cho các trang Edu Game (Solo Adventure, Live Challenge).
 * Thiết kế compact, tông tối #0a0e1a, đồng bộ logo/link giống Footer chính
 * nhưng tách biệt hoàn toàn để tránh ảnh hưởng toàn cục.
 */
const GameFooter = ({ mode = 'Solo Adventure', topic = '' }) => {
  return (
    <footer className="relative z-20 border-t border-slate-700/15 bg-[#0a0e1a]/90 backdrop-blur-xl">
      {/* Top glow line */}
      <div className="absolute -top-px left-1/2 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Left: Game mode + logos */}
          <div className="flex items-center gap-4">
            {/* Game mode tag */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-cyan-500/60" />
              <span className="font-bold">{mode}</span>
            </div>

            <div className="w-px h-4 bg-slate-700/30 hidden sm:block" />

            {/* Logos row - compact */}
            <div className="hidden sm:flex items-center gap-3">
              <a href="https://ntt.edu.vn/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                <img src={nttuLogo} alt="NTTU" className="h-5 w-auto object-contain brightness-90 opacity-50 hover:opacity-80 transition-opacity" />
              </a>
              <a href="https://niie.edu.vn/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                <img src={niieLogo} alt="NIIE" className="h-6 w-auto object-contain brightness-90 opacity-50 hover:opacity-80 transition-opacity" />
              </a>
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700/30">
                <BrainCircuit className="h-3.5 w-3.5 text-blue-400/60" />
                <span className="text-[11px] font-bold text-slate-500">
                  QuizVibe<span className="text-blue-500/60">.</span>
                </span>
              </div>
              <a href="https://kyanon.digital/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 pl-2 border-l border-slate-700/30">
                <img src={kyanonLogo} alt="Kyanon Digital" className="h-5 w-auto object-contain brightness-90 opacity-50 hover:opacity-80 transition-opacity" />
              </a>
            </div>

            {/* Topic label */}
            {topic && (
              <>
                <div className="w-px h-4 bg-slate-700/30 hidden md:block" />
                <span className="hidden md:inline text-[10px] text-slate-600 font-medium truncate max-w-[180px]">{topic}</span>
              </>
            )}
          </div>

          {/* Center: Copyright */}
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest hidden lg:block">
            © 2026 QuizVibe AI
          </p>

          {/* Right: Links */}
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-x-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <li><Link to="/contact" className="transition hover:text-cyan-400">Liên hệ</Link></li>
              <li><Link to="/privacy" className="transition hover:text-cyan-400">Bảo mật</Link></li>
              <li><Link to="/terms" className="transition hover:text-cyan-400">Điều khoản</Link></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default GameFooter;
