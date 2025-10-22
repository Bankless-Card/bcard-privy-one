import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

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
    ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
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

    async function handleWithdraw() {
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
            // Test with 1 USDC (1e6 units)
            const amount = BigInt(1_000_000); // 1 USDC
            const maxShares = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"); // max uint256
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
                    
                    let withdrawTx;
                    try {
                        withdrawTx = await Promise.race([withdrawPromise, withdrawTimeoutPromise]);
                        clearInterval(withdrawCountdownInterval);
                        setCountdown(0);
                        console.log('Withdraw tx returned:', withdrawTx);
                        console.log('Withdraw tx hash:', withdrawTx?.hash);
                    } catch (timeoutErr: any) {
                        clearInterval(withdrawCountdownInterval);
                        setCountdown(0);
                        if (timeoutErr.message === 'WITHDRAW_CALL_TIMEOUT') {
                            console.warn('Withdraw call timed out, but transaction may still be pending. Checking vault balance...');
                            // Wait a bit and check vault balance to see if withdraw succeeded
                            setCountdown(5);
                            setCountdownMax(5);
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
                                    throw new Error('Withdraw transaction call timed out. Please check your wallet or BaseScan to verify the transaction.');
                                }
                            } else {
                                throw new Error('Cannot verify withdraw status. Please check your wallet or BaseScan.');
                            }
                        } else {
                            throw timeoutErr;
                        }
                    }
                    
                    if (withdrawTx) {
                        console.log('Withdraw tx hash:', withdrawTx?.hash);
                        setWithdrawStatus('Transaction sent. Waiting for confirmation...');
                        // Show BaseScan link as plain string if available
                        if (withdrawTx.hash) {
                            setWithdrawStatus(
                                `Withdraw transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${withdrawTx.hash}`
                            );
                        }
                        console.log('About to wait for withdraw tx confirmation...');
                        const receipt = await withdrawTx.wait();
                        console.log('Withdraw tx confirmed, receipt:', receipt);
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <p><strong>Withdraw from USDC Vault</strong></p>
            
            {/* Countdown Timer with Pie Chart */}
            {countdown > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1em', margin: '0.5em 0' }}>
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
                    <span style={{ color: '#666', fontSize: '0.9em' }}>Processing transaction...</span>
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
            <button onClick={handleWithdraw} disabled={withdrawLoading || !vaultBalance || vaultBalance < 1} style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                {withdrawLoading ? (withdrawStatus || 'Withdrawing...') : <>
                    Withdraw from Vault
                    <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                        {/* Up arrow SVG icon */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12L10 7L15 12" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </span>
                </>}
            </button>
            <div>Your Vault balance: {vaultBalance === null ? 'Loading...' : vaultBalance}</div>
            <div>Your USDC balance: {usdcBalance === null ? 'Loading...' : usdcBalance}</div>
        </div>
    );
}
