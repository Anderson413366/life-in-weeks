import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  { icon: "🔍", text: "Scroll or pinch to zoom in and out" },
  { icon: "✋", text: "Drag to pan across your life grid" },
  { icon: "👆", text: "Click any past week to write a diary entry" },
  { icon: "⛶", text: "Full-screen immersive mode (bottom-right)" },
  { icon: "✨", text: "Gradient orb shares a beautiful life snapshot" },
  { icon: "🎙", text: "Floating mic button records voice journal entries" },
  { icon: "📝", text: "Golden dots mark weeks with diary entries" },
  { icon: "🔴", text: "Pulsing red = your current week" },
  { icon: "⚡", text: "Switch Focus/Zen mode in Settings" },
  { icon: "⎋", text: "Press Esc to exit immersive mode" },
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1001] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-primary/20"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-primary text-center mb-6">How to Use the Grid</h2>
          <ul className="space-y-3">
            {TIPS.map((tip) => (
              <li key={tip.text} className="flex items-start gap-3 text-sm">
                <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
                <span className="text-white/80">{tip.text}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onClose}
            className="mt-6 w-full h-11 rounded-xl bg-primary hover:bg-primary-dark text-bg-dark font-semibold text-sm transition-colors"
          >
            Got it
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default HelpModal;
