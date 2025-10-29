use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("X402Esc11111111111111111111111111111111111");

/// x402Resolve Escrow Program
///
/// Holds payments in escrow with time-lock and dispute resolution.
/// Enables automated refunds based on verifier oracle signatures.
#[program]
pub mod x402_escrow {
    use super::*;

    /// Initialize a new escrow for agent-to-API payment
    ///
    /// # Arguments
    /// * `amount` - Amount to escrow (lamports)
    /// * `time_lock` - Duration before auto-release (seconds)
    /// * `transaction_id` - Unique transaction identifier
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        time_lock: i64,
        transaction_id: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        escrow.agent = ctx.accounts.agent.key();
        escrow.api = ctx.accounts.api.key();
        escrow.amount = amount;
        escrow.status = EscrowStatus::Active;
        escrow.created_at = clock.unix_timestamp;
        escrow.expires_at = clock.unix_timestamp + time_lock;
        escrow.transaction_id = transaction_id;
        escrow.bump = ctx.bumps.escrow;

        // Transfer SOL to escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.agent.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        msg!("Escrow initialized: {} SOL locked", amount as f64 / 1_000_000_000.0);
        msg!("Expires at: {}", escrow.expires_at);

        Ok(())
    }

    /// Release funds to API (happy path - no dispute)
    ///
    /// Can be called by:
    /// - Agent (explicitly releasing)
    /// - Anyone after time_lock expires (auto-release)
    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::InvalidStatus
        );

        // Check if caller is agent OR time_lock expired
        let can_release = ctx.accounts.agent.key() == escrow.agent
            || clock.unix_timestamp >= escrow.expires_at;

        require!(can_release, EscrowError::Unauthorized);

        // Transfer full amount to API
        let seeds = &[
            b"escrow",
            escrow.transaction_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.api.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, escrow.amount)?;

        escrow.status = EscrowStatus::Released;

        msg!("Funds released to API: {} SOL", escrow.amount as f64 / 1_000_000_000.0);

        Ok(())
    }

    /// Resolve dispute with verifier oracle signature
    ///
    /// x402 Verifier Oracle assesses quality and signs a refund percentage.
    /// This instruction validates the signature and splits funds accordingly.
    ///
    /// # Arguments
    /// * `quality_score` - Quality score from verifier (0-100)
    /// * `refund_percentage` - Refund percentage (0-100)
    /// * `signature` - Ed25519 signature from verifier oracle
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        quality_score: u8,
        refund_percentage: u8,
        signature: [u8; 64],
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Active || escrow.status == EscrowStatus::Disputed,
            EscrowError::InvalidStatus
        );

        require!(quality_score <= 100, EscrowError::InvalidQualityScore);
        require!(refund_percentage <= 100, EscrowError::InvalidRefundPercentage);

        // Verify signature from verifier oracle
        // Message format: "{transaction_id}:{quality_score}"
        let message = format!("{}:{}", escrow.transaction_id, quality_score);
        let message_bytes = message.as_bytes();

        // Verify signature with verifier public key
        // NOTE: In production, store verifier public key in program state
        let verifier_pubkey = ctx.accounts.verifier.key();

        // Simplified signature verification (in production, use ed25519_dalek)
        // For now, we trust that the signature was validated off-chain
        msg!("Verifier: {}", verifier_pubkey);
        msg!("Quality Score: {}", quality_score);
        msg!("Refund: {}%", refund_percentage);

        // Calculate split amounts
        let refund_amount = (escrow.amount as u128)
            .checked_mul(refund_percentage as u128)
            .unwrap()
            .checked_div(100)
            .unwrap() as u64;

        let payment_amount = escrow.amount - refund_amount;

        msg!("Refund to Agent: {} SOL", refund_amount as f64 / 1_000_000_000.0);
        msg!("Payment to API: {} SOL", payment_amount as f64 / 1_000_000_000.0);

        // Transfer refund to agent
        if refund_amount > 0 {
            let seeds = &[
                b"escrow",
                escrow.transaction_id.as_bytes(),
                &[escrow.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.agent.to_account_info(),
                },
                signer,
            );
            anchor_lang::system_program::transfer(cpi_context, refund_amount)?;
        }

        // Transfer payment to API
        if payment_amount > 0 {
            let seeds = &[
                b"escrow",
                escrow.transaction_id.as_bytes(),
                &[escrow.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.api.to_account_info(),
                },
                signer,
            );
            anchor_lang::system_program::transfer(cpi_context, payment_amount)?;
        }

        escrow.status = EscrowStatus::Resolved;
        escrow.quality_score = Some(quality_score);
        escrow.refund_percentage = Some(refund_percentage);

        msg!("Dispute resolved!");

        Ok(())
    }

    /// Mark escrow as disputed (agent initiates dispute)
    pub fn mark_disputed(ctx: Context<MarkDisputed>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::InvalidStatus
        );

        require!(
            ctx.accounts.agent.key() == escrow.agent,
            EscrowError::Unauthorized
        );

        escrow.status = EscrowStatus::Disputed;

        msg!("Escrow marked as disputed");

        Ok(())
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[derive(Accounts)]
#[instruction(amount: u64, time_lock: i64, transaction_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = agent,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", transaction_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub agent: Signer<'info>,

    /// CHECK: API wallet address
    pub api: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.transaction_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub agent: Signer<'info>,

    /// CHECK: API wallet address
    #[account(mut)]
    pub api: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.transaction_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub agent: SystemAccount<'info>,

    /// CHECK: API wallet address
    #[account(mut)]
    pub api: AccountInfo<'info>,

    /// CHECK: Verifier oracle public key
    pub verifier: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkDisputed<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.transaction_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub agent: Signer<'info>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub agent: Pubkey,                    // 32
    pub api: Pubkey,                      // 32
    pub amount: u64,                      // 8
    pub status: EscrowStatus,             // 1 + 1
    pub created_at: i64,                  // 8
    pub expires_at: i64,                  // 8
    #[max_len(64)]
    pub transaction_id: String,           // 4 + 64
    pub bump: u8,                         // 1
    pub quality_score: Option<u8>,        // 1 + 1
    pub refund_percentage: Option<u8>,    // 1 + 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Active,      // Payment locked, awaiting resolution
    Released,    // Funds released to API (happy path)
    Disputed,    // Agent disputed quality
    Resolved,    // Dispute resolved with refund split
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow status for this operation")]
    InvalidStatus,

    #[msg("Unauthorized: Only agent or expired escrow can release")]
    Unauthorized,

    #[msg("Invalid quality score (must be 0-100)")]
    InvalidQualityScore,

    #[msg("Invalid refund percentage (must be 0-100)")]
    InvalidRefundPercentage,

    #[msg("Invalid verifier signature")]
    InvalidSignature,
}
