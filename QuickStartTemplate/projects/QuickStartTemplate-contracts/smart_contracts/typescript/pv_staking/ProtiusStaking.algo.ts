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
 * ProtiusStaking — single-pool staking contract for the demo
 *
 * Flow:
 *  1. Stakers call stake(projectId, amount) while the pool is open.
 *  2. (Optional) They can reduce stake via requestUnstake(projectId, amount)
 *     while staking is open.
 *  3. At Financial Close, admin calls:
 *        setDevCap(devCapAtFC)
 *        setRewardPool(premiumAmount)   // e.g. same as devCap for "2x money"
 *        distributeRewards(projectId)   // marker
 *        lockRewards()
 *  4. Stakers call claimRewards(projectId) to get their share:
 *        reward = rewardPool * stake(sender) / totalStaked
 */

export class ProtiusStaking extends Contract {
  // -------------------------------------------------------------
  // Global State
  // -------------------------------------------------------------

  /** Admin wallet (project sponsor / Protius) */
  admin = GlobalState<Account>({ key: 'admin' });

  /** Total dev capital that was staked into the project (at FC) */
  devCap = GlobalState<uint64>({ key: 'devCap', initialValue: Uint64(0) });

  /** Total currently staked (sum of all wallets) */
  totalStaked = GlobalState<uint64>({
    key: 'totalStaked',
    initialValue: Uint64(0),
  });

  /**
   * Reward pool to share among stakers.
   * Example:
   *  - devCap = 1_000_000
   *  - rewardPool = 1_000_000  (for "2x money")
   * or any other negotiated premium amount.
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
   * 1 = staking open (stake / requestUnstake allowed)
   * 0 = staking closed (after lockRewards)
   */
  stakingOpen = GlobalState<uint64>({
    key: 'stakingOpen',
    initialValue: Uint64(1),
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
      'only admin can call this method'
    );
  }

  private ensureRewardsLocked(): void {
    assert(this.rewardsLocked.value === Uint64(1), 'rewards not locked yet');
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
    assert(this.rewardsLocked.value === Uint64(0), 'rewards already locked');
    this.rewardPool.value = amount;
  }

  /**
   * Admin locks the reward pool at Financial Close.
   * After this:
   *  - rewardPool cannot change
   *  - stakingOpen = 0
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
   *  2. setRewardPool(1_000_000)  // or any negotiated premium
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
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const currentStake = this.stakeAmount(sender).value;

    this.stakeAmount(sender).value = currentStake + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  /**
   * Request to reduce stake (early exit).
   *
   * For v1, we allow unstake only while staking is open.
   * After lockRewards(), unstake is disabled and stakers
   * exit via claimRewards().
   */
  @abimethod()
  requestUnstake(projectId: uint64, amount: uint64): void {
    assert(this.stakingOpen.value === Uint64(1), 'unstake disabled after lock');
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const currentStake = this.stakeAmount(sender).value;
    assert(currentStake >= amount, 'cannot unstake more than current stake');

    this.stakeAmount(sender).value = currentStake - amount;
    this.totalStaked.value = this.totalStaked.value - amount;
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

  // (getConfig removed from ABI – returning an object is not allowed)

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
   * The actual USDC payment can be off-chain in the demo (e.g. bank transfer
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

    // integer division, with explicit uint64 typing
    const reward: uint64 = (pool * stake) / total;

    // mark as claimed
    this.hasClaimed(sender).value = Uint64(1);

    // In a future version, we could transfer ASA/ALGO here.
    // For v1, simply return the entitlement.
    return reward;
  }
}
