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

  // Pass the app-call txn as an explicit arg so we can read its sender
  @abimethod({ onCreate: 'require' })
  create(
    call: gtxn.ApplicationCallTxn,
    developerAddr: bytes,
    usdcAssetId: uint64,
    fundingGoal: uint64,
    minimumGoal: uint64,
    stakingPeriodSecs: uint64
  ): void {
    // creator is the caller of the create
    assert(call.onCompletion === 0, 'must be NoOp create');
    this.developer.value = developerAddr;
    this.usdc.value = usdcAssetId;
    this.fundingGoal.value = fundingGoal;
    this.minimumGoal.value = minimumGoal;
    this.stakingDeadline.value = Global.latestTimestamp + stakingPeriodSecs;
  }

  @abimethod({ allowActions: 'OptIn' })
  optIn(call: gtxn.ApplicationCallTxn): void {
    this.stakeAmount(call.sender).value = Uint64(0);
  }

  @abimethod()
  stake(call: gtxn.ApplicationCallTxn, axferTxn: gtxn.AssetTransferTxn): void {
    assert(Global.latestTimestamp <= this.stakingDeadline.value, 'staking closed');

    // Verify the asset transfer (USDC -> app address) from the caller
    assert(axferTxn.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(axferTxn.sender === call.sender, 'wrong sender');
    assert(
      axferTxn.assetReceiver.address === Global.currentApplicationAddress,
      'wrong receiver'
    );
    assert(axferTxn.assetAmount > 0, 'amount must be > 0');

    const amount = axferTxn.assetAmount;
    const prev = this.stakeAmount(call.sender).value;
    this.stakeAmount(call.sender).value = prev + amount;
    this.totalStaked.value = this.totalStaked.value + amount;
  }

  @abimethod()
  confirmFundingSuccess(call: gtxn.ApplicationCallTxn): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'already funded');
    // compare caller address (bytes) to stored developer address (bytes)
    assert(call.sender.address === this.developer.value, 'only developer');
    assert(
      this.totalStaked.value >= this.minimumGoal.value,
      'minimum not met'
    );

    this.isFunded.value = Uint64(1);
  }

  @abimethod()
  triggerFinancialClose(
    call: gtxn.ApplicationCallTxn,
    premiumAxfer: gtxn.AssetTransferTxn
  ): void {
    assert(this.isFunded.value === 1, 'not funded');
    assert(this.isClosed.value === 0, 'already closed');
    // same check here
    assert(call.sender.address === this.developer.value, 'only developer');

    // Verify premium transfer (developer -> app)
    assert(premiumAxfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(
      premiumAxfer.sender.address === this.developer.value,
      'wrong sender'
    );
    assert(
      premiumAxfer.assetReceiver.address === Global.currentApplicationAddress,
      'wrong receiver'
    );
    assert(premiumAxfer.assetAmount > 0, 'premium must be > 0');

    this.isClosed.value = Uint64(1);
  }

  @abimethod()
  refund(call: gtxn.ApplicationCallTxn, refundAxfer: gtxn.AssetTransferTxn): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'funded—no refund');

    const owed = this.stakeAmount(call.sender).value;
    assert(owed > 0, 'nothing to refund');

    // Verify the refund transfer (app -> caller) for the exact owed amount
    assert(refundAxfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(
      refundAxfer.sender.address === Global.currentApplicationAddress,
      'wrong sender'
    );
    assert(refundAxfer.assetReceiver === call.sender, 'wrong receiver');
    assert(refundAxfer.assetAmount === owed, 'wrong amount');

    this.stakeAmount(call.sender).value = Uint64(0);
    this.totalStaked.value = this.totalStaked.value - owed;
  }

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
  myStake(call: gtxn.ApplicationCallTxn): uint64 {
    return this.stakeAmount(call.sender).value;
  }
}
