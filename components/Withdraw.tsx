import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';
import styles from './Deposit.module.css';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const USDC_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];
const VAULT_ADDRESS = '0x119d2bc7bb9b94f5518ce30169457ff358b47535';
const VAULT_ABI = [
    // withdraw function (IERC4626 style)
    { "inputs": [
        { "internalType": "uint256", "name": "_assets", "type": "uint256" },
        { "internalType": "address", "name": "_receiver", "type": "address" },
        { "internalType": "address", "name": "_owner", "type": "address" },
        { "internalType": "uint256", "name": "_maxShares", "type": "uint256" }
    ], "name": "withdraw", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
    // balanceOf function
    { "inputs": [
        { "internalType": "address", "name": "account", "type": "address" }
    ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    // previewWithdraw function - returns shares needed for assets
    { "inputs": [
        { "internalType": "uint256", "name": "assets", "type": "uint256" }
    ], "name": "previewWithdraw", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];

interface WithdrawProps {
    vaultBalance: number | null;
    setVaultBalance: (balance: number) => void;
    usdcBalance: number | null;
    setUsdcBalance: (balance: number) => void;
}

export default function Withdraw({ vaultBalance, setVaultBalance, usdcBalance, setUsdcBalance }: WithdrawProps) {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
    const [withdrawError, setWithdrawError] = useState<string | null>(null);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [countdownMax, setCountdownMax] = useState<number>(30);
    const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

    // Refresh balances with retries for RPC sync (adapted for withdraw: USDC increases)
    async function refreshBalancesWithRetry(
        vaultContract: Contract,
        usdcContract: Contract,
        userAddress: string,
        previousUsdcBalance: number,
        withdrawnAmount: number,
        maxRetries: number = 5,
        delayMs: number = 2000
    ): Promise<void> {
        const expectedUsdcBalance = previousUsdcBalance + withdrawnAmount;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔍 Balance refresh attempt ${attempt}/${maxRetries}...`);

            // Fetch new balances
            const newVaultBalance = await vaultContract.balanceOf(userAddress);
            const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));

            const newUsdcBalanceRaw = await usdcContract.balanceOf(userAddress);
            const newUsdcBalance = Number(formatUnits(newUsdcBalanceRaw, 6));

            console.log('Balance check:', {
                previousUsdc: previousUsdcBalance,
                newUsdc: newUsdcBalance,
                expectedUsdc: expectedUsdcBalance,
                newVault: newVaultBalanceNum,
                synced: newUsdcBalance >= expectedUsdcBalance
            });

            // Check if balance increased (withdraw was processed)
            if (newUsdcBalance >= expectedUsdcBalance) {
                console.log('✅ Balances synced successfully');
                setVaultBalance(newVaultBalanceNum);
                setUsdcBalance(newUsdcBalance);
                return;
            }

            if (attempt < maxRetries) {
                console.log(`⏳ Waiting ${delayMs}ms for balance sync...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        console.warn('⚠️ Balance sync timed out, but withdraw succeeded. Refreshing balances with current values anyway.');
        // Even if we timeout, update with latest values
        const finalVaultBalance = await vaultContract.balanceOf(userAddress);
        const finalUsdcBalance = await usdcContract.balanceOf(userAddress);
        setVaultBalance(Number(formatUnits(finalVaultBalance, 6)));
        setUsdcBalance(Number(formatUnits(finalUsdcBalance, 6)));
    }

    async function handleWithdraw(withdrawAmount?: number) {
        // Wrap everything in try-catch to ensure NO errors escape to Next.js error boundary
        try {
            setWithdrawLoading(true);
            setWithdrawStatus('Preparing withdrawal...');
            setWithdrawError(null);
            setWithdrawSuccess(false);
            setCountdown(0);
            setWithdrawAmount(withdrawAmount);
        try {
            const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
            if (!wallet) throw new Error('No wallet found');
            const privyProvider = await wallet.getEthereumProvider();
            const provider = new BrowserProvider(privyProvider);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
            // Use provided amount or default to full balance (1 USDC for testing)
            const amountToWithdraw = withdrawAmount !== undefined ? withdrawAmount : (vaultBalance || 1);
            const amount = BigInt(Math.floor(amountToWithdraw * 1e6)); // USDC has 6 decimals
            
            // Get the actual shares needed for this withdrawal using previewWithdraw
            let maxShares = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"); // default to max uint256
            if (typeof vault.previewWithdraw === 'function') {
                try {
                    const sharesNeeded = await vault.previewWithdraw(amount);
                    // Add 1% buffer to account for potential slippage
                    maxShares = (sharesNeeded * BigInt(101)) / BigInt(100);
                    console.log('Shares needed for withdrawal:', {
                        assets: amount.toString(),
                        sharesNeeded: sharesNeeded.toString(),
                        maxSharesWithBuffer: maxShares.toString()
                    });
                } catch (previewErr) {
                    console.warn('Could not preview withdraw, using max uint256:', previewErr);
                }
            }
            
            console.log('Withdraw debug:', {
                vaultAddress: VAULT_ADDRESS,
                abi: VAULT_ABI,
                withdrawAmount: amount.toString(),
                receiver: address,
                owner: address,
                maxShares: maxShares.toString(),
                vaultBalance,
                walletAddress: address
            });
            if (amount <= 0n) throw new Error('No funds to withdraw');
            setWithdrawStatus('Sending withdraw transaction...');
            if (typeof vault.withdraw === 'function') {
                try {
                    console.log('About to call vault.withdraw...');
                    
                    // Start countdown for withdraw
                    setCountdown(30);
                    setCountdownMax(30);
                    const withdrawCountdownInterval = setInterval(() => {
                        setCountdown(prev => Math.max(0, prev - 1));
                    }, 1000);
                    
                    // Wrap withdraw call in a timeout Promise race
                    const withdrawPromise = vault.withdraw(amount, address, address, maxShares);
                    const withdrawTimeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('WITHDRAW_CALL_TIMEOUT')), 30000); // 30 second timeout
                    });
                    
                    // Declare interval outside try block so it's accessible in catch
                    let balanceCheckInterval: NodeJS.Timeout | null = null;
                    let withdrawTx;
                    
                    try {
                        // Start periodic balance checks every 5 seconds
                        const startPeriodicBalanceCheck = () => {
                            balanceCheckInterval = setInterval(async () => {
                                if (typeof vault.balanceOf === 'function') {
                                    try {
                                        const currentVaultBalance = await vault.balanceOf(address);
                                        const currentVaultBalanceNum = Number(formatUnits(currentVaultBalance, 6));
                                        console.log('🔍 Periodic withdraw balance check:', currentVaultBalanceNum, 'Previous:', vaultBalance);
                                        
                                        if (currentVaultBalanceNum < (vaultBalance || 0)) {
                                            console.log('✅ Withdraw detected via periodic check!');

                                            if (balanceCheckInterval) clearInterval(balanceCheckInterval);
                                            clearInterval(withdrawCountdownInterval);
                                            setCountdown(0);

                                            // Update balances with retry logic
                                            setWithdrawStatus('Withdraw successful! Updating balances...');
                                            const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                                            try {
                                                await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 5, 2000);
                                            } catch (balanceErr) {
                                                console.error('Balance refresh error:', balanceErr);
                                                // Fallback to direct update
                                                setVaultBalance(currentVaultBalanceNum);
                                                if (typeof usdc.balanceOf === 'function') {
                                                    const balance = await usdc.balanceOf(address);
                                                    setUsdcBalance(Number(formatUnits(balance, 6)));
                                                }
                                            }

                                            setWithdrawSuccess(true);
                                            setWithdrawStatus('Withdraw successful!');
                                            setWithdrawLoading(false);

                                            setTimeout(() => {
                                                setWithdrawStatus(null);
                                            }, 5000);
                                        }
                                    } catch (checkErr) {
                                        console.log('🔍 Withdraw balance check error (will retry):', checkErr);
                                    }
                                }
                            }, 5000); // Check every 5 seconds
                        };
                        
                        // Start periodic checks
                        startPeriodicBalanceCheck();
                        
                        withdrawTx = await Promise.race([withdrawPromise, withdrawTimeoutPromise]);
                        
                        // If we got here, the promise resolved, so stop periodic checks
                        if (balanceCheckInterval) clearInterval(balanceCheckInterval);
                        
                        clearInterval(withdrawCountdownInterval);
                        setCountdown(0);
                        console.log('Withdraw tx returned:', withdrawTx);
                        console.log('Withdraw tx hash:', withdrawTx?.hash);
                    } catch (timeoutErr: any) {
                        // Clean up intervals
                        if (balanceCheckInterval) clearInterval(balanceCheckInterval);
                        clearInterval(withdrawCountdownInterval);
                        setCountdown(0);
                        
                        // Check if this is a contract revert (not a timeout)
                        if (timeoutErr.message !== 'WITHDRAW_CALL_TIMEOUT') {
                            console.error('Withdraw call failed with error:', timeoutErr);
                            let errorMsg = 'Withdraw transaction failed';
                            if (timeoutErr.reason) {
                                errorMsg = `Withdraw failed: ${timeoutErr.reason}`;
                            } else if (timeoutErr.message) {
                                errorMsg = `Withdraw failed: ${timeoutErr.message}`;
                            }
                            setWithdrawStatus(errorMsg);
                            setWithdrawLoading(false);
                            setCountdown(0);
                            throw timeoutErr;
                        }
                        
                        // Handle timeout case
                        if (timeoutErr.message === 'WITHDRAW_CALL_TIMEOUT') {
                            console.warn('Withdraw call timed out, but transaction may still be pending. Checking vault balance...');
                            // Wait a bit and check vault balance to see if withdraw succeeded
                            setCountdown(5);
                            setCountdownMax(5);
                            setWithdrawStatus('Transaction timed out. Checking if it succeeded on-chain...');
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            setCountdown(0);
                            if (typeof vault.balanceOf === 'function') {
                                const newVaultBalance = await vault.balanceOf(address);
                                const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));
                                console.log('Vault balance after timeout:', newVaultBalanceNum, 'Previous:', vaultBalance);
                                if (newVaultBalanceNum < (vaultBalance || 0)) {
                                    console.log('Withdraw succeeded despite timeout!');
                                    // Update balances with retry logic
                                    setWithdrawStatus('Withdraw successful! Updating balances...');
                                    const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                                    try {
                                        await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 5, 2000);
                                    } catch (balanceErr) {
                                        console.error('Balance refresh error:', balanceErr);
                                        // Fallback to direct update
                                        setVaultBalance(newVaultBalanceNum);
                                        if (typeof usdc.balanceOf === 'function') {
                                            const balance = await usdc.balanceOf(address);
                                            setUsdcBalance(Number(formatUnits(balance, 6)));
                                        }
                                    }
                                    setWithdrawSuccess(true);
                                    setWithdrawStatus('Withdraw successful!');
                                    console.log('Withdraw status set to successful');
                                    // Reset status after 5 seconds
                                    setTimeout(() => {
                                        console.log('Clearing withdraw status after timeout');
                                        setWithdrawStatus(null);
                                    }, 5000);
                                    // Skip the rest of withdraw flow
                                    withdrawTx = null;
                                } else {
                                    // Transaction timed out and balance didn't change
                                    console.warn('Withdraw transaction timed out and balance did not decrease');
                                    setWithdrawStatus('Transaction timed out. Please check your wallet or BaseScan to verify the transaction status.');
                                    setWithdrawLoading(false);
                                    setCountdown(0);
                                    return; // Exit the function gracefully
                                }
                            } else {
                                console.error('Cannot verify withdraw status - balanceOf not available');
                                setWithdrawStatus('Cannot verify withdraw status. Please check your wallet or BaseScan.');
                                setWithdrawLoading(false);
                                setCountdown(0);
                                return; // Exit the function gracefully
                            }
                        }
                    }
                    
                    if (withdrawTx) {
                        // Log detailed withdrawal transaction metadata
                        console.log('✅ Withdraw Transaction Sent:', {
                            hash: withdrawTx.hash,
                            from: withdrawTx.from,
                            to: withdrawTx.to,
                            value: withdrawTx.value?.toString(),
                            gasLimit: withdrawTx.gasLimit?.toString(),
                            gasPrice: withdrawTx.gasPrice?.toString(),
                            maxFeePerGas: withdrawTx.maxFeePerGas?.toString(),
                            maxPriorityFeePerGas: withdrawTx.maxPriorityFeePerGas?.toString(),
                            nonce: withdrawTx.nonce,
                            chainId: withdrawTx.chainId,
                            type: withdrawTx.type,
                            data: withdrawTx.data
                        });
                        
                        setWithdrawStatus('Transaction sent. Waiting for confirmation...');
                        // Show BaseScan link as plain string if available
                        if (withdrawTx.hash) {
                            setWithdrawStatus(
                                `Withdraw transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${withdrawTx.hash}`
                            );
                        }
                        console.log('⏳ Waiting for withdraw tx confirmation...');
                        const receipt = await withdrawTx.wait();
                        
                        // Log detailed withdrawal receipt metadata
                        console.log('✅ Withdraw Transaction Confirmed:', {
                            transactionHash: receipt.hash,
                            blockNumber: receipt.blockNumber,
                            blockHash: receipt.blockHash,
                            from: receipt.from,
                            to: receipt.to,
                            gasUsed: receipt.gasUsed?.toString(),
                            cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
                            effectiveGasPrice: receipt.gasPrice?.toString(),
                            status: receipt.status,
                            logsBloom: receipt.logsBloom,
                            events: receipt.logs?.length || 0,
                            confirmations: await receipt.confirmations()
                        });
                        
                        setWithdrawSuccess(true);
                        setWithdrawStatus('Withdraw successful! Updating balances...');
                        console.log('Withdraw status set to successful');
                        // Update balances with retry logic
                        const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                        try {
                            await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 5, 2000);
                            setWithdrawStatus('Withdraw successful!');
                        } catch (balanceErr) {
                            console.error('Balance refresh error:', balanceErr);
                            setWithdrawStatus('Withdraw successful! (Balances may take a moment to update)');
                        }
                        // Reset status after 5 seconds
                        setTimeout(() => {
                            console.log('Clearing withdraw status after timeout');
                            setWithdrawStatus(null);
                        }, 5000);
                    }
                } catch (txErr) {
                    console.error('Withdraw transaction error:', txErr);
                    setCountdown(0);
                    setWithdrawStatus('Withdraw failed to send or confirm.');
                    throw txErr;
                }
            } else {
                setWithdrawStatus('Withdraw method not available on contract.');
                throw new Error('Vault withdraw method not available');
            }
        } catch (err: any) {
            let errorMsg = 'Withdraw failed';
            // Debugging info
            console.error('Withdraw error:', err);
            if (err) {
                if (typeof err === 'string') {
                    errorMsg = err;
                } else if (err.message) {
                    errorMsg = err.message;
                } else if (err.reason) {
                    errorMsg = err.reason;
                } else if (err.toString) {
                    errorMsg = err.toString();
                }
                // Log full error object for deeper debugging
                if (typeof err === 'object') {
                    try {
                        const safeErr = JSON.parse(JSON.stringify(err, (_key, value) =>
                            typeof value === 'bigint' ? value.toString() : value
                        ));
                        console.error('Full error object:', safeErr);
                    } catch (e) {
                        console.error('Full error object (raw):', err);
                    }
                }
            }
            // Error classification: insufficient funds for gas
            if (errorMsg.includes('insufficient funds for gas') || errorMsg.includes('insufficient funds')) {
                errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
            }
            // Error classification: contract revert
            if (errorMsg.includes('missing revert data') || errorMsg.includes('CALL_EXCEPTION')) {
                errorMsg = 'Withdraw failed: The contract reverted. Please check your balance and try again.';
            }
            // Error classification: RPC sync delay
            if (errorMsg.includes('transaction execution reverted') || errorMsg.includes('transaction failed')) {
                errorMsg = 'Withdraw failed. This may be due to RPC sync delays. Please wait 15 seconds and try again.';
            }
            setWithdrawError(errorMsg);
            setWithdrawStatus(errorMsg);
        } finally {
            setWithdrawLoading(false);
            setWithdrawAmount(0);
            setCountdown(0);
        }
        } catch (topLevelError: any) {
            // This is the nuclear option - catch ANY error that escaped inner handlers
            console.error('🚨 Top-level error handler caught error:', topLevelError);
            const errorMsg = topLevelError?.message || topLevelError?.reason || 'An unexpected error occurred';
            setWithdrawError('Withdraw failed. Please try again. ' + errorMsg);
            setWithdrawStatus('Withdraw failed.');
            setWithdrawLoading(false);
            setCountdown(0);
            // Do NOT re-throw - this ensures the Promise resolves, not rejects
        }
    }

    if (!ready) {
        return <div>Loading...</div>;
    }
    if (!authenticated) {
        return <div>Please log in to withdraw.</div>;
    }
    if (!vaultBalance || vaultBalance <= 0) {
        return null;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column'}}>
            
            <div className={`${styles.txDetails} txDetails`}>

            { (withdrawLoading || withdrawSuccess || withdrawStatus) && (
                <div className={`${styles.txStatus} txStatus`}>
                    { withdrawLoading &&  (
                    <div className={`${styles.txGoal} txGoal`}>
                        Withdrawing ${withdrawAmount}...
                    </div>
                    )}
                    <div className={`${styles.txProgress} txProgress`}>
                        {/* Countdown Timer with Pie Chart */}
                        { countdown > 0  && (
                            <div className={`${styles.txTimer} txTimer`}>
                                <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="20" cy="20" r="18" fill="none" stroke="#e0e0e0" strokeWidth="3" />
                                    <circle 
                                        cx="20" 
                                        cy="20" 
                                        r="18" 
                                        fill="none" 
                                        stroke="#4CAF50" 
                                        strokeWidth="3"
                                        strokeDasharray={`${2 * Math.PI * 18}`}
                                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - countdown / countdownMax)}`}
                                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                    <text 
                                        x="20" 
                                        y="20" 
                                        textAnchor="middle" 
                                        dy=".3em" 
                                        fill="#333" 
                                        fontSize="12" 
                                        fontWeight="bold"
                                        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                                    >
                                        {countdown}s
                                    </text>
                                </svg>
                            </div>
                        )}
                        { (!withdrawSuccess && withdrawStatus) && (withdrawStatus) }
                        { withdrawSuccess && (<div className={`${styles.txSuccess} txSuccess`}>Withdraw successful!</div>) }
                    </div>
                </div>
            )}
            </div>
            
            <div className={`${styles.vaultButtons} vaultButtons`}>
                {/* Dynamic amount button */}
                {vaultBalance && vaultBalance >= 1 && (
                    <button 
                        onClick={() => handleWithdraw(
                            vaultBalance < 5 ? 1 : vaultBalance < 20 ? 5 : 20
                        )} 
                        disabled={withdrawLoading}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5em',
                            padding: '0.75em 1em',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            background: '#6C68C5',
                            color: 'white',
                            cursor: withdrawLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95em',
                            opacity: withdrawLoading ? 0.6 : 1
                        }}
                    >
                        {withdrawLoading ? 'Withdrawing...' : <>
                            Withdraw ${vaultBalance < 5 ? '1' : vaultBalance < 20 ? '5' : '20'}
                            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 7L15 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </>}
                    </button>
                )}
                
                {/* Withdraw All button */}
                {vaultBalance && vaultBalance > 0 && (
                    <button 
                        onClick={() => handleWithdraw(vaultBalance)} 
                        disabled={withdrawLoading}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5em',
                            padding: '0.75em 1em',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            background: '#6C68C5',
                            color: 'white',
                            cursor: withdrawLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95em',
                            opacity: withdrawLoading ? 0.6 : 1
                        }}
                    >
                        {withdrawLoading ? 'Withdrawing...' : <>
                            Withdraw All (${vaultBalance?.toFixed(2)})
                            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 7L15 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </>}
                    </button>
                )}
            </div>
        </div>
    );
}
