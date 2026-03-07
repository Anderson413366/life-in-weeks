
import React from 'react';

interface SectionHeadingProps {
  title: string;
  className?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, className = "" }) => {
  return (
    <h2 className={`text-center text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary relative pb-3 mb-6 md:mb-8 ${className}
                    drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]
                    after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 
                    after:w-20 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-accent after:rounded-full`}
    >
      {title}
    </h2>
  );
};

export default SectionHeading;