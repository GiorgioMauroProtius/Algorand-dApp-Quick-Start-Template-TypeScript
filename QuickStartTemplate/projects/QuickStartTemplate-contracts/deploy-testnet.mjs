import algosdk from "algosdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load .env.testnet file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, ".env.testnet") });

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
  console.error("\n❌ DEPLOYER_MNEMONIC not set");
  console.error("\nSetup instructions:");
  console.error("1. Copy .env.testnet.template to .env.testnet:");
  console.error("   cp .env.testnet.template .env.testnet");
  console.error("\n2. Edit .env.testnet and paste your 25-word mnemonic");
  console.error("   Get testnet ALGO from: https://dispenser.algorandfoundation.org/");
  console.error("\n3. Run deploy again:");
  console.error("   node deploy-testnet.mjs\n");
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

  numGlobalInts: 7,        // fundingGoal, minimumGoal, stakingDeadline, totalStaked, isFunded, financialCloseReached, premiumPool
  numGlobalByteSlices: 1,  // developer (address)
  numLocalInts: 2,         // stakeAmount, hasWithdrawn
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

// ---------- Initialize the contract ----------
console.log("\n📝 Initializing contract...");

const arc56 = JSON.parse(
  fs.readFileSync("out/smart_contracts/protius_staking/ProtiusStaking.arc56.json", "utf8")
);

// Find the init method
const initMethod = arc56.methods.find(m => m.name === "init");
if (!initMethod) {
  console.error("❌ Could not find init method in ARC56");
  process.exit(1);
}

// Create ABI method
const abiMethod = new algosdk.ABIMethod(initMethod);

// Prepare init arguments
const fundingGoal = 1_000_000_000; // 1000 ALGO in microAlgos (pool target)
const minimumGoal = 5_000_000;     // 5 ALGO in microAlgos (minimum total to succeed)
const stakingPeriodSeconds = 86400 * 30; // 30 days

const atc = new algosdk.AtomicTransactionComposer();
const initParams = await algod.getTransactionParams().do();

atc.addMethodCall({
  appID: appId,
  method: abiMethod,
  methodArgs: [
    deployerAddr,        // developer account
    fundingGoal,         // funding goal
    minimumGoal,         // minimum goal
    stakingPeriodSeconds // staking period
  ],
  sender: deployerAddr,
  suggestedParams: initParams,
  signer: algosdk.makeBasicAccountTransactionSigner(deployer),
});

const initResult = await atc.execute(algod, 4);
console.log("✅ Contract initialized");
console.log("   Funding goal: 1000 ALGO");
console.log("   Minimum goal: 5 ALGO");
console.log("   Staking period: 30 days");

console.log("\nAdd to frontend .env:");
console.log(`VITE_PROTIUS_STAKING_APP_ID=${appId}`);

