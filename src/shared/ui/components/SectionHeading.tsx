import React from "react";

interface SectionHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  id?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, description, eyebrow, id }) => (
  <div id={id} className="mb-4 space-y-2">
    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
    <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
    {description ? <p className="max-w-2xl text-sm leading-7 text-white/62">{description}</p> : null}
  </div>
);

export default SectionHeading;
