import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { consoleLogger } from '@algorandfoundation/algokit-utils/types/logging'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// AlgoKit debug / logging
Config.configure({
  logger: consoleLogger,
  debug: true,
  // traceAll: true,
})
registerDebugEventHandlers()

// ESM-safe base directory (no __dirname)
const baseDir = path.dirname(fileURLToPath(import.meta.url))

async function importDeployerIfExists(dir: string) {
  const tsPath = path.resolve(dir, 'deploy-config.ts')
  const jsPath = path.resolve(dir, 'deploy-config.js')

  let fileToImport: string | null = null
  if (fs.existsSync(tsPath)) fileToImport = tsPath
  else if (fs.existsSync(jsPath)) fileToImport = jsPath
  if (!fileToImport) return null

  const mod = await import(pathToFileURL(fileToImport).href)
  if (!mod || typeof mod.deploy !== 'function') {
    console.warn(`Found ${path.basename(fileToImport)} but no export 'deploy'; skipping.`)
    return null
  }
  return { ...mod, name: path.basename(dir) } as { deploy: () => Promise<unknown>; name: string }
}

async function getDeployers() {
  const directories = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.resolve(baseDir, d.name))

  const deployers = await Promise.all(directories.map(importDeployerIfExists))
  return deployers.filter((x): x is { deploy: () => Promise<unknown>; name: string } => x !== null)
}

// usage: tsx -r dotenv/config smart_contracts/index.ts [contractFolderName]
;(async () => {
  const contractName = process.argv.length > 2 ? process.argv[2] : undefined
  const all = await getDeployers()

  const selected = contractName ? all.filter((d) => d.name === contractName) : all

  if (contractName && selected.length === 0) {
    console.warn(`No deployer found for contract folder: ${contractName}`)
    return
  }
  if (selected.length === 0) {
    console.warn(`No deploy-config.ts/js found under: ${baseDir}`)
    return
  }

  for (const d of selected) {
    try {
      console.log(`▶ Deploying ${d.name}...`)
      await d.deploy()
      console.log(`✅ Deployed ${d.name}`)
    } catch (e) {
      console.error(`❌ Error deploying ${d.name}:`, e)
    }
  }
})()
