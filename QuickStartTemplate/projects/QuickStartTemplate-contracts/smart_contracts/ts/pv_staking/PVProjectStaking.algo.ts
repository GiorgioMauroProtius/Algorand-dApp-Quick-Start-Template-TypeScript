import {
  Contract,
  contract,
  Global,
  abimethod,
  assert,
  GlobalState,
  LocalState,
  bytes,
  uint64,
  Uint64,
  gtxn,
  itxn,
} from '@algorandfoundation/algorand-typescript';

/**
 * MVP staking flow:
 * - Stake: user sends a grouped ASA transfer (USDC) to the app + app call → we verify the transfer.
 * - Confirm funding: after deadline & minimum met, mark funded. (Funds already sit in the app.)
 * - Financial close (developer): developer sends premium USDC to app (grouped) → we record it as rewards.
 * - Claim: stakers call `claim()` and receive USDC by inner tx (one-by-one, safe and simple).
 * - Refund: if not funded after deadline, staker calls `refund()` → inner tx returns their stake.
 *
 * Why this is the simplest robust UX:
 * - Only the initial stake needs a grouped transfer (you can’t pull ASA from a user without them sending).
 * - All payouts are inner-transaction based (single app call per user).
 */

@contract({
  name: 'PVProjectStaking',
  stateTotals: {
    globalUints: 10,
    globalBytes: 1,
    localUints: 3,
  },
})
export class PVProjectStaking extends Contract {
  // ---- Global state ----
  developer = GlobalState<bytes>({ key: 'developer' });         // developer address (bytes)
  usdc = GlobalState<uint64>({ key: 'usdc' });                  // USDC ASA ID
  fundingGoal = GlobalState<uint64>({ key: 'funding_goal' });
  minimumGoal = GlobalState<uint64>({ key: 'minimum_goal' });
  totalStaked = GlobalState<uint64>({ key: 'total_staked', initialValue: Uint64(0) });
  stakingDeadline = GlobalState<uint64>({ key: 'staking_deadline' });
  isFunded = GlobalState<uint64>({ key: 'is_funded', initialValue: Uint64(0) });
  isClosed = GlobalState<uint64>({ key: 'is_closed', initialValue: Uint64(0) });

  // reward accounting (accumulated premium per share, 1e6 precision)
  accRewardPerShare = GlobalState<uint64>({ key: 'acc_rps', initialValue: Uint64(0) });
  totalPremium = GlobalState<uint64>({ key: 'total_premium', initialValue: Uint64(0) });
  SCALE = Uint64(1_000_000);

  // ---- Local state ----
  stakeAmount = LocalState<uint64>({ key: 'stake' });           // user stake
  rewardDebt = LocalState<uint64>({ key: 'reward_debt' });      // stake * accRPS / SCALE at last update
  claimed = LocalState<uint64>({ key: 'claimed' });             // total claimed rewards

