import { useState, lazy, Suspense } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// dynamic import to keep initial bundle small
const Plot = lazy(() => import("react-plotly.js"));

const DARK_LAYOUT = {
  paper_bgcolor: "#0f172a",
  plot_bgcolor: "#0f172a",
  font: { color: "#cbd5e1", family: "Inter, sans-serif", size: 12 },
  margin: { t: 50, r: 20, b: 50, l: 60 },
  legend: { bgcolor: "rgba(0,0,0,0)", font: { color: "#94a3b8" } },
  xaxis: { gridcolor: "#1e293b", zerolinecolor: "#334155" },
  yaxis: { gridcolor: "#1e293b", zerolinecolor: "#334155" },
};

function ChartCard({ fig, index }) {
  const [collapsed, setCollapsed] = useState(false);

  const layout = {
    ...DARK_LAYOUT,
    ...(fig.layout || {}),
    paper_bgcolor: DARK_LAYOUT.paper_bgcolor,
    plot_bgcolor: DARK_LAYOUT.plot_bgcolor,
    font: DARK_LAYOUT.font,
    margin: DARK_LAYOUT.margin,
    xaxis: { ...(fig.layout?.xaxis || {}), ...DARK_LAYOUT.xaxis },
    yaxis: { ...(fig.layout?.yaxis || {}), ...DARK_LAYOUT.yaxis },
    legend: DARK_LAYOUT.legend,
  };

  const title = fig.layout?.title?.text || fig.layout?.title || `Chart ${index + 1}`;

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
      <button
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-700/50 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="text-sm font-semibold text-slate-200 text-left">{title}</span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="px-2 pb-3">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                Loading chart…
              </div>
            }
          >
            <Plot
              data={fig.data || []}
              layout={layout}
              config={{ responsive: true, displayModeBar: true, displaylogo: false }}
              style={{ width: "100%", minHeight: 380 }}
              useResizeHandler
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default function ChartGrid({ charts }) {
  if (!charts?.length) return null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-slate-100">Visualizations ({charts.length})</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {charts.map((fig, i) => (
          <ChartCard key={i} fig={fig} index={i} />
        ))}
      </div>
    </div>
  );
}
