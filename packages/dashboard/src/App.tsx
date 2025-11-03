import { useState } from 'react'
import DisputeSimulator from './components/DisputeSimulator'
import CostCalculator from './components/CostCalculator'
import { Shield, Zap, TrendingDown } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'calculator'>('simulator')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                x402Resolve Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Trustless Dispute Resolution on Solana</p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://github.com/x402kamiyo/x402resolve"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
              >
                GitHub
              </a>
              <a
                href="https://docs.x402resolve.com"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Shield className="w-6 h-6" />}
            title="Trustlessness"
            value="99%"
            subtitle="Decentralized oracle network"
            color="purple"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            title="Cost per Dispute"
            value="$0.005"
            subtitle="Switchboard On-Demand"
            color="blue"
          />
          <StatCard
            icon={<TrendingDown className="w-6 h-6" />}
            title="vs Traditional"
            value="99.99%"
            subtitle="Cost reduction"
            color="green"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'simulator'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Live Simulator
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'calculator'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Cost Calculator
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'simulator' ? <DisputeSimulator /> : <CostCalculator />}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Built for Solana x402 Hackathon · Powered by Switchboard On-Demand</p>
          <p className="mt-2">
            Trustless dispute resolution for AI agent payments · $0.000005 per transaction
          </p>
        </div>
      </footer>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: 'purple' | 'blue' | 'green'
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  }

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  )
}

export default App
