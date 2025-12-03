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
 * ProtiusStaking — Clean, compiler-safe TypeScript smart contract
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

@contract({ name: 'ProtiusStaking' })
export class ProtiusStaking extends Contract {
  // -------------------------------------------------------------
  // Global State
  // -------------------------------------------------------------

  admin = GlobalState<Account>({
    key: 'admin',
  });

  devCap = GlobalState<uint64>({
    key: 'devCap',
    initialValue: Uint64(0),
  });

  totalStaked = GlobalState<uint64>({
    key: 'totalStaked',
    initialValue: Uint64(0),
  });

  rewardPool = GlobalState<uint64>({
    key: 'rewardPool',
    initialValue: Uint64(0),
  });

  rewardsLocked = GlobalState<uint64>({
    key: 'rewardsLocked',
    initialValue: Uint64(0),
  });

  // -------------------------------------------------------------
  // Local State (per staker)
  // -------------------------------------------------------------

  stakeAmount = LocalState<uint64>({ key: 'stake' });

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

  @abimethod()
  init(admin: Account): void {
    this.admin.value = admin;
  }

  // -------------------------------------------------------------
  // Admin methods
  // -------------------------------------------------------------

  @abimethod()
  setDevCap(amount: uint64): void {
    this.onlyAdmin();
    this.devCap.value = amount;
  }

  @abimethod()
  setRewardPool(amount: uint64): void {
    this.onlyAdmin();
    assert(this.rewardsLocked.value === Uint64(0), 'rewards already locked');
    this.rewardPool.value = amount;
  }

  @abimethod()
  lockRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'rewardPool must be set');
    this.rewardsLocked.value = Uint64(1);
  }

  @abimethod()
  distributeRewards(): void {
    this.onlyAdmin();
    assert(this.rewardPool.value > Uint64(0), 'set rewardPool first');
    // No state update needed — reward is calculated in claimRewards()
  }

  // -------------------------------------------------------------
  // Staking
  // -------------------------------------------------------------

  @abimethod({ allowActions: 'OptIn' })
  optIn(): void {
    // no body needed
  }

  @abimethod()
  stake(amount: uint64): void {
    assert(this.rewardsLocked.value === Uint64(0), 'staking closed');
    assert(amount > Uint64(0), 'amount must be > 0');

    const sender = Txn.sender;
    const current = this.stakeAmount(sender).value;

    this.stakeAmount(sender).value = current + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

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
