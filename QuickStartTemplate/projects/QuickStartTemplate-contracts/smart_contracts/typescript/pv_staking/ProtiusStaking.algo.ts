import {
  Uint64,
  abimethod,
  assert,
  Contract,
  GlobalState,
  LocalState,
  Txn,
  type Account,
  type uint64,
} from '@algorandfoundation/algorand-typescript';

/**
 * ProtiusStaking v2 — single-pool staking with exit liquidity
 *
 * Actors
 * -------
 * - Admin (Protius): manages devCap, rewardPool, LP liquidity and exit curve
 * - Stakers: commit capital into the pool for ~12 months
 * - LP investors (represented by admin wallet in v1): provide liquidity
 *   to buy out stakers who want to exit early
 *
 * Core ideas
 * ----------
 * 1) Stakers call stake(projectId, amount) while staking is open.
 * 2) Admin funds a liquidity pool via addLiquidity(amount).
 * 3) A staker can exit early via exitStake(projectId, amount):
 *      - The LP pays them: payout = amount * exitPayoutBps / 10_000
 *      - The LP takes over the full `amount` of stake
 *      - The difference (amount - payout) is counted as exit fee / discount.
 * 4) At Financial Close:
 *      - Admin sets devCap and rewardPool
 *      - Admin may call distributeRewards(projectId) as a marker
 *      - Admin calls lockRewards()
 * 5) After lockRewards():
 *      - Stakers (including LP) call claimRewards(projectId)
 *      - Reward = rewardPool * stake(sender) / totalStaked
 *
 * Notes
 * -----
 * - We only compute entitlements on-chain; actual USDC/ALGO transfer
 *   can be handled off-chain or via a dedicated payout app in v2.
 * - "Maturity curve" / bid-offer spread is encoded via exitPayoutBps
 *   (basis points). Admin can adjust it over time (e.g. 50% at month 1,
 *   80% at month 11, etc.).
 */

export class ProtiusStaking extends Contract {
  // -------------------------------------------------------------
  // Global State
  // -------------------------------------------------------------

  /** Admin wallet (Protius / pool manager) */
  admin = GlobalState<Account>({ key: 'admin' });

  /** Total dev capital staked into the project, set at FC */
  devCap = GlobalState<uint64>({ key: 'devCap', initialValue: Uint64(0) });

  /** Total staked (sum of all wallets, including LP position) */
  totalStaked = GlobalState<uint64>({
    key: 'totalStaked',
    initialValue: Uint64(0),
  });

  /**
   * Reward pool to share among all final stakers.
   * Example:
   *  - devCap = 1_000_000
   *  - rewardPool = 1_000_000 (for "2x money")
   * Or any other negotiated premium.
   */
  rewardPool = GlobalState<uint64>({
    key: 'rewardPool',
    initialValue: Uint64(0),
  });

  /**
   * Rewards locked flag:
   * 0 = rewards not yet locked (admin may still change rewardPool)
   * 1 = rewards locked (no more changes to rewardPool; claiming enabled)
   */
  rewardsLocked = GlobalState<uint64>({
    key: 'rewardsLocked',
    initialValue: Uint64(0),
  });

  /**
   * Staking open flag:
   * 1 = staking open (stake / exitStake allowed)
   * 0 = staking closed (after lockRewards)
   */
  stakingOpen = GlobalState<uint64>({
    key: 'stakingOpen',
    initialValue: Uint64(1),
  });

  /**
   * Liquidity pool units (conceptual, for exit payouts).
   * In v1 this is an accounting number that should match
   * funds held by Protius on behalf of LP investors.
   */
  liquidityPool = GlobalState<uint64>({
    key: 'lpPool',
    initialValue: Uint64(0),
  });

  /**
   * Exit payout basis points (maturity / bid-offer logic).
   * payout = amount * exitPayoutBps / 10_000
   *
   * Example:
   *  - 6000 => exiting staker gets 60% of staked amount from LP
   *  - the remaining 40% is an effective "exit discount / fee"
   */
  exitPayoutBps = GlobalState<uint64>({
    key: 'exitBps',
    initialValue: Uint64(6000), // 60% default
  });

  /**
   * Accumulated exit fees / discounts.
   * Conceptually belongs to LP investors and/or Protius,
   * depending on the fund structure.
   */
  exitFeesAccrued = GlobalState<uint64>({
    key: 'exitFees',
    initialValue: Uint64(0),
  });