  // ---- Lifecycle ----
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
    this.rewardDebt(this.txn.sender).value = Uint64(0);
    this.claimed(this.txn.sender).value = Uint64(0);
  }

  // ---- Stake (verify grouped ASA transfer from user → app) ----
  @abimethod()
  stake(axfer: gtxn.AssetTransferTxn): void {
    assert(Global.latestTimestamp <= this.stakingDeadline.value, 'staking closed');

    // verify USDC transfer from sender -> app
    assert(axfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(axfer.sender === this.txn.sender, 'wrong sender');
    assert(axfer.assetReceiver === Global.currentApplicationAddress, 'wrong receiver');
    assert(axfer.assetAmount > 0, 'amount must be > 0');

    const amount = axfer.assetAmount;
    // reward bookkeeping
    const userStake = this.stakeAmount(this.txn.sender).value;
    const pending = userStake * this.accRewardPerShare.value / this.SCALE - this.rewardDebt(this.txn.sender).value;

    // update stake & totals
    const newStake = userStake + amount;
    this.stakeAmount(this.txn.sender).value = newStake;
    this.totalStaked.value = this.totalStaked.value + amount;

    // carry forward pending in rewardDebt by bumping debt to newStake * accRPS / SCALE
    // (pending is claimable via claim(); we don’t auto-payout here)
    this.rewardDebt(this.txn.sender).value = newStake * this.accRewardPerShare.value / this.SCALE;
  }

  // ---- Mark success (after deadline & minimum met) ----
  @abimethod()
  confirmFundingSuccess(): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'already funded');
    assert(this.txn.sender === this.developer.value, 'only developer');
    assert(this.totalStaked.value >= this.minimumGoal.value, 'minimum not met');

    this.isFunded.value = Uint64(1);
    // NOTE: funds (USDC) are already held by app from stakes. You can transfer to developer now or at close.
    // If you want to forward immediately, uncomment this inner transfer:
    // this._sendUSDC(this.developer.value, this.totalStaked.value);
  }

  // ---- Developer sends premium (grouped ASA transfer) then we record accRPS ----
  @abimethod()
  triggerFinancialClose(premiumAxfer: gtxn.AssetTransferTxn): void {
    assert(this.isFunded.value === 1, 'not funded');
    assert(this.isClosed.value === 0, 'already closed');
    assert(this.txn.sender === this.developer.value, 'only developer');

    assert(premiumAxfer.xferAsset.id === this.usdc.value, 'wrong asset');
    assert(premiumAxfer.sender === this.developer.value, 'wrong sender');
    assert(premiumAxfer.assetReceiver === Global.currentApplicationAddress, 'wrong receiver');
    assert(premiumAxfer.assetAmount > 0, 'premium > 0');

    const prem = premiumAxfer.assetAmount;
    this.totalPremium.value = this.totalPremium.value + prem;
    // accRPS += prem * SCALE / totalStaked
    assert(this.totalStaked.value > 0, 'no stakers');
    this.accRewardPerShare.value =
      this.accRewardPerShare.value + (prem * this.SCALE / this.totalStaked.value);

    this.isClosed.value = Uint64(1);
  }

  // ---- User claims accumulated rewards via inner transfer ----
  @abimethod()
  claim(): void {
    const user = this.txn.sender;
    const userStake = this.stakeAmount(user).value;
    const accumulated = userStake * this.accRewardPerShare.value / this.SCALE;
    const debt = this.rewardDebt(user).value;
    assert(accumulated >= debt, 'no rewards');
    const pending = accumulated - debt;
    assert(pending > 0, 'nothing to claim');

    this._sendUSDC(user, pending);

    this.claimed(user).value = this.claimed(user).value + pending;
    this.rewardDebt(user).value = accumulated;
  }

  // ---- Refund path (if not funded after deadline) ----
  @abimethod()
  refund(): void {
    assert(Global.latestTimestamp > this.stakingDeadline.value, 'still open');
    assert(this.isFunded.value === 0, 'funded—no refund');

    const amt = this.stakeAmount(this.txn.sender).value;
    assert(amt > 0, 'nothing to refund');

    // return user stake
    this._sendUSDC(this.txn.sender, amt);

    // update accounting
    this.stakeAmount(this.txn.sender).value = Uint64(0);
    // note: totalStaked tracks live stake; reduce it
    this.totalStaked.value = this.totalStaked.value - amt;

    // reset reward debt for safety
    this.rewardDebt(this.txn.sender).value = Uint64(0);
  }

  // ---- Read helpers ----
  @abimethod({ readonly: true })
  getTotals(): [uint64, uint64, uint64, uint64, uint64, uint64, uint64] {
    return [
      this.totalStaked.value,
      this.minimumGoal.value,
      this.fundingGoal.value,
      this.stakingDeadline.value,
      this.isFunded.value,
      this.isClosed.value,
      this.totalPremium.value,
    ];
  }

  @abimethod({ readonly: true })
  myStake(): uint64 {
    return this.stakeAmount(this.txn.sender).value;
  }

  // ---- Inner USDC transfer helper ----
  private _sendUSDC(to: bytes, amount: uint64): void {
    itxn.assetTransfer({
      xferAsset: this.usdc.value,
      assetReceiver: to,
      assetAmount: amount,
    });
  }
}

