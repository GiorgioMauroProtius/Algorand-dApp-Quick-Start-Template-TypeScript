import { useWallet } from "@txnlab/use-wallet";

export function App() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();

  return (
    <div>
      <h1>Protius Demo</h1>

      {!activeAddress ? (
        <button onClick={() => window.openWalletConnectModal()}>
          Connect Wallet
        </button>
      ) : (
        <p>Connected: {activeAddress}</p>
      )}
    </div>
  );
}

export default App;
