import type { Account, uint64 } from '@algorandfoundation/algorand-typescript';

import {
  Uint64,
  abimethod,
  assert,
  contract,
  Contract,
  GlobalState,
  LocalState,
  Txn,
} from '@algorandfoundation/algorand-typescript';

/**
 * ProtiusStaking
 *
 * v1 assumptions
 *  - Single staking pool (one project) – good enough for the Algorand demo.
 *  - Contract tracks *entitlements* on-chain (how much each wallet should get).
 *  - Actual USDC / money movement can be off-chain for now.
 *
 * Later we can extend this to multi-project using BoxMap or multiple apps.
 */

@contract
export class ProtiusStaking extends Contract {
  // ----------------------------
  // Global state (single pool)
  // ----------------------------

  /** Admin wallet (project sponsor / Protius) */
  admin = GlobalState<Account>({ key: 'admin' });

  /** Total dev capital that was staked into the project (e.g. 1 000 000) */
  devCap = GlobalState<uint64>({ key: 'devCap', initialValue: Uint64(0) });

  /** Total currently staked (sum of all wallets) */
  totalStaked = GlobalState<uint64>({
    key: 'totalStaked',
    initialValue: Uint64(0),
  });

  /**
   * Reward pool to share among stakers.
   * This is where the *human-in-the-loop* comes in:
   *  - For “2× money” you would set rewardPool = devCap * 2.
   *  - For other deals, just set rewardPool = negotiated premium amount.
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

  // ----------------------------
  // Local state (per staker)
  // ----------------------------

  /** Amount this wallet has staked into the pool */
  stakeAmount = LocalState<uint64>({ key: 'stake' });

  /**
   * Has this wallet already claimed rewards?
   * 0 = not claimed; 1 = already claimed
   */
  hasClaimed = LocalState<uint64>({ key: 'claimed' });

  // ----------------------------
  // Helpers
  // ----------------------------

  private onlyAdmin() {
    assert(Txn.sender === this.admin.value, 'only admin can call this');
  }

  private rewardsAreLocked() {
    assert(this.rewardsLocked.value === Uint64(1), 'rewards not locked yet');
  }

  // ----------------------------
  // Lifecycle / configuration
  // ----------------------------

  /**
   * Called once after deploy to set the admin wallet.
   * For the demo this will be your Pera wallet.
   *
   * (In practice you will deploy the app from your Pera account and call
   *  init() once so admin = your wallet.)
   */
  @abimethod()
  public init(admin: Account): void {
    // Simpler: just set the admin; for the demo you are the only caller.
    this.admin.value = admin;
  }

  /**
   * Admin sets / updates the dev cap (total staked capital used to develop).
   * Example: 1 000 000
   */
  @abimethod()
  public setDevCap(amount: uint64): void {
    this.onlyAdmin();
    this.devCap.value = amount;
  }

  /**
   * Admin sets or updates the reward pool *before* locking.
   *
   * For “2× money”: rewardPool = devCap * 2
   * For custom premium: rewardPool = custom value
   */
  @abimethod()
  public setRewardPool(amount: uint64): void {
    this.onlyAdmin();
    assert(this.rewardsLocked.value === Uint64(0), 'rewards already locked');
    this.rewardPool.value = amount;
  }

  /**
   * Admin locks the reward pool at Financial Close.
   * After this:
   *  - rewardPool cannot change
   *  - stakers can call claimRewards()
   */
  @abimethod()
  public lockRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'reward pool must be > 0');
    this.rewardsLocked.value = Uint64(1);
  }

  // ----------------------------
  // Staker actions
  // ----------------------------

  /** Standard ARC-4 opt-in so we can use LocalState for this account */
  @abimethod({ allowActions: 'OptIn' })
  public optIn(): void {
    // no body needed – ARC4 + LocalState will handle the storage
  }

  /**
   * Stake an amount into the pool.
   *
   * NOTE: in v1 this is **accounting only** – we assume the real USDC / ALGO
   * transfer happens off-chain or in a grouped transaction that we can
   * enforce later. For now: we just track balances.
   */
  @abimethod()
  public stake(amount: uint64): void {
    assert(amount > Uint64(0), 'amount must be > 0');

    // simple: rewards must not be locked when staking
    assert(this.rewardsLocked.value === Uint64(0), 'staking closed');

    const sender = Txn.sender;
    const currentStake = this.stakeAmount(sender).value;

    this.stakeAmount(sender).value = currentStake + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  /**
   * Request to reduce stake (early-exit).
   *
   * For the demo, we implement a **soft** unstake:
   *  - It reduces on-chain stake so future rewards ignore this capital.
   *  - The actual principal + small exit fee settlement is handled off-chain
   *    once a replacement staker is found.
   *
   * Later, we can extend this to enforce:
   *  - replacement stake present
   *  - on-chain exit fee payments, etc.
   */
  @abimethod()
  public requestUnstake(amount: uint64): void {
    assert(amount > Uint64(0), 'amount must be > 0');
    const sender = Txn.sender;
    const currentStake = this.stakeAmount(sender).value;
    assert(currentStake >= amount, 'cannot unstake more than current stake');

    this.stakeAmount(sender).value = currentStake - amount;
    this.totalStaked.value = this.totalStaked.value - amount;
  }

  // ----------------------------
  // Views
  // ----------------------------

  @abimethod({ readonly: true })
  public getStake(account: Account): uint64 {
    return this.stakeAmount(account).value;
  }

  @abimethod({ readonly: true })
  public getTotalStaked(): uint64 {
    return this.totalStaked.value;
  }

  @abimethod({ readonly: true })
  public getConfig(): {
    admin: Account;
    devCap: uint64;
    rewardPool: uint64;
    rewardsLocked: uint64;
    totalStaked: uint64;
  } {
    return {
      admin: this.admin.value,
      devCap: this.devCap.value,
      rewardPool: this.rewardPool.value,
      rewardsLocked: this.rewardsLocked.value,
      totalStaked: this.totalStaked.value,
    };
  }

  // ----------------------------
  // Reward distribution
  // ----------------------------

  /**
   * Admin-only “marker” function so the flow matches your mental model:
   *
   *  1. setDevCap(1_000_000)
   *  2. setRewardPool(2_000_000)  // or any negotiated premium
   *  3. distributeRewards()       // just a no-op marker
   *  4. lockRewards()
   *  5. stakers call claimRewards()
   */
  @abimethod()
  public distributeRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'reward pool must be set first');
    // No on-chain state change needed here; we keep the logic in claimRewards()
  }

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
  public claimRewards(): uint64 {
    this.rewardsAreLocked();

    const sender = Txn.sender;

    assert(this.hasClaimed(sender).value === Uint64(0), 'already claimed');

    const stake = this.stakeAmount(sender).value;
    assert(stake > Uint64(0), 'no stake to claim rewards for');

    const total = this.totalStaked.value;
    assert(total > Uint64(0), 'no stakers');

    const pool = this.rewardPool.value;

    // integer division, as usual on AVM
    const reward = (pool * stake) / total;

    // mark as claimed
    this.hasClaimed(sender).value = Uint64(1);

    // In a future version, we could transfer ASA/ALGO here.
    // For v1, simply return the entitlement.
    return reward;
  }
}
