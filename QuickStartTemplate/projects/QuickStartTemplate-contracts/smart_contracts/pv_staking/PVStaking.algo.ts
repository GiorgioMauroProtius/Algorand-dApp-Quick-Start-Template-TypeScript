/* PVStaking.algo.ts
   Algorand TypeScript (Puya TS) — MVP version aligned to AlgoKit compiler.

   IMPORTANT:
   - This MVP uses a “group-transaction” pattern: actual ASA transfers (USDC) are sent
     in the same atomic group as the app call. The contract only verifies them and
     records state; it does not attempt inner-asset-transfers (keeps things simple and portable).
   - Replace USDC_ASA_ID below with the TestNet ASA id you plan to use (or keep as arg in create).
*/

import {
  Contract,
  GlobalUint,
  GlobalBytes,
  LocalUint,
  abi,
  tx,
  gtx,
  itxn,
  addr,
  assert_,
  now,
  Global,
  Local,
} from '@algorandfoundation/puya-ts';

// If you prefer passing USDC ASA Id at create time, keep this as 0 and set via create().
const DEFAULT_USDC_ASA_ID = 0;

export class PVProjectStaking extends Contract {
  // -------- Global state --------
  developer: GlobalBytes = Global.bytes('developer');           // developer address (bytes)
  usdc: GlobalUint = Global.uint('usdc');                        // ASA id for USDC
  fundingGoal: GlobalUint = Global.uint('funding_goal');         // max or target (optional)
  minimumGoal: GlobalUint = Global.uint('minimum_goal');         // minimum threshold to succeed
  totalStaked: GlobalUint = Global.uint('total_staked');         // running total
  stakingDeadline: GlobalUint = Global.uint('staking_deadline'); // unix ts
  isFunded: GlobalUint = Global.uint('is_funded');               // 0/1
  isClosed: GlobalUint = Global.uint('is_closed');               // 0/1 after premium distribution

  // -------- Local state (per staker) --------
  stakeAmount: LocalUint = Local.uint('stake');                  // total stake of sender

  // --- Helpers ---
  private sender() {
    return tx.sender();
  }

  private appAddr() {
    return this.app.address;
  }

  // Get ASA transfer in the same atomic group at a given index
  private expectAssetTransfer(gtxIndex: number, { assetId, sender, receiver, amount }: {
    assetId: number | bigint,
    sender?: Uint8Array,
    receiver?: Uint8Array,
    amount?: bigint,
  }) {
    const t = gtx.assetTransfer(gtxIndex);
    assert_(t.xferAsset() === BigInt(assetId), 'wrong asset id');
    if (sender)   assert_(t.sender()   === sender,   'wrong asset sender');
    if (receiver) assert_(t.receiver() === receiver, 'wrong asset receiver');
    if (amount !== undefined) assert_(t.amount() === amount, 'wrong asset amount');
  }

  // -------- Lifecycle --------

  // @abi.create()
  @abi.create
  create(
    developerAddr: Uint8Array,   // address bytes
    usdcAssetId: bigint,         // can be 0 => will fallback to DEFAULT_USDC_ASA_ID
    fundingGoal: bigint,
    minimumGoal: bigint,
    stakingPeriodSecs: bigint    // seconds from now
  ) {
    // one-time init
    assert_(this.isFunded.value() === 0n && this.isClosed.value() === 0n, 'already init');
    this.developer.set(developerAddr);
    this.usdc.set(usdcAssetId === 0n ? BigInt(DEFAULT_USDC_ASA_ID) : usdcAssetId);
    this.fundingGoal.set(fundingGoal);
    this.minimumGoal.set(minimumGoal);
    this.totalStaked.set(0n);
    this.stakingDeadline.set(now() + stakingPeriodSecs);
    this.isFunded.set(0n);
    this.isClosed.set(0n);
  }

  // @abi.method()
  @abi.method
  stake(groupIndexOfAxfer: bigint, amount: bigint) {
    // open only before deadline
    assert_(now() <= this.stakingDeadline.value(), 'staking closed');
    assert_(amount > 0n, 'amount 0');

    // Validate the grouped asset transfer: axfer from sender -> app address
    this.expectAssetTransfer(Number(groupIndexOfAxfer), {
      assetId: Number(this.usdc.value()),
      sender: this.sender(),
      receiver: this.appAddr(),
      amount
    });

    // Update local + global
    const prev = this.stakeAmount.value(this.sender());
    this.stakeAmount.set(this.sender(), prev + amount);
    this.totalStaked.set(this.totalStaked.value() + amount);
  }

  // Only developer can confirm success after deadline if minimum met
  @abi.method
  confirmFundingSuccess() {
    assert_(now() > this.stakingDeadline.value(), 'still open');
    assert_(this.isFunded.value() === 0n, 'already funded');
    assert_(tx.sender() === this.developer.value(), 'only developer');
    assert_(this.totalStaked.value() >= this.minimumGoal.value(), 'minimum not met');

    // Mark funded (funds already with app address; developer will withdraw via separate flow if desired)
    this.isFunded.set(1n);
  }

  // Developer pays premium to app address (group axfer), contract distributes proportionally and closes.
  // For MVP, we simply record closure and expect off-chain distribution (keeps the contract small & safe).
  // If you want on-chain distribution, we can extend with box iteration / inner txns later.
  @abi.method
  triggerFinancialClose(groupIndexOfPremiumAxfer: bigint, premiumAmount: bigint) {
    assert_(this.isFunded.value() === 1n, 'not funded');
    assert_(this.isClosed.value() === 0n, 'already closed');
    assert_(tx.sender() === this.developer.value(), 'only developer');

    // Verify premium transfer: developer -> app
    this.expectAssetTransfer(Number(groupIndexOfPremiumAxfer), {
      assetId: Number(this.usdc.value()),
      sender: this.developer.value(),
      receiver: this.appAddr(),
      amount: premiumAmount
    });

    // Mark closed; distribution strategy
    // MVP: mark closed; the premium is held in app. Off-chain can orchestrate pro-rata withdrawals
    // We can add a "claimReward" method if you prefer per-staker pull model.
    this.isClosed.set(1n);
  }

  // Refund path: after deadline and if NOT funded, staker can claim back their stake.
  // We use “pull” refunds: staker sends a group axfer from app -> staker for their stake,
  // and we verify then zero their recorded amount. (Keeps the app TEAL small.)
  @abi.method
  refund(groupIndexOfRefundAxfer: bigint) {
    assert_(now() > this.stakingDeadline.value(), 'still open');
    assert_(this.isFunded.value() === 0n, 'funded—no refund');

    const owed = this.stakeAmount.value(this.sender());
    assert_(owed > 0n, 'nothing to refund');

    // Validate grouped refund transfer: app -> sender for 'owed'
    this.expectAssetTransfer(Number(groupIndexOfRefundAxfer), {
      assetId: Number(this.usdc.value()),
      sender: this.appAddr(),
      receiver: this.sender(),
      amount: owed
    });

    // Zero local and decrease global
    this.stakeAmount.set(this.sender(), 0n);
    this.totalStaked.set(this.totalStaked.value() - owed);
  }

  // (Optional) helper getters

  @abi.method
  getTotals(): [bigint, bigint, bigint, bigint, bigint, bigint] {
    return [
      this.totalStaked.value(),
      this.minimumGoal.value(),
      this.fundingGoal.value(),
      this.stakingDeadline.value(),
      this.isFunded.value(),
      this.isClosed.value()
    ];
  }

  @abi.method
  myStake(): bigint {
    return this.stakeAmount.value(this.sender());
  }
}

export default PVProjectStaking;

