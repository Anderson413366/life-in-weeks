import React from "react";

const Footer: React.FC = () => (
  <footer className="w-full max-w-7xl mx-auto py-6 px-4 mt-8 border-t border-[rgba(120,80,200,0.08)]">
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-white/20 text-xs">
        © {new Date().getFullYear()} Life in Weeks. All rights reserved.
      </p>
      <p className="text-white/15 text-[0.55rem]">
        Built with care for neurodivergent minds. Your data is private and encrypted.
      </p>
    </div>
  </footer>
);

export default Footer;
