import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

import Withdraw from './Withdraw';


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
	const [countdown, setCountdown] = useState<number>(0);
	const [countdownMax, setCountdownMax] = useState<number>(30);

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
		setCountdown(0);
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

			// Check USDC allowance and approve if needed
			const usdcERC20 = new Contract(USDC_ADDRESS, [
				"function allowance(address owner, address spender) view returns (uint256)",
				"function approve(address spender, uint256 amount) returns (bool)"
			], signer);
			let allowance = BigInt(0);
			if (typeof usdcERC20.allowance === 'function') {
				allowance = await usdcERC20.allowance(address, VAULT_ADDRESS);
				console.log('USDC allowance for vault:', allowance.toString());
			}
			if (allowance < amount) {
				setApprovalLoading(true);
				setDepositStatus('Requesting approval from wallet...');
				console.log('USDC allowance insufficient, approving...', {
					currentAllowance: allowance.toString(),
					requiredAmount: amount.toString()
				});
				try {
					if (typeof usdcERC20.approve === 'function') {
						console.log('About to call usdcERC20.approve...');
						
						// Start countdown for approval
						setCountdown(30);
						setCountdownMax(30);
						const countdownInterval = setInterval(() => {
							setCountdown(prev => Math.max(0, prev - 1));
						}, 1000);
						
						// Wrap approve call in a timeout Promise race
						const approvePromise = usdcERC20.approve(VAULT_ADDRESS, amount);
						const timeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('APPROVE_CALL_TIMEOUT')), 30000); // 30 second timeout
						});
						
						let approveTx;
						try {
							approveTx = await Promise.race([approvePromise, timeoutPromise]);
							clearInterval(countdownInterval);
							setCountdown(0);
							console.log('Approve tx returned:', approveTx);
							console.log('Approve tx hash:', approveTx?.hash);
						} catch (timeoutErr: any) {
							clearInterval(countdownInterval);
							setCountdown(0);
							if (timeoutErr.message === 'APPROVE_CALL_TIMEOUT') {
								console.warn('Approve call timed out, but transaction may still be pending. Checking allowance again...');
								// Wait a bit and check allowance again
								setCountdown(3);
								setCountdownMax(3);
								await new Promise(resolve => setTimeout(resolve, 3000));
								setCountdown(0);
								if (typeof usdcERC20.allowance === 'function') {
									const newAllowance = await usdcERC20.allowance(address, VAULT_ADDRESS);
									console.log('New allowance after timeout:', newAllowance.toString());
									if (newAllowance >= amount) {
										console.log('Approval succeeded despite timeout!');
										setApprovalSuccess(true);
										setDepositStatus('Approval confirmed! Proceeding to deposit...');
										setApprovalLoading(false);
										// Skip the rest of approval flow
										approveTx = null;
									} else {
										throw new Error('Approval transaction call timed out. Please try again or check your wallet.');
									}
								} else {
									throw new Error('Cannot verify approval status. Please try again.');
								}
							} else {
								throw timeoutErr;
							}
						}
						
						if (approveTx) {
							console.log('Approve tx hash:', approveTx?.hash);
							
							// Show BaseScan link as plain string if available
							if (approveTx.hash) {
								const statusMsg = `Approval transaction sent!\nView on BaseScan: https://basescan.org/tx/${approveTx.hash}\n\nWaiting for confirmation...`;
								setDepositStatus(statusMsg);
								console.log('Approval status updated with BaseScan link');
							} else {
								setDepositStatus('Approval transaction sent. Waiting for confirmation...');
								console.log('Approval status updated (no hash)');
							}
							
							// Add a timeout in case the tx is stuck
							const approvalTimeout = setTimeout(() => {
								console.log('Approval timeout reached (2 minutes)');
								setApprovalLoading(false);
								setDepositStatus('Approval taking longer than expected. Please check your wallet or block explorer.');
							}, 120000); // 2 minutes
							
							try {
								console.log('About to wait for approval tx confirmation...');
								const receipt = await approveTx.wait();
								console.log('Approval tx confirmed, receipt:', receipt);
								clearTimeout(approvalTimeout);
								setApprovalSuccess(true);
								setDepositStatus('Approval confirmed! Proceeding to deposit...');
								console.log('Approval status set to confirmed');
							} catch (waitErr) {
								console.error('Approval wait error:', waitErr);
								clearTimeout(approvalTimeout);
								setDepositStatus('Approval failed or rejected. Please try again.');
								setApprovalLoading(false);
								throw waitErr;
							}
						}
					} else {
						setApprovalLoading(false);
						throw new Error('USDC approve method not available');
					}
				} catch (approveErr) {
					console.error('Approval error:', approveErr);
					setApprovalLoading(false);
					setCountdown(0);
					setDepositStatus('Approval failed. Please check your wallet and try again.');
					throw approveErr;
				}
				setApprovalLoading(false);
				setCountdown(0);
				console.log('Approval loading set to false');
			} else {
				setApprovalSuccess(false);
				setDepositStatus('USDC allowance sufficient, proceeding to deposit...');
				console.log('USDC allowance sufficient, skipping approval');
			}

			// Call deposit(_assets, _receiver)
			setDepositStatus('Sending deposit transaction...');
			console.log('Calling vault.deposit with:', { amount: amount.toString(), receiver: address });
			if (typeof vault.deposit === 'function') {
				try {
					console.log('About to call vault.deposit...');
					
					// Start countdown for deposit
					setCountdown(30);
					setCountdownMax(30);
					const depositCountdownInterval = setInterval(() => {
						setCountdown(prev => Math.max(0, prev - 1));
					}, 1000);
					
					// Wrap deposit call in a timeout Promise race
					const depositPromise = vault.deposit(amount, address);
					const depositTimeoutPromise = new Promise((_, reject) => {
						setTimeout(() => reject(new Error('DEPOSIT_CALL_TIMEOUT')), 30000); // 30 second timeout
					});
					
					let depositTx;
					try {
						depositTx = await Promise.race([depositPromise, depositTimeoutPromise]);
						clearInterval(depositCountdownInterval);
						setCountdown(0);
						console.log('Deposit tx returned:', depositTx);
						console.log('Deposit tx hash:', depositTx?.hash);
					} catch (timeoutErr: any) {
						clearInterval(depositCountdownInterval);
						setCountdown(0);
						if (timeoutErr.message === 'DEPOSIT_CALL_TIMEOUT') {
							console.warn('Deposit call timed out, but transaction may still be pending. Checking vault balance...');
							// Wait a bit and check vault balance to see if deposit succeeded
							setCountdown(5);
							setCountdownMax(5);
							await new Promise(resolve => setTimeout(resolve, 5000));
							setCountdown(0);
							if (typeof vault.balanceOf === 'function') {
								const newVaultBalance = await vault.balanceOf(address);
								const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));
								console.log('Vault balance after timeout:', newVaultBalanceNum, 'Previous:', vaultBalance);
								if (newVaultBalanceNum > (vaultBalance || 0)) {
									console.log('Deposit succeeded despite timeout!');
									setVaultBalance(newVaultBalanceNum);
									setDepositSuccess(true);
									setDepositStatus('Deposit successful!');
									console.log('Deposit status set to successful');
									// Reset status after 5 seconds
									setTimeout(() => {
										console.log('Clearing deposit status after timeout');
										setDepositStatus(null);
									}, 5000);
									// Skip the rest of deposit flow
									depositTx = null;
								} else {
									throw new Error('Deposit transaction call timed out. Please check your wallet or BaseScan to verify the transaction.');
								}
							} else {
								throw new Error('Cannot verify deposit status. Please check your wallet or BaseScan.');
							}
						} else {
							throw timeoutErr;
						}
					}
					
					if (depositTx) {
						console.log('Deposit tx hash:', depositTx?.hash);
						setDepositStatus('Deposit transaction sent. Waiting for confirmation...');
						// Show BaseScan link as plain string if available
						if (depositTx.hash) {
							setDepositStatus(
								`Deposit transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${depositTx.hash}`
							);
						}
						console.log('About to wait for deposit tx confirmation...');
						const receipt = await depositTx.wait();
						console.log('Deposit tx confirmed, receipt:', receipt);
						setDepositSuccess(true);
						setDepositStatus('Deposit successful!');
						console.log('Deposit status set to successful');
						// Update vault balance and USDC balance
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
						// Reset status after 5 seconds
						setTimeout(() => {
							console.log('Clearing deposit status after timeout');
							setDepositStatus(null);
						}, 5000);
					}
				} catch (depositErr) {
					console.error('Deposit transaction error:', depositErr);
					setCountdown(0);
					setDepositStatus('Deposit transaction failed or rejected.');
					throw depositErr;
				}
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
			setCountdown(0);
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
			<p><strong>Interact with USDC Vault</strong></p>
			<div>Your ETH balance on Base: {ethBalance === null ? 'Loading...' : ethBalance}</div>
			<div>Your USDC balance on Base: {usdcBalance === null ? 'Loading...' : usdcBalance}</div>
			<div>Your Vault balance: {vaultBalance === null ? 'Loading...' : vaultBalance}</div>
			
			{usdcBalance !== null && usdcBalance > 0 && ethBalance !== null && ethBalance > 0 && (
				<button onClick={handleDeposit} disabled={depositLoading || approvalLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
					{depositLoading ? (depositStatus || 'Depositing...') : <>
						Deposit to USDC Vault
						<span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
							{/* Down arrow SVG icon */}
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M5 8L10 13L15 8" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</span>
					</>
					}
				</button>
			)}

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
					<span style={{ color: '#666', fontSize: '0.9em' }}>Processing transaction...</span>
				</div>
			)}

			{approvalLoading && <div style={{ color: '#888' }}>Approving tokens for deposit...</div>}
			{approvalSuccess && <div style={{ color: 'green' }}>Approval successful!</div>}
			{depositStatus && <div style={{ color: depositSuccess ? 'green' : 'red', whiteSpace: 'pre-line' }}>{depositStatus}</div>}
			{depositSuccess && !depositStatus && (
				<div style={{ color: 'green' }}>Deposit successful!</div>
			)}

			{vaultBalance !== null && vaultBalance !== 0 && (
				<Withdraw />
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
