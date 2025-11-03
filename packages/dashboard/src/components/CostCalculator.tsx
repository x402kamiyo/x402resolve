import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CostCalculator() {
  const [disputesPerMonth, setDisputesPerMonth] = useState(1000)

  const pythonCost = calculatePythonCost(disputesPerMonth)
  const switchboardCost = calculateSwitchboardCost(disputesPerMonth)
  const savings = ((pythonCost - switchboardCost) / pythonCost) * 100
  const chartData = generateChartData()

  return (
    <div style={{ background: 'transparent' }}>
      {/* Header */}
      <div style={{
        background: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.25rem', fontWeight: '700' }}>
          💰 Cost & Economics Calculator
        </h2>
        <p style={{ color: '#888', fontSize: '0.9375rem', lineHeight: '1.6' }}>
          Compare costs between centralized Python verifier and decentralized Switchboard oracles at different dispute volumes
        </p>
      </div>

      {/* Input Slider */}
      <div style={{
        background: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <label style={{ display: 'block', marginBottom: '12px', color: '#e5e5e5', fontWeight: '600', fontSize: '0.875rem' }}>
          Disputes per Month
        </label>
        <input
          type="range"
          min="100"
          max="100000"
          step="100"
          value={disputesPerMonth}
          onChange={(e) => setDisputesPerMonth(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            background: '#333',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.875rem' }}>
          <span style={{ color: '#666' }}>100</span>
          <span style={{ color: '#ff00ff', fontWeight: '700', fontSize: '1.25rem' }}>
            {disputesPerMonth.toLocaleString()}
          </span>
          <span style={{ color: '#666' }}>100,000</span>
        </div>
      </div>

      {/* Cost Comparison Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8125rem', color: '#888' }}>Python Verifier</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '10px 0', color: '#ef4444' }}>
            ${pythonCost.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>Centralized API</div>
          <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'left' }}>
            <div>• Hosting: ${disputesPerMonth < 10000 ? '50' : disputesPerMonth < 100000 ? '100' : '500'}/month</div>
            <div>• Per request: ~$0</div>
            <div>• Latency: 100-500ms</div>
          </div>
        </div>

        <div style={{
          background: '#1a1a1a',
          border: '2px solid #ff00ff',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8125rem', color: '#888' }}>Switchboard</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '10px 0', color: '#ff00ff' }}>
            ${switchboardCost.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>Decentralized Oracle</div>
          <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'left' }}>
            <div>• Per dispute: $0.005</div>
            <div>• No fixed costs</div>
            <div>• Latency: 2-5s</div>
          </div>
        </div>

        <div style={{
          background: savings > 0 ? '#1a1a1a' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: savings > 0 ? '1px solid #333' : '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8125rem', color: '#888' }}>
            {savings > 0 ? 'Python Saves' : 'Switchboard Saves'}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '10px 0', color: savings > 0 ? '#ef4444' : '#10b981' }}>
            ${Math.abs(pythonCost - switchboardCost).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
            {Math.abs(savings).toFixed(1)}% {savings > 0 ? 'cheaper' : 'more expensive'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888' }}>
            at {disputesPerMonth.toLocaleString()} disputes/month
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1rem', fontWeight: '700' }}>
          Cost Comparison at Scale
        </h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="disputes"
                stroke="#666"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#e5e5e5',
                  fontSize: '0.875rem'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.875rem' }}
              />
              <Line
                type="monotone"
                dataKey="python"
                stroke="#ef4444"
                strokeWidth={3}
                name="Python Verifier"
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="switchboard"
                stroke="#ff00ff"
                strokeWidth={3}
                name="Switchboard"
                dot={{ fill: '#ff00ff', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '16px' }}>
          <span style={{ color: '#00d9ff' }}>Break-even point:</span> ~10,000 disputes/month · After that, Python becomes more cost-effective
        </p>
      </div>

      {/* Recommendations */}
      <div style={{
        background: '#000',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1rem', fontWeight: '700' }}>
          Recommendation Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <p style={{ color: '#fff', fontWeight: '600', marginBottom: '12px' }}>Use Python Verifier When:</p>
            <div style={{ fontSize: '0.875rem', color: '#ccc', lineHeight: '1.8' }}>
              {[
                'Volume >10,000 disputes/month',
                'Low value disputes (<$10)',
                'Trusted counterparties',
                'Cost optimization is priority',
                'Low latency required (100-500ms)'
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 0, 255, 0.05)',
            border: '1px solid rgba(255, 0, 255, 0.3)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <p style={{ color: '#fff', fontWeight: '600', marginBottom: '12px' }}>Use Switchboard When:</p>
            <div style={{ fontSize: '0.875rem', color: '#ccc', lineHeight: '1.8' }}>
              {[
                'Volume <10,000 disputes/month',
                'High value disputes (≥$100)',
                'Trustlessness is critical',
                'Targeting security-focused users',
                'Need 99% decentralization'
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hybrid Approach */}
      <div style={{
        background: 'rgba(0, 217, 255, 0.05)',
        border: '1px solid rgba(0, 217, 255, 0.3)',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h3 style={{ color: '#00d9ff', marginBottom: '12px', fontSize: '1rem', fontWeight: '700' }}>
          💡 Hybrid Approach (Recommended)
        </h3>
        <p style={{ color: '#ccc', marginBottom: '16px', fontSize: '0.9375rem' }}>
          Use both systems based on dispute value and user preference for optimal cost-trustlessness balance
        </p>
        <div style={{ fontSize: '0.875rem', color: '#e5e5e5', lineHeight: '2' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
            <span style={{ color: '#00d9ff' }}>→</span>
            <span>Disputes &lt;$0.25: Python verifier (cost optimization)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
            <span style={{ color: '#00d9ff' }}>→</span>
            <span>Disputes ≥$0.25: Switchboard (trustlessness)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
            <span style={{ color: '#00d9ff' }}>→</span>
            <span>User selects trustlessness level: Configurable per-escrow</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculatePythonCost(disputes: number): number {
  const hostingCost = disputes < 10000 ? 50 : disputes < 100000 ? 100 : 500
  return hostingCost
}

function calculateSwitchboardCost(disputes: number): number {
  return disputes * 0.005
}

function generateChartData() {
  const volumes = [100, 1000, 5000, 10000, 25000, 50000, 75000, 100000]
  return volumes.map((disputes) => ({
    disputes,
    python: calculatePythonCost(disputes),
    switchboard: calculateSwitchboardCost(disputes),
  }))
}
