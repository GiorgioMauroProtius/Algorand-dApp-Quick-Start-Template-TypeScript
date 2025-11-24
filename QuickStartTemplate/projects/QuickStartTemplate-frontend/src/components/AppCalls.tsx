import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AiOutlineDeploymentUnit, AiOutlineLoading3Quarters, AiOutlineWarning } from 'react-icons/ai'
import { HelloWorldFactory } from '../contracts/HelloWorld'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [contractInput, setContractInput] = useState<string>('')
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  })
  algorand.setDefaultSigner(transactionSigner)

  const sendAppCall = async () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Please connect your wallet in the header before calling the contract.', {
        variant: 'warning',
      })
      return
    }

    if (!contractInput.trim()) {
      enqueueSnackbar('Please enter a value for the hello() input first.', {
        variant: 'warning',
      })
      return
    }

    setLoading(true)

    try {
      enqueueSnackbar('Deploying HelloWorld contract to Algorand TestNet…', {
        variant: 'info',
      })

      // Please note, in typical production scenarios,
      // you wouldn't want to use deploy directly from your frontend.
      // Instead, you would deploy your contract on your backend and reference it by id.
      // Given the simplicity of the starter contract, we are deploying it on the frontend
      // for demonstration purposes.
      const factory = new HelloWorldFactory({
        defaultSender: activeAddress ?? undefined,
        algorand,
      })

      const deployResult = await factory.deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })

      if (!deployResult) {
        enqueueSnackbar('Deployment failed. Please check your wallet and try again.', {
          variant: 'error',
        })
        return
      }

      const { appClient } = deployResult

      enqueueSnackbar(
        `Contract deployed successfully${
          (appClient as any)?.appId ? ` (App ID: ${(appClient as any).appId})` : ''
        }. Calling hello()…`,
        { variant: 'success' },
      )

      const response = await appClient.send.hello({
        args: { name: contractInput },
      })

      if (!response) {
        enqueueSnackbar('No response received from the contract.', {
          variant: 'warning',
        })
        return
      }

      enqueueSnackbar(`HelloWorld response: ${response.return}`, {
        variant: 'success',
      })

      // On success, clear input and close modal to make it feel complete.
      setContractInput('')
      setModalState(false)
    } catch (e) {
      const err = e as Error
      enqueueSnackbar(`Unexpected error during contract interaction: ${err.message || String(err)}`, {
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      id="appcalls_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${
        openModal ? 'modal-open' : ''
      }`}
    >
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
          <AiOutlineDeploymentUnit className="text-3xl" />
          Smart Contract Interaction
        </h3>

        <div className="bg-neutral-700 p-4 rounded-xl mb-6">
          <p className="flex items-center gap-2 text-sm text-gray-400">
            <AiOutlineWarning className="text-xl text-yellow-400" />
            <span>
              <strong>Note:</strong> This demo deploys the contract from the frontend. In production you
              would typically deploy it once (via backend or devops) and reference it by its app ID.
            </span>
          </p>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-gray-400">Input for hello() function</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full bg-neutral-700 text-gray-100 border-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="e.g., world!"
            value={contractInput}
            onChange={(e) => {
              setContractInput(e.target.value)
            }}
          />
        </div>

        <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="btn w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border-none text-gray-300 rounded-xl"
            onClick={() => setModalState(false)}
            disabled={loading}
          >
            Close
          </button>
          <button
            type="button"
            className={`
              btn w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl border-none font-semibold transition-all duration-300 transform active:scale-95
              ${contractInput ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
            `}
            onClick={sendAppCall}
            disabled={loading || !contractInput}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Sending…
              </span>
            ) : (
              'Send application call'
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default AppCalls