  // -------------------------------------------------------------
  // Local State (per staker)
  // -------------------------------------------------------------

  /** Amount this wallet has staked into the pool */
  stakeAmount = LocalState<uint64>({ key: 'stake' });

  /**
   * Has this wallet already claimed rewards?
   * 0 = not claimed; 1 = already claimed
   */
  hasClaimed = LocalState<uint64>({ key: 'claimed' });

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------

  private onlyAdmin(): void {
    assert(
      Txn.sender === this.admin.value,
      'only admin can call this method',
    );
  }

  private ensureRewardsLocked(): void {
    assert(this.rewardsLocked.value === Uint64(1), 'rewards not locked yet');
  }

  private ensureRewardsNotLocked(): void {
    assert(this.rewardsLocked.value === Uint64(0), 'rewards already locked');
  }

  // -------------------------------------------------------------
  // Lifecycle / configuration
  // -------------------------------------------------------------

  /**
   * Called once after deploy to set the admin wallet.
   * For the demo this will be your Pera wallet.
   */
  @abimethod()
init(admin: Account): void {
  this.admin.value = admin;

  // TEMP: arithmetic test for puya-ts
  const test: uint64 = Uint64(100) - Uint64(40);
}


  /**
   * Admin sets / updates the dev cap (total development capital).
   * Example: 1_000_000
   */
  @abimethod()
  setDevCap(amount: uint64): void {
    this.onlyAdmin();
    this.devCap.value = amount;
  }

  /**
   * Admin sets or updates the reward pool *before* locking.
   *
   * For “2× money”: rewardPool = devCap
   * For custom premium: rewardPool = negotiated value
   */
  @abimethod()
  setRewardPool(amount: uint64): void {
    this.onlyAdmin();
    this.ensureRewardsNotLocked();
    this.rewardPool.value = amount;
  }

  /**
   * Admin can adjust the exit payout curve (bid-offer spread)
   * as the project matures (e.g. 50% → 70% → 90%).
   *
   * bps is in [1, 10_000] and defines:
   *   payout = amount * bps / 10_000
   */
  @abimethod()
  setExitPayoutBps(bps: uint64): void {
    this.onlyAdmin();
    assert(bps > Uint64(0), 'bps must be > 0');
    assert(bps <= Uint64(10_000), 'bps must be <= 10000');
    this.exitPayoutBps.value = bps;
  }

  /**
   * Admin adds conceptual liquidity to the pool.
   * In practice this should correspond to real funds
   * held by Protius / LP investors off-chain or in a LP app.
   */
  @abimethod()
  addLiquidity(amount: uint64): void {
    this.onlyAdmin();
    assert(amount > Uint64(0), 'amount must be > 0');
    this.liquidityPool.value = this.liquidityPool.value + amount;
  }

  /**
   * Admin can withdraw liquidity from the pool (accounting only).
   * This is only allowed while rewards are not locked and
   * cannot exceed current liquidity.
   */
  @abimethod()
  removeLiquidity(amount: uint64): void {
    this.onlyAdmin();
    this.ensureRewardsNotLocked();
    assert(amount > Uint64(0), 'amount must be > 0');
    assert(
      this.liquidityPool.value >= amount,
      'insufficient liquidity to remove',
    );
    this.liquidityPool.value = this.liquidityPool.value - amount;
  }

