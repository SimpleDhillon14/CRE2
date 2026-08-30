export default function ComparisonTable({ result }) {
  if (!result) return null
  const { results, best_order } = result

  return (
    <section className="panel">
      <h2 className="panel-title">Order comparison</h2>
      <p className="panel-subtitle">
        Nonlinear least-squares fit of the integrated rate law to the raw C&nbsp;vs&nbsp;t data, for every order from 0 to n.
      </p>
      <div className="table-wrap">
        <table className="data-table results-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Fitted k</th>
              <th>Fitted C₀</th>
              <th>R²</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.order} className={r.order === best_order ? 'row-best' : ''}>
                <td>{r.order}</td>
                <td>{r.k !== null ? `${r.k.toPrecision(5)} ${r.k_unit}` : '—'}</td>
                <td>{r.C0 !== null ? r.C0.toPrecision(5) : '—'}</td>
                <td>{r.r2 !== null ? r.r2.toFixed(5) : '—'}</td>
                <td>{r.order === best_order ? <strong>Best</strong> : r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
