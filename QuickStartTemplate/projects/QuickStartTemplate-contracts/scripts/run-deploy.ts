#!/usr/bin/env node
import { deploy } from '../smart_contracts/protius_demo_staking/deploy-config'
import fs from 'fs/promises'

async function main() {
  try {
    const result = await deploy()
    console.log('Deployment successful:', result)
    await fs.writeFile('deploy-result.json', JSON.stringify(result, null, 2))
    console.log('Wrote deploy-result.json')
  } catch (e) {
    console.error('Deploy failed:', e)
    process.exit(1)
  }
}

main()
