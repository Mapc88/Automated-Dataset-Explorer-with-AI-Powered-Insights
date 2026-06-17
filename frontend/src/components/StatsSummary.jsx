import { Database, AlertTriangle, TrendingUp, Layers } from "lucide-react";

function Badge({ label, color = "brand" }) {
  const classes = {
    brand: "bg-brand-500/20 text-brand-300",
    green: "bg-green-500/20 text-green-300",
    yellow: "bg-yellow-500/20 text-yellow-300",
    red: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[color]}`}>{label}</span>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex gap-3">
      <div className="p-2 rounded-lg bg-brand-500/20 h-fit">
        <Icon className="w-4 h-4 text-brand-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsSummary({ summary, cleaning, topCorrs, outliers }) {
  const colTypes = summary.col_types || {};
  const missingEntries = Object.entries(summary.missing_values || {});

  const topCorr = topCorrs?.[0];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-100">Dataset Summary</h2>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Database} label="Rows" value={summary.shape[0].toLocaleString()} />
        <Stat icon={Layers} label="Columns" value={summary.shape[1]} />
        <Stat
          icon={AlertTriangle}
          label="Missing values fixed"
          value={cleaning.missing_before - cleaning.missing_after}
          sub={`${cleaning.rows_dropped} empty rows removed`}
        />
        <Stat
          icon={TrendingUp}
          label="Top correlation"
          value={topCorr ? Math.abs(topCorr.r).toFixed(2) : "-"}
          sub={topCorr ? `${topCorr.col1} / ${topCorr.col2}` : ""}
        />
      </div>

      {/* column types */}
      <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-slate-300">Column Types Detected</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(colTypes).map(([type, cols]) =>
            cols.map((col) => (
              <Badge
                key={col}
                label={`${col} (${type})`}
                color={
                  type === "numeric" ? "brand"
                  : type === "categorical" ? "green"
                  : type === "datetime" ? "yellow"
                  : "red"
                }
              />
            ))
          )}
        </div>
      </div>

      {/* top correlations */}
      {topCorrs?.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-300">Top Correlations</p>
          <div className="flex flex-col gap-2">
            {topCorrs.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 w-32 truncate font-mono text-xs">{p.col1}</span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-slate-400 flex-1 truncate font-mono text-xs">{p.col2}</span>
                <span
                  className={`font-bold tabular-nums ${
                    Math.abs(p.r) > 0.7 ? "text-green-400" : Math.abs(p.r) > 0.4 ? "text-yellow-400" : "text-slate-400"
                  }`}
                >
                  {p.r > 0 ? "+" : ""}{p.r.toFixed(3)}
                </span>
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.r > 0 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${Math.abs(p.r) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* outliers */}
      {Object.keys(outliers || {}).length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-300">Outlier Detection (IQR method)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(outliers).map(([col, info]) => (
              <div key={col} className="bg-slate-900 rounded-lg px-3 py-2 text-xs">
                <p className="text-slate-300 font-medium truncate">{col}</p>
                <p className="text-yellow-400 mt-0.5">{info.count} outliers ({info.pct}%)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* missing values if any remain */}
      {missingEntries.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-300">Remaining Missing Values</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {missingEntries.map(([col, count]) => (
              <div key={col} className="bg-slate-900 rounded-lg px-3 py-2 text-xs">
                <p className="text-slate-300 font-medium truncate">{col}</p>
                <p className="text-red-400 mt-0.5">{count} missing</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
