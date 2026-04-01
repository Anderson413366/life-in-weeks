import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="w-full max-w-7xl mx-auto py-6 px-4 mt-8 border-t border-[rgba(120,80,200,0.08)]">
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-white/20 text-xs">
        © {new Date().getFullYear()} Life in Weeks. All rights reserved.
      </p>
      <div className="flex items-center gap-3 text-[0.6rem] text-white/25">
        <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
      </div>
      <p className="text-white/15 text-[0.55rem]">
        Built with care for neurodivergent minds. Your data is private and encrypted.
      </p>
    </div>
  </footer>
);

export default Footer;
