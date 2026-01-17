import { motion } from "framer-motion";

export const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orb */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(210 100% 60% / 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Secondary orb */}
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(185 80% 55% / 0.1) 0%, transparent 70%)",
        }}
      />

      {/* Floating geometric shapes */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-20 h-20 border border-primary/20 rounded-2xl"
        style={{ transform: "rotate(45deg)" }}
      />

      <motion.div
        animate={{ y: [20, -20, 20], rotate: [0, -90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-[15%] w-12 h-12 border border-kadig-cyan/20 rounded-xl"
      />

      <motion.div
        animate={{ y: [-15, 25, -15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-[20%] w-6 h-6 bg-primary/10 rounded-full"
      />

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};
