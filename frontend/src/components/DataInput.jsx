import { useRef } from 'react'

const TIME_UNITS = ['s', 'min', 'hr', 'day']
const CONC_UNITS = ['M', 'mM', 'µM', 'mol/L', 'g/L']

let rowIdCounter = 0
function newRow(t = '', c = '') {
  rowIdCounter += 1
  return { id: rowIdCounter, t, c }
}

export function makeDefaultRows() {
  // pre-loaded sample second-order dataset: C(t) = C0 / (1 + k*C0*t), k=0.05, C0=2
  const k = 0.05, C0 = 2
  const ts = [0, 5, 10, 15, 20, 25, 30, 40, 50]
  return ts.map((t) => newRow(t, +(C0 / (1 + k * C0 * t)).toFixed(4)))
}

export default function DataInput({
  rows, setRows,
  maxOrder, setMaxOrder,
  timeUnit, setTimeUnit,
  concentrationUnit, setConcentrationUnit,
  onSubmit, loading, error,
}) {
  const fileInputRef = useRef(null)

  function updateRow(id, field, value) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows([...rows, newRow()])
  }

  function removeRow(id) {
    setRows(rows.filter((r) => r.id !== id))
  }

  function clearAll() {
    setRows([newRow()])
  }

  function loadSample() {
    setRows(makeDefaultRows())
  }

  function handleCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const parsed = []
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map((p) => p.trim())
        if (parts.length < 2) continue
        const [a, b] = parts
        if (Number.isNaN(Number(a)) || Number.isNaN(Number(b))) continue // skips header row
        parsed.push(newRow(a, b))
      }
      if (parsed.length) setRows(parsed)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Experimental data</h2>

      <div className="unit-row">
        <label className="unit-field">
          <span>Time unit</span>
          <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
            {TIME_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="unit-field">
          <span>Concentration unit</span>
          <select value={concentrationUnit} onChange={(e) => setConcentrationUnit(e.target.value)}>
            {CONC_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="unit-field">
          <span>Max order, n</span>
          <input
            type="number" min="0" max="10" step="1"
            value={maxOrder}
            onChange={(e) => setMaxOrder(e.target.value)}
          />
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time ({timeUnit})</th>
              <th>Concentration ({concentrationUnit})</th>
              <th aria-label="row actions"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="number" step="any" value={row.t}
                    onChange={(e) => updateRow(row.id, 't', e.target.value)}
                    placeholder="t"
                  />
                </td>
                <td>
                  <input
                    type="number" step="any" value={row.c}
                    onChange={(e) => updateRow(row.id, 'c', e.target.value)}
                    placeholder="C"
                  />
                </td>
                <td>
                  <button type="button" className="row-remove" onClick={() => removeRow(row.id)} aria-label="Remove row">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-row">
        <button type="button" className="btn btn-ghost" onClick={addRow}>+ Add row</button>
        <button type="button" className="btn btn-ghost" onClick={clearAll}>Clear all</button>
        <button type="button" className="btn btn-ghost" onClick={loadSample}>Load sample data</button>
        <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>Upload CSV</button>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCSV} hidden />
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}

      <div className="button-row submit-row">
        <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={loading}>
          {loading ? 'Fitting…' : 'Predict reaction order'}
        </button>
      </div>
    </section>
  )
}
