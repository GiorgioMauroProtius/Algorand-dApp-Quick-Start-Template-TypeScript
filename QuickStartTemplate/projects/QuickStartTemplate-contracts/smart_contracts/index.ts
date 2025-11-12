// smart_contracts/index.ts
import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { consoleLogger } from '@algorandfoundation/algokit-utils/types/logging'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

// Configure logging / debug
Config.configure({
  logger: consoleLogger,
  debug: true,
  // traceAll: true,
})
registerDebugEventHandlers()

// ESM-safe dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base directory where each contract folder (with deploy-config.ts/js) lives
const baseDir = __dirname

// Try to load a deploy-config.{ts,js} from a directory
async function importDeployerIfExists(dir: string) {
  const tsPath = path.resolve(dir, 'deploy-config.ts')
  const jsPath = path.resolve(dir, 'deploy-config.js')

  let fileToLoad: string | null = null
  if (fs.existsSync(tsPath)) fileToLoad = tsPath
  else if (fs.existsSync(jsPath)) fileToLoad = jsPath

  if (!fileToLoad) return null

  // Dynamic ESM import from file path
  const mod = await import(pathToFileURL(fileToLoad).href)
  // We accept either a default export or a named deploy()
  const deploy = (mod.default?.deploy ?? mod.deploy) as (opts?: any) => Promise<any>
  if (typeof deploy !== 'function') return null

  return { deploy, name: path.basename(dir) }
}

// Scan subfolders and collect deployers
async function getDeployers() {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
  const dirs = entries.filter(e => e.isDirectory()).map(e => path.resolve(baseDir, e.name))

  const candidates = await Promise.all(dirs.map(importDeployerIfExists))
  return candidates.filter((x): x is { deploy: Function; name: string } => x !== null)
}

// Execute
;(async () => {
  const contractName = process.argv.length > 2 ? process.argv[2] : undefined
  const deployers = await getDeployers()
  const chosen = contractName ? deployers.filter(d => d.name === contractName) : deployers

  if (contractName && chosen.length === 0) {
    console.warn('No deployer found for contract name: ' + contractName)
    return
  }

  for (const d of chosen) {
    try {
      console.log('➡️  Deploying: ' + d.name)
      const result = await d.deploy()
      if (result?.appClient?.appId) {
        console.log('✅ Deployed ' + d.name + ' App ID: ' + String(result.appClient.appId))
      } else {
        console.log('✅ Deployed ' + d.name)
      }
    } catch (e) {
      console.error('❌ Error deploying ' + d.name + ':', e)
      process.exitCode = 1
    }
  }
})()

