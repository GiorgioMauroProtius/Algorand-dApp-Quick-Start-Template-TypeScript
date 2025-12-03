// QuickStartTemplate-contracts/smart_contracts/typescript/pv_staking/ProtiusStaking.algo.ts

import {
  GlobalState,
  LocalState,
  Uint64,
  uint64,
  Txn,
  Global,
  Bytes,
  Account,
  assert,
  arc4,
} from '@algorandfoundation/algorand-typescript'

/**
 * ProtiusStaking
 *
 * Simplified single-pool staking contract, tuned for the demo:
 *
 * - Stake / unstake while staking is open
 * - At Financial Close, admin calls distributeRewards(projectId, devCapAtFC, premiumAmount)
 *   (e.g. devCapAtFC = 1_000_000, premiumAmount = 1_000_000 for “2x money”)
 * - Rewards are computed per staker as:
 *
 *      grossReward = stakeAmount * premiumAmount / devCapAtFC
 *      claimable   = max(0, grossReward - alreadyClaimed)
 *
 * - claimRewards(projectId) lets each staker pull their own rewards
 *   (for now this just tracks amounts on-chain; next step is wiring
 *   to an escrow / ASA transfer).
 */

export default class ProtiusStaking extends arc4.Contract {
  // -----------------------------
  // Global state
  // -----------------------------

  /**
   * Total amount staked in the pool (sum of all stakers’ stakeAmount)
   */
  public totalStaked = GlobalState<uint64>({
    key: Bytes('total_staked'),
    initialValue: Uint64(0),
  })

  /**
   * Development capital at Financial Close (human-in-the-loop input)
   * Example: 1_000_000
   */
  public devCapAtFC = GlobalState<uint64>({
    key: Bytes('dev_cap_fc'),
    initialValue: Uint64(0),
  })

  /**
   * Premium pool to be distributed to stakers
   * Example for “2x money”: premiumAmount = devCapAtFC
   */
  public premiumAmount = GlobalState<uint64>({
    key: Bytes('premium'),
    initialValue: Uint64(0),
  })

  /**
   * Has the reward configuration been set already?
   * 0 = not configured, 1 = configured
   */
  public rewardsConfigured = GlobalState<uint64>({
    key: Bytes('rewards_cfg'),
    initialValue: Uint64(0),
  })

  /**
   * Staking open flag
   * 1 = staking open (stake / unstake allowed)
   * 0 = staking closed (after distributeRewards is called)
   */
  public stakingOpen = GlobalState<uint64>({
    key: Bytes('staking_open'),
    initialValue: Uint64(1),
  })

  // -----------------------------
  // Local state (per account)
  // -----------------------------

  /**
   * Amount staked by each account
   */
  public stakeAmount = LocalState<uint64>({
    key: Bytes('stake_amt'),
  })

  /**
   * How much reward this account has already claimed
   */
  public claimedReward = LocalState<uint64>({
    key: Bytes('claimed'),
  })

  // -----------------------------
  // Internal helpers
  // -----------------------------

  /**
   * Only the contract creator (admin) may call certain methods.
   */
  private ensureAdmin(): void {
    assert(Txn.sender === Global.creatorAddress, 'only admin can call this method')
  }

  /**
   * Compute the *total* reward allocated for a given account
   * based on their stake and the configured devCapAtFC / premiumAmount.
   *
   * Uses integer division – no decimals on-chain.
   */
  private computeTotalRewardFor(account: Account): uint64 {
    if (this.rewardsConfigured.value === Uint64(0)) {
      return Uint64(0)
    }

    const staked = this.stakeAmount(account).value
    if (staked === Uint64(0)) {
      return Uint64(0)
    }

    const devCap = this.devCapAtFC.value
    const premium = this.premiumAmount.value

    if (devCap === Uint64(0)) {
      return Uint64(0)
    }

    // totalReward = stakeAmount * premium / devCap
    return (staked * premium) / devCap
  }

  /**
   * Compute the *currently claimable* reward for an account:
   * max(0, totalReward - claimedReward)
   */
  private computePendingRewardFor(account: Account): uint64 {
    const totalReward = this.computeTotalRewardFor(account)
    const alreadyClaimed = this.claimedReward(account).value

    if (totalReward <= alreadyClaimed) {
      return Uint64(0)
    }

    return totalReward - alreadyClaimed
  }

  // -----------------------------
  // ABI methods
  // -----------------------------

