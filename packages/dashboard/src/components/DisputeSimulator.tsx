import { useState } from 'react'
import { AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import QualityBreakdown from './QualityBreakdown'

type DisputeStep = 'idle' | 'creating' | 'disputed' | 'assessing' | 'resolved'

interface DisputeScenario {
  id: string
  name: string
  query: string
  data: string
  expectedScore: number
  expectedRefund: number
}

const scenarios: DisputeScenario[] = [
  {
    id: 'perfect',
    name: 'Perfect Match',
    query: 'Uniswap V3 exploits on Ethereum',
    data: 'High-quality Uniswap V3 exploit data with complete details',
    expectedScore: 90,
    expectedRefund: 0,
  },
  {
    id: 'partial',
    name: 'Partial Match',
    query: 'Recent Solana exploits with transaction details',
    data: 'Incomplete Solana exploit data, missing some transaction details',
    expectedScore: 65,
    expectedRefund: 19,
  },
  {
    id: 'poor',
    name: 'Poor Quality',
    query: 'Uniswap exploits',
    data: 'Wrong protocol data (Curve instead of Uniswap)',
    expectedScore: 40,
    expectedRefund: 100,
  },
  {
    id: 'empty',
    name: 'Empty Response',
    query: 'Terra Luna exploits',
    data: 'Empty array - no exploits found',
    expectedScore: 28,
    expectedRefund: 100,
  },
]

export default function DisputeSimulator() {
  const [step, setStep] = useState<DisputeStep>('idle')
  const [selectedScenario, setSelectedScenario] = useState<DisputeScenario>(scenarios[0])
  const [qualityScore, setQualityScore] = useState<number>(0)
  const [refundPercentage, setRefundPercentage] = useState<number>(0)
  const [breakdown, setBreakdown] = useState({
    semantic: 0,
    completeness: 0,
    freshness: 0,
  })

  const startSimulation = async () => {
    // Reset
    setStep('creating')
    await sleep(800)

    setStep('disputed')
    await sleep(1000)

    setStep('assessing')
    // Simulate quality assessment
    await simulateAssessment()

    setStep('resolved')
  }

  const simulateAssessment = async () => {
    // Gradually update the scores
    const targetScore = selectedScenario.expectedScore
    const targetRefund = selectedScenario.expectedRefund

    // Calculate realistic breakdown
    const semanticTarget = targetScore === 90 ? 85 : targetScore === 65 ? 60 : targetScore === 40 ? 25 : 20
    const completenessTarget = targetScore === 90 ? 95 : targetScore === 65 ? 72 : targetScore === 40 ? 30 : 5
    const freshnessTarget = targetScore === 90 ? 90 : targetScore === 65 ? 80 : targetScore === 40 ? 70 : 90

    // Animate to target
    for (let i = 0; i <= 100; i += 5) {
      await sleep(30)
      const progress = i / 100

      setQualityScore(Math.round(targetScore * progress))
      setRefundPercentage(Math.round(targetRefund * progress))
      setBreakdown({
        semantic: Math.round(semanticTarget * progress),
        completeness: Math.round(completenessTarget * progress),
        freshness: Math.round(freshnessTarget * progress),
      })
    }

    // Set final values
    setQualityScore(targetScore)
    setRefundPercentage(targetRefund)
    setBreakdown({
      semantic: semanticTarget,
      completeness: completenessTarget,
      freshness: freshnessTarget,
    })
  }

  const reset = () => {
    setStep('idle')
    setQualityScore(0)
    setRefundPercentage(0)
    setBreakdown({ semantic: 0, completeness: 0, freshness: 0 })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Scenario Selection & Flow */}
      <div className="space-y-6">
        {/* Scenario Selection */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Select Dispute Scenario</h2>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario)
                  if (step !== 'idle') reset()
                }}
                disabled={step !== 'idle'}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  selectedScenario.id === scenario.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                } ${step !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Expected: {scenario.expectedScore}/100 · {scenario.expectedRefund}% refund
                    </p>
                  </div>
                  {selectedScenario.id === scenario.id && (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Scenario Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Agent Query</p>
              <p className="mt-1 text-sm">{selectedScenario.query}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">API Response</p>
              <p className="mt-1 text-sm">{selectedScenario.data}</p>
            </div>
          </div>
        </div>

        {/* Dispute Flow */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-4">Dispute Resolution Flow</h3>
          <div className="space-y-4">
            <FlowStep
              number={1}
              title="Create Escrow"
              status={step === 'idle' ? 'pending' : 'completed'}
              active={step === 'creating'}
            />
            <FlowStep
              number={2}
              title="Mark Disputed"
              status={step === 'idle' || step === 'creating' ? 'pending' : 'completed'}
              active={step === 'disputed'}
            />
            <FlowStep
              number={3}
              title="Switchboard Assessment"
              status={
                step === 'idle' || step === 'creating' || step === 'disputed'
                  ? 'pending'
                  : step === 'assessing'
                  ? 'active'
                  : 'completed'
              }
              active={step === 'assessing'}
            />
            <FlowStep
              number={4}
              title="Resolve Dispute"
              status={step === 'resolved' ? 'completed' : 'pending'}
              active={false}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={step === 'resolved' ? reset : startSimulation}
          disabled={step !== 'idle' && step !== 'resolved'}
          className={`w-full py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            step === 'idle' || step === 'resolved'
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {step === 'resolved' ? (
            <>
              Reset Simulation
              <ArrowRight className="w-5 h-5" />
            </>
          ) : step === 'idle' ? (
            <>
              Start Dispute Simulation
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Processing...
            </>
          )}
        </button>
      </div>

      {/* Right: Quality Assessment & Results */}
      <div className="space-y-6">
        {step === 'idle' ? (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <AlertCircle className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-gray-400">Select a scenario and start the simulation</p>
            <p className="text-sm text-gray-500 mt-2">
              Watch as Switchboard oracles assess data quality in real-time
            </p>
          </div>
        ) : (
          <>
            {/* Quality Score */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold mb-4">Quality Assessment</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Overall Quality Score</span>
                <span className="text-3xl font-bold">{qualityScore}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    qualityScore >= 80
                      ? 'bg-green-500'
                      : qualityScore >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>

            {/* Quality Breakdown */}
            {step === 'assessing' || step === 'resolved' ? (
              <QualityBreakdown breakdown={breakdown} />
            ) : null}

            {/* Refund Result */}
            {step === 'resolved' && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="font-semibold mb-4">Resolution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Refund Percentage</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {refundPercentage}%
                    </span>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      {refundPercentage === 0 && '✅ Good quality - Full payment to API'}
                      {refundPercentage > 0 &&
                        refundPercentage < 100 &&
                        `⚖️ Partial refund - ${refundPercentage}% to agent, ${100 - refundPercentage}% to API`}
                      {refundPercentage === 100 && '🔴 Poor quality - Full refund to agent'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Assessed by Switchboard oracle network</p>
                    <p>• Cryptographic attestation verified on-chain</p>
                    <p>• Cost: ~$0.005 (Switchboard fee)</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface FlowStepProps {
  number: number
  title: string
  status: 'pending' | 'active' | 'completed'
  active: boolean
}

function FlowStep({ number, title, status, active }: FlowStepProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
          status === 'completed'
            ? 'bg-green-500 text-white'
            : status === 'active' || active
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-gray-700 text-gray-400'
        }`}
      >
        {status === 'completed' ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <div className="flex-1">
        <p
          className={`font-medium ${
            status === 'completed' || status === 'active' ? 'text-white' : 'text-gray-400'
          }`}
        >
          {title}
        </p>
      </div>
      {active && <Clock className="w-5 h-5 text-purple-400 animate-spin" />}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
