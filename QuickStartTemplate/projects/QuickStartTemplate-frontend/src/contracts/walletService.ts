/**
 * Wallet Service - Bridge between UI and protiusStakingApi
 * 
 * This service holds the wallet connection (algodClient + transactionSigner)
 * and forwards it to the protiusStakingApi for blockchain operations.
 */

import algosdk from 'algosdk'
import { setTransactionSigner } from './protiusStakingApi'

let cachedAlgodClient: algosdk.Algodv2 | null = null
let cachedTransactionSigner: algosdk.TransactionSigner | null = null

/**
 * Set the wallet service with algod client and transaction signer
 * This wires the wallet into the staking API
 */
export function setWalletService(
  algodClient: algosdk.Algodv2,
  transactionSigner: algosdk.TransactionSigner
): void {
  cachedAlgodClient = algodClient
  cachedTransactionSigner = transactionSigner
  
  // Forward signer to the staking API
  // Note: We can't get the address from transactionSigner directly,
  // so the address will be passed separately by the API calls
  console.log('[WalletService] Wallet service initialized')
}

/**
 * Clear the wallet service
 * Called when wallet is disconnected
 */
export function clearWalletService(): void {
  cachedAlgodClient = null
  cachedTransactionSigner = null
  setTransactionSigner(null, null)
  console.log('[WalletService] Wallet service cleared')
}

/**
 * Get the cached algod client
 */
export function getAlgodClient(): algosdk.Algodv2 | null {
  return cachedAlgodClient
}

/**
 * Get the cached transaction signer
 */
export function getTransactionSigner(): algosdk.TransactionSigner | null {
  return cachedTransactionSigner
}