  /**
   * Admin locks the reward pool at Financial Close.
   * After this:
   *  - rewardPool cannot change
   *  - stakingOpen = 0
   *  - exits are disabled
   *  - stakers can call claimRewards()
   */
  @abimethod()
  lockRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'reward pool must be > 0');
    this.rewardsLocked.value = Uint64(1);
    this.stakingOpen.value = Uint64(0);
  }

  /**
   * Admin-only “marker” function so the flow matches your mental model:
   *
   *  1. setDevCap(1_000_000)
   *  2. setRewardPool(1_000_000)      // or any negotiated premium
   *  3. distributeRewards(projectId)  // just a marker
   *  4. lockRewards()
   *  5. stakers call claimRewards(projectId)
   */
  @abimethod()
  distributeRewards(projectId: uint64): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'reward pool must be set first');
    // No on-chain state change needed here; we keep payout logic in claimRewards()
  }

  // -------------------------------------------------------------
  // Staker actions
  // -------------------------------------------------------------

  /** Standard ARC-4 opt-in so we can use LocalState for this account */
  @abimethod({ allowActions: 'OptIn' })
  optIn(): void {
    // no body needed
  }

  /**
   * Stake an amount into the pool.
   *
   * projectId is accepted for ABI compatibility with the front-end
   * but this contract currently manages a single pool per app.
   */
  @abimethod()
  stake(projectId: uint64, amount: uint64): void {
    assert(this.stakingOpen.value === Uint64(1), 'staking is closed');
    this.ensureRewardsNotLocked();
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const currentStake = this.stakeAmount(sender).value;

    this.stakeAmount(sender).value = currentStake + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  /**
   * Exit stake early by selling it to the LP.
   *
   * - Only allowed while staking is open AND rewards are not locked.
   * - Exiting staker receives:
   *
   *      payout = amount * exitPayoutBps / 10_000
   *
   *   (in conceptual units, to be settled off-chain or via LP app).
   *
   * - LP (admin wallet in v1) receives ownership of the full `amount`
   *   of stake (i.e. future rewards).
   *
   * - The difference (amount - payout) is counted as exit fee / discount.
   */
  @abimethod()
  exitStake(projectId: uint64, amount: uint64): uint64 {
    assert(this.stakingOpen.value === Uint64(1), 'staking is closed');
    this.ensureRewardsNotLocked();
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const senderStake = this.stakeAmount(sender).value;
    assert(senderStake >= amount, 'cannot exit more than current stake');

    // Compute payout based on exitPayoutBps
    const bps = this.exitPayoutBps.value;
    assert(bps > Uint64(0), 'exit bps must be set');

    const payout: uint64 = (amount * bps) / Uint64(10_000);

    // Ensure LP has enough liquidity to honour this exit
    assert(
      this.liquidityPool.value >= payout,
      'insufficient LP liquidity for exit',
    );

    // Transfer stake ownership: from sender to LP (admin wallet for v1)
    const lpAccount = this.admin.value;
    const lpStake = this.stakeAmount(lpAccount).value;

    this.stakeAmount(sender).value = senderStake - amount;
    this.stakeAmount(lpAccount).value = lpStake + amount;

    // Update liquidity pool and fee bucket
    this.liquidityPool.value = this.liquidityPool.value - payout;

    const fee = amount - payout;
    this.exitFeesAccrued.value = this.exitFeesAccrued.value + fee;

    // Note: totalStaked stays unchanged (we just changed ownership).
    // Return the payout entitlement so the front-end can display it.
    return payout;
  }

  // -------------------------------------------------------------
  // Views
  // -------------------------------------------------------------

  @abimethod({ readonly: true })
  getStake(projectId: uint64, account: Account): uint64 {
    return this.stakeAmount(account).value;
  }

  @abimethod({ readonly: true })
  getTotalStaked(projectId: uint64): uint64 {
    return this.totalStaked.value;
  }

  @abimethod({ readonly: true })
  getLiquidityInfo(): {
    liquidityPool: uint64;
    exitPayoutBps: uint64;
    exitFeesAccrued: uint64;
  } {
    return {
      liquidityPool: this.liquidityPool.value,
      exitPayoutBps: this.exitPayoutBps.value,
      exitFeesAccrued: this.exitFeesAccrued.value,
    };
  }

  // -------------------------------------------------------------
  // Reward distribution
  // -------------------------------------------------------------

  /**
   * Claim this wallet’s share of the locked reward pool.
   *
   * reward = rewardPool * stake(sender) / totalStaked
   *
   * For v1 we:
   *  - compute the entitlement on-chain
   *  - mark `hasClaimed` so it can't be double-claimed
   *  - return the amount to the caller
   *
   * The actual USDC/ALGO payment can be off-chain in the demo (e.g. bank transfer
   * or a separate ASA payout app that uses this entitlement as reference).
   */
  @abimethod()
  claimRewards(projectId: uint64): uint64 {
    this.ensureRewardsLocked();

    const sender = Txn.sender;

    assert(this.hasClaimed(sender).value === Uint64(0), 'already claimed');

    const stake = this.stakeAmount(sender).value;
    assert(stake > Uint64(0), 'no stake to claim rewards for');

    const total = this.totalStaked.value;
    assert(total > Uint64(0), 'no stakers');

    const pool = this.rewardPool.value;

    // Integer division, with explicit uint64 typing
    const reward: uint64 = (pool * stake) / total;

    // Mark as claimed
    this.hasClaimed(sender).value = Uint64(1);

    // In a future version, we could transfer ASA/ALGO here.
    // For v1, simply return the entitlement.
    return reward;
  }
}
