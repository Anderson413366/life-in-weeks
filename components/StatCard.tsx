
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  value: string | number;
  label: string;
  variant?: 'default' | 'mini' | 'daysLived' | 'daysRemaining' | 'weeksLived' | 'weeksRemaining';
  className?: string;
  index?: number; // For staggered animation
}

const StatCard: React.FC<StatCardProps> = ({ value, label, variant = 'default', className = "", index = 0 }) => {
  const valueClass = variant === 'mini' 
    ? "text-2xl sm:text-3xl lg:text-4xl" 
    : "text-3xl sm:text-4xl lg:text-5xl";
  
  const paddingClass = variant === 'mini' ? "p-3 sm:p-4" : "p-4 sm:p-5";

  let gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300";
  if (variant === 'daysLived' || variant === 'weeksLived') {
    gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-b from-[#e0f7fa] to-primary";
  } else if (variant === 'daysRemaining' || variant === 'weeksRemaining') {
     gradientTextClass = "text-transparent bg-clip-text bg-gradient-to-b from-[#fff3e0] to-accent";
  }

  let borderGradient = "bg-gradient-to-r from-primary to-accent";
  if (variant === 'daysLived' || variant === 'weeksLived') {
    borderGradient = "bg-gradient-to-r from-primary to-[#0088ff]"; // Example secondary primary color
  } else if (variant === 'daysRemaining' || variant === 'weeksRemaining') {
    borderGradient = "bg-gradient-to-r from-[#ff9f43] to-accent"; // Example secondary accent color
  }

  // Framer Motion variants for subtle appearance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay: index * 0.05, // Stagger animation based on index
        ease: "easeOut" 
      } 
    },
  };

  return (
    <motion.div 
      className={`bg-card-bg rounded-lg text-center shadow-xl border border-[rgba(255,255,255,0.08)] 
                    backdrop-blur-md flex flex-col items-center justify-center transition-all duration-200 ease-in-out 
                    hover:transform hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden h-full 
                    ${paddingClass} ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      // ADHD/Accessibility: Announce changes to screen readers if values are highly dynamic and critical.
      // For slowly ticking numbers, it might be too verbose. For this app, it's likely fine without aria-live on each card,
      // as the values update frequently and their primary consumption is visual.
      // However, if a specific stat was a key action trigger, `aria-live="polite"` would be useful.
    >
      <div className={`absolute top-0 left-0 right-0 h-1 opacity-70 ${borderGradient}`}></div>
      <div 
        className={`${valueClass} font-bold mb-1 leading-none ${gradientTextClass}`}
        // Accessibility: if these numbers update very frequently and are critical,
        // consider an aria-live region on a parent or a mechanism to announce significant changes.
        // For this dashboard, the visual update is primary.
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`uppercase tracking-wider font-normal text-xs sm:text-sm text-text-muted ${variant === 'mini' ? 'text-xs' : 'text-sm'}`}>
        {label}
      </div>
    </motion.div>
  );
};

export default StatCard;