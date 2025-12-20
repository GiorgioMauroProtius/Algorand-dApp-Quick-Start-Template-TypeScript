/**
 * Protius Staking API - Real Algorand TestNet Implementation
 * 
 * This module provides functions to interact with the Protius Staking smart contract
 * on Algorand TestNet using algosdk v3.
 */

import algosdk from 'algosdk'

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Represents the current state of the staking application
 */
export interface StakingState {
  /** Total amount staked across all users (in microAlgos) */
  totalStake: bigint
  /** Amount staked by the current user (in microAlgos) */
  userStake: bigint
}

// ============================================================================
// Configuration and State
// ============================================================================

/** Algorand TestNet API endpoint */
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_TOKEN = ''
const ALGOD_PORT = ''

/** Cached Algod client instance */
let algodClient: algosdk.Algodv2 | null = null

/** Cached transaction signer from wallet */
let transactionSigner: algosdk.TransactionSigner | null = null

/** Cached user address */
let userAddress: string | null = null

/**
 * Get or create Algod client for TestNet
 */
function getAlgodClient(): algosdk.Algodv2 {
  if (!algodClient) {
    algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
    console.log('[ProtiusStaking] Algod client initialized for TestNet')
  }
  return algodClient
}

/**
 * Get the staking application ID from environment
 */
function getAppId(): number {
  const appIdStr = import.meta.env.VITE_PROTIUS_STAKING_APP_ID
  if (!appIdStr) {
    throw new Error(
      'VITE_PROTIUS_STAKING_APP_ID environment variable is not configured. ' +
      'Please set it in your .env file.'
    )
  }
  const appId = parseInt(appIdStr, 10)
  if (isNaN(appId) || appId <= 0) {
    throw new Error(
      `Invalid VITE_PROTIUS_STAKING_APP_ID: ${appIdStr}. ` +
      'Must be a positive integer.'
    )
  }
  return appId
}

// ============================================================================
// Transaction Signer Management
// ============================================================================

/**
 * Set the transaction signer from the wallet
 * This should be called by the external UI to inject the wallet's transaction signer
 * 
 * @param signer - Transaction signer from the wallet provider
 * @param address - Active wallet address
 */
export function setTransactionSigner(
  signer: algosdk.TransactionSigner | null,
  address: string | null
): void {
  transactionSigner = signer
  userAddress = address
  console.log('[ProtiusStaking] Transaction signer updated:', {
    hasSigner: !!signer,
    address: address || 'none'
  })
}

// ============================================================================
// State Reading Functions
// ============================================================================

/**
 * Parse application state from TealKeyValue pairs
 */
function parseApplicationState(
  state: Array<{ key: Uint8Array | string; value: { bytes?: Uint8Array | string; type: number; uint?: number | bigint } }>
): Record<string, bigint | Uint8Array> {
  const parsed: Record<string, bigint | Uint8Array> = {}
  
  for (const item of state) {
    // Handle key - it may be Uint8Array or base64 string
    let key: string
    if (typeof item.key === 'string') {
      key = Buffer.from(item.key, 'base64').toString('utf-8')
    } else {
      key = Buffer.from(item.key).toString('utf-8')
    }
    
    if (item.value.type === 2) {
      // uint type
      const uint = item.value.uint
      parsed[key] = typeof uint === 'bigint' ? uint : BigInt(uint || 0)
    } else if (item.value.type === 1) {
      // bytes type
      const bytes = item.value.bytes
      if (typeof bytes === 'string') {
        parsed[key] = Buffer.from(bytes, 'base64')
      } else if (bytes) {
        parsed[key] = bytes
      } else {
        parsed[key] = new Uint8Array(0)
      }
    }
  }
  
  return parsed
}

/**
 * Read global application state
 */
async function readGlobalState(appId: number): Promise<bigint> {
  const client = getAlgodClient()
  
  try {
    const appInfo = await client.getApplicationByID(appId).do()
    
    if (!appInfo.params || !appInfo.params.globalState) {
      console.log('[ProtiusStaking] No global state found')
      return BigInt(0)
    }
    
    const globalState = parseApplicationState(appInfo.params.globalState)
    const totalStake = globalState['total_stake']
    
    if (typeof totalStake === 'bigint') {
      console.log('[ProtiusStaking] Global state - total_stake:', totalStake.toString())
      return totalStake
    }
    
    console.log('[ProtiusStaking] total_stake not found in global state')
    return BigInt(0)
  } catch (error) {
    console.error('[ProtiusStaking] Error reading global state:', error)
    throw new Error(`Failed to read global state: ${error}`)
  }
}

/**
 * Read local application state for a user
 */
