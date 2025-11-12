import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { consoleLogger } from '@algorandfoundation/algokit-utils/types/logging'

// Node ESM-friendly shims + stdlib
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// -----------------------------------------------------------------------------
// ESM polyfill for __filename / __dirname
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// -----------------------------------------------------------------------------
// AlgoKit debug / logging config
// -----------------------------------------------------------------------------
Config.configure({
  logger: consoleLogger,
  debug: true,
  // traceAll: true, // Uncomment to emit AVM debugger traces / sourcemaps
})
registerDebugEventHandlers()

// Base directory that contains your per-contract subfolders (each with deploy-config.{ts,js})
const baseDir = path.resolve(__dirname)

// -----------------------------------------------------------------------------
// Dynamically import a deployer module if present
// Looks for: <dir>/deploy-config.ts or <dir>/deploy-config.js
// -----------------------------------------------------------------------------
async function importDeployerIfExists(dir: string) {
  const tsPath = path.resolve(dir, 'deploy-config.ts')
  const jsPath = path.resolve(dir, 'deploy-config.js')

  let fileToImport: string | null = null
  if (fs.existsSync(tsPath)) fileToImport = tsPath
  else if (fs.existsSync(jsPath)) fileToImport = jsPath

  if (!fileToImport) return null

  // In ESM, dynamic import works most reliably with file URLs
  const deployerModule = await import(pathToFileURL(fileToImport).href)

  // We expect the module to export a `deploy` function
  if (!deployerModule || typeof deployerModule.deploy !== 'function') {
    console.warn(
      `Found ${path.basename(fileToImport)} but it does not export a 'deploy' function; skipping.`,
    )
    return null
  }

  return { ...deployerModule, name: path.basename(dir) } as { deploy: () => Promise<unknown>; name: string }
}

// -----------------------------------------------------------------------------
// Collect all deployers from subdirectories of baseDir
// -----------------------------------------------------------------------------
async function getDeployers() {
  const directories = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.resolve(baseDir, d.name))

  const deployers = await Promise.all(directories.map(importDeployerIfExists))
  return deployers.filter((x): x is { deploy: () => Promise<unknown>; name: string } => x !== null)
}

// -----------------------------------------------------------------------------
// Entry point: optional arg to select a single contract folder
//   usage: tsx -r dotenv/config smart_contracts/index.ts [contractFolderName]
// -----------------------------------------------------------------------------
;(async () => {
  const contractName = process.argv.length > 2 ? process.argv[2] : undefined
  const allDeployers = await getDeployers()

  const deployers = contractName
    ? allDeployers.filter((d) => d.name === contractName)
    : allDeployers

  if (contractName && deployers.length === 0) {
    console.warn(`No deployer found for contract folder: ${contractName}`)
    return
  }

  if (deployers.length === 0) {
    console.warn(`No deploy-config.ts/js found under: ${baseDir}`)
    return
  }

  for (const d of deployers) {
    try {
      console.log(`▶ Deploying ${d.name}...`)
      await d.deploy()
      console.log(`✅ Deployed ${d.name}`)
    } catch (e) {
      console.error(`❌ Error deploying ${d.name}:`, e)
    }
  }
})()
