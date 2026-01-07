import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-app overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <div className="relative w-24 h-24 mb-8">
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-brand-purple"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-t-2 border-l-2 border-blue-500/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-blue-600 rounded-full shadow-[0_0_30px_rgba(109,40,217,0.5)]" />
          </motion.div>
        </div>

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Fivescores</h2>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-white/40 tracking-wider">{message}</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
              className="text-brand-purple"
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, times: [0, 0.5, 1] }}
              className="text-brand-purple"
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, times: [0, 0.5, 1] }}
              className="text-brand-purple"
            >
              .
            </motion.span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