async function readLocalState(appId: number, address: string): Promise<bigint> {
  const client = getAlgodClient()
  
  try {
    const accountInfo = await client.accountApplicationInformation(address, appId).do()
    
    if (!accountInfo.appLocalState || !accountInfo.appLocalState.keyValue) {
      console.log('[ProtiusStaking] User not opted in or no local state')
      return BigInt(0)
    }
    
    const localState = parseApplicationState(accountInfo.appLocalState.keyValue)
    const userStake = localState['user_stake']
    
    if (typeof userStake === 'bigint') {
      console.log('[ProtiusStaking] Local state - user_stake:', userStake.toString())
      return userStake
    }
    
    console.log('[ProtiusStaking] user_stake not found in local state')
    return BigInt(0)
  } catch (error: unknown) {
    // User likely not opted in - this is not an error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('application does not exist') || 
        errorMessage.includes('no app-local-state')) {
      console.log('[ProtiusStaking] User not opted in to application')
      return BigInt(0)
    }
    console.error('[ProtiusStaking] Error reading local state:', error)
    // Return 0 instead of throwing to handle gracefully
    return BigInt(0)
  }
}

/**
 * Check if a user is opted into the application
 */
async function isUserOptedIn(appId: number, address: string): Promise<boolean> {
  const client = getAlgodClient()
  
  try {
    const accountInfo = await client.accountApplicationInformation(address, appId).do()
    const optedIn = !!accountInfo.appLocalState
    console.log('[ProtiusStaking] User opted in status:', optedIn)
    return optedIn
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('application does not exist') ||
        errorMessage.includes('no app-local-state')) {
      console.log('[ProtiusStaking] User not opted in')
      return false
    }
    console.error('[ProtiusStaking] Error checking opt-in status:', error)
    return false
  }
}

/**
 * Fetch the current staking state
 * 
 * @param address - Optional user address. If not provided, uses cached address
 * @returns Current staking state with total stake and user stake
 */
export async function fetchStakingState(address?: string): Promise<StakingState> {
  console.log('[ProtiusStaking] Fetching staking state...')
  
  const appId = getAppId()
  const addr = address || userAddress
  
  // Read global state (always available)
  const totalStake = await readGlobalState(appId)
  
  // Read user state if address is available
  let userStake = BigInt(0)
  if (addr) {
    userStake = await readLocalState(appId, addr)
  }
  
  const state: StakingState = {
    totalStake,
    userStake
  }
  
  console.log('[ProtiusStaking] Staking state fetched:', {
    totalStake: state.totalStake.toString(),
    userStake: state.userStake.toString()
  })
  
  return state
}

// ============================================================================
// Transaction Utilities
// ============================================================================

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(
  client: algosdk.Algodv2,
  txId: string,
  timeout: number = 4
): Promise<algosdk.modelsv2.PendingTransactionResponse> {
  console.log('[ProtiusStaking] Waiting for confirmation of transaction:', txId)
  
  const statusResponse = await client.status().do()
  const startRound = statusResponse.lastRound
  let currentRound = startRound
  
  while (currentRound < startRound + BigInt(timeout)) {
    try {
      const pendingInfo = await client.pendingTransactionInformation(txId).do()
      if (pendingInfo.confirmedRound && pendingInfo.confirmedRound > 0) {
        console.log('[ProtiusStaking] Transaction confirmed in round:', 
          pendingInfo.confirmedRound)
        return pendingInfo
      }
    } catch (error) {
      console.error('[ProtiusStaking] Error checking transaction:', error)
    }
    
    await client.statusAfterBlock(currentRound).do()
    currentRound++
  }
  
  throw new Error(`Transaction ${txId} not confirmed after ${timeout} rounds`)
}

/**
 * Get suggested transaction parameters
 */
async function getSuggestedParams(): Promise<algosdk.SuggestedParams> {
  const client = getAlgodClient()
  const params = await client.getTransactionParams().do()
  console.log('[ProtiusStaking] Got suggested params - fee:', params.fee, 'round:', params.firstValid)
  return params
}

// ============================================================================
// Opt-In Function
// ============================================================================

/**
 * Opt-in to the staking application
 */
async function optInToApplication(appId: number, address: string): Promise<void> {
  if (!transactionSigner) {
    throw new Error('Transaction signer not set. Please connect your wallet first.')
  }
  
  console.log('[ProtiusStaking] Opting in to application...')
  
  const client = getAlgodClient()
  const params = await getSuggestedParams()
  
  // Create opt-in transaction (application call with OnComplete = OptIn)
  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: address,
    appIndex: appId,
    suggestedParams: params
  })
  
  // Sign the transaction
  const signedTxns = await transactionSigner([optInTxn], [0])
  
  // Send the transaction
  const response = await client.sendRawTransaction(signedTxns).do()
  const txId = response.txid
  console.log('[ProtiusStaking] Opt-in transaction sent:', txId)
  
  // Wait for confirmation
  await waitForConfirmation(client, txId)
  console.log('[ProtiusStaking] Opt-in confirmed')
}

