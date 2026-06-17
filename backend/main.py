import io
import os
import traceback
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from analyzer import analyze
from insights import generate_insights

load_dotenv()

app = FastAPI(title="Dataset Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_SIZE_MB = 50
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def _load_dataframe(filename: str, contents: bytes) -> pd.DataFrame:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Upload a CSV or Excel file.")
    if ext == ".csv":
        # try common encodings
        for enc in ["utf-8", "latin-1", "cp1252"]:
            try:
                return pd.read_csv(io.BytesIO(contents), encoding=enc, low_memory=False)
            except UnicodeDecodeError:
                continue
        raise HTTPException(400, "Could not decode CSV file - try saving as UTF-8.")
    else:
        return pd.read_excel(io.BytesIO(contents), engine="openpyxl")


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(413, f"File too large ({size_mb:.1f} MB). Maximum is {MAX_SIZE_MB} MB.")

    try:
        df = _load_dataframe(file.filename, contents)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {e}")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(422, "File appears empty or has only one column.")

    preview = df.head(20).replace({np.nan: None}).to_dict(orient="records")
    columns = list(df.columns)
    return {"preview": preview, "columns": columns, "shape": list(df.shape)}


@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    contents = await file.read()

    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(413, f"File too large ({size_mb:.1f} MB).")

    try:
        df = _load_dataframe(file.filename, contents)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {e}")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(422, "File appears empty or has only one column.")

    try:
        result = analyze(df)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Analysis failed: {e}")

    # generate insights; skip if unavailable
    insights = {"raw": "", "sections": {}}
    try:
        insights = generate_insights(result)
    except RuntimeError as e:
        insights["sections"]["Note"] = str(e)
    except Exception as e:
        traceback.print_exc()
        insights["sections"]["Note"] = f"AI insights unavailable: {e}"

    result.pop("chart_meta", None)  # internal only
    result["insights"] = insights
    return JSONResponse(content=result)


@app.get("/api/health")
def health():
    return {"status": "ok"}
