## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Optional – only needed for AI insights
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=...
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Start (two terminals)

**Terminal 1 – backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 – frontend:**
```bash
cd frontend
npm run dev
```
Opens at **http://localhost:5173**



## Notes

- AI insights require a free `GEMINI_API_KEY` from [aistudio.google.com](https://aistudio.google.com). App still works without it.
- Visuals are interactive and can be exported