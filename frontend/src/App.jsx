import { useState, useCallback } from "react";
import { BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import UploadZone from "./components/UploadZone";
import DataPreview from "./components/DataPreview";
import StatsSummary from "./components/StatsSummary";
import ChartGrid from "./components/ChartGrid";
import InsightCard from "./components/InsightCard";

const API = "/api";

// ── phases: idle | previewing | analyzing | results | error
export default function App() {
  const [phase, setPhase] = useState("idle");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileAccepted = useCallback(async (f) => {
    setFile(f);
    setError(null);
    setPhase("uploading");

    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setPreview(data);
      setPhase("previewing");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    setPhase("analyzing");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/analyze`, { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || `Analysis failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
      setPhase("results");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  }, [file]);

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* nav */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-500" />
            <span className="hidden sm:block text-xs text-slate-500 ml-1">Automated Dataset Analysis</span>
          </div>
          {phase !== "idle" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New dataset
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* ── idle: hero + upload ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-10 py-10">
            <div className="text-center max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-violet-400 leading-tight pb-1">
                Instant Big-Data Insights
              </h1>
              <p className="mt-4 text-slate-400 text-lg">
                Upload any CSV or Excel file and get automated EDA, interactive visualizations,
                and AI-generated business insights in seconds.
              </p>
            </div>
            <UploadZone onFileAccepted={handleFileAccepted} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-slate-500 max-w-xl">
              {["Data Cleaning", "Auto Visualizations", "Correlation Analysis", "AI Insights"].map((f) => (
                <div key={f} className="bg-slate-800/60 rounded-lg px-3 py-2">
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── uploading spinner ── */}
        {phase === "uploading" && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-slate-400">Uploading file…</p>
          </div>
        )}

        {/* ── preview ── */}
        {(phase === "previewing" || phase === "analyzing") && preview && (
          <DataPreview
            file={file}
            preview={preview.preview}
            columns={preview.columns}
            shape={preview.shape}
            onAnalyze={handleAnalyze}
            analyzing={phase === "analyzing"}
          />
        )}

        {/* ── results ── */}
        {phase === "results" && result && (
          <div className="flex flex-col gap-10">
            <StatsSummary
              summary={result.summary}
              cleaning={result.cleaning_report}
              topCorrs={result.top_correlations}
              outliers={result.outliers}
            />
            <ChartGrid charts={result.charts} />
            <InsightCard insights={result.insights} />
          </div>
        )}

        {/* ── error ── */}
        {phase === "error" && (
          <div className="flex flex-col items-center py-20 gap-5">
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-6 py-4 max-w-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={reset}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4" />
    </div>
  );
}
