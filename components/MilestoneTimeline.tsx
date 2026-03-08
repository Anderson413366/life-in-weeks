import React from "react";
import { motion } from "framer-motion";

interface Milestone {
  title: string;
  date: string;
  color: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ milestones }) => (
  <div className="relative flex flex-col sm:flex-row justify-around items-start max-w-3xl mx-auto gap-6 sm:gap-4">
    {/* Connecting line */}
    <div className="hidden sm:block absolute top-3 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[#4CAF50] via-[#2196F3] to-[#9C27B0] rounded-full z-[1] opacity-40" />

    {milestones.map((m, i) => (
      <motion.div
        key={m.title}
        className="relative z-[2] flex flex-col items-center w-full sm:w-1/3 px-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
      >
        {/* Dot */}
        <div
          className="w-6 h-6 rounded-full mb-3 flex items-center justify-center ring-4 ring-bg-dark"
          style={{ backgroundColor: m.color, boxShadow: `0 0 16px ${m.color}60` }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>

        {/* Card */}
        <div className="glass rounded-lg p-4 w-full text-center">
          <div className="font-semibold text-sm mb-1" style={{ color: m.color }}>{m.title}</div>
          <div className="text-base sm:text-lg text-white font-medium">{m.date}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default MilestoneTimeline;
