# Algorand Protius dApp Architecture Map

## 1) WHAT IS THIS REPO FOR

Algorand dApp Quick Start Template: TypeScript-based monorepo for building, deploying, and interacting with Algorand smart contracts (specifically Protius staking contracts) with React/Vite frontend.

---

## 2) WORKSPACE STRUCTURE

### Monorepo Layout
```
QuickStartTemplate/
├── projects/
│   ├── QuickStartTemplate-contracts/    # Smart contracts, deploy scripts
│   └── QuickStartTemplate-frontend/     # React + Vite UI
```

### Key Top-Level Folders
- **Contracts**: `QuickStartTemplate/projects/QuickStartTemplate-contracts`
- **Frontend**: `QuickStartTemplate/projects/QuickStartTemplate-frontend`

---

## 3) FRONTEND

### Entrypoint
- **HTML**: `QuickStartTemplate/projects/QuickStartTemplate-frontend/index.html`
- **TypeScript**: `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/main.tsx`
- **Root Component**: `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/App.tsx`

### Commands to Run Locally
```bash
cd QuickStartTemplate/projects/QuickStartTemplate-frontend
npm run dev
```
*(Runs code generation + Vite dev server)*

---

## 4) CONTRACTS/DEPLOY

### Contract Paths

**Protius Staking Contract (Primary):**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/protius_staking/contract.algo.ts
```

**Alternative Contracts:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/hello_world/contract.algo.ts
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/protius_demo_staking/ProtiusDemoStaking.ts
```

**Compiled Artifacts:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/artifacts/protius_staking/
```

### Canonical Deploy Entrypoint for TestNet

**Deploy Script:** 
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/deploy-testnet.mjs
```

**Command:**
```bash
cd QuickStartTemplate/projects/QuickStartTemplate-contracts
node deploy-testnet.mjs
```

**Alternative Deploy Methods:**
- Via AlgoKit: `npm run deploy`
- Via run-deploy script: `npm run deploy:runner` 
  - Uses: `scripts/run-deploy.ts`

---

## 5) APP ID PERSISTENCE

### Where App ID Gets Printed

**File:** 
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/deploy-testnet.mjs
Lines 94-101
```

**Output:**
```
🆔 App ID: {appId}
VITE_PROTIUS_STAKING_APP_ID={appId}
```

**Note:** App ID is printed but NOT automatically persisted to file - must be manually copied to `.env`

---

## 6) ENVIRONMENT VARIABLES

### Contracts/Deploy

**Required:**
- `DEPLOYER_MNEMONIC` 
  - Referenced in: `deploy-testnet.mjs` (line 21)

**Optional (for custom networks):**
- `ALGOD_TOKEN`
- `ALGOD_SERVER`
- `ALGOD_PORT`
- `INDEXER_TOKEN`
- `INDEXER_SERVER`
- `INDEXER_PORT`

**Referenced in:**
- `.algokit.toml` (lines 22-28)
- AlgoKit deploy configs

### Frontend (Vite)

**Declaration File:** 
```
QuickStartTemplate/projects/QuickStartTemplate-frontend/src/vite-env.d.ts
```

**Template:** 
```
QuickStartTemplate/projects/QuickStartTemplate-frontend/.env.template
```

#### Algod Configuration
- `VITE_ALGOD_TOKEN`
- `VITE_ALGOD_SERVER`
- `VITE_ALGOD_PORT`
- `VITE_ALGOD_NETWORK`

**Used in:** `src/utils/network/getAlgoClientConfigs.ts`, `src/App.tsx`

#### Indexer Configuration
- `VITE_INDEXER_TOKEN`
- `VITE_INDEXER_SERVER`
- `VITE_INDEXER_PORT`

#### KMD (LocalNet only)
- `VITE_KMD_TOKEN`
- `VITE_KMD_SERVER`
- `VITE_KMD_PORT`
- `VITE_KMD_PASSWORD`
- `VITE_KMD_WALLET`

#### App IDs
- `VITE_HELLO_APP_ID`
- `VITE_PROTIUS_STAKING_APP_ID` ← **Main staking app ID**

#### General
- `VITE_ENVIRONMENT`

### NFT Mint Server (Optional)

**Used in:** `nft_mint_server/app.js`

- `PINATA_API_KEY`
- `PINATA_API_SECRET`
- `PINATA_JWT`
- `PORT`

**Template:** `nft_mint_server/.env.template`

---

## 7) TOP 10 MOST IMPORTANT FILES

### Full Flow: UI → Wallet Connect → TX → Chain → State Refresh

| # | File | Purpose |
|---|------|---------|
| 1 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/main.tsx` | App entry point |
| 2 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/App.tsx` | Wallet provider & network config |
| 3 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/Home.tsx` | Main UI container |
| 4 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/components/ConnectWallet.tsx` | Wallet connection UI |
| 5 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/components/ProtiusStakingPanel.tsx` | Staking UI & controls |
| 6 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/protiusStakingApi.ts` | Transaction builders & state fetching |
| 7 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/utils/algodClient.ts` | Algod client singleton |
| 8 | `QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/projectConfig.ts` | App ID configuration |
| 9 | `QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/protius_staking/contract.algo.ts` | Smart contract logic |
| 10 | `QuickStartTemplate/projects/QuickStartTemplate-contracts/deploy-testnet.mjs` | Deploy script |

