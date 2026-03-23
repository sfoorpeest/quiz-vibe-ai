import React, { useRef } from 'react';
import { BookOpen, Trophy, Lightbulb, Sparkles, Globe, Compass } from 'lucide-react';
import { motion, useAnimationFrame } from 'framer-motion';

const Draggable3DItem = ({ children, className, initialY, initialX, initialRotateX, initialRotateY, delay }) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
      whileHover={{ scale: 1.1, cursor: "grab" }}
      whileDrag={{ scale: 1.2, cursor: "grabbing" }}
      dragElastic={0.2}
      initial={{ y: initialY, x: initialX, rotateX: initialRotateX, rotateY: initialRotateY }}
      animate={{
        y: [initialY, initialY - 30, initialY],
        rotateX: [initialRotateX, initialRotateX - 10, initialRotateX],
        rotateY: [initialRotateY, initialRotateY + 20, initialRotateY],
      }}
      transition={{
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
        delay: delay,
      }}
      className={`absolute z-10 flex items-center justify-center bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-700/50 p-5 lg:p-6 transform-3d ${className}`}
      style={{ touchAction: "none" }}
    >
      <div className="filter drop-shadow-md text-inherit" style={{ transform: 'translateZ(40px)' }}>
        {children}
      </div>
    </motion.div>
  );
};

const AnimatedBackground = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-20 w-full h-full overflow-hidden bg-slate-950 perspective-1000 overflow-y-hidden">
      
      {/* Brighter and larger background glowing blobs (blue & purple palette) */}
      <div className="absolute top-[-5%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/20 blur-[130px] animate-blob" />
      <div className="absolute top-[15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-600/20 blur-[140px] animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[-5%] w-[65vw] h-[65vw] rounded-full bg-sky-600/15 blur-[150px] animate-blob" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[60%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-violet-600/20 blur-[130px] animate-blob" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[80%] left-[5%] w-[70vw] h-[70vw] rounded-full bg-blue-600/15 blur-[160px] animate-blob" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-600/15 blur-[140px] animate-blob" style={{ animationDelay: '3s' }} />
      
      {/* Dynamic orbs scattered throughout */}
      <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-soft" />
      <div className="absolute top-[75%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-violet-500/10 blur-[110px] animate-pulse-soft" style={{ animationDelay: '2.5s' }} />
      
      {/* Lighter, more subtle overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-tr from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] rounded-full bg-slate-900/40 blur-[160px]" />

      {/* Modern dotted grid for academic / notebook feel */}
      <div className="absolute inset-0 bg-grid-edu opacity-20 mask-[radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />

      {/* Draggable 3D Cubes/Rings */}
      <motion.div 
        drag dragConstraints={containerRef} whileHover={{ scale: 1.1 }} whileDrag={{ scale: 1.2 }} dragElastic={0.2}
        className="absolute top-[15%] right-[25%] opacity-90 cursor-grab active:cursor-grabbing z-0"
        animate={{ rotateX: [30, 390], rotateY: [0, 360], rotateZ: [15, 375] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-20 h-20 bg-linear-to-br from-cyan-900/80 to-slate-800 rounded-4xl shadow-2xl shadow-cyan-900/40 border-2 border-slate-700/50 backdrop-blur-md transform-3d" />
      </motion.div>

      <motion.div 
        drag dragConstraints={containerRef} whileHover={{ scale: 1.1 }} whileDrag={{ scale: 1.2 }} dragElastic={0.2}
        className="absolute bottom-[20%] left-[25%] opacity-90 cursor-grab active:cursor-grabbing z-0"
        animate={{ rotateX: [30, 390], rotateY: [360, 0], rotateZ: [15, 375] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-16 h-16 bg-slate-800/60 border-[6px] border-violet-700/60 backdrop-blur-md rounded-full shadow-xl shadow-violet-900/30 transform-3d" />
      </motion.div>

      {/* 3D Floating Educational Icons (Draggable) */}
      <Draggable3DItem 
        className="top-[15%] left-[10%] text-cyan-400"
        initialY={0} initialX={0} initialRotateX={15} initialRotateY={-15} delay={0}
      >
        <Globe size={48} strokeWidth={1.5} />
      </Draggable3DItem>

      <Draggable3DItem 
        className="top-[25%] right-[10%] text-violet-400"
        initialY={0} initialX={0} initialRotateX={-15} initialRotateY={15} delay={1}
      >
        <Trophy size={52} strokeWidth={1.5} />
      </Draggable3DItem>

      <Draggable3DItem 
        className="bottom-[15%] left-[15%] text-blue-400"
        initialY={0} initialX={0} initialRotateX={15} initialRotateY={15} delay={2.5}
      >
        <BookOpen size={48} strokeWidth={1.5} />
      </Draggable3DItem>

      <Draggable3DItem 
        className="bottom-[25%] right-[15%] text-purple-400"
        initialY={0} initialX={0} initialRotateX={-15} initialRotateY={-15} delay={1.5}
      >
        <Lightbulb size={44} strokeWidth={1.5} />
      </Draggable3DItem>
      
      {/* Drifting Sparkles for magic/educational discovery effect */}
      <div className="absolute top-[10%] left-[40%] opacity-40 animate-drift text-cyan-400 pointer-events-none">
         <Sparkles size={80} strokeWidth={1} />
      </div>
      <div className="absolute top-[50%] left-[10%] opacity-30 animate-drift text-violet-400 pointer-events-none" style={{ animationDelay: '10s', animationDuration: '45s' }}>
         <Sparkles size={100} strokeWidth={1} />
      </div>
      <div className="absolute top-[80%] right-[20%] opacity-35 animate-drift text-sky-400 pointer-events-none" style={{ animationDelay: '5s', animationDuration: '35s' }}>
         <Sparkles size={120} strokeWidth={1} />
      </div>

    </div>
  );
};

export default AnimatedBackground;
