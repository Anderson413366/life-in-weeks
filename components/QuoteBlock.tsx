import React, { useState } from "react";
import { QUOTES } from "../constants";

const CARD = "bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl";

const QuoteBlock: React.FC<{ quote?: string }> = ({ quote: propQuote }) => {
  const [q] = useState(() => propQuote ?? QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <div className={`${CARD} px-5 py-4 max-w-lg mx-auto w-full text-center`} style={{ boxShadow: "0 0 20px rgba(0,212,255,0.04)" }}>
      <p className="text-sm italic leading-relaxed" style={{ color: "rgba(180, 210, 255, 0.85)" }}>
        "{q}"
      </p>
    </div>
  );
};

export default QuoteBlock;
