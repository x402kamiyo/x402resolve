use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    sysvar::instructions::{load_instruction_at_checked, ID as INSTRUCTIONS_ID},
};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("BtSoJmuFZCq8DmWbesuAbu7E6KJijeSeLLBUWTKC6x4P");

// Validation constants
const MIN_TIME_LOCK: i64 = 3600;                    // 1 hour
const MAX_TIME_LOCK: i64 = 2_592_000;               // 30 days
const MAX_ESCROW_AMOUNT: u64 = 1_000_000_000_000;   // 1000 SOL
const MIN_ESCROW_AMOUNT: u64 = 1_000_000;           // 0.001 SOL

#[event]
pub struct EscrowInitialized {
    pub escrow: Pubkey,
    pub agent: Pubkey,
    pub api: Pubkey,
    pub amount: u64,
    pub expires_at: i64,
    pub transaction_id: String,
}

#[event]
pub struct DisputeMarked {
    pub escrow: Pubkey,
    pub agent: Pubkey,
    pub transaction_id: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub escrow: Pubkey,
    pub transaction_id: String,
    pub quality_score: u8,
    pub refund_percentage: u8,
    pub refund_amount: u64,
    pub payment_amount: u64,
    pub verifier: Pubkey,
}

#[event]
pub struct FundsReleased {
    pub escrow: Pubkey,
    pub transaction_id: String,
    pub amount: u64,
    pub api: Pubkey,
    pub timestamp: i64,
}

/// x402Resolve Escrow Program
///
/// Holds payments in escrow with time-lock and dispute resolution.
/// Enables automated refunds based on verifier oracle signatures.
#[program]
pub mod x402_escrow {
    use super::*;

    /// Verify Ed25519 signature instruction
    ///
    /// Checks that an Ed25519 signature verification instruction exists in the transaction
    /// and validates the signature against the expected message format
    fn verify_ed25519_signature(
        instructions_sysvar: &AccountInfo,
        signature: &[u8; 64],
        verifier_pubkey: &Pubkey,
        message: &[u8],
    ) -> Result<()> {
        // Load the Ed25519 instruction from the sysvar
        // Expected to be at index 0 (before the current instruction)
        let ix = load_instruction_at_checked(0, instructions_sysvar)
            .map_err(|_| error!(EscrowError::InvalidSignature))?;

        // Verify it's the Ed25519 program
        require!(
            ix.program_id == ed25519_program::ID,
            EscrowError::InvalidSignature
        );

        // Ed25519 instruction data layout:
        // [0]: num_signatures (should be 1)
        // [1]: padding
        // [2..4]: signature_offset (u16)
        // [4..6]: signature_instruction_index (u16)
        // [6..8]: public_key_offset (u16)
        // [8..10]: public_key_instruction_index (u16)
        // [10..12]: message_data_offset (u16)
        // [12..14]: message_data_size (u16)
        // [14..16]: message_instruction_index (u16)
        // [16..]: data (signature + pubkey + message)

        require!(
            ix.data.len() >= 16,
            EscrowError::InvalidSignature
        );

        // Verify we have exactly 1 signature
        require!(
            ix.data[0] == 1,
            EscrowError::InvalidSignature
        );

        // Parse offsets
        let sig_offset = u16::from_le_bytes([ix.data[2], ix.data[3]]) as usize;
        let pubkey_offset = u16::from_le_bytes([ix.data[6], ix.data[7]]) as usize;
        let message_offset = u16::from_le_bytes([ix.data[10], ix.data[11]]) as usize;
        let message_size = u16::from_le_bytes([ix.data[12], ix.data[13]]) as usize;

        // Verify signature matches
        let ix_signature = &ix.data[sig_offset..sig_offset + 64];
        require!(
            ix_signature == signature,
            EscrowError::InvalidSignature
        );

        // Verify public key matches
        let ix_pubkey = &ix.data[pubkey_offset..pubkey_offset + 32];
        require!(
            ix_pubkey == verifier_pubkey.as_ref(),
            EscrowError::InvalidSignature
        );

        // Verify message matches
        let ix_message = &ix.data[message_offset..message_offset + message_size];
        require!(
            ix_message == message,
            EscrowError::InvalidSignature
        );

        Ok(())
    }

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
        // Validate inputs
        require!(
            amount >= MIN_ESCROW_AMOUNT,
            EscrowError::InvalidAmount
        );
        require!(
            amount <= MAX_ESCROW_AMOUNT,
            EscrowError::AmountTooLarge
        );
        require!(
            time_lock >= MIN_TIME_LOCK && time_lock <= MAX_TIME_LOCK,
            EscrowError::InvalidTimeLock
        );
        require!(
            !transaction_id.is_empty() && transaction_id.len() <= 64,
            EscrowError::InvalidTransactionId
        );

