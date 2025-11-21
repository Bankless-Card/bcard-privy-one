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
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [countdownMax, setCountdownMax] = useState<number>(30);

    async function handleWithdraw(withdrawAmount?: number) {
    setWithdrawLoading(true);
    setWithdrawStatus('Preparing withdrawal...');
    setWithdrawSuccess(false);
    setCountdown(0);
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
                                            
                                            // Update balances
                                            setVaultBalance(currentVaultBalanceNum);
                                            const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                                            if (typeof usdc.balanceOf === 'function') {
                                                const balance = await usdc.balanceOf(address);
                                                const newUsdcBalance = Number(formatUnits(balance, 6));
                                                console.log('Updated USDC balance:', newUsdcBalance);
                                                setUsdcBalance(newUsdcBalance);
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
                                    setVaultBalance(newVaultBalanceNum);
                                    // Update USDC balance
                                    const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                                    if (typeof usdc.balanceOf === 'function') {
                                        const balance = await usdc.balanceOf(address);
                                        const newUsdcBalance = Number(formatUnits(balance, 6));
                                        console.log('Updated USDC balance:', newUsdcBalance);
                                        setUsdcBalance(newUsdcBalance);
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
                        setWithdrawStatus('Withdraw successful!');
                        console.log('Withdraw status set to successful');
                        // Update vault balance
                        if (typeof vault.balanceOf === 'function') {
                            const newVaultBalance = await vault.balanceOf(address);
                            const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));
                            console.log('Updated vault balance:', newVaultBalanceNum);
                            setVaultBalance(newVaultBalanceNum);
                        }
                        // Update USDC balance
                        const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
                        if (typeof usdc.balanceOf === 'function') {
                            const balance = await usdc.balanceOf(address);
                            const newUsdcBalance = Number(formatUnits(balance, 6));
                            console.log('Updated USDC balance:', newUsdcBalance);
                            setUsdcBalance(newUsdcBalance);
                        }
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
            setWithdrawStatus(errorMsg);
        } finally {
            setWithdrawLoading(false);
            setCountdown(0);
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
            {/* Countdown Timer with Pie Chart */}
            {countdown > 0 && (
                <div className={`${styles.txTimer} txTimer`}>
                    <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#e0e0e0" strokeWidth="3" />
                        <circle 
                            cx="20" 
                            cy="20" 
                            r="18" 
                            fill="none" 
                            stroke="#FF9800" 
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
                    <span>{ withdrawSuccess && !withdrawStatus ? "Withdraw successful!" : "Withdraw in progress..."}</span>
                </div>
            )}
            
            {withdrawStatus && (
                <div style={{
                    color:
                        withdrawStatus.includes('successful') ? 'green'
                        : withdrawStatus.includes('Waiting') || withdrawStatus.includes('Preparing') || withdrawStatus.includes('Sending') ? '#888'
                        : 'red',
                    marginBottom: '0.5em',
                    whiteSpace: 'pre-line'
                }}>{withdrawStatus}</div>
            )}
            {withdrawSuccess && !withdrawStatus && (
                <div style={{ color: 'green' }}>Withdraw successful!</div>
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
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            cursor: withdrawLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95em',
                            opacity: withdrawLoading ? 0.6 : 1
                        }}
                    >
                        {withdrawLoading ? (withdrawStatus || 'Withdrawing...') : <>
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
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            color: 'white',
                            cursor: withdrawLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95em',
                            opacity: withdrawLoading ? 0.6 : 1
                        }}
                    >
                        {withdrawLoading ? '' : <>
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