  /**
   * Stake into the pool.
   *
   * projectId is accepted for ABI compatibility with the front-end
   * but this contract currently manages a single pool per app instance.
   */
  @arc4.abimethod
  public stake(projectId: uint64, amount: uint64): void {
    // Only allow staking while the pool is open
    assert(this.stakingOpen.value === Uint64(1), 'staking is closed')
    assert(amount > Uint64(0), 'stake amount must be > 0')

    const sender = Txn.sender

    // Require opt-in first (good practice, and aligns with LocalState pattern)
    assert(
      sender.isOptedIn(Global.currentApplicationId),
      'account must opt in before staking',
    )

    const current = this.stakeAmount(sender).value

    this.stakeAmount(sender).value = current + amount
    this.totalStaked.value = this.totalStaked.value + amount
  }

  /**
   * Unstake from the pool.
   *
   * For now, we implement the “safe” version:
   * - Unstake is only allowed while stakingOpen == 1
   * - After distributeRewards is called (stakingOpen = 0),
   *   unstake is disabled (you then exit via rewards).
   *
   * The more complex “replacement staker” logic you described
   * can be layered on top later.
   */
  @arc4.abimethod
  public unstake(projectId: uint64, amount: uint64): void {
    assert(this.stakingOpen.value === Uint64(1), 'unstaking disabled after lock')
    assert(amount > Uint64(0), 'unstake amount must be > 0')

    const sender = Txn.sender

    assert(
      sender.isOptedIn(Global.currentApplicationId),
      'account must opt in before unstaking',
    )

    const current = this.stakeAmount(sender).value
    assert(current >= amount, 'not enough staked to unstake')

    this.stakeAmount(sender).value = current - amount
    this.totalStaked.value = this.totalStaked.value - amount
  }

  /**
   * Read the stake for a specific wallet.
   */
  @arc4.abimethod({ readonly: true })
  public getStake(projectId: uint64, staker: Account): uint64 {
    return this.stakeAmount(staker).value
  }

  /**
   * Read the total staked in the pool.
   */
  @arc4.abimethod({ readonly: true })
  public getTotalStaked(projectId: uint64): uint64 {
    return this.totalStaked.value
  }

  /**
   * Admin-only:
   * Configure rewards at Financial Close and lock the pool.
   *
   * devCapAtFC      - total development capital actually spent (e.g. 1_000_000)
   * premiumAmount   - premium to be shared with stakers (e.g. 1_000_000 for 2x money)
   *
   * After this:
   *  - stakingOpen = 0 (no more stake/unstake)
   *  - rewardsConfigured = 1
   *
   * The ratio is: premiumAmount / devCapAtFC
   */
  @arc4.abimethod
  public distributeRewards(
    projectId: uint64,
    devCapAtFC: uint64,
    premiumAmount: uint64,
  ): void {
    this.ensureAdmin()

    assert(this.rewardsConfigured.value === Uint64(0), 'rewards already configured')
    assert(devCapAtFC > Uint64(0), 'devCapAtFC must be > 0')

    this.devCapAtFC.value = devCapAtFC
    this.premiumAmount.value = premiumAmount
    this.rewardsConfigured.value = Uint64(1)

    // Close staking from this point
    this.stakingOpen.value = Uint64(0)
  }

  /**
   * Read the pending (unclaimed) reward for any wallet.
   */
  @arc4.abimethod({ readonly: true })
  public getPendingReward(projectId: uint64, staker: Account): uint64 {
    return this.computePendingRewardFor(staker)
  }

  /**
   * Claim rewards for the sender.
   *
   * For now this *only* updates bookkeeping on-chain and returns
   * the claimed amount; it doesn’t move any ASA/USDC yet.
   *
   * The front-end can read the returned value and present it
   * as “claimable premium” in the UI. Later, we can wire this
   * to an escrow and inner asset transfers.
   */
  @arc4.abimethod
  public claimRewards(projectId: uint64): uint64 {
    assert(this.rewardsConfigured.value === Uint64(1), 'rewards not configured yet')

    const sender = Txn.sender

    assert(
      sender.isOptedIn(Global.currentApplicationId),
      'account must opt in before claiming',
    )

    const pending = this.computePendingRewardFor(sender)
    if (pending === Uint64(0)) {
      return Uint64(0)
    }

    const alreadyClaimed = this.claimedReward(sender).value
    this.claimedReward(sender).value = alreadyClaimed + pending

    // NOTE: no actual asset transfer yet – this is just accounting.
    // Next iteration: wire to USDC ASA + inner transactions.
    return pending
  }
}
