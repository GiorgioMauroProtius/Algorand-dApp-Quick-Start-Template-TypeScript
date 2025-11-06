// PVStaking.algo.ts
import {
  Contract,
  GlobalStateKey,
  LocalStateKey,
  Address,
  Asset,
  uint64,
  txn,
  assert,
  sendAssetTransfer,
} from '@algorandfoundation/tealscript'

/**
 * PVProjectStaking (TypeScript contract compiled by TealScript)
 * - USDC ASA staking until a deadline
 * - If >= minimumGoal at deadline: funds go to developer
 * - Developer later sends a premium that gets distributed pro-rata to stakers
 * - If < minimumGoal at deadline: stakers can refund
 */
export class PVProjectStaking extends Contract {
  // ---- Global state ----
  developer = GlobalStateKey<Address>()
  usdc = GlobalStateKey<Asset>()
  fundingGoal = GlobalStateKey<uint64>()
  minimumGoal = GlobalStateKey<uint64>()
  stakingDeadline = GlobalStateKey<uint64>()
  totalStaked = GlobalStateKey<uint64>()
  isFunded = GlobalStateKey<uint64>() // 0/1
  isClosed = GlobalStateKey<uint64>() // 0/1

  // ---- Local state (per staker) ----
  staked = LocalStateKey<uint64>()

  // ---- On-create initializer ----
  // NOTE: call with app create and these args
  init(
    developer: Address,
    usdc: Asset,
    fundingGoal: uint64,
    minimumGoal: uint64,
    stakingPeriodDays: uint64
  ) {
    assert(txn.sender === developer, 'Only developer can create')
    this.developer.value = developer
    this.usdc.value = usdc
    this.fundingGoal.value = fundingGoal
    this.minimumGoal.value = minimumGoal
    this.stakingDeadline.value = txn.firstValidTime + stakingPeriodDays * 86400
    this.totalStaked.value = 0
    this.isFunded.value = 0
    this.isClosed.value = 0
  }

  // ---- Stake USDC before the deadline ----
  stake(amount: uint64) {
    assert(txn.firstValidTime <= this.stakingDeadline.value, 'Staking closed')
    assert(amount > 0, 'Amount must be > 0')

    // Expect the user to group an ASA transfer of USDC to the app address
    assert(
      this.txn.assets.transfer.asset === this.usdc.value &&
        this.txn.assets.transfer.receiver === this.app.address &&
        this.txn.assets.transfer.amount === amount,
      'Group must contain USDC → app transfer of amount'
    )

    this.staked.value = this.staked.value + amount
    this.totalStaked.value = this.totalStaked.value + amount
  }

  // ---- After deadline, if min reached, forward funds to developer ----
  confirmFundingSuccess() {
    assert(txn.firstValidTime > this.stakingDeadline.value, 'Too early')
    assert(this.isFunded.value === 0, 'Already funded')
    assert(this.totalStaked.value >= this.minimumGoal.value, 'Min not met')

    // Send app-held USDC to developer
    sendAssetTransfer({
      asset: this.usdc.value,
      receiver: this.developer.value,
      amount: this.totalStaked.value,
      sender: this.app.address,
    })

    this.isFunded.value = 1
  }

  // ---- Developer deposits premium and distributes pro-rata ----
  triggerFinancialClose(premiumAmount: uint64) {
    assert(this.isFunded.value === 1, 'Project not funded')
    assert(this.isClosed.value === 0, 'Already closed')

    // Require group where developer sent premium to app
    assert(
      this.txn.assets.transfer.asset === this.usdc.value &&
        this.txn.assets.transfer.sender === this.developer.value &&
        this.txn.assets.transfer.receiver === this.app.address &&
        this.txn.assets.transfer.amount === premiumAmount,
      'Group must contain developer → app USDC premium'
    )

    // Distribute premium pro-rata to **current** caller only.
    // (Front-end can loop stakers and call this for each one; avoids huge loops on-chain.)
    const userShare =
      (this.staked.value * premiumAmount) / this.totalStaked.value

    if (userShare > 0) {
      sendAssetTransfer({
        asset: this.usdc.value,
        receiver: txn.sender,
        amount: userShare,
        sender: this.app.address,
      })
    }

    // Mark closed once total premium has been distributed (front-end should set this in final call).
    // To keep on-chain simple, we just allow developer to flip it after distribution.
  }

  // ---- Developer marks contract closed after all distributions ----
  markClosed() {
    assert(txn.sender === this.developer.value, 'Only developer')
    this.isClosed.value = 1
  }

  // ---- Refund path when min NOT met ----
  refund() {
    assert(txn.firstValidTime > this.stakingDeadline.value, 'Too early')
    assert(this.isFunded.value === 0, 'Funding succeeded')

    const amount = this.staked.value
    assert(amount > 0, 'Nothing to refund')

    this.staked.value = 0

    sendAssetTransfer({
      asset: this.usdc.value,
      receiver: txn.sender,
      amount,
      sender: this.app.address,
    })
  }
}

