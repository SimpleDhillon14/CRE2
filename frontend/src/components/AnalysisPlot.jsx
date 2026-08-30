import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function AnalysisPlot({ result }) {
  if (!result) return null
  const { linearized, best_order, best_r2 } = result

  const scatterData = linearized.points.map(([t, y]) => ({ t, y }))
  const lineData = linearized.fit_line.map(([t, y]) => ({ t, y }))

  return (
    <section className="panel">
      <h2 className="panel-title analysis-heading">
        Analysis of Experimental Concentration–Time Data for Reaction Order Prediction
      </h2>
      <h3 className="panel-subheading">Reaction order plot</h3>
      <p className="panel-subtitle">
        Linearized form for the predicted order {best_order}: {linearized.y_label} vs. {linearized.x_label}
        {' '}(R² = {best_r2.toFixed(5)}).
      </p>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="#dbeafe" strokeDasharray="4 4" />
            <XAxis
              dataKey="t" type="number"
              label={{ value: linearized.x_label, position: 'insideBottom', offset: -12, fill: '#0b3a56', fontWeight: 600 }}
              tick={{ fill: '#0b3a56' }}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              dataKey="y" type="number"
              label={{ value: linearized.y_label, angle: -90, position: 'insideLeft', fill: '#0b3a56', fontWeight: 600 }}
              tick={{ fill: '#0b3a56' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #1a6fa5', borderRadius: 8, color: '#111111' }}
              formatter={(value) => Number(value).toPrecision(5)}
            />
            <Legend verticalAlign="top" height={32} />
            <Scatter
              name="Experimental (transformed)"
              data={scatterData}
              fill="#0b6fb0"
              shape="circle"
            />
            <Line
              name="Fit from k, C₀"
              data={lineData}
              type="linear"
              dataKey="y"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              legendType="line"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
