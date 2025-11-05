/**
 * PVProjectStaking Smart Contract (Algorand TEALScript version)
 * 
 * Equivalent logic to the Solidity version:
 * - Users stake USDC ASA
 * - Developer sets funding goal and deadline
 * - If minimum reached, funds go to developer
 * - If not, users can refund
 * - Developer distributes premium rewards after Financial Close
 */

import { Contract } from '@algorandfoundation/tealscript';

export class PVProjectStaking extends Contract {
    // Global variables
    developer = GlobalStateKey<Address>();
    usdcAsset = GlobalStateKey<Asset>();
    fundingGoal = GlobalStateKey<uint64>();
    minimumGoal = GlobalStateKey<uint64>();
    totalStaked = GlobalStateKey<uint64>();
    stakingDeadline = GlobalStateKey<uint64>();
    isFunded = GlobalStateKey<boolean>();
    financialCloseReached = GlobalStateKey<boolean>();

    // Local state for each staker
    stakeAmount = LocalStateKey<uint64>();

    /**
     * Deploy and initialize
     */
    deploy(
        developer: Address,
        usdcAsset: Asset,
        fundingGoal: uint64,
        minimumGoal: uint64,
        stakingPeriodDays: uint64
    ): void {
        this.developer.value = developer;
        this.usdcAsset.value = usdcAsset;
        this.fundingGoal.value = fundingGoal;
        this.minimumGoal.value = minimumGoal;
        this.totalStaked.value = 0;
        this.stakingDeadline.value = this.txn.firstValidTime + stakingPeriodDays * 86400; // days to seconds
        this.isFunded.value = false;
        this.financialCloseReached.value = false;
    }

    /**
     * Stake USDC before the deadline
     */
    stake(amount: uint64, staker: Address): void {
        assert(this.txn.firstValidTime <= this.stakingDeadline.value, 'Staking closed');
        assert(amount > 0, 'Amount must be > 0');

        sendAssetTransfer({
            xferAsset: this.usdcAsset.value,
            assetAmount: amount,
            sender: staker,
            receiver: this.app.address
        });

        const prev = this.stakeAmount(staker).value;
        this.stakeAmount(staker).value = prev + amount;
        this.totalStaked.value += amount;
    }

    /**
     * Developer confirms project funding success after deadline
     */
    confirmFundingSuccess(): void {
        assert(this.txn.sender === this.developer.value, 'Only developer');
        assert(this.txn.firstValidTime > this.stakingDeadline.value, 'Staking still open');
        assert(this.totalStaked.value >= this.minimumGoal.value, 'Minimum not met');
        assert(!this.isFunded.value, 'Already funded');

        this.isFunded.value = true;

        sendAssetTransfer({
            xferAsset: this.usdcAsset.value,
            assetAmount: this.totalStaked.value,
            sender: this.app.address,
            receiver: this.developer.value
        });
    }

    /**
     * Developer distributes premium after financial close
     */
    triggerFinancialClose(premiumAmount: uint64): void {
        assert(this.txn.sender === this.developer.value, 'Only developer');
        assert(this.isFunded.value, 'Project not funded');
        assert(!this.financialCloseReached.value, 'Already closed');

        sendAssetTransfer({
            xferAsset: this.usdcAsset.value,
            assetAmount: premiumAmount,
            sender: this.developer.value,
            receiver: this.app.address
        });

        const total = this.totalStaked.value;
        for (const acct of this.app.localStates.keys()) {
            const userStake = this.stakeAmount(acct).value;
            if (userStake > 0) {
                const share = (userStake * premiumAmount) / total;
                sendAssetTransfer({
                    xferAsset: this.usdcAsset.value,
                    assetAmount: share,
                    sender: this.app.address,
                    receiver: acct
                });
            }
        }

        this.financialCloseReached.value = true;
    }

    /**
     * Refund stakers if funding fails
     */
    refund(staker: Address): void {
        assert(this.txn.firstValidTime > this.stakingDeadline.value, 'Still open');
        assert(!this.isFunded.value, 'Funding succeeded');

        const amount = this.stakeAmount(staker).value;
        assert(amount > 0, 'No stake found');

        this.stakeAmount(staker).value = 0;

        sendAssetTransfer({
            xferAsset: this.usdcAsset.value,
            assetAmount: amount,
            sender: this.app.address,
            receiver: staker
        });
    }
}

