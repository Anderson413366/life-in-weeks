import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

interface FeedbackPopupProps {
  userId?: string;
}

const STORAGE_KEY = "liw-feedback-last";
const INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days between prompts

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ userId }) => {
  const [show, setShow] = useState(false);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - parseInt(last, 10) < INTERVAL_MS) return;
    // Show after 60 seconds of usage
    const timer = setTimeout(() => setShow(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShow(false);
  }

  async function handleStarClick(rating: number) {
    setStars(rating);
    if (rating === 5) {
      // 5 stars — save immediately, no follow-up
      await saveFeedback(rating, "");
      setSubmitted(true);
      setTimeout(dismiss, 2000);
    } else {
      // Less than 5 — show follow-up question
      setShowFollowUp(true);
    }
  }

  async function handleSubmitFollowUp() {
    await saveFeedback(stars, message);
    setSubmitted(true);
    setTimeout(dismiss, 2000);
  }

  async function saveFeedback(rating: number, msg: string) {
    try {
      await supabase.from("liw_feedback").insert({
        user_id: userId ?? null,
        stars: rating,
        message: msg.trim() || null,
      });
    } catch (e) {
      console.error("Feedback save error:", e);
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            className="card-base p-6 sm:p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
          >
            {submitted ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">💜</div>
                <p className="text-white font-bold text-lg">Thank you!</p>
                <p className="text-white/50 text-sm mt-1">Your feedback means everything to us.</p>
              </div>
            ) : (
              <>
                <button onClick={dismiss} className="absolute top-4 right-4 text-white/30 hover:text-white text-sm">✕</button>

                <div className="text-center mb-5">
                  <p className="text-white/90 text-sm leading-relaxed">
                    I know, I know... pop-ups are a pain in the ass. 😅
                  </p>
                  <p className="text-white/60 text-sm mt-2 leading-relaxed">
                    But it would <strong className="text-[#00d4ff]">genuinely</strong> help me as the developer if you shared your honest take. Don't hold back.
                  </p>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleStarClick(n)}
                      className="text-3xl transition-all duration-200 hover:scale-125"
                      style={{ filter: n <= stars ? "none" : "grayscale(1) opacity(0.3)" }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                {stars > 0 && stars < 5 && <p className="text-center text-white/40 text-xs mb-3">{stars} out of 5</p>}

                {/* Follow-up for < 5 stars */}
                <AnimatePresence>
                  {showFollowUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <p className="text-white/70 text-sm text-center mb-3">
                        Okay, honest reviews like yours matter the most. 🙏<br />
                        <strong className="text-[#00d4ff]">What would it take to get to 5 stars?</strong>
                      </p>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Be brutally honest — bugs, missing features, ugly design, whatever..."
                        className="w-full h-24 p-3 rounded-xl border border-[rgba(120,80,200,0.15)] bg-transparent text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/30 mb-3"
                        autoFocus
                      />
                      <button
                        onClick={handleSubmitFollowUp}
                        className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #00d4ff, #ec4899)" }}
                      >
                        Send Feedback
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-center text-white/15 text-[0.55rem] mt-4">
                  This won't show again for 3 days. Promise.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackPopup;
