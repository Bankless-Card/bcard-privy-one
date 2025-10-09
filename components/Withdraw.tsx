import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

const VAULT_ADDRESS = '0x119d2bc7bb9b94f5518ce30169457ff358b47535';
const VAULT_ABI = [
    // withdraw function
    { "inputs": [
        { "internalType": "uint256", "name": "_assets", "type": "uint256" },
        { "internalType": "address", "name": "_receiver", "type": "address" }
    ], "name": "withdraw", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
    // balanceOf function
    { "inputs": [
        { "internalType": "address", "name": "account", "type": "address" }
    ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];

export default function Withdraw() {
    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [vaultBalance, setVaultBalance] = useState<number | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    useEffect(() => {
        const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
        async function fetchVaultBalance() {
            if (wallet) {
                try {
                    const privyProvider = await wallet.getEthereumProvider();
                    const provider = new BrowserProvider(privyProvider);
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    setWalletAddress(address);
                    const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, provider);
                    if (typeof vault.balanceOf === 'function') {
                        const vBalance = await vault.balanceOf(address);
                        setVaultBalance(Number(formatUnits(vBalance, 6)));
                    } else {
                        setVaultBalance(0);
                    }
                } catch (err) {
                    setVaultBalance(0);
                    setWalletAddress(null);
                }
            } else {
                setWalletAddress(null);
            }
        }
        if (ready && authenticated && wallet) {
            fetchVaultBalance();
        } else if (ready && authenticated && !wallet) {
            setWalletAddress(null);
        }
    }, [ready, authenticated, wallets]);

    async function handleWithdraw() {
        setWithdrawLoading(true);
        setWithdrawStatus('Withdrawing...');
        setWithdrawSuccess(false);
        try {
            const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
            if (!wallet) throw new Error('No wallet found');
            const privyProvider = await wallet.getEthereumProvider();
            const provider = new BrowserProvider(privyProvider);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
            const amount = BigInt(Math.floor(vaultBalance! * 1e6)); // USDC has 6 decimals
            if (amount <= 0n) throw new Error('No funds to withdraw');
            setWithdrawStatus('Sending withdraw transaction...');
            if (typeof vault.withdraw === 'function') {
                const withdrawTx = await vault.withdraw(amount, address);
                setWithdrawStatus('Withdraw transaction sent. Waiting for confirmation...');
                await withdrawTx.wait();
                setWithdrawSuccess(true);
                setWithdrawStatus('Withdraw successful!');
                setTimeout(() => {
                    setWithdrawStatus(null);
                }, 5000);
            } else {
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
            }
            setWithdrawStatus(errorMsg);
        } finally {
            setWithdrawLoading(false);
        }
    }

    if (!ready) {
        return <div>Loading...</div>;
    }
    if (!authenticated) {
        return <div>Please log in to withdraw.</div>;
    }
    if (!walletAddress || !vaultBalance || vaultBalance <= 0) {
        return null;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <p><strong>Withdraw from USDC Vault</strong></p>
            {/* <div>Your Vault balance: {vaultBalance}</div> */}
            {withdrawStatus && <div style={{ color: withdrawSuccess ? 'green' : 'red' }}>{withdrawStatus}</div>}
            {withdrawSuccess && !withdrawStatus && (
                <div style={{ color: 'green' }}>Withdraw successful!</div>
            )}
            <button onClick={handleWithdraw} disabled={withdrawLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
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
            {/* <div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.9em', color: '#888' }}>
                Wallet Address: {walletAddress}
            </div> */}
        </div>
    );
}
