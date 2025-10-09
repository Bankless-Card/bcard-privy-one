

import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

export default function Deposit() {
	const { ready, authenticated, login } = usePrivy();
    const { wallets } = useWallets();
    
	const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
	const USDC_ABI = [
		"function balanceOf(address owner) view returns (uint256)"
	];
	const VAULT_ADDRESS = '0x119d2bc7bb9b94f5518ce30169457ff358b47535';
	const VAULT_ABI = [
		// deposit function
		{ "inputs": [
			{ "internalType": "uint256", "name": "_assets", "type": "uint256" },
			{ "internalType": "address", "name": "_receiver", "type": "address" }
		], "name": "deposit", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
		// balanceOf function
		{ "inputs": [
			{ "internalType": "address", "name": "account", "type": "address" }
		], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
	];
	const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
	const [vaultBalance, setVaultBalance] = useState<number | null>(null);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);
	const [ethBalance, setEthBalance] = useState<number | null>(null);
	const [depositLoading, setDepositLoading] = useState(false);
	const [depositError, setDepositError] = useState<string | null>(null);
	const [depositSuccess, setDepositSuccess] = useState(false);
	const [depositStatus, setDepositStatus] = useState<string | null>(null);
	const [approvalLoading, setApprovalLoading] = useState(false);
	const [approvalSuccess, setApprovalSuccess] = useState(false);

	useEffect(() => {
		const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
		async function fetchBalanceAndAddress() {
			if (wallet) {
				try {
					setApprovalSuccess(false);
					const privyProvider = await wallet.getEthereumProvider();
					const provider = new BrowserProvider(privyProvider);
					const network = await provider.getNetwork();
					if (Number(network.chainId) !== 8453) {
						await wallet.switchChain(8453);
					}
					const signer = await provider.getSigner();
					const address = await signer.getAddress();
					setWalletAddress(address);
					// ETH balance
					const ethBal = await provider.getBalance(address);
					setEthBalance(Number(formatUnits(ethBal, 18)));
					// USDC balance
					const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
					if (typeof usdc.balanceOf === 'function') {
						const balance = await usdc.balanceOf(address);
						setUsdcBalance(Number(formatUnits(balance, 6)));
					} else {
						setUsdcBalance(0);
					}
					// Vault balance
					const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, provider);
					if (typeof vault.balanceOf === 'function') {
						const vBalance = await vault.balanceOf(address);
						setVaultBalance(Number(formatUnits(vBalance, 6)));
					} else {
						setVaultBalance(0);
					}
				} catch (err) {
					setUsdcBalance(0);
					setVaultBalance(0);
					setEthBalance(0);
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

	async function handleDeposit() {
		setDepositLoading(true);
		setDepositError(null);
		setDepositSuccess(false);
		setDepositStatus('Depositing...');
		try {
			const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
			if (!wallet) throw new Error('No wallet found');
			const privyProvider = await wallet.getEthereumProvider();
			const provider = new BrowserProvider(privyProvider);
			const signer = await provider.getSigner();
			const address = await signer.getAddress();
			const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
			const amount = BigInt(Math.floor(usdcBalance! * 1e6)); // USDC has 6 decimals

			// Log deposit inputs
			console.log('Deposit input audit:', {
				walletAddress: address,
				depositAmount: amount.toString(),
				usdcBalance,
				ethBalance,
				vaultAddress: VAULT_ADDRESS
			});

			// Check allowance and approve on VAULT_ADDRESS contract
			const vaultERC20 = new Contract(VAULT_ADDRESS, [
				"function allowance(address owner, address spender) view returns (uint256)",
				"function approve(address spender, uint256 amount) returns (bool)"
			], signer);
			let allowance = BigInt(0);
			if (typeof vaultERC20.allowance === 'function') {
				allowance = await vaultERC20.allowance(address, VAULT_ADDRESS);
				console.log('Vault ERC20 allowance for vault:', allowance.toString());
			}
			if (allowance < amount) {
				// Approve vault to spend tokens
				setApprovalLoading(true);
				console.log('Vault ERC20 allowance insufficient, approving...');
				if (typeof vaultERC20.approve === 'function') {
					const approveTx = await vaultERC20.approve(VAULT_ADDRESS, amount);
					console.log('Approve tx:', approveTx);
					await approveTx.wait();
					setApprovalSuccess(true);
					console.log('Approve tx confirmed');
				} else {
					throw new Error('Vault ERC20 approve method not available');
				}
				setApprovalLoading(false);
			} else {
				setApprovalSuccess(false);
				console.log('Vault ERC20 allowance sufficient, skipping approval');
			}

			// Call deposit(_assets, _receiver)
			console.log('Calling vault.deposit with:', { amount: amount.toString(), receiver: address });
			if (typeof vault.deposit === 'function') {
				const depositTx = await vault.deposit(amount, address);
				console.log('Deposit tx:', depositTx);
				setDepositStatus('Transaction sent. Waiting for confirmation...');
				await depositTx.wait();
				console.log('Deposit tx confirmed');
				setDepositSuccess(true);
				setDepositStatus('Deposit successful!');
				// Reset status after 5 seconds
				setTimeout(() => {
					setDepositStatus(null);
				}, 5000);
			} else {
				throw new Error('Vault deposit method not available');
			}
		} catch (err: any) {
			let errorMsg = 'Deposit failed';
			// Debugging info
			console.error('Deposit error:', err);
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
				// Log full error object for deeper debugging, avoid BigInt serialization
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
			// viem/ethers insufficient funds error handling
			if (errorMsg.includes('insufficient funds for gas') || errorMsg.includes('insufficient funds')) {
				errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
			}
			// Handle missing revert data / call exception
			if (errorMsg.includes('missing revert data') || errorMsg.includes('CALL_EXCEPTION')) {
				errorMsg = 'Deposit failed: The contract reverted without a message. Please check your USDC balance, approval, and try again. If the problem persists, contact support.';
			}
			setDepositError(errorMsg);
			setDepositStatus(errorMsg);
		} finally {
			setDepositLoading(false);
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
			<p>Welcome! You are logged in.</p>
			<div>Your USDC balance on Base: {usdcBalance === null ? 'Loading...' : usdcBalance}</div>
			<div>Your ETH balance on Base: {ethBalance === null ? 'Loading...' : ethBalance}</div>
			<div>Your Vault deposit balance: {vaultBalance === null ? 'Loading...' : vaultBalance}</div>
			{approvalLoading && <div style={{ color: '#888' }}>Approving tokens for deposit...</div>}
			{approvalSuccess && <div style={{ color: 'green' }}>Approval successful!</div>}
			{depositStatus && <div style={{ color: depositSuccess ? 'green' : 'red' }}>{depositStatus}</div>}
			{usdcBalance !== null && usdcBalance > 0 && ethBalance !== null && ethBalance > 0 && (
				<button onClick={handleDeposit} disabled={depositLoading || approvalLoading}>
					{depositLoading ? (depositStatus || 'Depositing...') : 'Deposit to USDC Vault'}
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
