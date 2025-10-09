

import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

export default function Deposit() {
	const { ready, authenticated, login } = usePrivy();
    const { wallets } = useWallets();
    
    const USDC_VAULT = '0x119d2bc7bb9b94f5518ce30169457ff358b47535';
	const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
	const USDC_ABI = [
		// Minimal ABI for balanceOf
		"function balanceOf(address owner) view returns (uint256)"
	];
	const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);

	useEffect(() => {
		const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
		console.debug('Privy wallets:', wallets);
		console.debug('Selected wallet:', wallet);

		async function fetchBalanceAndAddress() {
			if (wallet) {
				try {
					// Base chain = chainId 8453
					const privyProvider = await wallet.getEthereumProvider();
					console.debug('Privy provider:', privyProvider);
					const provider = new BrowserProvider(privyProvider);
					const network = await provider.getNetwork();
				    if (Number(network.chainId) !== 8453) {
						console.log(`Wallet is on wrong network: ${network.chainId}. Expected 8453 (Base).`);
						// alert('Please switch your wallet to the Base network (chainId 8453) to use Deposit.');
						// setWalletAddress(null);
						// setUsdcBalance(null);
						// return;

                        await wallet.switchChain(8453);
					}
					const signer = await provider.getSigner();
					const address = await signer.getAddress();
					console.debug("Wallet address:", address);
					setWalletAddress(address);
					const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
					console.debug('USDC contract:', usdc);
					if (typeof usdc.balanceOf === 'function') {
						const balance = await usdc.balanceOf(address);
						console.debug('USDC balance raw:', balance);
						setUsdcBalance(Number(formatUnits(balance, 6)));
					} else {
						console.error('usdc.balanceOf is not a function');
						setUsdcBalance(0);
					}
				} catch (err) {
					console.error('Error fetching wallet info:', err);
					setUsdcBalance(0);
					setWalletAddress(null);
				}
			} else {
				setWalletAddress(null);
			}
		}
		if (ready && authenticated && wallet) {
			fetchBalanceAndAddress();
		} else if (ready && authenticated && !wallet) {
			setWalletAddress(null);
		}
	}, [ready, authenticated, wallets]);

	if (!ready) {
		return <div>Loading...</div>;
	}

	if (!authenticated) {
		return (
			<div>
				<p>Please log in to deposit.</p>
				<button onClick={login}>Log in</button>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
			<p>Welcome! You are logged in.</p>
			<div>Your USDC balance on Base: {usdcBalance === null ? 'Loading...' : usdcBalance}</div>
			{usdcBalance !== null && usdcBalance > 0 && (
				<button>
					Deposit to USDC Vault
				</button>
			)}
			<div style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.9em', color: '#888' }}>
				Wallet Address: {walletAddress
					? walletAddress
					: wallets && wallets.length === 0
						? 'No wallet connected'
						: 'Loading...'}
			</div>
		</div>
	);
}