        let clock = Clock::get()?;

        // Initialize escrow state
        {
            let escrow = &mut ctx.accounts.escrow;
            escrow.agent = ctx.accounts.agent.key();
            escrow.api = ctx.accounts.api.key();
            escrow.amount = amount;
            escrow.status = EscrowStatus::Active;
            escrow.created_at = clock.unix_timestamp;
            escrow.expires_at = clock.unix_timestamp + time_lock;
            escrow.transaction_id = transaction_id.clone();
            escrow.bump = ctx.bumps.escrow;
        }

        // Transfer SOL to escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.agent.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        let expires_at = clock.unix_timestamp + time_lock;
        msg!("Escrow initialized: {} SOL locked", amount as f64 / 1_000_000_000.0);
        msg!("Expires at: {}", expires_at);

        let escrow = &ctx.accounts.escrow;
        emit!(EscrowInitialized {
            escrow: escrow.key(),
            agent: escrow.agent,
            api: escrow.api,
            amount: escrow.amount,
            expires_at: escrow.expires_at,
            transaction_id: transaction_id,
        });

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
        let is_agent = ctx.accounts.agent.key() == escrow.agent;
        let time_lock_expired = clock.unix_timestamp >= escrow.expires_at;

        // If not agent, time lock must have expired
        if !is_agent {
            require!(time_lock_expired, EscrowError::TimeLockNotExpired);
        }

        require!(is_agent || time_lock_expired, EscrowError::Unauthorized);

        // Copy values before PDA signing
        let transfer_amount = escrow.amount;
        let transaction_id = escrow.transaction_id.clone();
        let bump = escrow.bump;

        // Transfer full amount to API
        let seeds = &[
            b"escrow",
            transaction_id.as_bytes(),
            &[bump],
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
        anchor_lang::system_program::transfer(cpi_context, transfer_amount)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Released;

        msg!("Funds released to API: {} SOL", escrow.amount as f64 / 1_000_000_000.0);

        let clock = Clock::get()?;
        emit!(FundsReleased {
            escrow: escrow.key(),
            transaction_id: escrow.transaction_id.clone(),
            amount: escrow.amount,
            api: escrow.api,
            timestamp: clock.unix_timestamp,
        });

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

        // Verify Ed25519 signature from the instructions sysvar
        verify_ed25519_signature(
            &ctx.accounts.instructions_sysvar,
            &signature,
            ctx.accounts.verifier.key,
            message_bytes,
        )?;

        msg!("Verifier: {}", ctx.accounts.verifier.key());
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

        // Copy values needed for PDA signing
        let transaction_id = escrow.transaction_id.clone();
        let bump = escrow.bump;

        // Transfer refund to agent
        if refund_amount > 0 {
            let seeds = &[
                b"escrow",
                transaction_id.as_bytes(),
                &[bump],
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
                transaction_id.as_bytes(),
                &[bump],
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

        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Resolved;
        escrow.quality_score = Some(quality_score);
        escrow.refund_percentage = Some(refund_percentage);

        msg!("Dispute resolved!");

        emit!(DisputeResolved {
            escrow: escrow.key(),
            transaction_id: escrow.transaction_id.clone(),
            quality_score,
            refund_percentage,
            refund_amount,
            payment_amount,
            verifier: ctx.accounts.verifier.key(),
        });

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

        // Check if dispute window is still open (before time lock expires)
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < escrow.expires_at,
            EscrowError::DisputeWindowExpired
        );

        escrow.status = EscrowStatus::Disputed;

        msg!("Escrow marked as disputed");

        emit!(DisputeMarked {
            escrow: escrow.key(),
            agent: escrow.agent,
            transaction_id: escrow.transaction_id.clone(),
            timestamp: clock.unix_timestamp,
        });

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

    /// CHECK: Instructions sysvar for Ed25519 signature verification
    #[account(address = INSTRUCTIONS_ID)]
    pub instructions_sysvar: AccountInfo<'info>,

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

    #[msg("Invalid time lock: must be between 1 hour and 30 days")]
    InvalidTimeLock,

    #[msg("Invalid amount: must be greater than 0")]
    InvalidAmount,

    #[msg("Invalid transaction ID: must be non-empty and max 64 chars")]
    InvalidTransactionId,

    #[msg("Time lock not expired: cannot release funds yet")]
    TimeLockNotExpired,

    #[msg("Dispute window expired: cannot dispute after time lock")]
    DisputeWindowExpired,

    #[msg("Amount too large: exceeds maximum escrow amount")]
    AmountTooLarge,
}
