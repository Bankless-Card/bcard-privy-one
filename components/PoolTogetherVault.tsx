import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Contract, formatUnits, BrowserProvider, JsonRpcProvider } from 'ethers';

import styles from './PoolTogetherVault.module.css';


export default function PoolTogetherVault() {
	const { ready, authenticated, login } = usePrivy();
	const { wallets } = useWallets();

	const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
	const USDC_ABI = [
		"function balanceOf(address owner) view returns (uint256)"
	];
	const VAULT_ADDRESS = '0x119d2bc7bb9b94f5518ce30169457ff358b47535';
	// Combined ABI for deposit and withdraw operations
	const VAULT_ABI = [
		// deposit function
		{ "inputs": [
			{ "internalType": "uint256", "name": "_assets", "type": "uint256" },
			{ "internalType": "address", "name": "_receiver", "type": "address" }
		], "name": "deposit", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
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
		// totalDebt function
		{ "inputs": [], "name": "totalDebt", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
		// previewWithdraw function - returns shares needed for assets
		{ "inputs": [
			{ "internalType": "uint256", "name": "assets", "type": "uint256" }
		], "name": "previewWithdraw", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
	];

	// Shared balance state
	const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
	const [vaultBalance, setVaultBalance] = useState<number | null>(null);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);
	const [ethBalance, setEthBalance] = useState<number | null>(null);
	const [totalDebt, setTotalDebt] = useState<number | null>(null);

	// Deposit-specific state
	const [depositLoading, setDepositLoading] = useState(false);
	const [depositError, setDepositError] = useState<string | null>(null);
	const [depositSuccess, setDepositSuccess] = useState(false);
	const [depositStatus, setDepositStatus] = useState<string | null>(null);
	const [approvalLoading, setApprovalLoading] = useState(false);
	const [approvalSuccess, setApprovalSuccess] = useState(false);
	const [depositCountdown, setDepositCountdown] = useState<number>(0);
	const [depositCountdownMax, setDepositCountdownMax] = useState<number>(30);
	const [depositAmount, setDepositAmount] = useState<number>(0);

	// Withdraw-specific state
	const [withdrawLoading, setWithdrawLoading] = useState(false);
	const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
	const [withdrawError, setWithdrawError] = useState<string | null>(null);
	const [withdrawSuccess, setWithdrawSuccess] = useState(false);
	const [withdrawCountdown, setWithdrawCountdown] = useState<number>(0);
	const [withdrawCountdownMax, setWithdrawCountdownMax] = useState<number>(30);
	const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

	// Address copy state
	const [copied, setCopied] = useState(false);

	//useMemo provider and vault to debounce requests on component re-render
	const provider = useMemo(
	  () => new JsonRpcProvider('https://mainnet.base.org'),
	  []
	);

	const vault = useMemo(
	  () => new Contract(VAULT_ADDRESS, VAULT_ABI, provider),
	  [provider]
	);

	const DEBT_STORAGE_KEY = 'vault:totalDebt';
	const TTL_MS = 30_000;

	function getCachedDebt() {
		try {
			const raw = localStorage.getItem(DEBT_STORAGE_KEY);
			if (!raw) return null;

			const { value, ts } = JSON.parse(raw);
			if (Date.now() - ts > TTL_MS) return null;

			return value;
		} catch {
			return null;
		}
	}

	function setCachedDebt(value) {
		try {
			localStorage.setItem(
				DEBT_STORAGE_KEY,
				JSON.stringify({ value, ts: Date.now() })
			);
		} catch {
			// ignore quota / private mode errors
		}
	}

	useEffect(() => {
		if (!ready) return;

		//try cache first
		const cached = getCachedDebt();
		if (cached !== null) {
			setTotalDebt(cached);
			return;
		}

		//use cancelled var to avoid re-setting state on multiple runs
		let cancelled = false;

		(async () => {
			try {
				const debt = await vault.totalDebt.staticCall();
				const value = Number(formatUnits(debt, 6));

				if (!cancelled) {
					setTotalDebt(value);
					setCachedDebt(value);
				}
			} catch (err) {
				if (!cancelled) {
					console.error('Failed to fetch total debt:', err);
					setTotalDebt(0);
				}
			}
		})();

		//useEffect cleanup function
		return () => {
			cancelled = true;
		};
	}, [ready]);



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
			<div className={`${styles.vaultWidget} vaultWidget`}>
				<div className={`${styles.vaultBalance} vaultBalances`}>
					<div>
						Total Vault Deposits: {totalDebt === null ? 'Loading...' : `$${Number(totalDebt.toFixed(2)).toLocaleString('en-US')}`}
					</div>
					<strong>Log in to deposit.</strong>
				</div>
			</div>
		);
	}

	// Verify allowance after approval with retries for RPC sync
	async function verifyAllowanceWithRetry(
		usdcContract: Contract,
		ownerAddress: string,
		spenderAddress: string,
		requiredAmount: bigint,
		maxRetries: number = 8,
		delayMs: number = 3000
	): Promise<void> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const currentAllowance = await usdcContract.allowance(ownerAddress, spenderAddress);
			console.log(`🔍 Allowance verification attempt ${attempt}/${maxRetries}:`, {
				currentAllowance: currentAllowance.toString(),
				requiredAmount: requiredAmount.toString(),
				sufficient: currentAllowance >= requiredAmount
			});

			if (currentAllowance >= requiredAmount) {
				console.log('✅ Allowance verified successfully');
				// Add one final delay to ensure the state is fully propagated
				console.log('⏳ Final safety delay before deposit...');
				await new Promise(resolve => setTimeout(resolve, 2000));
				return;
			}

			if (attempt < maxRetries) {
				console.log(`⏳ Waiting ${delayMs}ms for RPC to sync...`);
				await new Promise(resolve => setTimeout(resolve, delayMs));
			}
		}

		throw new Error(
			'Allowance verification failed after approval. The approval succeeded on-chain, but RPC nodes are not synced yet. Please wait 15 seconds and try depositing again (approval is already done, so it will skip to deposit).'
		);
	}

	// Unified refresh balances with retries for RPC sync
	// direction: 'deposit' = USDC decreases, vault increases
	// direction: 'withdraw' = USDC increases, vault decreases
	async function refreshBalancesWithRetry(
		vaultContract: Contract,
		usdcContract: Contract,
		userAddress: string,
		previousUsdcBalance: number,
		changedAmount: number,
		direction: 'deposit' | 'withdraw',
		maxRetries: number = 5,
		delayMs: number = 2000
	): Promise<void> {
		const expectedUsdcBalance = direction === 'deposit'
			? previousUsdcBalance - changedAmount
			: previousUsdcBalance + changedAmount;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			console.log(`🔍 Balance refresh attempt ${attempt}/${maxRetries}...`);

			// Fetch new balances
			const newVaultBalance = await vaultContract.balanceOf(userAddress);
			const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));

			const newUsdcBalanceRaw = await usdcContract.balanceOf(userAddress);
			const newUsdcBalance = Number(formatUnits(newUsdcBalanceRaw, 6));

			const synced = direction === 'deposit'
				? newUsdcBalance <= expectedUsdcBalance
				: newUsdcBalance >= expectedUsdcBalance;

			console.log('Balance check:', {
				previousUsdc: previousUsdcBalance,
				newUsdc: newUsdcBalance,
				expectedUsdc: expectedUsdcBalance,
				newVault: newVaultBalanceNum,
				direction,
				synced
			});

			if (synced) {
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

		console.warn('⚠️ Balance sync timed out, but transaction succeeded. Refreshing balances with current values anyway.');
		// Even if we timeout, update with latest values
		const finalVaultBalance = await vaultContract.balanceOf(userAddress);
		const finalUsdcBalance = await usdcContract.balanceOf(userAddress);
		setVaultBalance(Number(formatUnits(finalVaultBalance, 6)));
		setUsdcBalance(Number(formatUnits(finalUsdcBalance, 6)));
	}

	async function handleDeposit(depositAmount?: number) {
		// Wrap everything in try-catch to ensure NO errors escape to Next.js error boundary
		try {
			setDepositLoading(true);
			setDepositError(null);
			setDepositSuccess(false);
			setDepositStatus('Depositing...');
			setDepositAmount(depositAmount);
			setDepositCountdown(0);
		try {
			const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
			if (!wallet) throw new Error('No wallet found');
			const privyProvider = await wallet.getEthereumProvider();
			const provider = new BrowserProvider(privyProvider);
			const signer = await provider.getSigner();
			const address = await signer.getAddress();
			const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
			// Use provided amount or default to full balance
			const amountToDeposit = depositAmount !== undefined ? depositAmount : usdcBalance!;
			const amount = BigInt(Math.floor(amountToDeposit * 1e6)); // USDC has 6 decimals

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
						setDepositCountdown(30);
						setDepositCountdownMax(30);
						const countdownInterval = setInterval(() => {
							setDepositCountdown(prev => Math.max(0, prev - 1));
						}, 1000);

						// Wrap approve call in a timeout Promise race
						const approvePromise = usdcERC20.approve(VAULT_ADDRESS, amount);
						const timeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('APPROVE_CALL_TIMEOUT')), 30000); // 30 second timeout
						});

						// Declare interval outside try block so it's accessible in catch
						let approvalCheckInterval: NodeJS.Timeout | null = null;
						let approveTx;

						try {
							// Start periodic allowance checks every 5 seconds
							const startPeriodicAllowanceCheck = () => {
								approvalCheckInterval = setInterval(async () => {
									if (typeof usdcERC20.allowance === 'function') {
										try {
											const currentAllowance = await usdcERC20.allowance(address, VAULT_ADDRESS);
											console.log('🔍 Periodic allowance check:', currentAllowance.toString(), 'Required:', amount.toString());

											if (currentAllowance >= amount) {
												console.log('✅ Approval detected via periodic check!');
												if (approvalCheckInterval) clearInterval(approvalCheckInterval);
												clearInterval(countdownInterval);
												setDepositCountdown(0);

												setApprovalSuccess(true);
												setDepositStatus('1Approval confirmed! Proceeding to deposit...');
												setApprovalLoading(false);
											}
										} catch (checkErr) {
											console.log('🔍 Allowance check error (will retry):', checkErr);
										}
									}
								}, 5000); // Check every 5 seconds
							};

							// Start periodic checks
							startPeriodicAllowanceCheck();

							approveTx = await Promise.race([approvePromise, timeoutPromise]);

							// If we got here, the promise resolved, so stop periodic checks
							if (approvalCheckInterval) clearInterval(approvalCheckInterval);

							clearInterval(countdownInterval);
							setDepositCountdown(0);
							console.log('Approve tx returned:', approveTx);
							console.log('Approve tx hash:', approveTx?.hash);
						} catch (timeoutErr: any) {
							// Clean up intervals
							if (approvalCheckInterval) clearInterval(approvalCheckInterval);
							clearInterval(countdownInterval);
							setDepositCountdown(0);

							if (timeoutErr.message === 'APPROVE_CALL_TIMEOUT') {
								console.warn('🟡 Approve call timed out, but transaction may still be pending. Checking allowance again...');
								// Wait a bit and check allowance again
								setDepositCountdown(3);
								setDepositCountdownMax(3);
								await new Promise(resolve => setTimeout(resolve, 3000));
								setDepositCountdown(0);
								if (typeof usdcERC20.allowance === 'function') {
									const newAllowance = await usdcERC20.allowance(address, VAULT_ADDRESS);
									console.log('New allowance after timeout:', newAllowance.toString());
									if (newAllowance >= amount) {
										console.log('Approval succeeded despite timeout!');
										// Verify the allowance before proceeding
										try {
											await verifyAllowanceWithRetry(usdcERC20, address, VAULT_ADDRESS, amount);
											setApprovalSuccess(true);
											setDepositStatus('2Approval confirmed! Proceeding to deposit...');
											setApprovalLoading(false);
											approveTx = null;
										} catch (verifyErr) {
											throw new Error('Approval succeeded but network sync is delayed. Please try again in 10 seconds.');
										}
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
							// Log detailed approval transaction metadata
							console.log('✅ Approval Transaction Sent:', {
								hash: approveTx.hash,
								from: approveTx.from,
								to: approveTx.to,
								value: approveTx.value?.toString(),
								gasLimit: approveTx.gasLimit?.toString(),
								gasPrice: approveTx.gasPrice?.toString(),
								maxFeePerGas: approveTx.maxFeePerGas?.toString(),
								maxPriorityFeePerGas: approveTx.maxPriorityFeePerGas?.toString(),
								nonce: approveTx.nonce,
								chainId: approveTx.chainId,
								type: approveTx.type,
								data: approveTx.data
							});

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
								console.log('⏳ Waiting for approval tx confirmation...');
								const receipt = await approveTx.wait();

								// Log detailed approval receipt metadata
								console.log('✅ Approval Transaction Confirmed:', {
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

								clearTimeout(approvalTimeout);
								setApprovalSuccess(true);
								setDepositStatus('3Approval confirmed! Proceeding to deposit...');
								console.log('Approval status set to confirmed');

								// Verify allowance is synced across RPC nodes before proceeding
								console.log('🔍 Verifying allowance is synced before deposit...');
								setDepositStatus('Verifying approval on network...');
								try {
									await verifyAllowanceWithRetry(usdcERC20, address, VAULT_ADDRESS, amount);
									setDepositStatus('Approval verified! Proceeding to deposit...');
								} catch (verifyErr: any) {
									console.error('Allowance verification failed:', verifyErr);
									setDepositStatus('Approval completed but network sync delayed. Please try again in a moment.');
									setApprovalLoading(false);
									setDepositLoading(false);
									throw verifyErr;
								}
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
					setDepositCountdown(0);
					setDepositStatus('Approval failed. Please check your wallet and try again.');
					throw approveErr;
				}
				setApprovalLoading(false);
				setDepositCountdown(0);
				console.log('Approval loading set to false');
			} else {
				setApprovalSuccess(false);
				setDepositStatus('USDC allowance sufficient, proceeding to deposit...');
				console.log('USDC allowance sufficient, skipping approval');
			}

			// Call deposit(_assets, _receiver)
			setDepositStatus('Sending deposit transaction...');
			console.log('🔵 Calling vault.deposit with:', { amount: amount.toString(), receiver: address });
			if (typeof vault.deposit === 'function') {
				try {
					console.log('🔵 About to call vault.deposit...');
					console.log('🔵 Vault contract address:', VAULT_ADDRESS);
					console.log('🔵 Deposit method exists:', typeof vault.deposit);

					// Declare variables so they're visible to both try/catch and post-try logic
					let balanceCheckInterval: NodeJS.Timeout | null = null;
					let depositCountdownInterval: NodeJS.Timeout | null = null;
					let depositTx: any = null;

					try {
						// Start countdown for deposit
						setDepositCountdown(30);
						setDepositCountdownMax(30);
						depositCountdownInterval = setInterval(() => {
							setDepositCountdown(prev => Math.max(0, prev - 1));
						}, 1000);

						// Wrap deposit call in a timeout Promise race
						console.log('🔵 Creating deposit promise...');
						const depositPromise = (async () => {
							return await vault.deposit(amount, address);
						  })();
						//const depositPromise = vault.deposit(amount, address);
						console.log('🔵 Deposit promise created:', depositPromise);
						console.log('🔵 Is it a Promise?', depositPromise instanceof Promise);

						const depositTimeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('DEPOSIT_CALL_TIMEOUT')), 30000); // 30 second timeout
						});

						console.log('🔵 Starting Promise.race for deposit...');

						// Start periodic balance checks every 5 seconds
						const startPeriodicBalanceCheck = () => {
							balanceCheckInterval = setInterval(async () => {
								if (typeof vault.balanceOf === 'function') {
									try {
										const currentVaultBalance = await vault.balanceOf(address);
										const currentVaultBalanceNum = Number(formatUnits(currentVaultBalance, 6));
										console.log('🔍 Periodic balance check:', currentVaultBalanceNum, 'Previous:', vaultBalance);

										if (currentVaultBalanceNum > (vaultBalance || 0)) {
											console.log('✅ Deposit detected via periodic check!');

											if (balanceCheckInterval) clearInterval(balanceCheckInterval);
											if (depositCountdownInterval) {
												clearInterval(depositCountdownInterval);
												depositCountdownInterval = null;
											}
											setDepositCountdown(0);

											// Update balances with retry logic
											setDepositStatus('Deposit successful! Updating balances...');
											const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
											try {
												await refreshBalancesWithRetry(vault, usdc, address, usdcBalance!, amountToDeposit, 'deposit', 5, 2000);
											} catch (balanceErr) {
												console.error('Balance refresh error:', balanceErr);
												// Fallback to direct update
												setVaultBalance(currentVaultBalanceNum);
												if (typeof usdc.balanceOf === 'function') {
													const balance = await usdc.balanceOf(address);
													setUsdcBalance(Number(formatUnits(balance, 6)));
												}
											}

											setDepositSuccess(true);
											setDepositStatus('Deposit successful!');
											setDepositLoading(false);

											setTimeout(() => {
												setDepositStatus(null);
											}, 5000);
										}
									} catch (checkErr) {
										console.log('🔍 Balance check error (will retry):', checkErr);
									}
								}
							}, 5000); // Check every 5 seconds
						};

						// Start periodic checks
						startPeriodicBalanceCheck();

						depositTx = await Promise.race([depositPromise, depositTimeoutPromise]);

						// If we got here, the promise resolved, so stop periodic checks
						if (balanceCheckInterval) clearInterval(balanceCheckInterval);

						console.log('🔵 Promise.race resolved!');
						if (depositCountdownInterval) {
							clearInterval(depositCountdownInterval);
							depositCountdownInterval = null;
						}
						setDepositCountdown(0);
						console.log('🔵 Deposit tx returned:', depositTx);
						console.log('🔵 Deposit tx hash:', depositTx?.hash);
						console.log('🔵 Deposit tx type:', typeof depositTx);
					} catch (timeoutErr: any) {
						console.log('🔴 Promise.race caught an error');
						console.log('🔴 Error type:', typeof timeoutErr);
						console.log('🔴 Error message:', timeoutErr?.message);
						console.log('🔴 Full error:', timeoutErr);

						// Clean up intervals
						if (balanceCheckInterval) clearInterval(balanceCheckInterval);
						if (depositCountdownInterval) {
							clearInterval(depositCountdownInterval);
							depositCountdownInterval = null;
						}
						setDepositCountdown(0);

						// Check if this is a contract revert (not a timeout)
						if (timeoutErr.message !== 'DEPOSIT_CALL_TIMEOUT') {
							console.error('🔴 Deposit call failed with error (not timeout):', timeoutErr);
							let errorMsg = 'Deposit transaction failed';
							if (timeoutErr.reason) {
								errorMsg = `Deposit failed: ${timeoutErr.reason}`;
							} else if (timeoutErr.message) {
								errorMsg = `Deposit failed: ${timeoutErr.message}`;
							}
							setDepositStatus(errorMsg);
							setDepositLoading(false);
							setDepositCountdown(0);
							throw timeoutErr;
						}

						// Handle timeout case
						if (timeoutErr.message === 'DEPOSIT_CALL_TIMEOUT') {
							console.warn('🟡 Deposit call timed out, but transaction may still be pending. Checking vault balance...');
							// Wait a bit and check vault balance to see if deposit succeeded
							setDepositCountdown(5);
							setDepositCountdownMax(5);
							setDepositStatus('Transaction timed out. Checking if it succeeded on-chain...');
							await new Promise(resolve => setTimeout(resolve, 5000));
							setDepositCountdown(0);
							if (typeof vault.balanceOf === 'function') {
								const newVaultBalance = await vault.balanceOf(address);
								const newVaultBalanceNum = Number(formatUnits(newVaultBalance, 6));
								console.log('Vault balance after timeout:', newVaultBalanceNum, 'Previous:', vaultBalance);
								if (newVaultBalanceNum > (vaultBalance || 0)) {
									console.log('Deposit succeeded despite timeout!');
									// Update USDC balance with retry logic
									setDepositStatus('Deposit successful! Updating balances...');
									const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
									try {
										await refreshBalancesWithRetry(vault, usdc, address, usdcBalance!, amountToDeposit, 'deposit', 5, 2000);
									} catch (balanceErr) {
										console.error('Balance refresh error:', balanceErr);
										// Fallback to direct update
										setVaultBalance(newVaultBalanceNum);
										if (typeof usdc.balanceOf === 'function') {
											const balance = await usdc.balanceOf(address);
											setUsdcBalance(Number(formatUnits(balance, 6)));
										}
									}
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
									// Transaction timed out and balance didn't increase
									console.warn('Deposit transaction timed out and balance did not increase');
									setDepositStatus('Transaction timed out. Please check your wallet or BaseScan to verify the transaction status.');
									setDepositLoading(false);
									setDepositCountdown(0);
									return; // Exit the function gracefully
								}
							} else {
								console.error('Cannot verify deposit status - balanceOf not available');
								setDepositStatus('Cannot verify deposit status. Please check your wallet or BaseScan.');
								setDepositLoading(false);
								setDepositCountdown(0);
								return; // Exit the function gracefully
							}
						}
					}

					if (depositTx) {
						// Log detailed transaction metadata
						console.log('✅ Deposit Transaction Sent:', {
							hash: depositTx.hash,
							from: depositTx.from,
							to: depositTx.to,
							value: depositTx.value?.toString(),
							gasLimit: depositTx.gasLimit?.toString(),
							gasPrice: depositTx.gasPrice?.toString(),
							maxFeePerGas: depositTx.maxFeePerGas?.toString(),
							maxPriorityFeePerGas: depositTx.maxPriorityFeePerGas?.toString(),
							nonce: depositTx.nonce,
							chainId: depositTx.chainId,
							type: depositTx.type,
							data: depositTx.data
						});

						setDepositStatus('Deposit transaction sent. Waiting for confirmation...');
						// Show BaseScan link as plain string if available
						if (depositTx.hash) {
							setDepositStatus(
								`Deposit transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${depositTx.hash}`
							);
						}
						console.log('⏳ Waiting for deposit tx confirmation...');
						let receipt;
						try {
							receipt = await depositTx.wait();
						} catch (waitError: any) {
							console.error('❌ Deposit transaction failed:', waitError);
							setDepositCountdown(0);
							setDepositLoading(false);

							// Check if it's a revert
							if (waitError.receipt && waitError.receipt.status === 0) {
								setDepositError('Deposit transaction reverted. This may be due to RPC synchronization delays. The approval is complete - please wait 15 seconds and try depositing again (it will skip the approval step).');
								setDepositStatus('Deposit failed. Please try again.');
								return;
							}

							// Handle other errors
							const errorMsg = waitError.message || waitError.reason || 'Deposit transaction failed';
							setDepositError(errorMsg);
							setDepositStatus('Deposit transaction failed.');
							return;
						}

						// Log detailed receipt metadata
						console.log('✅ Deposit Transaction Confirmed:', {
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
						setDepositSuccess(true);
						setDepositStatus('Deposit successful! Updating balances...');
						console.log('Deposit status set to successful');
						// Update vault balance and USDC balance with retry logic
						const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
						try {
							await refreshBalancesWithRetry(vault, usdc, address, usdcBalance!, amountToDeposit, 'deposit', 5, 2000);
							setDepositStatus('Deposit successful!');
						} catch (balanceErr) {
							console.error('Balance refresh error:', balanceErr);
							setDepositStatus('Deposit successful! (Balances may take a moment to update)');
						}
						// Reset status after 5 seconds
						setTimeout(() => {
							console.log('Clearing deposit status after timeout');
							setDepositStatus(null);
						}, 5000);
					}
				} catch (depositErr) {
					console.error('Deposit transaction error:', depositErr);
					setDepositCountdown(0);
					setDepositLoading(false);

					const errorMsg = (depositErr as any).message || 'Deposit transaction failed or rejected.';
					setDepositError(errorMsg);
					setDepositStatus(errorMsg);
					return;
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
			// Handle transaction execution reverted
			if (errorMsg.includes('transaction execution reverted') || errorMsg.includes('transaction failed')) {
				errorMsg = 'Deposit transaction failed. This may be due to insufficient allowance or RPC sync delays. Please wait 15 seconds and try again.';
			}
			setDepositError(errorMsg);
			setDepositStatus(errorMsg);
		} finally {
			setDepositLoading(false);
			setDepositAmount(0);
			setDepositCountdown(0);
		}
		} catch (topLevelError: any) {
			// This is the nuclear option - catch ANY error that escaped inner handlers
			console.error('🚨 Top-level error handler caught error:', topLevelError);
			const errorMsg = topLevelError?.message || topLevelError?.reason || 'An unexpected error occurred';
			setDepositError('Deposit failed. Please try again. ' + errorMsg);
			setDepositStatus('Deposit failed.');
			setDepositLoading(false);
			setDepositCountdown(0);
			// Do NOT re-throw - this ensures the Promise resolves, not rejects
		}
	}

	async function handleWithdraw(withdrawAmt?: number) {
		// Wrap everything in try-catch to ensure NO errors escape to Next.js error boundary
		try {
			setWithdrawLoading(true);
			setWithdrawStatus('Preparing withdrawal...');
			setWithdrawError(null);
			setWithdrawSuccess(false);
			setWithdrawCountdown(0);
			setWithdrawAmount(withdrawAmt);
		try {
			const wallet = wallets && wallets.length > 0 ? wallets[0] : null;
			if (!wallet) throw new Error('No wallet found');
			const privyProvider = await wallet.getEthereumProvider();
			const provider = new BrowserProvider(privyProvider);
			const signer = await provider.getSigner();
			const address = await signer.getAddress();
			const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
			// Use provided amount or default to full balance (1 USDC for testing)
			const amountToWithdraw = withdrawAmt !== undefined ? withdrawAmt : (vaultBalance || 1);
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
					setWithdrawCountdown(30);
					setWithdrawCountdownMax(30);
					const withdrawCountdownInterval = setInterval(() => {
						setWithdrawCountdown(prev => Math.max(0, prev - 1));
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
											setWithdrawCountdown(0);

											// Update balances with retry logic
											setWithdrawStatus('Withdraw successful! Updating balances...');
											const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
											try {
												await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 'withdraw', 5, 2000);
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
						setWithdrawCountdown(0);
						console.log('Withdraw tx returned:', withdrawTx);
						console.log('Withdraw tx hash:', withdrawTx?.hash);
					} catch (timeoutErr: any) {
						// Clean up intervals
						if (balanceCheckInterval) clearInterval(balanceCheckInterval);
						clearInterval(withdrawCountdownInterval);
						setWithdrawCountdown(0);

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
							setWithdrawCountdown(0);
							throw timeoutErr;
						}

						// Handle timeout case
						if (timeoutErr.message === 'WITHDRAW_CALL_TIMEOUT') {
							console.warn('Withdraw call timed out, but transaction may still be pending. Checking vault balance...');
							// Wait a bit and check vault balance to see if withdraw succeeded
							setWithdrawCountdown(5);
							setWithdrawCountdownMax(5);
							setWithdrawStatus('Transaction timed out. Checking if it succeeded on-chain...');
							await new Promise(resolve => setTimeout(resolve, 5000));
							setWithdrawCountdown(0);
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
										await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 'withdraw', 5, 2000);
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
									setWithdrawCountdown(0);
									return; // Exit the function gracefully
								}
							} else {
								console.error('Cannot verify withdraw status - balanceOf not available');
								setWithdrawStatus('Cannot verify withdraw status. Please check your wallet or BaseScan.');
								setWithdrawLoading(false);
								setWithdrawCountdown(0);
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
							await refreshBalancesWithRetry(vault, usdc, address, usdcBalance || 0, amountToWithdraw, 'withdraw', 5, 2000);
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
					setWithdrawCountdown(0);
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
			setWithdrawCountdown(0);
		}
		} catch (topLevelError: any) {
			// This is the nuclear option - catch ANY error that escaped inner handlers
			console.error('🚨 Top-level error handler caught error:', topLevelError);
			const errorMsg = topLevelError?.message || topLevelError?.reason || 'An unexpected error occurred';
			setWithdrawError('Withdraw failed. Please try again. ' + errorMsg);
			setWithdrawStatus('Withdraw failed.');
			setWithdrawLoading(false);
			setWithdrawCountdown(0);
			// Do NOT re-throw - this ensures the Promise resolves, not rejects
		}
	}

	function truncateAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	async function copyAddressToClipboard() {
		if (walletAddress) {
			await navigator.clipboard.writeText(walletAddress);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	return (
		<div className={`${styles.vaultWidget} vaultWidget`}>

			<div className={`${styles.vaultBalance} vaultBalances`}>
				<div>
					Total Vault Deposits: {totalDebt === null ? 'Loading...' : `$${Number(totalDebt.toFixed(2)).toLocaleString('en-US')}`}
				</div>
			</div>

			<div className={`${styles.balances} balances`}>
				<strong>You have...</strong>
				<div className={`${styles.tokenBalance} tokenBalance`}>{vaultBalance === null ? 'Loading...' : `$${Number(vaultBalance.toFixed(2)).toLocaleString('en-US')}`} deposited</div>
				<div className={`${styles.tokenBalance} tokenBalance`}>{usdcBalance === null ? 'Loading...' : `$${Number(usdcBalance.toFixed(2)).toLocaleString('en-US')}`} available to deposit</div>
			</div>

			{usdcBalance !== null && usdcBalance > 0 && ethBalance !== null && ethBalance > 0 && (
				<div className={`${styles.vaultButtons} vaultButtons`}>
					{/* Always show $1 button if balance >= $1 */}
					{usdcBalance >= 1 && (
						<button
							onClick={() => handleDeposit(1).catch(err => {
								// Error already handled in handleDeposit, this just prevents unhandled promise rejection
								console.error('Deposit error caught at handler level:', err);
							})}
							disabled={depositLoading || approvalLoading}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5em',
								padding: '0.75em 1em',
								borderRadius: '8px',
								border: '1px solid #fff',
								background: '#D85AB0',
								color: 'white',
								cursor: depositLoading || approvalLoading ? 'not-allowed' : 'pointer',
								fontWeight: 'bold',
								fontSize: '0.95em',
								opacity: depositLoading || approvalLoading ? 0.6 : 1
							}}
						>
							{depositLoading ? ('Depositing...') : <>
								Deposit $1
								<span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
									<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M5 8L10 13L15 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</span>
							</>}
						</button>
					)}

					{/* Show $5 button if balance >= $5 */}
					{usdcBalance >= 5 && (
						<button
							onClick={() => handleDeposit(5).catch(err => {
								// Error already handled in handleDeposit, this just prevents unhandled promise rejection
								console.error('Deposit error caught at handler level:', err);
							})}
							disabled={depositLoading || approvalLoading}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5em',
								padding: '0.75em 1em',
								borderRadius: '8px',
								border: '1px solid #ddd',
								background: '#D85AB0',
								color: 'white',
								cursor: depositLoading || approvalLoading ? 'not-allowed' : 'pointer',
								fontWeight: 'bold',
								fontSize: '0.95em',
								opacity: depositLoading || approvalLoading ? 0.6 : 1
							}}
						>
							{depositLoading ? ('Depositing...') : <>
								Deposit $5
								<span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
									<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M5 8L10 13L15 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</span>
							</>}
						</button>
					)}

					{/* Show $20 button if balance >= $20 */}
					{usdcBalance >= 20 && (
						<button
							onClick={() => handleDeposit(20).catch(err => {
								// Error already handled in handleDeposit, this just prevents unhandled promise rejection
								console.error('Deposit error caught at handler level:', err);
							})}
							disabled={depositLoading || approvalLoading}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5em',
								padding: '0.75em 1em',
								borderRadius: '8px',
								border: '1px solid #ddd',
								background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
								color: 'white',
								cursor: depositLoading || approvalLoading ? 'not-allowed' : 'pointer',
								fontWeight: 'bold',
								fontSize: '0.95em',
								opacity: depositLoading || approvalLoading ? 0.6 : 1
							}}
						>
							{depositLoading ? ('Depositing...') : <>
								Deposit $20
								<span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
									<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M5 8L10 13L15 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</span>
							</>}
						</button>
					)}
				</div>
			)}

			<div className={`${styles.txDetails} txDetails`}>

			{ (depositLoading || depositError || depositSuccess) && (
				<div className={`${styles.txStatus} txStatus`}>
					{ depositLoading &&  (
					<div className={`${styles.txGoal} txGoal`}>
						Depositing ${depositAmount}...
					</div>
					)}
					<div className={`${styles.txProgress} txProgress`}>
						{/* Countdown Timer with Pie Chart */}
						{ depositCountdown > 0  && (
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
										strokeDashoffset={`${2 * Math.PI * 18 * (1 - depositCountdown / depositCountdownMax)}`}
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
										{depositCountdown}s
									</text>
								</svg>
							</div>
						)}
						{ (!depositSuccess && depositStatus) && (depositStatus) }
						{ depositSuccess && (<div className={`${styles.txSuccess} txSuccess`}>Deposit successful!</div>) }
					</div>
				</div>
			)}

			{ (approvalLoading || approvalSuccess) && !depositSuccess && (
				<ol>
					<li>Approve tokens for deposit {approvalLoading&&"⏳"}{(approvalSuccess||depositSuccess)&&"✅"}</li>
					<li>Deposit tokens {(approvalSuccess&&!depositSuccess)&&"⏳"}{depositSuccess&&"✅"}</li>
				</ol>
			)}


			</div>

			{/* Withdraw Section - only show if user has vault balance */}
			{vaultBalance !== null && vaultBalance > 0 && (
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
								{ withdrawCountdown > 0  && (
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
												strokeDashoffset={`${2 * Math.PI * 18 * (1 - withdrawCountdown / withdrawCountdownMax)}`}
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
												{withdrawCountdown}s
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
						{vaultBalance >= 1 && (
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
						{vaultBalance > 0 && (
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
			)}

			<div className={`${styles.technicalDetails} technicalDetails`}>
				<strong>Technical details:</strong>
				<ul>
					<li>All deposits on BASE chain</li>
					<li>Your ETH balance on Base: {ethBalance === null ? 'Loading...' : ethBalance.toFixed(8)}</li>
					<li>Wallet Address: {walletAddress
						? (
							<span
								onClick={copyAddressToClipboard}
								style={{ cursor: 'pointer' }}
								title={`Click to copy: ${walletAddress}`}
							>
								{truncateAddress(walletAddress)}
								{copied ? (
									<span style={{ marginLeft: '0.5em', color: '#4CAF50' }}>Copied!</span>
								) : (
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										style={{ marginLeft: '0.5em', verticalAlign: 'middle' }}
									>
										<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
										<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
									</svg>
								)}
							</span>
						)
						: wallets && wallets.length === 0
							? 'No wallet connected'
							: 'Loading...'}
					</li>
				</ul>
			</div>
		</div>
	);
}
