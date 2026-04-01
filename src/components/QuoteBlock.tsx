import React, { useState } from "react";
import { QUOTES } from "../constants";

const QuoteBlock: React.FC<{ quote?: string }> = ({ quote: propQuote }) => {
  const [q] = useState(() => propQuote ?? QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  return (
    <div className="card-base px-5 py-4 max-w-lg mx-auto w-full text-center">
      <p className="text-sm italic leading-relaxed" style={{ color: "rgba(200, 190, 230, 0.85)" }}>
        "{q}"
      </p>
    </div>
  );
};

export default QuoteBlock;
