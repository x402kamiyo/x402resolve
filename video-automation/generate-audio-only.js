require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const scenes = [
  {
    id: 1,
    name: "hook-problem",
    duration: 20,
    text: "When APIs require payment, disputes are expensive and slow. Traditional payment processors charge thirty-five dollars per dispute and take up to ninety days to resolve. x402Resolve solves this with blockchain-based dispute resolution. Quality-verified refunds, resolved in forty-eight hours, for less than one cent per transaction."
  },
  {
    id: 2,
    name: "architecture",
    duration: 25,
    text: "The architecture uses Solana program derived addresses for trustless escrow. When an agent makes an API request, payment is locked in an on-chain escrow account. A quality oracle analyzes the response using multiple factors: semantic similarity, completeness, and data freshness. Scores below eighty percent trigger automatic proportional refunds. The entire process is transparent and verifiable on-chain."
  },
  {
    id: 3,
    name: "live-demo",
    duration: 45,
    text: "Let's see the system in action. We start by running an autonomous agent that requests security intelligence data from the KAMIYO API. The API responds with HTTP 402 payment required, including the escrow account address. The agent creates an escrow on Solana, funding it with the requested amount. With payment proof attached, the API returns the requested exploit data. Now the agent evaluates the response quality. Semantic similarity: seventy percent. Completeness: sixty percent. Data freshness: ninety percent. Overall quality score: sixty-five percent. Since this is below the eighty percent threshold, the agent automatically files an on-chain dispute. The oracle verifies the quality assessment and executes a thirty-five percent refund. The transaction completes in under two seconds."
  },
  {
    id: 4,
    name: "dashboard",
    duration: 30,
    text: "The live dashboard tracks all system activity in real-time. These are actual transactions on Solana devnet. The technical metrics show comprehensive test coverage, with ninety-one percent of the codebase verified. Market impact analysis demonstrates value across multiple industries: financial services see eighty-one percent fraud reduction. Performance benchmarks highlight sub-second transaction times and ninety-nine point nine percent oracle reliability. Every metric is backed by on-chain data."
  },
  {
    id: 5,
    name: "code-switchboard",
    duration: 30,
    text: "The escrow program is implemented in Rust using the Anchor framework. Program derived addresses ensure trustless operation with no admin keys. Signature verification leverages Solana's native Ed25519 instruction for cryptographic proof. Time-lock constraints prevent premature fund release. The Switchboard oracle integration provides decentralized quality verification as an alternative to centralized assessment. For AI agent integration, the MCP server exposes dispute filing through Claude Desktop, enabling natural language interaction with the dispute resolution system."
  },
  {
    id: 6,
    name: "impact-cta",
    duration: 30,
    text: "x402Resolve delivers measurable impact. Payment dispute costs drop from thirty-five dollars to half a cent. That's ninety-nine point nine percent cost reduction. Resolution time decreases from ninety days to forty-eight hours. Eighty-five percent faster. The system is live on Solana devnet with full test coverage and comprehensive documentation. API providers can integrate with the TypeScript SDK or Python middleware. Autonomous agents can use the agent client library for automatic dispute handling. The program address and complete source code are available on GitHub. Start building trustless payment systems today. Developed by KAMIYO."
  }
];

async function generateAudio() {
  const outputDir = path.join(__dirname, 'audio-output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating audio files...\n');

  for (const scene of scenes) {
    console.log(`Generating scene ${scene.id}: ${scene.name} (${scene.duration}s)`);

    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      speed: 1.15,
      input: scene.text,
      response_format: 'mp3'
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `scene-${String(scene.id).padStart(2, '0')}-${scene.name}.mp3`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, buffer);
    console.log(`  ✓ Saved: ${filename}\n`);
  }

  console.log('All audio files generated successfully!');
  console.log(`Output directory: ${outputDir}`);
}

generateAudio().catch(console.error);
