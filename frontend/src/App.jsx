import { useState } from 'react'
import DataInput, { makeDefaultRows } from './components/DataInput.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ComparisonTable from './components/ComparisonTable.jsx'
import AnalysisPlot from './components/AnalysisPlot.jsx'
import { fitReactionOrder } from './api.js'

export default function App() {
  const [rows, setRows] = useState(makeDefaultRows())
  const [maxOrder, setMaxOrder] = useState(4)
  const [timeUnit, setTimeUnit] = useState('s')
  const [concentrationUnit, setConcentrationUnit] = useState('M')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    setError(null)

    const cleaned = rows
      .filter((r) => r.t !== '' && r.c !== '')
      .map((r) => ({ t: Number(r.t), c: Number(r.c) }))

    if (cleaned.length < 3) {
      setError('Enter at least 3 data points.')
      return
    }
    if (cleaned.some((r) => Number.isNaN(r.t) || Number.isNaN(r.c))) {
      setError('All time and concentration values must be numbers.')
      return
    }
    if (cleaned.some((r) => r.t < 0 || r.c < 0)) {
      setError('Time and concentration must be greater than or equal to zero.')
      return
    }
    const n = Number(maxOrder)
    if (!Number.isInteger(n) || n < 0 || n > 10) {
      setError('Max order must be an integer between 0 and 10.')
      return
    }

    setLoading(true)
    try {
      const data = await fitReactionOrder({
        time: cleaned.map((r) => r.t),
        concentration: cleaned.map((r) => r.c),
        maxOrder: n,
        timeUnit,
        concentrationUnit,
      })
      setResult(data)
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <span className="site-kicker">Chemical Reaction Engineering</span>
          <h1 className="site-title">Reaction Order Predictor</h1>
          <p className="site-tagline">
            Nonlinear regression of concentration–time data against the integrated rate law of every candidate order.
          </p>
        </div>
      </header>

      <main className="site-main">
        <DataInput
          rows={rows} setRows={setRows}
          maxOrder={maxOrder} setMaxOrder={setMaxOrder}
          timeUnit={timeUnit} setTimeUnit={setTimeUnit}
          concentrationUnit={concentrationUnit} setConcentrationUnit={setConcentrationUnit}
          onSubmit={handleSubmit} loading={loading} error={error}
        />

        {result && (
          <>
            <ResultsPanel result={result} />
            <AnalysisPlot result={result} />
            <ComparisonTable result={result} />
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>React · FastAPI · SciPy nonlinear least squares</span>
      </footer>
    </div>
  )
}
