/**
 * useStaking Hook
 * 
 * Provides staking operations and state management
 * Wraps the protiusStakingApi for React components
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchStakingState, stake as stakeApi, withdraw as withdrawApi, setTransactionSigner } from '../contracts/protiusStakingApi'
import { useSnackbar } from 'notistack'

export interface StakingData {
  totalStake: string
  userStake: string
  isLoading: boolean
}

export function useStaking(address: string | null) {
  const { enqueueSnackbar } = useSnackbar()
  const [data, setData] = useState<StakingData>({
    totalStake: '0',
    userStake: '0',
    isLoading: false
  })

  // Fetch staking state when address changes
  const refreshState = useCallback(async () => {
    if (!address) {
      setData({ totalStake: '0', userStake: '0', isLoading: false })
      return
    }

    try {
      setData(prev => ({ ...prev, isLoading: true }))
      const state = await fetchStakingState(address)
      
      setData({
        totalStake: (Number(state.totalStake) / 1_000_000).toFixed(2),
        userStake: (Number(state.userStake) / 1_000_000).toFixed(2),
        isLoading: false
      })
    } catch (error) {
      console.error('[useStaking] Failed to fetch state:', error)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [address])

  useEffect(() => {
    refreshState()
  }, [refreshState])

  const stake = useCallback(async (amountAlgo: number) => {
    if (!address) {
      enqueueSnackbar('No wallet address available', { variant: 'error' })
      return
    }

    try {
      setData(prev => ({ ...prev, isLoading: true }))
      const microAlgos = BigInt(Math.floor(amountAlgo * 1_000_000))
      
      await stakeApi(microAlgos, address)
      
      enqueueSnackbar('Stake successful!', { variant: 'success' })
      
      // Refresh state after staking
      await refreshState()
    } catch (error) {
      console.error('[useStaking] Stake failed:', error)
      enqueueSnackbar(`Stake failed: ${error}`, { variant: 'error' })
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [address, refreshState, enqueueSnackbar])

  const withdraw = useCallback(async (amountAlgo: number) => {
    if (!address) {
      enqueueSnackbar('No wallet address available', { variant: 'error' })
      return
    }

    try {
      setData(prev => ({ ...prev, isLoading: true }))
      const microAlgos = BigInt(Math.floor(amountAlgo * 1_000_000))
      
      await withdrawApi(microAlgos, address)
      
      enqueueSnackbar('Withdraw successful!', { variant: 'success' })
      
      // Refresh state after withdrawal
      await refreshState()
    } catch (error) {
      console.error('[useStaking] Withdraw failed:', error)
      enqueueSnackbar(`Withdraw failed: ${error}`, { variant: 'error' })
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }, [address, refreshState, enqueueSnackbar])

  return {
    ...data,
    stake,
    withdraw,
    refreshState
  }
}
