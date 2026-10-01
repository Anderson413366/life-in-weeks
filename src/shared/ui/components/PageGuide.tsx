import React from "react";

interface PageGuideProps {
  summary: string;
  audience: string;
  topTasks: string[];
  steps: string[];
  next: string;
  mistakes?: string[];
  defaultOpen?: boolean;
  title?: string;
}

const sectionTitleClass = "text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/45";
const listClass = "space-y-2 text-sm leading-6 text-white/72";

const PageGuide: React.FC<PageGuideProps> = ({
  summary,
  audience,
  topTasks,
  steps,
  next,
  mistakes = [],
  defaultOpen = false,
  title = "How this page works",
}) => (
  <details className="card-base rounded-3xl p-4 sm:p-5" open={defaultOpen}>
    <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="eyebrow">Task Map</p>
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-white/65">{summary}</p>
      </div>
      <span className="chip self-start text-[0.68rem] text-white/70">Open guide</span>
    </summary>

    <div className="mt-4 grid gap-4 border-t border-white/8 pt-4 lg:grid-cols-2">
      <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className={sectionTitleClass}>Who Uses It</p>
        <p className="text-sm leading-6 text-white/72">{audience}</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className={sectionTitleClass}>Top 3 Tasks</p>
        <ul className={listClass}>
          {topTasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className={sectionTitleClass}>Normal Step Order</p>
        <ol className={listClass}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className={sectionTitleClass}>What Happens Next</p>
        <p className="text-sm leading-6 text-white/72">{next}</p>
        {mistakes.length > 0 && (
          <>
            <p className={`${sectionTitleClass} pt-2`}>Common Mistakes</p>
            <ul className={listClass}>
              {mistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  </details>
);

export default PageGuide;
