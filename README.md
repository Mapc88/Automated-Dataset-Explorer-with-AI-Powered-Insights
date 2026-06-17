# Automated Dataset Analysis

Upload a CSV or Excel file and get automatic data cleaning, exploratory analysis,
interactive charts, and an AI-written summary. FastAPI backend, React frontend.

Stack: FastAPI, pandas, numpy, scikit-learn, Plotly, React, Tailwind, Google Gemini.

## Features

- Drag-and-drop upload for CSV / XLSX / XLS (up to 50 MB) with a preview of the first 20 rows
- Automatic cleaning: trims blanks, drops empty rows and columns, fills missing values
- Column type detection (numeric, categorical, datetime, text)
- Interactive Plotly charts: histograms, box and violin plots, bar and pie charts,
  correlation heatmap, pair plot, scatter plots with regression, and time series
- KMeans clustering and a geographic map when the data supports them
- Correlation ranking and IQR-based outlier detection
- AI insights via Google Gemini (optional)
- One-click HTML report export with a Save as PDF button

## Quick start (Windows)

Two scripts in the project root:

1. `setup.bat` - installs backend and frontend dependencies (run once)
2. `start.bat` - launches both servers and opens the app in your browser

Then open http://localhost:5173

## Manual setup

### Backend

```
cd backend
pip install -r requirements.txt
```

Optional, for AI insights, create `backend/.env` with a free key from https://aistudio.google.com:

```
GEMINI_API_KEY=your_key_here
```

### Frontend

```
cd frontend
npm install
```

### Run (two terminals)

Backend:

```
cd backend
uvicorn main:app --reload --port 8000
```

Frontend:

```
cd frontend
npm run dev
```

Open http://localhost:5173

## Notes

- The app runs fully without an API key; the insights section just shows a notice instead.
- Charts are interactive (zoom, pan, hover, export PNG).
- The downloaded HTML report loads Plotly from a CDN, so opening it needs an internet connection.
