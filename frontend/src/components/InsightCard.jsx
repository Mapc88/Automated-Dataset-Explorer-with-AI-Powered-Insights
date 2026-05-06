import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function Section({ title, content }) {
  const [open, setOpen] = useState(true);
  const lines = content.trim().split("\n").filter(Boolean);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700/60 transition-colors"
      >
        <span className="font-semibold text-slate-200 text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-slate-900 text-sm text-slate-300 leading-relaxed flex flex-col gap-1.5">
          {lines.map((line, i) => {
            const isBullet = line.trimStart().startsWith("-") || line.trimStart().startsWith("•");
            return (
              <p key={i} className={isBullet ? "pl-4" : ""}>
                {isBullet ? line.replace(/^[\s\-•]+/, "• ") : line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InsightCard({ insights }) {
  const sections = insights?.sections || {};
  const hasSections = Object.keys(sections).length > 0;
  const rawFallback = insights?.raw;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" />
        <h2 className="text-xl font-bold text-slate-100">AI-Generated Insights</h2>
      </div>

      {hasSections ? (
        <div className="flex flex-col gap-3">
          {Object.entries(sections).map(([title, content]) => (
            <Section key={title} title={title} content={content} />
          ))}
        </div>
      ) : rawFallback ? (
        <div className="bg-slate-800 rounded-xl p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-700">
          {rawFallback}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-5 text-sm text-slate-400 italic border border-slate-700">
          No AI insights available. Add your <code className="text-brand-400">ANTHROPIC_API_KEY</code> to the backend
          <code className="text-brand-400"> .env</code> file to enable this feature.
        </div>
      )}
    </div>
  );
}
