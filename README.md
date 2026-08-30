# Reaction Order Predictor

A web GUI for chemical-engineering reaction kinetics. Given experimental
concentration-vs-time data, it nonlinearly fits the integrated rate law for
every reaction order from 0 to n directly against the raw (t, C) data with
`scipy.optimize.curve_fit` (no linearization), and reports the order with
the highest R² as the predicted reaction order.

- **Frontend:** React + Vite, chart via Recharts
- **Backend:** FastAPI
- **Curve fitting:** SciPy nonlinear least squares

```
reaction-kinetics/
├── backend/
│   ├── main.py            FastAPI app, POST /api/fit
│   ├── kinetics.py         curve-fitting logic for every order
│   ├── models.py            pydantic request/response schemas
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── index.css
    │   └── components/
    │       ├── DataInput.jsx      table, CSV upload, unit dropdowns
    │       ├── ResultsPanel.jsx   predicted order / k / C0 / R² readout
    │       ├── AnalysisPlot.jsx   single linearized plot for the predicted order
    │       └── ComparisonTable.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## How the fitting works

For each order `n = 0..max_order`, the app fits `k` and `C0` in the
integrated rate law directly to the raw data:

- Order 0: `C(t) = C0 - k t`
- Order 1: `C(t) = C0 e^(-k t)`
- Order n ≠ 1: `C(t) = [C0^(1-n) + (n-1) k t]^(1/(1-n))`

R² is computed for each fit; the order with the highest R² is reported as
the predicted order. Predictions and the transformed diagnostic plot are
clipped/guarded so a depleted concentration (`C → 0`) or a negative base
under a fractional power never produces NaN or Infinity.

The "Reaction order plot" on the page shows only the linearized transform
for the *predicted* order (e.g. `1/C` vs `t` for second order, `ln(C)` vs
`t` for first order, `C` vs `t` for zero order, `1/C^(n-1)` vs `t` in
general) — not every candidate order.

## Run locally

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` and talks to the backend at
`http://127.0.0.1:8000` by default (see `src/api.js`). To point it at a
different backend URL, set `VITE_API_URL` (see below).

## Deploying to Render

**Backend — Web Service**
1. New → Web Service → connect this repo, root directory `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Note the deployed URL, e.g. `https://reaction-kinetics-api.onrender.com`.

**Frontend — Static Site**
1. New → Static Site → connect this repo, root directory `frontend`.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add an environment variable `VITE_API_URL` set to your backend's URL
   from the previous step, then redeploy (Vite bakes env vars in at build
   time).

Once both are live, open the static site's URL — it will call the FastAPI
backend automatically.

## API

`POST /api/fit`

```json
{
  "time": [0, 10, 20, 30, 40],
  "concentration": [1.0, 0.82, 0.69, 0.58, 0.49],
  "max_order": 4,
  "time_unit": "s",
  "concentration_unit": "M"
}
```

Returns the best order, fitted `k`/`C0`/`R²`, the equation, the full
per-order comparison table, the experimental and smooth best-fit curves,
and the linearized-plot data for the predicted order. `t ≥ 0` and
`C ≥ 0` are enforced; violations return `400` with a clear message.
