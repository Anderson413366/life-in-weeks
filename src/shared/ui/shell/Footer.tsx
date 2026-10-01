import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => (
  <footer className="w-full max-w-7xl mx-auto px-4 pb-8 pt-2">
    <div className="card-base flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-white/25 text-xs uppercase tracking-[0.2em]">Life in Weeks</p>
        <p className="text-white/20 text-xs">
          © {new Date().getFullYear()} Life in Weeks. All rights reserved.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[0.72rem] text-white/30">
        <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        <a href="mailto:support@lifeinweeks.app" className="hover:text-primary transition-colors">Support</a>
      </div>
      <p className="max-w-sm text-[0.68rem] leading-relaxed text-white/20 sm:text-right">
        Built for reflective use, low-noise focus, and data you can export when you need to.
      </p>
    </div>
  </footer>
);

export default Footer;
