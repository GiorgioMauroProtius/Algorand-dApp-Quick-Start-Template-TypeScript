import {
  Contract,
  GlobalState,
  LocalState,
  uint64,
  bytes,
  Uint64,
  abimethod,
  gtxn,
  assert,
  Global,
  contract,
} from '@algorandfoundation/algorand-typescript';

@contract({
  name: 'PVProjectStaking',
  stateTotals: {
    globalUints: 7,
    globalBytes: 1,
    localUints: 1,
  },
})
export class PVProjectStaking extends Contract {
  // -------- Global state --------
  developer = GlobalState<bytes>({ key: 'developer' });
  usdc = GlobalState<uint64>({ key: 'usdc' });
  fundingGoal = GlobalState<uint64>({ key: 'funding_goal' });
  minimumGoal = GlobalState<uint64>({ key: 'minimum_goal' });
  totalStaked = GlobalState<uint64>({ initialValue: Uint64(0) });
  stakingDeadline = GlobalState<uint64>({ key: 'staking_deadline' });
  isFunded = GlobalState<uint64>({ initialValue: Uint64(0) });
  isClosed = GlobalState<uint64>({ initialValue: Uint64(0) });

  // -------- Local state (per staker) --------
  stakeAmount = LocalState<uint64>({ key: 'stake' });

  // -------- Lifecycle --------
  @abimethod({ onCreate: 'require' })
  create(
    developerAddr: bytes,
    usdcAssetId: uint64,
    fundingGoal: uint64,
    minimumGoal: uint64,
    stakingPeriodSecs: uint64
  ): void {
    this.developer.value = developerAddr;
    this.usdc.value = usdcAssetId;
    this.fundingGoal.value = fundingGoal;
    this.minimumGoal.value = minimumGoal;
    this.stakingDeadline.value = Global.latestTimestamp + stakingPeriodSecs;
  }

  @abimethod({ allowActions: 'OptIn' })
  optIn(): void {
    this.stakeAmount(this.txn.sender).value = Uint64(0);
  }

  /**
   * Group with an AssetTransfer from the caller -> app address.
   */
  @abimethod()
  stake(axferTxn: gtxn.AssetTransferTxn): void {
    const caller = this.txn.sender;

    // window open?
    assert(
      Global.latestTimestamp <= this.stakingDeadline.value,
      'staking closed'
    );

    // validate the grouped ASA transfer
    assert(axferTxn.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(axferTxn.sender === caller, 'wrong sender');
    assert(
      axferTxn.assetReceiver === Global.currentApplicationAddress,
      'wrong receiver'
    );
    assert(axferTxn.assetAmount > 0, 'amount must be > 0');

    const amount = axferTxn.assetAmount;
    const prev = this.stakeAmount(caller).value;

    this.stakeAmount(caller).value = prev + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  /**
   * Developer confirms success after window closes and min goal met.
   */
  @abimethod()
  confirmFundingSuccess(): void {
    const caller = this.txn.sender;

    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'already funded');
    assert(caller === this.developer.value, 'only developer');
    assert(
      this.totalStaked.value >= this.minimumGoal.value,
      'minimum not met'
    );

    this.isFunded.value = Uint64(1);
  }

  /**
   * At Financial Close the developer pays the premium (ASA transfer).
   */
  @abimethod()
  triggerFinancialClose(premiumAxfer: gtxn.AssetTransferTxn): void {
    const caller = this.txn.sender;

    assert(this.isFunded.value === 1, 'not funded');
    assert(this.isClosed.value === 0, 'already closed');
    assert(caller === this.developer.value, 'only developer');

    assert(premiumAxfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(premiumAxfer.sender === this.developer.value, 'wrong sender');
    assert(
      premiumAxfer.assetReceiver === Global.currentApplicationAddress,
      'wrong receiver'
    );
    assert(premiumAxfer.assetAmount > 0, 'premium must be > 0');

    this.isClosed.value = Uint64(1);
  }

  /**
   * If funding failed, stakers can claim a refund
   * by grouping a transfer from app -> caller of the owed amount.
   */
  @abimethod()
  refund(refundAxfer: gtxn.AssetTransferTxn): void {
    const caller = this.txn.sender;

    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'funded—no refund');

    const owed = this.stakeAmount(caller).value;
    assert(owed > 0, 'nothing to refund');

    assert(refundAxfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(
      refundAxfer.sender === Global.currentApplicationAddress,
      'wrong sender'
    );
    assert(refundAxfer.assetReceiver === caller, 'wrong receiver');
    assert(refundAxfer.assetAmount === owed, 'wrong amount');

    // clear stake and reduce total
    this.stakeAmount(caller).value = Uint64(0);
    this.totalStaked.value = this.totalStaked.value - owed;
  }

  // -------- Views --------
  @abimethod({ readonly: true })
  getTotals(): [uint64, uint64, uint64, uint64, uint64, uint64] {
    return [
      this.totalStaked.value,
      this.minimumGoal.value,
      this.fundingGoal.value,
      this.stakingDeadline.value,
      this.isFunded.value,
      this.isClosed.value,
    ];
  }

  @abimethod({ readonly: true })
  myStake(): uint64 {
    return this.stakeAmount(this.txn.sender).value;
  }
}
