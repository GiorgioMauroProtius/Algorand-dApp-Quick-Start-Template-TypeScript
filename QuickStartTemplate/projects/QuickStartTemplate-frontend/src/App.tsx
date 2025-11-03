import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import { Analytics } from '@vercel/analytics/react'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
  <SnackbarProvider maxSnack={3}>
    <WalletProvider manager={walletManager}>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          minHeight: '100vh',
          background: '#0c0c0c',
          color: '#e4e4e4',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            background: '#111',
            borderBottom: '1px solid #222',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ color: '#00ffd0', margin: 0 }}>⚡ Protius Protocol</h2>
          <nav style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: '#00ffd0' }}>Home</a>
            <a href="#" style={{ color: '#00ffd0' }}>Projects</a>
            <a href="#" style={{ color: '#00ffd0' }}>Profile</a>
          </nav>
        </header>

        <main style={{ padding: '40px 24px', flex: 1 }}>
          <Home />
        </main>

        <footer
          style={{
            borderTop: '1px solid #222',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#888',
          }}
        >
          © 2025 Protius Protocol — Powered by Algorand TestNet
        </footer>
      </div>

      <Analytics />
    </WalletProvider>
  </SnackbarProvider>
)

 
