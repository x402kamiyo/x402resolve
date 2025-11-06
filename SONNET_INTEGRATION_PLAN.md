# Sonnet Integration Plan: Complete Switchboard Fix & Push to Main Repo

## Current Situation

**What's Done:**
- ✅ Code changes made to `lib.rs` (timestamp validation at line 495-504)
- ✅ Dependencies updated in `Cargo.toml` (Anchor 0.30.1, Switchboard 0.10.5)
- ✅ `Anchor.toml` configured for version 0.31.1
- ✅ Agave 2.1.0 installed
- ✅ System Rust 1.88.0 active

**What's NOT Done:**
- ❌ Build still fails (Rust 1.79.0-dev in cargo-build-sbf, need 1.82+)
- ❌ Program not deployed to devnet
- ❌ Tests still failing (6/8 passing, need 8/8)
- ❌ Changes not pushed to main repo (https://github.com/x402kamiyo/x402resolve)

**Current Build Error:**
```
error: rustc 1.79.0-dev is not supported by the following package:
  indexmap@2.12.0 requires rustc 1.82
```

---

## Phase 1: Fix the Build

### Option A: Downgrade Dependencies (RECOMMENDED - Fastest)

The issue is that `indexmap@2.12.0` requires Rust 1.82, but Agave 2.1.0 ships with Rust 1.79.0-dev.

**Solution:** Downgrade dependencies to versions compatible with Rust 1.79:

```bash
cd /workspaces/x402resolve-program/packages/x402-escrow/programs/x402-escrow

# Update Cargo.toml to pin compatible versions
cargo update -p indexmap --precise 2.6.0
cargo update -p hashbrown --precise 0.15.2

# Verify Cargo.lock is updated
git diff Cargo.lock | head -20

# Clean and rebuild
cd /workspaces/x402resolve-program/packages/x402-escrow
rm -rf target/ .anchor/
anchor build
```

**Expected Output:**
```
Compiling x402-escrow v0.1.0
...
Finished release [optimized] target(s) in 90s
```

**Success Indicators:**
- No Rust version errors
- File created: `target/deploy/x402_escrow.so`
- File created: `target/idl/x402_escrow.json`

---

### Option B: Use Anchor's System Rust Override (Alternative)

Anchor 0.31+ should support using system Rust instead of BPF Rust. Try forcing it:

```bash
cd /workspaces/x402resolve-program/packages/x402-escrow

# Set environment variable to force system Rust
export ANCHOR_WALLET=~/.config/solana/id.json
export RUSTC_WRAPPER=""

# Try building with system Rust explicitly
RUSTC=/home/vscode/.rustup/toolchains/1.88.0-x86_64-unknown-linux-gnu/bin/rustc anchor build
```

**If this fails:** Fall back to Option A (downgrade dependencies)

---

### Option C: Install Newer Agave (Last Resort)

Try Agave 2.2 or later which might ship with newer Rust:

```bash
# Check available versions
curl -s https://release.anza.xyz/ | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | sort -V | tail -5

# Install latest
agave-install init 2.2.0  # or whatever latest version is available

# Verify
export PATH="/home/vscode/.local/share/solana/install/active_release/bin:$PATH"
cargo-build-sbf --version  # Should show Rust 1.82+
```

---

## Phase 2: Deploy to Devnet

Once build succeeds:

```bash
cd /workspaces/x402resolve-program/packages/x402-escrow

# Ensure PATH is set
export PATH="/home/vscode/.local/share/solana/install/active_release/bin:$PATH"

# Configure Solana CLI
solana config set --url devnet
solana config set --keypair ~/.config/solana/id.json

# Check wallet balance (should have ~2 SOL from previous funding)
solana balance

# If insufficient funds, request airdrop
solana airdrop 2

# Deploy the program
anchor deploy --provider.cluster devnet
```

**Expected Output:**
```
Deploying cluster: devnet
Upgrade authority: /home/vscode/.config/solana/id.json
Deploying program "x402-escrow"...
Program Id: <NEW_PROGRAM_ID>
Deploy success
```

**IMPORTANT:** Save the new Program ID - you'll need it for the next steps.

---

## Phase 3: Update Configuration Files

Update all files that reference the old program ID with the new one:

```bash
cd /workspaces/x402resolve-program

# Get the new program ID from deployment output
NEW_PROGRAM_ID="<paste_from_deployment>"

# Update Anchor.toml
sed -i "s/x402_escrow = \".*\"/x402_escrow = \"$NEW_PROGRAM_ID\"/" packages/x402-escrow/Anchor.toml

# Update any other config files that reference the program ID
grep -r "67jbeT5hyTJyVo6KtJjBXc24gpxae2yHYd3Y882Up8ow" --include="*.ts" --include="*.js" --include="*.json" .

# Manually update each file found with the new program ID
```

**Files likely to need updates:**
- `packages/x402-escrow/Anchor.toml`
- `production-e2e-test.js`
- `test-production-oracle.ts`
- `test-production-oracle.js`
- `docs/idl.json`
- `packages/x402-sdk/src/constants.ts` (if exists)

---

## Phase 4: Run Tests

### Test 1: Production E2E Tests

```bash
cd /workspaces/x402resolve-program

# Run the E2E test suite
node production-e2e-test.js
```

**Expected Output:**
```
✓ Environment Setup
✓ Wallet Funding
✓ Program Deployment
✓ Agent Reputation
✓ API Reputation
✓ Escrow Creation
✓ Dispute Resolution
✓ Refund Verification

8/8 tests passed
```

**If tests fail:**
- Check the program ID is updated everywhere
- Verify devnet is accessible: `solana cluster-version --url devnet`
- Check wallet balance: `solana balance --url devnet`
- Review error messages for specific issues

---

### Test 2: Oracle Transaction Flow

```bash
cd /workspaces/x402resolve-program

# Run the full oracle transaction test
npx ts-node test-production-oracle.ts
```

**Expected Output:**
```
✓ Agent reputation initialized
✓ API reputation initialized
✓ Escrow created: <signature>
✓ Dispute resolved: <signature>
✅ Success! Agent received X.XXXX SOL refund
```

---

### Test 3: Anchor Tests (Optional)

```bash
cd /workspaces/x402resolve-program/packages/x402-escrow

# Run Anchor unit tests
anchor test --skip-deploy
```

---

## Phase 5: Verify Switchboard Integration

Check that timestamp validation is working:

```bash
# Check program logs for timestamp validation
solana logs --url devnet | grep "Switchboard attestation age"

# Should see logs like:
# Program log: Switchboard attestation age: 45 seconds
```

**Verify these security properties:**
1. Stale attestations (>300s old) are rejected
2. Future timestamps are rejected (age_seconds < 0)
3. Fresh attestations (<300s old) are accepted

---

## Phase 6: Commit Changes to Git

```bash
cd /workspaces/x402resolve-program

# Stage all modified files
git add -A

# Create commit with detailed message
git commit -m "$(cat <<'EOF'
Complete Switchboard oracle integration with timestamp validation

## Changes

### Smart Contract (packages/x402-escrow)
- Implemented timestamp validation in lib.rs:495-504
- Added 300-second freshness check for Switchboard attestations
- Fixed timestamp field access (last_update_timestamp)
- Updated to Anchor 0.31.1 and Switchboard 0.10.5

### Dependencies
- Downgraded indexmap to 2.6.0 (Rust 1.79 compatibility)
- Upgraded to Agave 2.1.0 toolchain
- Updated Cargo.lock to version 3

### Configuration
- Updated program ID in Anchor.toml: <NEW_PROGRAM_ID>
- Configured devnet deployment settings

### Testing
- production-e2e-test.js: 8/8 tests passing
- test-production-oracle.ts: Full oracle flow verified
- Timestamp validation tested and working

### Security Improvements
- Reject stale attestations (>5 minutes old)
- Reject future-dated attestations
- Added attestation age logging for monitoring

## Deployment
- Program deployed to devnet: <NEW_PROGRAM_ID>
- All tests passing
- Ready for production use

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Verify commit
git log -1 --stat
```

---

## Phase 7: Push to Main Repository

### Check Repository Access

First, verify you have access to push to the main repo:

```bash
cd /workspaces/x402resolve-program

# Check current remotes
git remote -v

# Expected output:
# origin  https://github.com/mizuki-tamaki/x402resolve-program (fetch)
# origin  https://github.com/mizuki-tamaki/x402resolve-program (push)
```

---

### Option A: Direct Push (If You Have Write Access)

```bash
cd /workspaces/x402resolve-program

# Add the main repo as a remote
git remote add upstream https://github.com/x402kamiyo/x402resolve.git

# Fetch to ensure we're up to date
git fetch upstream

# Check if there are any conflicts
git diff upstream/main

# Push to main repo
git push upstream main

# If authentication is required, you'll need a GitHub token
```

**If authentication fails:**
You'll need to create a GitHub Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Generate token with `repo` scope
3. Use token as password when prompted

---

### Option B: Create Pull Request (Recommended)

```bash
cd /workspaces/x402resolve-program

# Push to your fork first
git push origin main

# Create PR using GitHub CLI (if available)
gh pr create \
  --repo x402kamiyo/x402resolve \
  --title "Complete Switchboard Oracle Integration with Timestamp Validation" \
  --body "$(cat <<'EOF'
## Summary

This PR completes the Switchboard oracle integration for the x402-escrow program, fixing the build issues and deploying a working version to devnet.

## Changes

### Smart Contract
- ✅ Implemented timestamp validation (300-second freshness check)
- ✅ Fixed Switchboard field access (`last_update_timestamp`)
- ✅ Upgraded to Anchor 0.31.1 and Switchboard 0.10.5

### Build Fixes
- ✅ Resolved Rust toolchain compatibility issues
- ✅ Downgraded indexmap to 2.6.0 (compatible with Rust 1.79)
- ✅ Upgraded to Agave 2.1.0
- ✅ Successfully built and deployed program

### Testing
- ✅ production-e2e-test.js: **8/8 tests passing** (was 6/8)
- ✅ test-production-oracle.ts: Full oracle flow verified
- ✅ Timestamp validation working correctly

### Security
- ✅ Stale attestations (>5 minutes) rejected
- ✅ Future-dated attestations rejected
- ✅ Attestation age logging for monitoring

## Deployment

**New Program ID:** `<NEW_PROGRAM_ID>`

Deployed to devnet and fully tested. All 8 E2E tests passing.

## Test Plan

- [x] Build completes without errors
- [x] Program deploys to devnet
- [x] E2E tests pass (8/8)
- [x] Oracle transaction flow verified
- [x] Timestamp validation tested
EOF
)"
```

**If `gh` CLI is not available:**

Manually create the PR:
1. Push to your fork: `git push origin main`
2. Visit: https://github.com/x402kamiyo/x402resolve/compare/main...mizuki-tamaki:x402resolve-program:main
3. Click "Create Pull Request"
4. Copy the PR body from above

---

### Option C: Manual Remote Setup

If you want to push directly but don't have the upstream remote:

```bash
cd /workspaces/x402resolve-program

# Check if you can access the main repo
git ls-remote https://github.com/x402kamiyo/x402resolve.git

# If successful, add as remote and push
git remote add upstream https://github.com/x402kamiyo/x402resolve.git
git push upstream main

# If you get permission denied, you'll need to create a PR instead
```

---

## Phase 8: Documentation Updates (Optional)

Update documentation to reflect the completed integration:

```bash
cd /workspaces/x402resolve-program

# Update SWITCHBOARD_FIX_PLAN.md to reflect completion
cat > SWITCHBOARD_FIX_PLAN.md <<'EOF'
# Switchboard Oracle Integration - COMPLETED ✅

## Status: Deployed to Devnet

**Program ID:** <NEW_PROGRAM_ID>

**Date Completed:** 2025-11-06

## Summary

Successfully integrated Switchboard On-Demand oracles with timestamp validation.

## What Was Accomplished

1. ✅ Implemented timestamp validation (300-second freshness check)
2. ✅ Fixed Rust toolchain compatibility (Agave 2.1.0 + dependency downgrades)
3. ✅ Built program successfully with Anchor 0.31.1
4. ✅ Deployed to devnet
5. ✅ All tests passing (8/8)

## Test Results

- production-e2e-test.js: 8/8 passing ✅
- test-production-oracle.ts: Full flow verified ✅
- Timestamp validation: Working correctly ✅

## Security Validation

- ✅ Stale attestations (>300s) rejected
- ✅ Future timestamps rejected
- ✅ Fresh attestations accepted
- ✅ Attestation age logged for monitoring

## Next Steps

- Monitor devnet deployment
- Prepare for mainnet deployment
- Update SDK documentation

EOF

# Commit the documentation update
git add SWITCHBOARD_FIX_PLAN.md
git commit -m "docs: Update Switchboard fix plan - COMPLETED"
git push origin main
```

---

## Troubleshooting Guide

### Problem: Build fails with "indexmap requires rustc 1.82"

**Solution:**
```bash
cd /workspaces/x402resolve-program/packages/x402-escrow/programs/x402-escrow
cargo update -p indexmap --precise 2.6.0
cargo update -p hashbrown --precise 0.15.2
```

---

### Problem: Deploy fails with "insufficient funds"

**Solution:**
```bash
solana airdrop 2 --url devnet
# Wait 30 seconds
solana balance --url devnet
# Retry deploy
```

---

### Problem: Tests fail with "Program not found"

**Solution:**
1. Verify program deployed: `solana program show <PROGRAM_ID> --url devnet`
2. Update program ID in all config files
3. Wait 30 seconds for propagation
4. Retry tests

---

### Problem: "gh: command not found"

**Solution:**
```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

**Alternative:** Create PR manually through GitHub web interface

---

### Problem: Push fails with "authentication required"

**Solution:**
```bash
# Create GitHub Personal Access Token
# Visit: https://github.com/settings/tokens
# Generate token with 'repo' scope

# Configure git to use token
git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/mizuki-tamaki/x402resolve-program.git
git remote set-url upstream https://<YOUR_GITHUB_TOKEN>@github.com/x402kamiyo/x402resolve.git

# Retry push
```

---

## Success Criteria Checklist

Before pushing to main repo, verify ALL items:

- [ ] `anchor build` completes without errors
- [ ] Program deployed to devnet successfully
- [ ] Program ID updated in all config files
- [ ] `production-e2e-test.js` shows 8/8 tests passing
- [ ] `test-production-oracle.ts` completes successfully
- [ ] Timestamp validation logs visible in program output
- [ ] All changes committed to git with descriptive message
- [ ] No uncommitted changes: `git status` is clean
- [ ] Build artifacts excluded from git (in .gitignore)

---

## Quick Command Reference

```bash
# Check build status
cd /workspaces/x402resolve-program/packages/x402-escrow && anchor build

# Check deployment
solana program show <PROGRAM_ID> --url devnet

# Run tests
cd /workspaces/x402resolve-program && node production-e2e-test.js
cd /workspaces/x402resolve-program && npx ts-node test-production-oracle.ts

# Check git status
git status
git log -1

# Push to main repo
git push upstream main
# OR create PR
gh pr create --repo x402kamiyo/x402resolve --title "..." --body "..."
```

---

## Estimated Time

- Phase 1 (Fix Build): 5-10 minutes
- Phase 2 (Deploy): 2-5 minutes
- Phase 3 (Update Config): 5 minutes
- Phase 4 (Run Tests): 5-10 minutes
- Phase 5 (Verify): 5 minutes
- Phase 6 (Commit): 2 minutes
- Phase 7 (Push): 5 minutes
- **Total: 30-40 minutes**

---

## Key Files to Update

| File | Action | Why |
|------|--------|-----|
| `packages/x402-escrow/Anchor.toml` | Update program ID | Deployment configuration |
| `production-e2e-test.js` | Update program ID | Test configuration |
| `test-production-oracle.ts` | Update program ID | Test configuration |
| `docs/idl.json` | Replace with new IDL | Frontend integration |
| `SWITCHBOARD_FIX_PLAN.md` | Mark as completed | Documentation |

---

## Final Notes

**Critical:** The main challenge is getting the build to work. Once the build succeeds, deployment and testing should be straightforward.

**Recommended Approach:**
1. Start with Option A (downgrade dependencies) - fastest and most reliable
2. If that fails, try Option B (system Rust override)
3. Only use Option C (newer Agave) as last resort

**After Successful Push:**
- Monitor the PR/commit in GitHub
- Check CI/CD pipeline status (if configured)
- Notify team members of the update
- Update any dependent repositories

**Contact Information:**
- Original work: Opus 4.1 agent (2025-11-06)
- Integration plan: Opus 4.1 agent (2025-11-06)
- Execution: Sonnet 4.5 agent (pending)
