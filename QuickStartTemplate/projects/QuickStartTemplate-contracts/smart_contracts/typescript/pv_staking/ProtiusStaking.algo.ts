import {
  abimethod,
  assert,
  contract,
  Contract,
  GlobalState,
  LocalState,
  Uint64,
  Txn,
  type Account,
  type uint64,
} from '@algorandfoundation/algorand-typescript';

/**
 * ProtiusStaking — TypeScript smart contract
 *
 * Supports:
 *  - stake()
 *  - requestUnstake()
 *  - getStake()
 *  - getTotalStaked()
 *  - setDevCap()
 *  - setRewardPool()
 *  - distributeRewards()
 *  - lockRewards()
 *  - claimRewards()
 */

@(contract as any)({ name: 'ProtiusStaking' })
export class ProtiusStaking extends Contract {
  // -------------------------------------------------------------
  // Global State
  // -------------------------------------------------------------

  /** Admin wallet (project sponsor / Protius) */
  admin = GlobalState<Account>({
    key: 'admin',
  });

  /** Total dev capital that was staked into the project (e.g. 1 000 000) */
  devCap = GlobalState<uint64>({
    key: 'devCap',
    initialValue: Uint64(0),
  });

  /** Total currently staked (sum of all wallets) */
  totalStaked = GlobalState<uint64>({
    key: 'totalStaked',
    initialValue: Uint64(0),
  });

  /**
   * Reward pool to share among stakers.
   * This is where the human-in-the-loop comes in:
   *  - For “2× money” you would set rewardPool = devCap * 2.
   *  - For negotiated premiums, set rewardPool = custom value.
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

  private onlyAdmin() {
    assert(Txn.sender === this.admin.value, 'only admin can call this');
  }

  private assertRewardsLocked() {
    assert(this.rewardsLocked.value === Uint64(1), 'rewards not locked yet');
  }

  // -------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------

  /**
   * Initialise contract with admin wallet (your Pera address for the demo).
   */
  @abimethod()
  init(admin: Account): void {
    this.admin.value = admin;
  }

  // -------------------------------------------------------------
  // Admin methods
  // -------------------------------------------------------------

  /** Set / update development capital total (e.g. 1 000 000) */
  @abimethod()
  setDevCap(amount: uint64): void {
    this.onlyAdmin();
    this.devCap.value = amount;
  }

  /**
   * Set / update reward pool before locking.
   *  - For 2× money: rewardPool = devCap * 2
   *  - For custom premium: rewardPool = negotiated amount
   */
  @abimethod()
  setRewardPool(amount: uint64): void {
    this.onlyAdmin();
    assert(this.rewardsLocked.value === Uint64(0), 'rewards already locked');
    this.rewardPool.value = amount;
  }

  /** Lock rewards at Financial Close; after this, pool is fixed. */
  @abimethod()
  lockRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'rewardPool must be set');
    this.rewardsLocked.value = Uint64(1);
  }

  /**
   * Marker function to match your flow:
   *  setDevCap → setRewardPool → distributeRewards → lockRewards → claimRewards
   */
  @abimethod()
  distributeRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'set rewardPool first');
    // No state update needed — reward is computed in claimRewards()
  }

  // -------------------------------------------------------------
  // Staking
  // -------------------------------------------------------------

  /** Standard ARC-4 opt-in so we can use LocalState for the account */
  @abimethod({ allowActions: 'OptIn' })
  optIn(): void {
    // no body needed
  }

  /** Add stake to the pool (accounting only in v1) */
  @abimethod()
  stake(amount: uint64): void {
    assert(this.rewardsLocked.value === Uint64(0), 'staking closed');
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const current = this.stakeAmount(sender).value;

    this.stakeAmount(sender).value = current + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  /**
   * Soft-unstake to reduce stake (early exit).
   * Real-world settlement (replacement staker, exit fee) is handled off-chain.
   */
  @abimethod()
  requestUnstake(amount: uint64): void {
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const current = this.stakeAmount(sender).value;

    assert(current >= amount, 'insufficient stake');

    this.stakeAmount(sender).value = current - amount;
    this.totalStaked.value = this.totalStaked.value - amount;
  }

  // -------------------------------------------------------------
  // Views
  // -------------------------------------------------------------

  @abimethod({ readonly: true })
  getStake(account: Account): uint64 {
    return this.stakeAmount(account).value;
  }

  @abimethod({ readonly: true })
  getTotalStaked(): uint64 {
    return this.totalStaked.value;
  }

  @abimethod({ readonly: true })
  getConfig(): {
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

  // -------------------------------------------------------------
  // Claim Rewards
  // -------------------------------------------------------------

  /**
   * Claim this wallet’s share of the rewardPool once locked.
   *
   * reward = rewardPool * stake(sender) / totalStaked
   *
   * For v1 we:
   *  - compute entitlement on-chain
   *  - mark hasClaimed so it can’t be double-claimed
   *  - return the entitlement (off-chain payout in demo)
   */
  @abimethod()
  claimRewards(): uint64 {
    this.assertRewardsLocked();

    const sender = Txn.sender;
    const staked = this.stakeAmount(sender).value;

    assert(staked > Uint64(0), 'no stake');
    assert(this.hasClaimed(sender).value === Uint64(0), 'already claimed');

    const total = this.totalStaked.value;
    assert(total > Uint64(0), 'no stakers');

    const pool = this.rewardPool.value;

    const reward = (pool * staked) / total;

    this.hasClaimed(sender).value = Uint64(1);

    return reward;
  }
}
