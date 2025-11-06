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
} from '@algorandfoundation/algorand-typescript'

@contract({
  name: 'PVProjectStaking',
  stateTotals: {
    globalUints: 7,
    globalBytes: 1,
    localUints: 1,
  },
})
export class PVProjectStaking extends Contract {
  // ---------- GLOBAL STATE ----------
  developer = GlobalState<bytes>({ key: 'developer' })
  usdc = GlobalState<uint64>({ key: 'usdc' })
  fundingGoal = GlobalState<uint64>({ key: 'funding_goal' })
  minimumGoal = GlobalState<uint64>({ key: 'minimum_goal' })
  totalStaked = GlobalState<uint64>({ initialValue: Uint64(0) })
  stakingDeadline = GlobalState<uint64>({ key: 'staking_deadline' })
  isFunded = GlobalState<uint64>({ initialValue: Uint64(0) })
  isClosed = GlobalState<uint64>({ initialValue: Uint64(0) })

  // ---------- LOCAL STATE (per staker) ----------
  stakeAmount = LocalState<uint64>({ key: 'stake' })

  // ---------- CONTRACT LIFECYCLE ----------

  // Initialize the contract
  @abimethod({ onCreate: 'require' })
  create(
    developerAddr: bytes,
    usdcAssetId: uint64,
    fundingGoal: uint64,
    minimumGoal: uint64,
    stakingPeriodSecs: uint64
  ): void {
    this.developer.value = developerAddr
    this.usdc.value = usdcAssetId
    this.fundingGoal.value = fundingGoal
    this.minimumGoal.value = minimumGoal
    this.stakingDeadline.value = Global.latestTimestamp + stakingPeriodSecs
  }

  // Allow stakers to opt-in and initialize their local state
  @abimethod({ allowActions: 'OptIn' })
  optIn(): void {
    this.stakeAmount(this.txn.sender).value = Uint64(0)
  }

  // Stake USDC tokens before the deadline
  @abimethod()
  stake(axferTxn: gtxn.AssetTransferTxn): void {
    assert(Global.latestTimestamp <= this.stakingDeadline.value, 'staking closed')
    assert(axferTxn.xferAsset.id === this.usdc.value, 'wrong asset')
    assert(axferTxn.sender === this.txn.sender, 'wrong sender')
    assert(axferTxn.assetReceiver === Global.currentApplicationAddress, 'wrong receiver')
    assert(axferTxn.assetAmount > 0, 'amount must be > 0')

    const amount = axferTxn.assetAmount
    const prev = this.stakeAmount(this.txn.sender).value
    this.stakeAmount(this.txn.sender).value = prev + amount
    this.totalStaked.value = this.totalStaked.value + amount
  }

  // Developer confirms the funding success
  @abimethod()
  confirmFundingSuccess(): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open')
    assert(this.isFunded.value === 0, 'already funded')
    assert(this.txn.sender === this.developer.value, 'only developer')
    assert(this.totalStaked.value >= this.minimumGoal.value, 'minimum not met')

    this.isFunded.value = Uint64(1)
  }

  // Developer triggers financial close with a premium payment
  @abimethod()
  triggerFinancialClose(premiumAxfer: gtxn.AssetTransferTxn): void {
    assert(this.isFunded.value === 1, 'not funded')
    assert(this.isClosed.value === 0, 'already closed')
    assert(this.txn.sender === this.developer.value, 'only developer')

    assert(premiumAxfer.xferAsset.id === this.usdc.value, 'wrong asset')
    assert(premiumAxfer.sender === this.developer.value, 'wrong sender')
    assert(premiumAxfer.assetReceiver === Global.currentApplicationAddress, 'wrong receiver')
    assert(premiumAxfer.assetAmount > 0, 'premium must be > 0')

    this.isClosed.value = Uint64(1)
  }

  // Refund investors if project not funded by the deadline
  @abimethod()
  refund(refundAxfer: gtxn.AssetTransferTxn): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open')
    assert(this.isFunded.value === 0, 'funded—no refund')

    const owed = this.stakeAmount(this.txn.sender).value
    assert(owed > 0, 'nothing to refund')

    assert(refundAxfer.xferAsset.id === this.usdc.value, 'wrong asset')
    assert(refundAxfer.sender === Global.currentApplicationAddress, 'wrong sender')
    assert(refundAxfer.assetReceiver === this.txn.sender, 'wrong receiver')
    assert(refundAxfer.assetAmount === owed, 'wrong amount')

    this.stakeAmount(this.txn.sender).value = Uint64(0)
    this.totalStaked.value = this.totalStaked.value - owed
  }

  // ---------- READ-ONLY GETTERS ----------

  @abimethod({ readonly: true })
  getTotals(): [uint64, uint64, uint64, uint64, uint64, uint64] {
    return [
      this.totalStaked.value,
      this.minimumGoal.value,
      this.fundingGoal.value,
      this.stakingDeadline.value,
      this.isFunded.value,
      this.isClosed.value,
    ]
  }

  @abimethod({ readonly: true })
  myStake(): uint64 {
    return this.stakeAmount(this.txn.sender).value
  }
}

