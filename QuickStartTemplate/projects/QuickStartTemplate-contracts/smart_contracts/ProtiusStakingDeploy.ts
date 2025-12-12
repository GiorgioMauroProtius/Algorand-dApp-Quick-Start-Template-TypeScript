import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { ProtiusStakingFactory } from './ProtiusStaking.contract';

async function main() {
  console.log("🚀 Deploying ProtiusStaking contract to TestNet...");

  // 1. Load Algod connection from environment (same network used by contracts dev tools)
const algorand = AlgorandClient.fromEnvironment();


  // 2. Use the active wallet (the one you already use for HelloWorld)
  const sender = await algorand.account.fromEnvironment(); 
  const adminAddress = sender.addr;

  console.log("• Admin wallet:", adminAddress);

  // 3. Deploy using the generated factory
  const factory = new ProtiusStakingFactory(algorand.client);
  const deployResult = await factory.deploy(
    {
      admin: adminAddress, // sets admin in init()
    },
    {
      sender,
      allowUpdate: "never",
      allowDelete: "never",
    }
  );

  console.log("🎉 Deployment successful!");
  console.log("📌 ProtiusStaking App ID:", deployResult.appId);

  return deployResult.appId;
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
});
