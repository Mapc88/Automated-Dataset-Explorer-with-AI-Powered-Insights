import { FileSpreadsheet, BarChart3 } from "lucide-react";

export default function DataPreview({ file, preview, columns, shape, onAnalyze, analyzing }) {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* file info bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-brand-500 shrink-0" />
          <div>
            <p className="font-semibold text-slate-100 leading-tight">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB &nbsp;|&nbsp;
              {shape[0].toLocaleString()} rows &nbsp;|&nbsp; {shape[1]} columns
            </p>
          </div>
        </div>
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-white transition-colors"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Analyze Dataset
            </>
          )}
        </button>
      </div>

      {/* preview table */}
      <div className="overflow-auto rounded-xl border border-slate-700 scrollbar-thin">
        <table className="text-xs w-full whitespace-nowrap">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-slate-500 font-medium text-right w-10">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-slate-300 font-medium text-left max-w-[180px] truncate">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"}>
                <td className="px-3 py-1.5 text-slate-600 text-right">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 text-slate-300 max-w-[180px] truncate">
                    {row[col] == null ? (
                      <span className="text-slate-600 italic">null</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 text-center">Showing first 20 rows of {shape[0].toLocaleString()}</p>
    </div>
  );
}