// ============================================================================
// Stake Function
// ============================================================================

/**
 * Stake ALGO into the staking contract
 * 
 * This function creates an atomic transaction group consisting of:
 * 1. Payment transaction sending ALGO to the application address
 * 2. Application call transaction invoking the "stake" method
 * 
 * If the user is not opted in, it automatically opts them in first.
 * 
 * @param amount - Amount to stake in microAlgos
 * @param address - Optional user address. If not provided, uses cached address
 */
export async function stake(amount: bigint, address?: string): Promise<void> {
  if (!transactionSigner) {
    throw new Error('Transaction signer not set. Please connect your wallet first.')
  }
  
  const addr = address || userAddress
  if (!addr) {
    throw new Error('No wallet address available. Please connect your wallet.')
  }
  
  const appId = getAppId()
  console.log('[ProtiusStaking] Staking', amount.toString(), 'microAlgos...')
  
  // Check if user is opted in, opt in if needed
  const optedIn = await isUserOptedIn(appId, addr)
  if (!optedIn) {
    console.log('[ProtiusStaking] User not opted in, performing automatic opt-in...')
    await optInToApplication(appId, addr)
  }
  
  const client = getAlgodClient()
  const params = await getSuggestedParams()
  
  // Validate amount is within safe range for Number conversion
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Stake amount ${amount} exceeds maximum safe integer value. ` +
      `Maximum supported amount is ${Number.MAX_SAFE_INTEGER} microAlgos.`
    )
  }
  
  // Get application address
  const appAddress = algosdk.getApplicationAddress(appId)
  console.log('[ProtiusStaking] Application address:', appAddress)
  
  // Create payment transaction
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: addr,
    receiver: appAddress,
    amount: Number(amount),
    suggestedParams: params
  })
  
  // Create application call transaction with "stake" method
  const stakeMethodArg = new TextEncoder().encode('stake')
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: addr,
    appIndex: appId,
    appArgs: [stakeMethodArg],
    suggestedParams: params
  })
  
  // Group transactions
  const txnGroup = [paymentTxn, appCallTxn]
  algosdk.assignGroupID(txnGroup)
  console.log('[ProtiusStaking] Created atomic transaction group with', txnGroup.length, 'transactions')
  
  // Sign the transaction group
  const signedTxns = await transactionSigner(txnGroup, [0, 1])
  
  // Send the transaction group
  const response = await client.sendRawTransaction(signedTxns).do()
  const txId = response.txid
  console.log('[ProtiusStaking] Stake transaction group sent:', txId)
  
  // Wait for confirmation
  await waitForConfirmation(client, txId)
  console.log('[ProtiusStaking] Stake transaction confirmed')
}

// ============================================================================
// Withdraw Function
// ============================================================================

/**
 * Withdraw staked ALGO from the staking contract
 * 
 * @param amount - Amount to withdraw in microAlgos
 * @param address - Optional user address. If not provided, uses cached address
 */
export async function withdraw(amount: bigint, address?: string): Promise<void> {
  if (!transactionSigner) {
    throw new Error('Transaction signer not set. Please connect your wallet first.')
  }
  
  const addr = address || userAddress
  if (!addr) {
    throw new Error('No wallet address available. Please connect your wallet.')
  }
  
  const appId = getAppId()
  console.log('[ProtiusStaking] Withdrawing', amount.toString(), 'microAlgos...')
  
  const client = getAlgodClient()
  const params = await getSuggestedParams()
  
  // Validate amount is within safe range for Number conversion
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Withdraw amount ${amount} exceeds maximum safe integer value. ` +
      `Maximum supported amount is ${Number.MAX_SAFE_INTEGER} microAlgos.`
    )
  }
  
  // Create application call transaction with "withdraw" method
  const withdrawMethodArg = new TextEncoder().encode('withdraw')
  const amountArg = algosdk.encodeUint64(Number(amount))
  
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: addr,
    appIndex: appId,
    appArgs: [withdrawMethodArg, amountArg],
    suggestedParams: params
  })
  
  console.log('[ProtiusStaking] Created withdraw transaction')
  
  // Sign the transaction
  const signedTxns = await transactionSigner([appCallTxn], [0])
  
  // Send the transaction
  const response = await client.sendRawTransaction(signedTxns).do()
  const txId = response.txid
  console.log('[ProtiusStaking] Withdraw transaction sent:', txId)
  
  // Wait for confirmation
  await waitForConfirmation(client, txId)
  console.log('[ProtiusStaking] Withdraw transaction confirmed')
}
