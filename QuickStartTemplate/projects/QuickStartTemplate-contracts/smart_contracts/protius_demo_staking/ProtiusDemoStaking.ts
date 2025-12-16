import {
  Contract,
  GlobalState,
  LocalState,
  Txn,
  AssetTransferTxn,
  assert,
  emit,
  Bytes,
  Uint64,
  Global,
} from "@algorandfoundation/algokit-utils/types/tealscript";

/**
 * ==================================
 * Protius Demo Staking (PuyaTS)
 * ==================================
 *
 * DEMO INTENT (EXPLICIT):
 * - Non-custodial USDC staking
 * - Investor-visible lifecycle events
 * - No liquidity pool enforcement yet
 * - Economic effects are DECLARED, not settled
 *
 * ASSUMPTIONS:
 * - USDC ASA (6 decimals)
 * - Max stake per wallet: 1,000 USDC
 * - Withdrawal lock: 48 hours
 * - Early exit penalty: 2.5% (DECLARED ONLY)
 * - Target return at maturity: 2.0x (INDICATIVE)
 */

export class ProtiusDemoStaking extends Contract {
  /* ========= GLOBAL STATE ========= */

  usdcAssetId = GlobalState<Uint64>();
  stakingOpen = GlobalState<Uint64>(); // 1 = open, 0 = closed
  maturityReached = GlobalState<Uint64>(); // 1 = matured
  targetReturnMultiple = GlobalState<Uint64>(); // e.g. 200 = 2.0x
  withdrawalLockSeconds = GlobalState<Uint64>(); // seconds

  /* ========= LOCAL STATE (PER STAKER) ========= */

  depositedAmount = LocalState<Uint64>();
  depositTimestamp = LocalState<Uint64>();
  hasConverted = LocalState<Uint64>(); // 0 = no, 1 = opted-in

  /* ========= CONSTANTS ========= */

  static readonly MAX_STAKE = 1_000_000; // 1,000 USDC (6 decimals)
  static readonly EARLY_EXIT_PENALTY_BPS = 250; // 2.5% (declared only)

  /* ========= CREATE ========= */

  createApplication(usdcAssetId: Uint64): void {
    this.usdcAssetId.value = usdcAssetId;
    this.stakingOpen.value = 1;
    this.maturityReached.value = 0;
    this.targetReturnMultiple.value = 200; // 2.0x
    this.withdrawalLockSeconds.value = 172800; // 48 hours

    emit(Bytes("PROTIUS_INIT"), usdcAssetId);
  }

  /* ========= OPT-IN ========= */

  optIn(): void {
    this.depositedAmount.value = 0;
    this.depositTimestamp.value = 0;
    this.hasConverted.value = 0;

    emit(Bytes("STAKER_OPTED_IN"), Txn.sender);
  }

  /* ========= STAKE ========= */

  stake(): void {
    assert(this.stakingOpen.value === 1, "Staking closed");

    const axfer =
      Txn.groupIndex > 0
        ? (Txn.group[Txn.groupIndex - 1] as AssetTransferTxn)
        : assert(false);

    assert(axfer.xferAsset === this.usdcAssetId.value, "Wrong asset");
    assert(
      axfer.assetReceiver === Global.currentApplicationAddress,
      "Wrong receiver"
    );
    assert(axfer.sender === Txn.sender, "Sender mismatch");

    const newTotal =
      this.depositedAmount.value + axfer.assetAmount;

    assert(
      newTotal <= ProtiusDemoStaking.MAX_STAKE,
      "Max stake exceeded"
    );

    this.depositedAmount.value = newTotal;
    this.depositTimestamp.value = Global.latestTimestamp;

    emit(
      Bytes("STAKE_DEPOSITED"),
      Txn.sender,
      axfer.assetAmount,
      newTotal
    );
  }

  /* ========= WITHDRAW ========= */

  withdraw(): void {
    const lockedUntil =
      this.depositTimestamp.value +
      this.withdrawalLockSeconds.value;

    assert(
      Global.latestTimestamp >= lockedUntil,
      "Withdrawal locked"
    );

    const amount = this.depositedAmount.value;
    assert(amount > 0, "Nothing to withdraw");

    // DEMO NOTE:
    // Early exit penalty (2.5%) is DECLARED but NOT enforced.
    // Liquidity pool logic applies this in production.

    this.depositedAmount.value = 0;

    emit(
      Bytes("WITHDRAW_REQUESTED"),
      Txn.sender,
      amount,
      ProtiusDemoStaking.EARLY_EXIT_PENALTY_BPS
    );
  }

  /* ========= MATURITY ========= */

  markProjectMatured(): void {
    assert(this.maturityReached.value === 0, "Already matured");

    this.maturityReached.value = 1;

    emit(
      Bytes("PROJECT_MATURED"),
      this.targetReturnMultiple.value
    );
  }

  /* ========= CONVERSION OPTION ========= */

  optIntoConversion(): void {
    assert(this.maturityReached.value === 1, "Not matured");
    assert(this.depositedAmount.value > 0, "No stake");

    this.hasConverted.value = 1;

    emit(
      Bytes("CONVERSION_SELECTED"),
      Txn.sender,
      this.depositedAmount.value,
      this.targetReturnMultiple.value
    );
  }

  /* ========= ADMIN ========= */

  closeStaking(): void {
    this.stakingOpen.value = 0;
    emit(Bytes("STAKING_CLOSED"));
  }
}

