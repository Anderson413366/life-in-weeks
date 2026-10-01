import React, { useState, useRef, useEffect } from "react";

interface AccordionSectionProps {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  keepMounted?: boolean;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, defaultOpen = false, keepMounted = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const contentId = React.useId();
  const shouldRender = open || keepMounted;

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between card-base px-6 py-4 group hover:border-[rgba(120,80,200,0.25)] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">{icon}</span>
          <span className="text-white font-semibold text-base">{title}</span>
        </div>
        <span
          className={`text-[#00d4ff] text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div
        id={contentId}
        ref={contentRef}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${height}px` : "0px",
          opacity: open ? 1 : 0,
        }}
        aria-hidden={!open}
      >
        {shouldRender ? <div className="pt-3 pb-1">{children}</div> : null}
      </div>
    </div>
  );
};

export default AccordionSection;
