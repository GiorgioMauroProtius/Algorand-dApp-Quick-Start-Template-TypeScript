import type { Account, uint64 } from '@algorandfoundation/algorand-typescript';
import {
  Contract,
  GlobalState,
  LocalState,
  Uint64,
  abimethod,
  Global,
  Txn,
  assert,
} from '@algorandfoundation/algorand-typescript';

export class ProtiusStaking extends Contract {
  // -------- Global state --------

  developer = GlobalState<Account>();
  fundingGoal = GlobalState<uint64>();
  minimumGoal = GlobalState<uint64>();
  stakingDeadline = GlobalState<uint64>();
  totalStaked = GlobalState<uint64>({ initialValue: Uint64(0) });
  isFunded = GlobalState<uint64>({ initialValue: Uint64(0) });
  financialCloseReached = GlobalState<uint64>({ initialValue: Uint64(0) });
  premiumPool = GlobalState<uint64>({ initialValue: Uint64(0) });

  // -------- Local State (per staker) --------

  stakeAmount = LocalState<uint64>({ key: 's' });
  hasWithdrawn = LocalState<uint64>({ key: 'w' });

  // -------- Internal helper --------

  private onlyDeveloper(): void {
    assert(Txn.sender === this.developer.value);
  }

  // -------- Methods (ABI accessible) --------

  @abimethod()
  public init(
    developer: Account,
    fundingGoal: uint64,
    minimumGoal: uint64,
    stakingPeriodSeconds: uint64,
  ): void {
    assert(this.totalStaked.value === Uint64(0));
    assert(this.isFunded.value === Uint64(0));

    this.developer.value = developer;
    this.fundingGoal.value = fundingGoal;
    this.minimumGoal.value = minimumGoal;
    this.stakingDeadline.value = Global.latestTimestamp + stakingPeriodSeconds;
  }

  @abimethod()
  public stake(amount: uint64): void {
    const now = Global.latestTimestamp;

    assert(now <= this.stakingDeadline.value);
    assert(amount > Uint64(0));

    const staker = Txn.sender;
    const userStake = this.stakeAmount(staker);

    userStake.value = userStake.value + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  @abimethod()
  public confirmFundingSuccess(): void {
    this.onlyDeveloper();

    const now = Global.latestTimestamp;
    assert(now > this.stakingDeadline.value);
    assert(this.isFunded.value === Uint64(0));
    assert(this.totalStaked.value >= this.minimumGoal.value);

    this.isFunded.value = Uint64(1);
  }

  @abimethod()
  public addPremium(premiumAmount: uint64): void {
    this.onlyDeveloper();

    assert(this.isFunded.value === Uint64(1));
    assert(this.financialCloseReached.value === Uint64(0));
    assert(premiumAmount > Uint64(0));

    this.premiumPool.value = this.premiumPool.value + premiumAmount;
    this.financialCloseReached.value = Uint64(1);
  }

  @abimethod()
  public previewPayout(account: Account): uint64 {
    const userStake = this.stakeAmount(account).value;

    if (userStake === Uint64(0)) {
      return Uint64(0);
    }

    const total = this.totalStaked.value;
    if (total === Uint64(0)) {
      return Uint64(0);
    }

    return (this.premiumPool.value * userStake) / total;
  }

  @abimethod()
  public withdraw(): uint64 {
    const caller = Txn.sender;
    const userStake = this.stakeAmount(caller).value;

    assert(userStake > Uint64(0));

    if (this.isFunded.value === Uint64(0)) {
      const now = Global.latestTimestamp;
      assert(now > this.stakingDeadline.value);

      this.stakeAmount(caller).value = Uint64(0);
      this.totalStaked.value = this.totalStaked.value - userStake;

      return userStake;
    }

    assert(this.financialCloseReached.value === Uint64(1));

    const flag = this.hasWithdrawn(caller).value;
    assert(flag === Uint64(0));

    const reward = this.previewPayout(caller);
    this.hasWithdrawn(caller).value = Uint64(1);

    return reward;
  }
}
