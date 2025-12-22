import algosdk from "algosdk";
import { getAlgodClient, getTransactionSigner } from "../services/walletService";

// MUST match your deployed app
const PROTIUS_STAKING_APP_ID = Number(
  import.meta.env.VITE_PROTIUS_STAKING_APP_ID ?? "0"
);

export type StakingState = {
  totalStake: bigint; // microAlgos
  userStake: bigint;  // microAlgos
};

/**
 * ============================
 * READ STATE
 * ============================
 */
export async function fetchStakingState(
  accountAddress: string
): Promise<StakingState> {
  const algod = getAlgodClient();

  try {
    const acctInfo = await algod
      .accountApplicationInformation(accountAddress, PROTIUS_STAKING_APP_ID)
      .do();

    const localState = acctInfo["app-local-state"]?.["key-value"] ?? [];

    let userStake = 0n;

    for (const kv of localState) {
      const key = Buffer.from(kv.key, "base64").toString();
      if (key === "stake") {
        userStake = BigInt(kv.value.uint);
      }
    }

    const appInfo = await algod
      .getApplicationByID(PROTIUS_STAKING_APP_ID)
      .do();

    const globalState = appInfo.params["global-state"] ?? [];
    let totalStake = 0n;

    for (const kv of globalState) {
      const key = Buffer.from(kv.key, "base64").toString();
      if (key === "total_stake") {
        totalStake = BigInt(kv.value.uint);
      }
    }

    return { totalStake, userStake };
  } catch (err: any) {
    // Not opted in yet → return zeroes
    if (err?.status === 404) {
      return { totalStake: 0n, userStake: 0n };
    }
    throw err;
  }
}

/**
 * ============================
 * MANUAL OPT-IN (OPTION B)
 * ============================
 */
export async function optIn(accountAddress: string): Promise<void> {
  const algod = getAlgodClient();
  const signer = getTransactionSigner();

  const params = await algod.getTransactionParams().do();

  const txn = algosdk.makeApplicationOptInTxnFromObject({
    sender: accountAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    suggestedParams: params,
  });

  const signed = await signer([txn], [0]);
  const { txId } = await algod.sendRawTransaction(signed).do();

  await algosdk.waitForConfirmation(algod, txId, 4);
}

/**
 * ============================
 * STAKE
 * ============================
 */
export async function stake(
  accountAddress: string,
  amount: bigint
): Promise<void> {
  const algod = getAlgodClient();
  const signer = getTransactionSigner();

  const params = await algod.getTransactionParams().do();

  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: accountAddress,
    receiver: algosdk.getApplicationAddress(PROTIUS_STAKING_APP_ID),
    amount: Number(amount),
    suggestedParams: params,
  });

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: accountAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [new Uint8Array(Buffer.from("stake"))],
    suggestedParams: params,
  });

  algosdk.assignGroupID([payTxn, appCallTxn]);

  const signed = await signer([payTxn, appCallTxn], [0, 1]);
  const { txId } = await algod.sendRawTransaction(signed).do();

  await algosdk.waitForConfirmation(algod, txId, 4);
}

/**
 * ============================
 * WITHDRAW
 * ============================
 */
export async function withdraw(
  accountAddress: string,
  amount: bigint
): Promise<void> {
  const algod = getAlgodClient();
  const signer = getTransactionSigner();

  const params = await algod.getTransactionParams().do();

  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: accountAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      new Uint8Array(Buffer.from("withdraw")),
      algosdk.encodeUint64(Number(amount)),
    ],
    suggestedParams: params,
  });

  const signed = await signer([appCallTxn], [0]);
  const { txId } = await algod.sendRawTransaction(signed).do();

  await algosdk.waitForConfirmation(algod, txId, 4);
}
