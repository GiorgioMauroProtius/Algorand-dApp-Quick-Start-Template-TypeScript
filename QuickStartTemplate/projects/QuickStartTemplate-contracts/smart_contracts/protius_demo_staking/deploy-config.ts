import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { ProtiusDemoStaking } from './ProtiusDemoStaking'

export async function deploy() {
  const algorand = AlgorandClient.fromEnvironment()

  // Dummy USDC ASA ID for demo (can be changed later)
  const USDC_ASSET_ID = 123456

  const appClient = new ProtiusDemoStaking({
    algorand,
    sender: algorand.account.fromEnvironment("deployer"),
  })

  const result = await appClient.create({
    usdcAssetId: BigInt(USDC_ASSET_ID),
  })

  return { appClient, appId: result.appId }
}

