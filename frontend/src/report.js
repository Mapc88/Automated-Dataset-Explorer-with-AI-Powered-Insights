const PLOTLY_CDN = "https://cdn.plot.ly/plotly-2.35.2.min.js";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function overviewCards(result) {
  const s = result.summary;
  const c = result.cleaning_report;
  const cards = [
    ["Rows", s.shape[0].toLocaleString()],
    ["Columns", s.shape[1]],
    ["Missing values fixed", (c.missing_before - c.missing_after).toLocaleString()],
    ["Empty rows removed", c.rows_dropped.toLocaleString()],
  ];
  const inner = cards
    .map(([lbl, num]) => `<div class="card"><div class="num">${esc(num)}</div><div class="lbl">${esc(lbl)}</div></div>`)
    .join("");
  return `<div class="cards">${inner}</div>`;
}

function columnTypesTable(result) {
  const types = result.summary.col_types || {};
  const rows = Object.entries(types)
    .filter(([, cols]) => cols.length)
    .map(([type, cols]) => `<tr><td><b>${esc(type)}</b></td><td>${cols.map(esc).join(", ")}</td></tr>`)
    .join("");
  if (!rows) return "";
  return `<h2>Column types</h2><table><tr><th>Type</th><th>Columns</th></tr>${rows}</table>`;
}

function correlationsTable(result) {
  const corrs = result.top_correlations || [];
  if (!corrs.length) return "";
  const rows = corrs
    .slice(0, 10)
    .map((p) => `<tr><td>${esc(p.col1)}</td><td>${esc(p.col2)}</td><td>${p.r}</td></tr>`)
    .join("");
  return `<h2>Top correlations</h2><table><tr><th>Column A</th><th>Column B</th><th>r</th></tr>${rows}</table>`;
}

function outliersTable(result) {
  const entries = Object.entries(result.outliers || {});
  if (!entries.length) return "";
  const rows = entries
    .map(([col, info]) => `<tr><td>${esc(col)}</td><td>${info.count}</td><td>${info.pct}%</td></tr>`)
    .join("");
  return `<h2>Outliers (IQR method)</h2><table><tr><th>Column</th><th>Count</th><th>Share</th></tr>${rows}</table>`;
}

function clustersSection(result) {
  const c = result.clusters;
  if (!c) return "";
  const sizes = Object.entries(c.sizes || {})
    .map(([name, n]) => `${esc(name)}: ${n}`)
    .join(", ");
  return `<h2>Clusters</h2><p>Found ${c.k} clusters (silhouette score ${c.silhouette}). Sizes: ${sizes}.</p>`;
}

function insightsSection(result) {
  const insights = result.insights || {};
  const sections = insights.sections || {};
  const keys = Object.keys(sections);
  if (keys.length) {
    const body = keys
      .map((title) => {
        const lines = sections[title]
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `<p>${esc(l)}</p>`)
          .join("");
        return `<div class="insight"><h3>${esc(title)}</h3>${lines}</div>`;
      })
      .join("");
    return `<h2>Insights</h2>${body}`;
  }
  if (insights.raw) {
    return `<h2>Insights</h2><div class="insight"><p>${esc(insights.raw).replace(/\n/g, "<br>")}</p></div>`;
  }
  return "";
}

function chartsSection(charts) {
  if (!charts?.length) return "";
  const divs = charts.map((_, i) => `<div class="chart" id="chart-${i}"></div>`).join("");
  return `<h2>Visualizations</h2>${divs}`;
}

function buildHtml(result, sourceName) {
  const charts = result.charts || [];
  const figsJson = JSON.stringify(charts).replace(/<\//g, "<\\/");
  const generated = new Date().toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dataset Analysis Report</title>
<script src="${PLOTLY_CDN}"></script>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#1e293b;background:#f8fafc;margin:0;}
.wrap{max-width:1000px;margin:0 auto;padding:32px 24px;}
h1{font-size:26px;margin:0 0 4px;}
h2{font-size:18px;margin:28px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;}
h3{margin:0 0 8px;font-size:15px;}
.meta{color:#64748b;font-size:13px;margin-bottom:16px;}
table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:8px;}
th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}
th{background:#f1f5f9;}
.cards{display:flex;flex-wrap:wrap;gap:12px;}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;min-width:120px;}
.card .num{font-size:20px;font-weight:bold;}
.card .lbl{font-size:12px;color:#64748b;}
.chart{margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;background:#fff;min-height:380px;}
.insight{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:12px;}
.btn{background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:14px;cursor:pointer;}
@media print{.no-print{display:none;}body{background:#fff;}.chart,.card,.insight{break-inside:avoid;}}
</style>
</head>
<body>
<div class="wrap">
<h1>Dataset Analysis Report</h1>
<div class="meta">Source: ${esc(sourceName || "dataset")} &nbsp; Generated: ${esc(generated)}</div>
<button class="btn no-print" onclick="window.print()">Save as PDF</button>
<h2>Overview</h2>
${overviewCards(result)}
${columnTypesTable(result)}
${correlationsTable(result)}
${outliersTable(result)}
${clustersSection(result)}
${chartsSection(charts)}
${insightsSection(result)}
</div>
<script>
var FIGS = JSON.parse(${JSON.stringify(figsJson)});
FIGS.forEach(function (f, i) {
  Plotly.newPlot("chart-" + i, f.data || [], f.layout || {}, { responsive: true, displaylogo: false });
});
</script>
</body>
</html>`;
}

export function downloadReport(result, sourceName) {
  const html = buildHtml(result, sourceName);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const base = (sourceName || "dataset").replace(/\.[^.]+$/, "");
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${base}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
