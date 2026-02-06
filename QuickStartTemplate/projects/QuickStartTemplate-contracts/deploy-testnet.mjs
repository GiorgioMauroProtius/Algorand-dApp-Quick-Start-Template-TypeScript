import algosdk from "algosdk";
import fs from "fs";

// ---------- Algod (TestNet via AlgoNode) ----------
const algod = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  443
);

// ---------- Load compiled TEAL ----------
const approval = fs.readFileSync(
  "out/smart_contracts/protius_staking/ProtiusStaking.approval.teal",
  "utf8"
);
const clear = fs.readFileSync(
  "out/smart_contracts/protius_staking/ProtiusStaking.clear.teal",
  "utf8"
);

// ---------- Deployer ----------
const mnemonic = process.env.DEPLOYER_MNEMONIC;
if (!mnemonic) {
  console.error("❌ DEPLOYER_MNEMONIC not set");
  process.exit(1);
}

const deployer = algosdk.mnemonicToSecretKey(mnemonic);
const deployerAddr = algosdk.encodeAddress(deployer.addr.publicKey);

console.log("🧾 Deployer:", deployerAddr);

// ---------- Balance check ----------
const acct = await algod.accountInformation(deployerAddr).do();
console.log("💰 Balance:", Number(acct.amount) / 1e6, "ALGO");

if (acct.amount < 300_000) {
  console.error("❌ Insufficient balance (need ~0.3 ALGO)");
  process.exit(1);
}

// ---------- Compile TEAL ----------
const approvalCompiled = await algod.compile(approval).do();
const clearCompiled = await algod.compile(clear).do();

const approvalBytes = new Uint8Array(
  Buffer.from(approvalCompiled.result, "base64")
);
const clearBytes = new Uint8Array(
  Buffer.from(clearCompiled.result, "base64")
);

// ---------- Tx params ----------
const params = await algod.getTransactionParams().do();

// ---------- CREATE APPLICATION ----------
const txn = algosdk.makeApplicationCreateTxnFromObject({
  sender: deployerAddr,
  suggestedParams: params,
  onComplete: algosdk.OnApplicationComplete.NoOpOC,

  approvalProgram: approvalBytes,
  clearProgram: clearBytes,

  numGlobalInts: 5,
  numGlobalByteSlices: 0,
  numLocalInts: 3,
  numLocalByteSlices: 0,
});

// ---------- Sign & send ----------
const signed = txn.signTxn(deployer.sk);
const sendResult = await algod.sendRawTransaction(signed).do();

const txId =
  sendResult.txId ||
  sendResult.txid ||
  sendResult.transactionId;

if (!txId) {
  console.error("❌ Could not determine txId from send result:", sendResult);
  process.exit(1);
}

console.log("📤 Tx sent:", txId);

// ---------- Confirm ----------
const result = await algosdk.waitForConfirmation(algod, txId, 10);
const appId =
  result["application-index"] ??
  result.applicationIndex;

console.log("\n✅ DEPLOYED SUCCESSFULLY");
console.log("🆔 App ID:", appId);
console.log(
  "🔎 Explorer:",
  `https://testnet.algoexplorer.io/application/${appId}`
);

console.log("\nAdd to frontend .env:");
console.log(`VITE_PROTIUS_STAKING_APP_ID=${appId}`);

