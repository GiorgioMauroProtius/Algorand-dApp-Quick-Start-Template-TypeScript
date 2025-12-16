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
<<<<<<< HEAD
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
=======
} from "@algorandfoundation/tealscript";

/**
 * ============================
 * Protius Demo Staking Contract
 * ============================
 *
 * DEMO ASSUMPTIONS (EXPLICIT):
 * - USDC ASA used as stake asset
 * - Max stake per wallet: 1,000 USDC
 * - Withdrawal lock: 48 hours
 * - Early exit penalty: 2.5% (DECLARED, NOT ENFORCED)
 * - Target return at maturity: 2.0x (INDICATIVE ONLY)
 *
 * This contract records lifecycle events and balances.
 * Economic settlement and liquidity pools are out of scope for this demo.
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)
 */

export class ProtiusDemoStaking extends Contract {
  /* ========= GLOBAL STATE ========= */

  usdcAssetId = GlobalState<Uint64>();
  stakingOpen = GlobalState<Uint64>(); // 1 = open, 0 = closed
  maturityReached = GlobalState<Uint64>(); // 1 = matured
  targetReturnMultiple = GlobalState<Uint64>(); // e.g. 200 = 2.0x
<<<<<<< HEAD
  withdrawalLockSeconds = GlobalState<Uint64>(); // seconds

  /* ========= LOCAL STATE (PER STAKER) ========= */

  depositedAmount = LocalState<Uint64>();
  depositTimestamp = LocalState<Uint64>();
  hasConverted = LocalState<Uint64>(); // 0 = no, 1 = opted-in
=======
  withdrawalLockSeconds = GlobalState<Uint64>(); // e.g. 172800 (48h)

  /* ========= LOCAL STATE ========= */

  depositedAmount = LocalState<Uint64>();
  depositTimestamp = LocalState<Uint64>();
  hasConverted = LocalState<Uint64>(); // 0 = no, 1 = opted-in (record only)
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

  /* ========= CONSTANTS ========= */

  static readonly MAX_STAKE = 1_000_000; // 1,000 USDC (6 decimals)
<<<<<<< HEAD
  static readonly EARLY_EXIT_PENALTY_BPS = 250; // 2.5% (declared only)
=======
  static readonly EARLY_EXIT_PENALTY_BPS = 250; // 2.5% (DECLARED ONLY)
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

  /* ========= CREATE ========= */

  createApplication(usdcAssetId: Uint64): void {
    this.usdcAssetId.value = usdcAssetId;
    this.stakingOpen.value = 1;
    this.maturityReached.value = 0;
    this.targetReturnMultiple.value = 200; // 2.0x
<<<<<<< HEAD
    this.withdrawalLockSeconds.value = 172800; // 48 hours
=======
    this.withdrawalLockSeconds.value = 172800; // 48h
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

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

<<<<<<< HEAD
    const newTotal =
      this.depositedAmount.value + axfer.assetAmount;

    assert(
      newTotal <= ProtiusDemoStaking.MAX_STAKE,
      "Max stake exceeded"
    );
=======
    const newTotal = this.depositedAmount.value + axfer.assetAmount;

    assert(newTotal <= ProtiusDemoStaking.MAX_STAKE, "Max stake exceeded");
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

    this.depositedAmount.value = newTotal;
    this.depositTimestamp.value = Global.latestTimestamp;

<<<<<<< HEAD
    emit(
      Bytes("STAKE_DEPOSITED"),
      Txn.sender,
      axfer.assetAmount,
      newTotal
    );
=======
    emit(Bytes("STAKE_DEPOSITED"), Txn.sender, axfer.assetAmount, newTotal);
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)
  }

  /* ========= WITHDRAW ========= */

  withdraw(): void {
    const lockedUntil =
<<<<<<< HEAD
      this.depositTimestamp.value +
      this.withdrawalLockSeconds.value;

    assert(
      Global.latestTimestamp >= lockedUntil,
      "Withdrawal locked"
    );
=======
      this.depositTimestamp.value + this.withdrawalLockSeconds.value;

    assert(Global.latestTimestamp >= lockedUntil, "Withdrawal locked");
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

    const amount = this.depositedAmount.value;
    assert(amount > 0, "Nothing to withdraw");

<<<<<<< HEAD
    // DEMO NOTE:
    // Early exit penalty (2.5%) is DECLARED but NOT enforced.
    // Liquidity pool logic applies this in production.

=======
    // NOTE: penalty is DECLARED only (demo)
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)
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

<<<<<<< HEAD
    emit(
      Bytes("PROJECT_MATURED"),
      this.targetReturnMultiple.value
    );
  }

  /* ========= CONVERSION OPTION ========= */
=======
    emit(Bytes("PROJECT_MATURED"), this.targetReturnMultiple.value);
  }

  /* ========= CONVERSION ========= */
>>>>>>> 8a37be0 (feat(track-b): add PuyaTS Protius demo staking contract)

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
