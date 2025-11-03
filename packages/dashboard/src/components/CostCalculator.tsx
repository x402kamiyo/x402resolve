import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calculator, TrendingDown, Zap } from 'lucide-react'

export default function CostCalculator() {
  const [disputesPerMonth, setDisputesPerMonth] = useState(1000)

  // Calculate costs
  const pythonCost = calculatePythonCost(disputesPerMonth)
  const switchboardCost = calculateSwitchboardCost(disputesPerMonth)
  const savings = ((pythonCost - switchboardCost) / pythonCost) * 100

  // Generate chart data
  const chartData = generateChartData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold">Cost Calculator</h2>
        </div>
        <p className="text-gray-400">
          Compare costs between centralized Python verifier and decentralized Switchboard oracles
        </p>
      </div>

      {/* Input */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <label className="block mb-2 font-medium">Disputes per Month</label>
        <input
          type="range"
          min="100"
          max="100000"
          step="100"
          value={disputesPerMonth}
          onChange={(e) => setDisputesPerMonth(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>100</span>
          <span className="font-bold text-purple-400 text-lg">{disputesPerMonth.toLocaleString()}</span>
          <span>100,000</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CostCard
          title="Python Verifier"
          cost={pythonCost}
          subtitle="Centralized API"
          breakdown={[
            `Hosting: $${disputesPerMonth < 10000 ? 50 : 100}/month`,
            `Per request: ~$0`,
          ]}
          icon={<Zap className="w-6 h-6" />}
        />
        <CostCard
          title="Switchboard"
          cost={switchboardCost}
          subtitle="Decentralized Oracle"
          breakdown={[
            `Per dispute: $0.005`,
            `No fixed costs`,
          ]}
          icon={<Calculator className="w-6 h-6" />}
          highlight
        />
        <CostCard
          title={savings > 0 ? 'Python Saves' : 'Switchboard Saves'}
          cost={Math.abs(pythonCost - switchboardCost)}
          subtitle={`${Math.abs(savings).toFixed(1)}% ${savings > 0 ? 'cheaper' : 'more expensive'}`}
          breakdown={[
            savings > 0 ? 'Python is cheaper' : 'Switchboard is cheaper',
            `at ${disputesPerMonth.toLocaleString()} disputes/month`,
          ]}
          icon={<TrendingDown className="w-6 h-6" />}
          isSavings
        />
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold mb-4">Cost Comparison at Scale</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="disputes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="python"
                stroke="#ef4444"
                strokeWidth={2}
                name="Python Verifier"
              />
              <Line
                type="monotone"
                dataKey="switchboard"
                stroke="#9333ea"
                strokeWidth={2}
                name="Switchboard"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Break-even point: ~10,000 disputes/month · After that, Python becomes more cost-effective
        </p>
      </div>

      {/* Recommendation */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold mb-4">Recommendation Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecommendationCard
            title="Use Python Verifier When:"
            items={[
              'Volume >10,000 disputes/month',
              'Low value disputes (<$10)',
              'Trusted counterparties',
              'Cost optimization is priority',
              'Low latency required (100-500ms)',
            ]}
            color="red"
          />
          <RecommendationCard
            title="Use Switchboard When:"
            items={[
              'Volume <10,000 disputes/month',
              'High value disputes (≥$100)',
              'Trustlessness is critical',
              'Targeting security-focused users',
              'Need 99% decentralization',
            ]}
            color="purple"
          />
        </div>
      </div>

      {/* Hybrid Approach */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Hybrid Approach (Recommended)
        </h3>
        <p className="text-gray-300 mb-4">
          Use both systems based on dispute value and user preference:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-purple-400">→</span>
            <span>Disputes &lt;$0.25: Python verifier (cost optimization)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">→</span>
            <span>Disputes ≥$0.25: Switchboard (trustlessness)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">→</span>
            <span>User selects trustlessness level: Configurable per-escrow</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CostCardProps {
  title: string
  cost: number
  subtitle: string
  breakdown: string[]
  icon: React.ReactNode
  highlight?: boolean
  isSavings?: boolean
}

function CostCard({ title, cost, subtitle, breakdown, icon, highlight, isSavings }: CostCardProps) {
  return (
    <div
      className={`rounded-lg p-6 border ${
        highlight
          ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30'
          : isSavings
          ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">${cost.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="space-y-1 text-xs text-gray-400">
        {breakdown.map((item, i) => (
          <p key={i}>• {item}</p>
        ))}
      </div>
    </div>
  )
}

interface RecommendationCardProps {
  title: string
  items: string[]
  color: 'red' | 'purple'
}

function RecommendationCard({ title, items, color }: RecommendationCardProps) {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
  }

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <p className="font-medium mb-3">{title}</p>
      <ul className="space-y-2 text-sm text-gray-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function calculatePythonCost(disputes: number): number {
  // Fixed hosting cost scales with volume
  const hostingCost = disputes < 10000 ? 50 : disputes < 100000 ? 100 : 500
  return hostingCost
}

function calculateSwitchboardCost(disputes: number): number {
  // $0.005 per dispute
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
