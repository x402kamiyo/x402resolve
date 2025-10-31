# Hosted Demo Guide

Step-by-step guide for deploying the interactive demo to production hosting.

## Quick Deploy Options

### Option 1: GitHub Pages (Recommended)

**Zero cost, automatic SSL, instant deployment**

```bash
# 1. Enable GitHub Pages
# Go to repo Settings → Pages → Source: main branch → /demo folder

# 2. Access demo at:
# https://x402kamiyo.github.io/x402resolve/

# 3. Custom domain (optional):
# Add CNAME file with: demo.x402resolve.com
```

**Build time**: <2 minutes
**Cost**: $0/month
**SSL**: Automatic (Let's Encrypt)
**CDN**: GitHub's global CDN

### Option 2: Vercel

**One-click deploy with preview URLs**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy demo
cd demo
vercel --prod

# 3. Result:
# https://x402resolve-demo.vercel.app
```

**Build time**: <1 minute
**Cost**: $0/month (hobby tier)
**SSL**: Automatic
**CDN**: Global edge network

### Option 3: Netlify

**Drag-and-drop deployment**

```bash
# 1. Go to https://app.netlify.com/drop
# 2. Drag demo/ folder
# 3. Get instant URL: https://x402resolve.netlify.app
```

**Build time**: <30 seconds
**Cost**: $0/month
**SSL**: Automatic
**CDN**: Global CDN

## Demo Features

### Interactive Components

1. **Quality Score Simulator**
   - Adjust semantic, completeness, freshness sliders
   - Real-time quality score calculation
   - Dynamic refund percentage display

2. **Dispute Timeline**
   - Animated workflow visualization
   - Step-by-step resolution process
   - Time estimates for each phase

3. **Live Transactions**
   - Connect to Solana devnet
   - Query real program state
   - Display actual escrow accounts

4. **Code Examples**
   - Copy-paste SDK integration
   - Language switcher (TypeScript/Python/Rust)
   - Syntax highlighting

## Hosting Requirements

### Static Files Only
```
demo/
├── index.html (main page)
├── styles.css (responsive design)
└── script.js (interactive logic)
```

**No build step required** - pure HTML/CSS/JS

### Browser Compatibility
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile browsers ✓

## Environment Configuration

### Production URLs

Update script.js with production endpoints:

```javascript
// Development
const VERIFIER_URL = 'http://localhost:8000';
const RPC_URL = 'https://api.devnet.solana.com';

// Production
const VERIFIER_URL = 'https://verifier.x402resolve.com';
const RPC_URL = 'https://api.mainnet-beta.solana.com';
```

### API CORS

Configure verifier oracle for browser requests:

```python
# packages/x402-verifier/verifier.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://x402resolve.github.io",
        "https://demo.x402resolve.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## Deployment Steps

### GitHub Pages (Detailed)

```bash
# 1. Prepare demo folder
cd demo
ls
# Expected: index.html, styles.css, script.js

# 2. Create GitHub workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy-demo.yml << 'EOF'
name: Deploy Demo
on:
  push:
    branches: [main]
    paths: ['demo/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./demo
          cname: demo.x402resolve.com
EOF

# 3. Push to trigger deployment
git add .github/workflows/deploy-demo.yml
git commit -m "Add demo deployment workflow"
git push origin main

# 4. Wait 2 minutes for build
# 5. Access: https://x402kamiyo.github.io/x402resolve/
```

### Vercel (Detailed)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Create vercel.json config
cat > demo/vercel.json << 'EOF'
{
  "version": 2,
  "name": "x402resolve-demo",
  "builds": [
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOF

# 4. Deploy
cd demo
vercel --prod

# 5. Result:
# ✓ Production: https://x402resolve-demo.vercel.app
```

### Netlify (Detailed)

```bash
# Method 1: Drag & Drop
# 1. Go to https://app.netlify.com/drop
# 2. Drag demo/ folder
# 3. Done!

# Method 2: CLI
npm install -g netlify-cli
netlify login
cd demo
netlify deploy --prod

# Method 3: GitHub Integration
# 1. https://app.netlify.com → New site from Git
# 2. Select GitHub repo
# 3. Build settings:
#    - Base directory: demo
#    - Publish directory: demo
# 4. Deploy!
```

## Custom Domain Setup

### GitHub Pages + Custom Domain

```bash
# 1. Add CNAME record in DNS:
# demo.x402resolve.com → x402kamiyo.github.io

# 2. Create CNAME file:
echo "demo.x402resolve.com" > demo/CNAME

# 3. Commit and push:
git add demo/CNAME
git commit -m "Add custom domain"
git push

# 4. Enable HTTPS in GitHub Settings → Pages
```

### Vercel + Custom Domain

```bash
# 1. Run: vercel domains add demo.x402resolve.com
# 2. Add DNS records shown
# 3. Wait for SSL (automatic)
```

### Netlify + Custom Domain

```bash
# 1. Site settings → Domain management → Add custom domain
# 2. Add DNS records shown
# 3. Enable HTTPS (automatic)
```

## Analytics Integration

### Google Analytics

```html
<!-- Add to demo/index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Plausible Analytics (Privacy-focused)

```html
<!-- Add to demo/index.html <head> -->
<script defer data-domain="demo.x402resolve.com"
        src="https://plausible.io/js/script.js"></script>
```

## Performance Optimization

### CDN Configuration

```html
<!-- demo/index.html -->

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://api.devnet.solana.com">
<link rel="preconnect" href="https://verifier.x402resolve.com">

<!-- Preload critical resources -->
<link rel="preload" href="styles.css" as="style">
<link rel="preload" href="script.js" as="script">
```

### Caching Headers

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

## Monitoring

### Uptime Monitoring

**UptimeRobot** (Free):
- Monitor: https://demo.x402resolve.com
- Check interval: 5 minutes
- Alerts: Email, Slack, Discord

**Pingdom** (Free tier):
- Monitor: https://demo.x402resolve.com
- Check interval: 1 minute
- Real user monitoring

### Error Tracking

**Sentry** (Free tier):

```html
<!-- Add to demo/index.html -->
<script src="https://browser.sentry-cdn.com/8.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: "https://your-key@sentry.io/project-id",
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
</script>
```

## Load Testing

```bash
# Test concurrent users
npx artillery quick --count 100 --num 10 https://demo.x402resolve.com

# Expected:
# - 100 concurrent users
# - 10 requests each
# - <500ms avg response time
# - 0% error rate
```

## Demo URL Examples

### GitHub Pages
```
Production: https://x402kamiyo.github.io/x402resolve/
Custom:     https://demo.x402resolve.com
```

### Vercel
```
Production: https://x402resolve-demo.vercel.app
Preview:    https://x402resolve-demo-git-feat-xyz.vercel.app (per branch)
```

### Netlify
```
Production: https://x402resolve.netlify.app
Preview:    https://deploy-preview-123--x402resolve.netlify.app (per PR)
```

## Maintenance

### Update Demo Content

```bash
# 1. Edit demo files locally
cd demo
# Edit index.html, styles.css, script.js

# 2. Test locally
python3 -m http.server 8080
# Open: http://localhost:8080

# 3. Deploy updates
git add demo/
git commit -m "Update demo: new feature showcase"
git push

# 4. Automatic deployment via CI/CD (2 min)
```

### Rollback

```bash
# GitHub Pages
git revert HEAD
git push

# Vercel
vercel rollback

# Netlify
netlify rollback
```

## Checklist

Before going live:

- [ ] Update API endpoints to production
- [ ] Configure CORS on verifier oracle
- [ ] Add custom domain DNS records
- [ ] Enable HTTPS (automatic on all platforms)
- [ ] Add analytics tracking
- [ ] Test on mobile devices
- [ ] Setup uptime monitoring
- [ ] Configure error tracking
- [ ] Run load tests
- [ ] Update README with demo URL
- [ ] Share demo link in hackathon submission

## Cost Summary

| Platform | Free Tier | Bandwidth | SSL | CDN |
|----------|-----------|-----------|-----|-----|
| GitHub Pages | ✓ | 100 GB/month | ✓ | ✓ |
| Vercel | ✓ | 100 GB/month | ✓ | ✓ |
| Netlify | ✓ | 100 GB/month | ✓ | ✓ |

**Total Cost**: $0/month for demo hosting

## Live Demo

**Production URL**: https://demo.x402resolve.com
**Backup URL**: https://x402kamiyo.github.io/x402resolve/
**Status**: https://status.x402resolve.com

Try the interactive demo to see x402Resolve in action:
1. Simulate quality disputes
2. Visualize refund calculations
3. Explore code examples
4. Connect to live devnet
