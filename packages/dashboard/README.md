# x402Resolve Dashboard

Interactive dashboard for demonstrating trustless dispute resolution with Switchboard On-Demand oracles.

## Features

### 🎮 Live Dispute Simulator
- **4 Predefined Scenarios**: Perfect match, partial match, poor quality, empty response
- **Real-time Quality Assessment**: Watch as Switchboard oracles score data quality
- **Interactive Flow Visualization**: See each step of the dispute resolution process
- **Animated Results**: Quality breakdown with charts and detailed metrics

### 💰 Cost Calculator
- **Dynamic Comparison**: Python verifier vs Switchboard at different volumes
- **Interactive Slider**: Adjust disputes per month (100 to 100,000)
- **Cost Breakdown**: Detailed hosting and per-request costs
- **Visualization**: Line chart showing break-even point (~10,000 disputes/month)
- **Recommendation Matrix**: When to use each solution

### 📊 Quality Breakdown
- **3 Component Scores**: Semantic (40%), Completeness (40%), Freshness (20%)
- **Bar Chart Visualization**: Color-coded metrics
- **Progress Bars**: Real-time score updates
- **Formula Display**: Show calculation methodology

## Running Locally

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd packages/dashboard
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:3000

### Build

```bash
npm run build
```

Output in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Technology Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Lucide React**: Icons

## Components

### DisputeSimulator
Main interactive component for simulating dispute resolution flow.

**Features:**
- Scenario selection (4 presets)
- Step-by-step flow visualization
- Animated quality assessment
- Final resolution with refund calculation

**States:**
- `idle`: Waiting to start
- `creating`: Creating escrow
- `disputed`: Marking dispute
- `assessing`: Switchboard assessing quality
- `resolved`: Final result

### QualityBreakdown
Visualizes the three quality components with charts and progress bars.

**Displays:**
- Bar chart of all three scores
- Individual progress bars
- Component descriptions
- Weighted calculation formula

### CostCalculator
Compares costs between Python verifier and Switchboard at scale.

**Features:**
- Interactive volume slider
- Cost comparison cards
- Line chart visualization
- Break-even analysis
- Recommendation matrix
- Hybrid approach guidance

## Dispute Scenarios

### Perfect Match (Score: 90, Refund: 0%)
- Query: "Uniswap V3 exploits on Ethereum"
- Data: High-quality Uniswap V3 data
- Breakdown: Semantic 85%, Completeness 95%, Freshness 90%

### Partial Match (Score: 65, Refund: 19%)
- Query: "Recent Solana exploits with transaction details"
- Data: Incomplete Solana data
- Breakdown: Semantic 60%, Completeness 72%, Freshness 80%

### Poor Quality (Score: 40, Refund: 100%)
- Query: "Uniswap exploits"
- Data: Wrong protocol (Curve)
- Breakdown: Semantic 25%, Completeness 30%, Freshness 70%

### Empty Response (Score: 28, Refund: 100%)
- Query: "Terra Luna exploits"
- Data: Empty array
- Breakdown: Semantic 20%, Completeness 5%, Freshness 90%

## Cost Calculations

### Python Verifier
- **Hosting**: $50/month (<10k disputes), $100/month (10k-100k), $500/month (>100k)
- **Per Request**: ~$0 (marginal cost)
- **Latency**: 100-500ms

### Switchboard
- **Hosting**: $0 (no fixed costs)
- **Per Dispute**: $0.005
- **Latency**: 2-5 seconds

### Break-even
- **~10,000 disputes/month**: Both cost ~$50/month
- **Below 10k**: Switchboard cheaper
- **Above 10k**: Python cheaper

## Customization

### Adding New Scenarios

Edit `src/components/DisputeSimulator.tsx`:

```typescript
const scenarios: DisputeScenario[] = [
  {
    id: 'custom',
    name: 'Custom Scenario',
    query: 'Your query',
    data: 'Your data description',
    expectedScore: 75,
    expectedRefund: 31,
  },
  // ... existing scenarios
]
```

### Adjusting Cost Formula

Edit `src/components/CostCalculator.tsx`:

```typescript
function calculatePythonCost(disputes: number): number {
  // Your custom hosting cost logic
  return customCalculation(disputes)
}

function calculateSwitchboardCost(disputes: number): number {
  // Adjust per-dispute cost
  return disputes * YOUR_COST_PER_DISPUTE
}
```

### Theming

Colors defined in `tailwind.config.js`:

```javascript
colors: {
  'x402-purple': '#9333ea',
  'x402-blue': '#3b82f6',
  'x402-green': '#10b981',
}
```

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
npm run build
# Copy dist/ to gh-pages branch
```

## Integration with SDK

The dashboard can be connected to live Solana devnet:

```typescript
import { EscrowClient, SwitchboardClient } from '@kamiyo/x402-sdk'

// In DisputeSimulator.tsx
const escrowClient = new EscrowClient(config, IDL)
const switchboardClient = new SwitchboardClient(sbConfig)

// Use real transactions instead of simulation
const tx = await escrowClient.createEscrow(params)
```

## Performance

- **Initial Load**: ~100KB gzipped
- **First Contentful Paint**: <1s
- **Time to Interactive**: <2s
- **Lighthouse Score**: 95+

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 15+, Chrome Android

## Future Enhancements

### Phase 1 (Current)
- ✅ Live dispute simulator
- ✅ Cost calculator
- ✅ Quality breakdown visualization

### Phase 2 (Planned)
- [ ] Live Solana devnet integration
- [ ] Real-time transaction tracking
- [ ] Historical dispute data
- [ ] Wallet connection (Phantom, Solflare)
- [ ] User reputation tracking

### Phase 3 (Future)
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Advanced analytics
- [ ] Export reports (PDF)
- [ ] API for embedding

## Contributing

```bash
# Fork and clone
git clone https://github.com/x402kamiyo/x402resolve.git
cd x402resolve/packages/dashboard

# Create branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev
npm run build

# Submit PR
git push origin feature/your-feature
```

## License

MIT

## Links

- [GitHub](https://github.com/x402kamiyo/x402resolve)
- [Documentation](https://docs.x402resolve.com)
- [Switchboard Docs](https://docs.switchboard.xyz/)
- [Solana Docs](https://docs.solana.com/)
