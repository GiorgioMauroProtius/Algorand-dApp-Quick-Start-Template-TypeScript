import { useWallet } from '@txnlab/use-wallet-react';
import ProjectForm from './components/ProjectForm';

export default function Home() {
  const { activeAccount } = useWallet();
  const addr = activeAccount?.address ?? null;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/protius-bg.jpg)",
        backgroundSize: 'cover',
        backgroundPosition: 'center 70%',
        backgroundRepeat: 'no-repeat',
        color: '#eaeaea',
      }}
    >
      <div
        style={{
          padding: 24,
          maxWidth: 880,
          margin: '0 auto',
          backdropFilter: 'blur(3px)',
        }}
      >
        <h1 style={{ color: '#00ffd0', marginBottom: 8 }}>
          ⚡ Protius Project Registration
        </h1>
        <p style={{ color: '#9b9b9b', marginBottom: 24 }}>
          Register a renewable energy project to start the Protius lifecycle
          (DEVT → kWp → kWh).
        </p>

        {!addr ? (
          <div
            style={{
              border: '1px dashed #333',
              borderRadius: 12,
              padding: 24,
              background: '#0f0f0f',
              color: '#bcbcbc',
              textAlign: 'center',
            }}
          >
            Connect your Algorand wallet (Pera, Defly, Exodus) to begin.
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              // temporary; we'll wire this to on-chain in the next step
              console.log('new project →', data, 'from', addr);
            }}
          />
        )}
      </div>

      <footer
        style={{
          maxWidth: 880,
          margin: '24px auto',
          padding: '12px 0',
          color: '#8a8a8a',
          borderTop: '1px solid #222',
          textAlign: 'center',
          fontSize: 12,
        }}
      >
        © 2025 Protius Protocol — Built on Algorand TestNet
      </footer>
    </div>
  );
}
