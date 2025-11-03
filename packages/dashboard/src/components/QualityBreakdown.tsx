import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface QualityBreakdownProps {
  breakdown: {
    semantic: number
    completeness: number
    freshness: number
  }
}

export default function QualityBreakdown({ breakdown }: QualityBreakdownProps) {
  const data = [
    { name: 'Semantic', value: breakdown.semantic, weight: '40%', color: '#9333ea' },
    { name: 'Completeness', value: breakdown.completeness, weight: '40%', color: '#3b82f6' },
    { name: 'Freshness', value: breakdown.freshness, weight: '20%', color: '#10b981' },
  ]

  const weightedScore = Math.round(
    breakdown.semantic * 0.4 + breakdown.completeness * 0.4 + breakdown.freshness * 0.2
  )

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quality Breakdown</h3>
        <span className="text-sm text-gray-400">
          Weighted Score: <span className="font-bold text-white">{weightedScore}/100</span>
        </span>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-3">
        <MetricRow
          label="Semantic Similarity"
          value={breakdown.semantic}
          weight="40%"
          color="purple"
          description="Query vs data relevance (Jaccard + keywords)"
        />
        <MetricRow
          label="Completeness"
          value={breakdown.completeness}
          weight="40%"
          color="blue"
          description="Expected criteria coverage + record count"
        />
        <MetricRow
          label="Freshness"
          value={breakdown.freshness}
          weight="20%"
          color="green"
          description="Data recency based on timestamps"
        />
      </div>

      {/* Formula */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">Calculation Formula:</p>
        <code className="text-xs text-green-400">
          score = (semantic × 0.4) + (completeness × 0.4) + (freshness × 0.2)
        </code>
      </div>
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: number
  weight: string
  color: 'purple' | 'blue' | 'green'
  description: string
}

function MetricRow({ label, value, weight, color, description }: MetricRowProps) {
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-gray-500">({weight})</span>
        </div>
        <span className="text-sm font-bold">{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}