---

## 8) PROTIUS STAKING — COMPLETE REFERENCE

### Contract Folder(s)

**Main Contract:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/protius_staking/
└── contract.algo.ts
```

**Demo Contract:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/protius_demo_staking/
├── ProtiusDemoStaking.ts
└── deploy-config.ts
```

**Compiled Artifacts:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/artifacts/protius_staking/
├── ProtiusStaking.approval.teal
├── ProtiusStaking.clear.teal
├── ProtiusStaking.arc32.json
├── ProtiusStaking.arc56.json
└── ProtiusStakingClient.ts
```

### Deploy Script(s)

**Canonical TestNet Deploy:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/deploy-testnet.mjs
```

**Alternative Deploy Runner:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/scripts/run-deploy.ts
```

**Legacy Deploy Script:**
```
QuickStartTemplate/projects/QuickStartTemplate-contracts/smart_contracts/ProtiusStakingDeploy.ts
```

### Frontend Env Var Name(s)

```
VITE_PROTIUS_STAKING_APP_ID
```

### Frontend Files That Read/Use That App ID

1. **`QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/projectConfig.ts`** (line 9)
   - Reads and parses `VITE_PROTIUS_STAKING_APP_ID`
   - Exports `PROJECT_STAKING_CONFIGS` array

2. **`QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/protiusStakingApi.ts`** (lines 5-7)
   - Consumes App ID for all contract calls
   - Functions: `fetchStakingState()`, `optIn()`, `stake()`, `withdraw()`

3. **`QuickStartTemplate/projects/QuickStartTemplate-frontend/src/components/ProtiusStakingPanel.tsx`**
   - Uses `protiusStakingApi` indirectly
   - Displays staking UI and handles user interactions

### Frontend Type Definitions

**Generated ARC-56 Types:**
```
QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/ProtiusStaking.ts
```

**Generated Typed Client:**
```
QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/ProtiusStakingClient.ts
```

---

## QUICK REFERENCE COMMANDS

### Setup & Development

```bash
# Frontend development
cd QuickStartTemplate/projects/QuickStartTemplate-frontend
npm install
npm run dev

# Contracts development
cd QuickStartTemplate/projects/QuickStartTemplate-contracts
npm install
npm run build
```

### Deployment

```bash
# Build contracts
npm run build

# Deploy to TestNet (using the canonical script)
node deploy-testnet.mjs

# Alternative: Deploy via AlgoKit
npm run deploy
```

### Environment Setup

**Frontend (.env file):**
```
VITE_ENVIRONMENT=local
VITE_ALGOD_TOKEN=""
VITE_ALGOD_SERVER="https://testnet-api.algonode.cloud"
VITE_ALGOD_PORT=""
VITE_ALGOD_NETWORK="testnet"
VITE_INDEXER_TOKEN=""
VITE_INDEXER_SERVER="https://testnet-idx.algonode.cloud"
VITE_INDEXER_PORT=""
VITE_PROTIUS_STAKING_APP_ID=<from deploy output>
```

**Contracts (.env.testnet):**
```
DEPLOYER_MNEMONIC=<your mnemonic here>
```

---

## DATA FLOW

### 1. User Connects Wallet
- `App.tsx` initializes `WalletProvider` with `WalletManager`
- `ConnectWallet.tsx` triggers wallet connection
- `useWallet()` hook provides `activeAddress` and `transactionSigner`

### 2. Staking UI Loads
- `ProtiusStakingPanel.tsx` calls `fetchStakingState(activeAddress)`
- `protiusStakingApi.ts` reads from smart contract via Algod client
- State updates: `totalStake`, `userStake`

### 3. User Stakes
- `ProtiusStakingPanel.tsx` → `stakeApi(activeAddress, transactionSigner, amount)`
- `protiusStakingApi.ts` builds `AppCallTxn` using `VITE_PROTIUS_STAKING_APP_ID`
- Transaction signed by wallet → sent to Algod
- `waitForConfirmation()` polls until confirmed

### 4. State Refresh
- On success, `loadState()` re-fetches staking state from chain
- UI updates with new balances

---

## KEY TECHNOLOGIES

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Wallet**: `@txnlab/use-wallet-react`, Pera/Defly connect
- **Contracts**: Algorand TypeScript SDK, AlgoKit
- **Deployment**: Node.js, AlgoKit CLI, AlgoNode (TestNet)
- **State**: LocalStorage (wallet state), On-chain (contract state)

---

## NOTES

- App IDs must be manually added to frontend `.env` after deployment
- `deploy-testnet.mjs` outputs the exact env var needed
- All frontend env vars are prefixed with `VITE_` (Vite convention)
- Contract deployment requires `DEPLOYER_MNEMONIC` with sufficient balance (~0.3 ALGO for TestNet)
- Protius staking contract uses local state (`s` key) for user stakes and global state (`totalStaked` key) for pool total
