/**
 * Wallet Service - Bridge between UI and protiusStakingApi
 * 
 * This service holds the wallet connection (algodClient + transactionSigner)
 * and forwards it to the protiusStakingApi for blockchain operations.
 * 
 * Phase 2: Enhanced with defensive checks and validation
 */

import algosdk from 'algosdk'
import { setTransactionSigner } from './protiusStakingApi'

let cachedAlgodClient: algosdk.Algodv2 | null = null
let cachedTransactionSigner: algosdk.TransactionSigner | null = null

/**
 * Set the wallet service with algod client and transaction signer
 * This wires the wallet into the staking API
 * 
 * @throws Error if algodClient or transactionSigner is invalid
 */
export function setWalletService(
  algodClient: algosdk.Algodv2,
  transactionSigner: algosdk.TransactionSigner
): void {
  // Defensive checks
  if (!algodClient) {
    console.error('[WalletService] algodClient is null or undefined')
    throw new Error('algodClient is required')
  }
  
  if (!transactionSigner) {
    console.error('[WalletService] transactionSigner is null or undefined')
    throw new Error('transactionSigner is required')
  }
  
  cachedAlgodClient = algodClient
  cachedTransactionSigner = transactionSigner
  
  console.log('[WalletService] Wallet service initialized', {
    hasAlgodClient: !!algodClient,
    hasTransactionSigner: !!transactionSigner,
    timestamp: new Date().toISOString()
  })
  
  // Note: Address will be set separately via setTransactionSigner
  console.log('[WalletService] Remember to call setTransactionSigner with address')
}

/**
 * Clear the wallet service
 * Called when wallet is disconnected
 */
export function clearWalletService(): void {
  const hadClient = !!cachedAlgodClient
  const hadSigner = !!cachedTransactionSigner
  
  cachedAlgodClient = null
  cachedTransactionSigner = null
  setTransactionSigner(null, null)
  
  console.log('[WalletService] Wallet service cleared', {
    hadClient,
    hadSigner,
    timestamp: new Date().toISOString()
  })
}

/**
 * Get the cached algod client
 * @returns The cached algod client or null if not set
 */
export function getAlgodClient(): algosdk.Algodv2 | null {
  return cachedAlgodClient
}

/**
 * Get the cached transaction signer
 * @returns The cached transaction signer or null if not set
 */
export function getTransactionSigner(): algosdk.TransactionSigner | null {
  return cachedTransactionSigner
}

/**
 * Check if wallet service is ready
 * @returns true if both algodClient and transactionSigner are set
 */
export function isWalletServiceReady(): boolean {
  const ready = !!(cachedAlgodClient && cachedTransactionSigner)
  console.log('[WalletService] Wallet service ready check:', ready)
  return ready
}
