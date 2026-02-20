import fs from 'fs';

// Read the generated approval TEAL
const approvalPath = 'out/smart_contracts/protius_staking/ProtiusStaking.approval.teal';
let approval = fs.readFileSync(approvalPath, 'utf8');

// Replace the bare routing section to allow OptIn
// Find: main_bare_routing@13:
//       txn OnCompletion
//       bnz main_after_if_else@17
// Replace with code that allows OptIn (OnCompletion == 1)

const oldBareRouting = `main_bare_routing@13:
    // smart_contracts/protius_staking/contract.algo.ts:13
    // export class ProtiusStaking extends Contract {
    txn OnCompletion
    bnz main_after_if_else@17`;

const newBareRouting = `main_bare_routing@13:
    // smart_contracts/protius_staking/contract.algo.ts:13
    // export class ProtiusStaking extends Contract {
    txn OnCompletion
    intc_1 // 1
    ==
    bnz main_allow_optin@15  // If OptIn, allow it
    txn OnCompletion
    bnz main_after_if_else@17  // Otherwise, check other cases

main_allow_optin@15:
    // Allow bare OptIn
    intc_1 // 1
    return
`;

approval = approval.replace(oldBareRouting, newBareRouting);

fs.writeFileSync(approvalPath, approval);
console.log('✅ Modified approval program to allow OptIns');
