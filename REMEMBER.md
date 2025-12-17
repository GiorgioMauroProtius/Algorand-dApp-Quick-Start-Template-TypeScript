Reminder: Manual deploy workflow and runner

What I added:

- `.github/workflows/manual-deploy.yml` — a manual `workflow_dispatch` GitHub Action that:
  - installs `algokit`, starts the LocalNet, waits for it to be healthy, installs contracts deps, bootstraps the project, and runs the deploy runner
  - uploads `deploy-result.json` as an artifact when successful

- `QuickStartTemplate/projects/QuickStartTemplate-contracts/scripts/run-deploy.ts` — simple TypeScript runner that calls `deploy()` from `smart_contracts/protius_demo_staking/deploy-config.ts` and writes `deploy-result.json` with the result.

- Added `deploy:runner` npm script to `QuickStartTemplate/projects/QuickStartTemplate-contracts/package.json` to run the runner using `npx tsx`.

Notes:
- The runner requires a running LocalNet or reachable Algorand node; the workflow runs an Algokit LocalNet on the runner before executing the deploy.
- Running the workflow will start docker containers; the runner waits for up to ~2 minutes for `http://localhost:4001/v2/status`.
- I did NOT execute the workflow — it is ready to be triggered manually in GitHub under Actions → Manual Deploy (or via the workflow_dispatch API).

If you'd like, I can also open a GitHub Issue as a reminder or add a short README section to the contracts project documenting how to run the workflow locally and in CI.
