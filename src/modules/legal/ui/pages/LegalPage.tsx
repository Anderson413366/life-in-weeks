import React from "react";
import { Link } from "react-router-dom";

interface LegalPageProps {
  title: string;
  updatedAt: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
}

const LegalPage: React.FC<LegalPageProps> = ({ title, updatedAt, sections }) => (
  <div className="min-h-screen w-full px-4 py-10 sm:px-6">
    <div className="mx-auto flex w-full max-w-[56rem] flex-col gap-8">
      <div className="card-base rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Life in Weeks</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
              Public legal information stays reachable even when you are signed out. Last updated {updatedAt}.
            </p>
          </div>
          <Link
            to="/"
            className="btn-secondary"
          >
            Back To App
          </Link>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-white/70">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LegalPage;
