import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";

export default function UploadZone({ onFileAccepted }) {
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    (accepted, rejected) => {
      setError(null);
      if (rejected.length) {
        setError("Only CSV and Excel (.xlsx / .xls) files under 50 MB are accepted.");
        return;
      }
      if (accepted.length) onFileAccepted(accepted[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
          ${isDragActive
            ? "border-brand-500 bg-brand-500/10 scale-[1.02]"
            : "border-slate-600 bg-slate-800/50 hover:border-brand-500 hover:bg-slate-800"
          }`}
      >
        <input {...getInputProps()} />
        <div className="p-4 rounded-full bg-brand-500/20">
          {isDragActive ? (
            <FileSpreadsheet className="w-10 h-10 text-brand-500" />
          ) : (
            <Upload className="w-10 h-10 text-brand-500" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-200">
            {isDragActive ? "Drop your file here" : "Drag & drop your dataset"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            or{" "}
            <span className="text-brand-500 underline underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-slate-500 mt-3">CSV, XLSX, XLS (max 50 MB)</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
