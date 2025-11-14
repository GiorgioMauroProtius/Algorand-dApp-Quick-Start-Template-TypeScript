import { Outlet } from "react-router-dom";
import { Wallet } from "@txnlab/use-wallet";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-area">
          <span className="logo-text">⚡ Protius Protocol</span>
        </div>

        <div className="wallet-area">
          {/* THIS IS THE BUTTON YOU NEED */}
          <Wallet />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
