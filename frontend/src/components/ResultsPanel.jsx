const ORDER_WORDS = { 0: 'Zero', 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth' }

function orderLabel(n) {
  return ORDER_WORDS[n] ? `${ORDER_WORDS[n]} order` : `Order ${n}`
}

export default function ResultsPanel({ result }) {
  if (!result) return null

  return (
    <section className="panel readout-panel">
      <h2 className="panel-title">Predicted result</h2>
      <div className="readout-grid">
        <div className="readout-hero">
          <span className="readout-hero-label">Predicted reaction order</span>
          <span className="readout-hero-value">{result.best_order}</span>
          <span className="readout-hero-sub">{orderLabel(result.best_order)} kinetics</span>
        </div>

        <div className="readout-stat">
          <span className="readout-stat-label">Rate constant, k</span>
          <span className="readout-stat-value">{result.best_k.toPrecision(5)}</span>
          <span className="readout-stat-unit">{result.best_k_unit}</span>
        </div>

        <div className="readout-stat">
          <span className="readout-stat-label">Initial concentration, C₀</span>
          <span className="readout-stat-value">{result.best_C0.toPrecision(5)}</span>
          <span className="readout-stat-unit">{result.concentration_unit}</span>
        </div>

        <div className="readout-stat">
          <span className="readout-stat-label">R²</span>
          <span className="readout-stat-value">{result.best_r2.toFixed(5)}</span>
          <span className="readout-stat-unit">goodness of fit</span>
        </div>
      </div>

      <div className="equation-box">
        <span className="equation-label">Rate law</span>
        <span className="equation-text">{result.equation}</span>
      </div>
    </section>
  )
}
