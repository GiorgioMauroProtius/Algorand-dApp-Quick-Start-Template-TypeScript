// ProtiusStakingPanel.tsx
// Staking panel component that wires wallet signer to the Protius Staking API

import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { setTransactionSigner, fetchStakingState, stake, withdraw } from '../contracts/protiusStakingApi'

interface ProtiusStakingPanelProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const ProtiusStakingPanel = ({ openModal, setModalState }: ProtiusStakingPanelProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [stakeAmount, setStakeAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [totalStake, setTotalStake] = useState<string>('0')
  const [userStake, setUserStake] = useState<string>('0')

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  // Wire the transaction signer whenever wallet connection changes
  useEffect(() => {
    setTransactionSigner(transactionSigner ?? null, activeAddress ?? null)
  }, [transactionSigner, activeAddress])

  // Fetch staking state when modal opens or address changes
  useEffect(() => {
    const loadStakingState = async () => {
      if (!openModal || !activeAddress) {
        setTotalStake('0')
        setUserStake('0')
        return
      }

      try {
        const state = await fetchStakingState(activeAddress)
        setTotalStake((Number(state.totalStake) / 1_000_000).toFixed(2))
        setUserStake((Number(state.userStake) / 1_000_000).toFixed(2))
      } catch (error) {
        console.error('Failed to fetch staking state:', error)
      }
    }

    loadStakingState()
  }, [openModal, activeAddress])

  const handleStake = async () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid stake amount', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const microAlgos = BigInt(Math.floor(amount * 1_000_000))
      await stake(microAlgos, activeAddress)
      enqueueSnackbar('Stake successful!', { variant: 'success' })
      setStakeAmount('')
      
      // Refresh state
      const state = await fetchStakingState(activeAddress)
      setTotalStake((Number(state.totalStake) / 1_000_000).toFixed(2))
      setUserStake((Number(state.userStake) / 1_000_000).toFixed(2))
    } catch (error) {
      console.error('Stake failed:', error)
      enqueueSnackbar(`Stake failed: ${error}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      enqueueSnackbar('Please enter a valid withdraw amount', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      const microAlgos = BigInt(Math.floor(amount * 1_000_000))
      await withdraw(microAlgos, activeAddress)
      enqueueSnackbar('Withdraw successful!', { variant: 'success' })
      setWithdrawAmount('')
      
      // Refresh state
      const state = await fetchStakingState(activeAddress)
      setTotalStake((Number(state.totalStake) / 1_000_000).toFixed(2))
      setUserStake((Number(state.userStake) / 1_000_000).toFixed(2))
    } catch (error) {
      console.error('Withdraw failed:', error)
      enqueueSnackbar(`Withdraw failed: ${error}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!openModal) return null

  return (
    <div
      id="staking_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-[#1a1a2e] border border-[#00fff7]">
        <h3 className="font-bold text-lg text-[#00fff7] mb-4">Protius Staking</h3>
        
        {/* Staking Stats */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#e0e0ff]">Total Staked:</span>
            <span className="text-[#00fff7] font-bold">{totalStake} ALGO</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#e0e0ff]">Your Stake:</span>
            <span className="text-[#00fff7] font-bold">{userStake} ALGO</span>
          </div>
        </div>

        {/* Stake Section */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text text-[#e0e0ff]">Stake Amount (ALGO)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1 bg-[#23234a] text-[#00fff7] border-[#00fff7]"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-white border-none"
              onClick={handleStake}
              disabled={loading || !activeAddress}
            >
              {loading ? 'Processing...' : 'Stake'}
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="mb-6">
          <label className="label">
            <span className="label-text text-[#e0e0ff]">Withdraw Amount (ALGO)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1 bg-[#23234a] text-[#00fff7] border-[#00fff7]"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={loading}
            />
            <button
              className="btn bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-white border-none"
              onClick={handleWithdraw}
              disabled={loading || !activeAddress}
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="modal-action">
          <button
            className="btn btn-sm bg-[#23234a] hover:bg-[#23234a]/80 text-[#00fff7] border-[#00fff7]"
            onClick={() => setModalState(false)}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProtiusStakingPanel
