import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client():
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY not set")
        _client = genai.Client(api_key=key)
    return _client


def generate_insights(analysis_result: dict) -> dict:
    summary = analysis_result["summary"]
    top_corrs = analysis_result["top_correlations"]
    outliers = analysis_result["outliers"]
    chart_meta = analysis_result["chart_meta"]
    cleaning = analysis_result["cleaning_report"]

    corr_text = "\n".join(
        f"  - {p['col1']} ↔ {p['col2']}: r = {p['r']}" for p in top_corrs[:5]
    ) or "  (no numeric correlations found)"

    outlier_text = "\n".join(
        f"  - {col}: {v['count']} outliers ({v['pct']}% of values)"
        for col, v in list(outliers.items())[:5]
    ) or "  (no significant outliers detected)"

    charts_text = "\n".join(f"  - {m}" for m in chart_meta) or "  (no charts)"

    dtype_summary = "\n".join(
        f"  - {k}: {', '.join(v) or 'none'}"
        for k, v in summary["col_types"].items()
        if v
    )

    missing = summary.get("missing_values", {})
    missing_text = (
        ", ".join(f"{c}: {n}" for c, n in list(missing.items())[:5])
        if missing else "none"
    )

    prompt = f"""You are a senior data analyst. A user uploaded a dataset and an automated EDA pipeline has processed it. Provide sharp, actionable insights.

DATASET OVERVIEW
- Shape: {summary['shape'][0]} rows × {summary['shape'][1]} columns
- Column types:
{dtype_summary}
- Missing values: {missing_text}
- Cleaning: removed {cleaning['rows_dropped']} empty rows, imputed {cleaning['missing_before'] - cleaning['missing_after']} missing values

TOP CORRELATIONS
{corr_text}

OUTLIER DETECTION
{outlier_text}

CHARTS GENERATED
{charts_text}

Write a structured analysis with the following sections. Be specific – use numbers and column names from the data above. Keep each section concise but insightful.

## Key Findings
3–5 bullet points about the most important patterns and statistics in this dataset.

## Correlations & Relationships
What do the correlations tell us? Which ones are strong, which are surprising?

## Data Quality Notes
Comment on missingness, outliers, and cleaning actions. Any caveats for interpretation?

## Business / Actionable Recommendations
2–4 concrete recommendations based on the data patterns. Frame them for a business audience.

## Final Conclusion
One paragraph summarising the story this dataset tells and what to do next.
"""

    client = _get_client()
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite-preview",
        contents=prompt,
    )
    raw = response.text

    sections = {}
    current_key = None
    current_lines = []
    for line in raw.splitlines():
        if line.startswith("## "):
            if current_key:
                sections[current_key] = "\n".join(current_lines).strip()
            current_key = line[3:].strip()
            current_lines = []
        else:
            current_lines.append(line)
    if current_key:
        sections[current_key] = "\n".join(current_lines).strip()

    return {"raw": raw, "sections": sections}
