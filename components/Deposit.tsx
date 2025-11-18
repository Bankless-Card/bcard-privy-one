import { usePrivy, useWallets } from '@privy-io/react-auth';
import React, { useEffect, useState } from 'react';
import { Contract, formatUnits, BrowserProvider } from 'ethers';

import styles from './Deposit.module.css';
import Withdraw from './Withdraw';
import Button from './Button';


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

	async function handleApproval(
		usdcErc20Contract: Contract,
		vaultAddress: string,
		userAddress: string,
		amount: bigint,
		countdownIntervalSetter: (interval: NodeJS.Timeout) => void
	) {
		setApprovalLoading(true);
		setDepositStatus('Requesting approval from wallet...');
		console.log('USDC allowance insufficient, approving...', {
			currentAllowance: (await usdcErc20Contract.allowance(userAddress, vaultAddress)).toString(),
			requiredAmount: amount.toString(),
		});

		try {
			if (typeof usdcErc20Contract.approve !== 'function') {
				throw new Error('USDC approve method not available');
			}

			console.log('About to call usdcErc20Contract.approve...');
			setCountdown(30);
			setCountdownMax(30);
			const countdownInterval = setInterval(() => {
				setCountdown(prev => Math.max(0, prev - 1));
			}, 1000);
			countdownIntervalSetter(countdownInterval);

			const approvePromise = usdcErc20Contract.approve(vaultAddress, amount);
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('APPROVE_CALL_TIMEOUT')), 30000);
			});

			let approvalCheckInterval: NodeJS.Timeout | null = null;
			let approveTx;

			try {
				const startPeriodicAllowanceCheck = () => {
					approvalCheckInterval = setInterval(async () => {
						if (typeof usdcErc20Contract.allowance === 'function') {
							try {
								const currentAllowance = await usdcErc20Contract.allowance(userAddress, vaultAddress);
								if (currentAllowance >= amount) {
									if (approvalCheckInterval) clearInterval(approvalCheckInterval);
									clearInterval(countdownInterval);
									setCountdown(0);
									setApprovalSuccess(true);
									setDepositStatus('Approval confirmed! Proceeding to deposit...');
									setApprovalLoading(false);
								}
							} catch (checkErr) {
								console.log('🔍 Allowance check error (will retry):', checkErr);
							}
						}
					}, 5000);
				};
				startPeriodicAllowanceCheck();

				approveTx = await Promise.race([approvePromise, timeoutPromise]);

				if (approvalCheckInterval) clearInterval(approvalCheckInterval);
				clearInterval(countdownInterval);
				setCountdown(0);

			} catch (timeoutErr: any) {
				if (approvalCheckInterval) clearInterval(approvalCheckInterval);
				clearInterval(countdownInterval);
				setCountdown(0);

				if (timeoutErr.message === 'APPROVE_CALL_TIMEOUT') {
					console.warn('🟡 Approve call timed out, but transaction may still be pending. Checking allowance again...');
					await new Promise(resolve => setTimeout(resolve, 3000));
					const newAllowance = await usdcErc20Contract.allowance(userAddress, vaultAddress);
					if (newAllowance >= amount) {
						setApprovalSuccess(true);
						setDepositStatus('Approval confirmed! Proceeding to deposit...');
						setApprovalLoading(false);
						approveTx = null;
					} else {
						throw new Error('Approval transaction call timed out. Please try again or check your wallet.');
					}
				} else {
					throw timeoutErr;
				}
			}

			if (approveTx) {
				setDepositStatus(`Approval transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${approveTx.hash}`);
				const receipt = await approveTx.wait();
				if (receipt.status === 0) throw new Error('Approval transaction failed.');
				setApprovalSuccess(true);
				setDepositStatus('Approval confirmed! Proceeding to deposit...');
			}
			return true;
		} catch (err: any) {
			console.error('Approval error:', err);
			let errorMsg = 'Approval failed. Please check your wallet and try again.';
			if (err.reason) errorMsg = err.reason;
			else if (err.message) errorMsg = err.message;
			if (errorMsg.includes('insufficient funds')) {
				errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
			}
			setDepositStatus(errorMsg);
			setDepositError(errorMsg);
			return false;
		} finally {
			setApprovalLoading(false);
			setCountdown(0);
		}
	}

	async function executeDeposit(
		vaultContract: Contract,
		usdcContract: Contract,
		provider: BrowserProvider,
		userAddress: string,
		amount: bigint,
		countdownIntervalSetter: (interval: NodeJS.Timeout) => void
	) {
		setDepositStatus('Sending deposit transaction...');
		try {
			if (typeof vaultContract.deposit !== 'function') {
				throw new Error('Vault deposit method not available');
			}

			setCountdown(30);
			setCountdownMax(30);
			const depositCountdownInterval = setInterval(() => {
				setCountdown(prev => Math.max(0, prev - 1));
			}, 1000);
			countdownIntervalSetter(depositCountdownInterval);

			const depositPromise = vaultContract.deposit(amount, userAddress);
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('DEPOSIT_CALL_TIMEOUT')), 30000);
			});

			let balanceCheckInterval: NodeJS.Timeout | null = null;
			let depositTx;

			const initialVaultBalance = await vaultContract.balanceOf(userAddress);

			try {
				const startPeriodicBalanceCheck = () => {
					balanceCheckInterval = setInterval(async () => {
						const currentVaultBalance = await vaultContract.balanceOf(userAddress);
						if (currentVaultBalance > initialVaultBalance) {
							if (balanceCheckInterval) clearInterval(balanceCheckInterval);
							clearInterval(depositCountdownInterval);
							setCountdown(0);
							setDepositSuccess(true);
							setDepositStatus('Deposit successful!');
							const newUsdcBalance = await usdcContract.balanceOf(userAddress);
							setUsdcBalance(Number(formatUnits(newUsdcBalance, 6)));
							setVaultBalance(Number(formatUnits(currentVaultBalance, 6)));
							setTimeout(() => setDepositStatus(null), 5000);
						}
					}, 5000);
				};
				startPeriodicBalanceCheck();

				depositTx = await Promise.race([depositPromise, timeoutPromise]);

				if (balanceCheckInterval) clearInterval(balanceCheckInterval);
				clearInterval(depositCountdownInterval);
				setCountdown(0);

			} catch (timeoutErr: any) {
				if (balanceCheckInterval) clearInterval(balanceCheckInterval);
				clearInterval(depositCountdownInterval);
				setCountdown(0);

				if (timeoutErr.message === 'DEPOSIT_CALL_TIMEOUT') {
					await new Promise(resolve => setTimeout(resolve, 5000));
					const newVaultBalance = await vaultContract.balanceOf(userAddress);
					if (newVaultBalance > initialVaultBalance) {
						setDepositSuccess(true);
						setDepositStatus('Deposit successful!');
						const newUsdcBalance = await usdcContract.balanceOf(userAddress);
						setUsdcBalance(Number(formatUnits(newUsdcBalance, 6)));
						setVaultBalance(Number(formatUnits(newVaultBalance, 6)));
						setTimeout(() => setDepositStatus(null), 5000);
						depositTx = null;
					} else {
						throw new Error('Deposit transaction timed out. Please check your wallet or BaseScan.');
					}
				} else {
					throw timeoutErr;
				}
			}

			if (depositTx) {
				setDepositStatus(`Deposit transaction sent. Waiting for confirmation...\nView on BaseScan: https://basescan.org/tx/${depositTx.hash}`);
				const receipt = await depositTx.wait();
				if (receipt.status === 0) throw new Error('Deposit transaction failed');
				setDepositSuccess(true);
				setDepositStatus('Deposit successful!');
				const newVaultBalance = await vaultContract.balanceOf(userAddress);
				const newUsdcBalance = await usdcContract.balanceOf(userAddress);
				setVaultBalance(Number(formatUnits(newVaultBalance, 6)));
				setUsdcBalance(Number(formatUnits(newUsdcBalance, 6)));
				setTimeout(() => setDepositStatus(null), 5000);
			}
			return true;
		} catch (err: any) {
			console.error('Deposit error:', err);
			let errorMsg = 'Deposit failed. Please check your wallet and try again.';
			if (err.reason) errorMsg = err.reason;
			else if (err.message) errorMsg = err.message;
			if (errorMsg.includes('insufficient funds')) {
				errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
			}
			setDepositStatus(errorMsg);
			setDepositError(errorMsg);
			return false;
		}
	}

	async function handleDepositInternal(depositAmount?: number) {
		setDepositLoading(true);
		setDepositError(null);
		setDepositSuccess(false);
		setDepositStatus('Depositing...');
		setCountdown(0);
		let countdownInterval: NodeJS.Timeout | null = null;
		const countdownIntervalSetter = (interval: NodeJS.Timeout) => {
			countdownInterval = interval;
		};

		try {
			const wallet = wallets?.[0];
			if (!wallet) throw new Error('No wallet found');

			const provider = new BrowserProvider(await wallet.getEthereumProvider());
			const signer = await provider.getSigner();
			const address = await signer.getAddress();

			const usdcERC20 = new Contract(USDC_ADDRESS, [
				"function allowance(address owner, address spender) view returns (uint256)",
				"function approve(address spender, uint256 amount) returns (bool)",
				"function balanceOf(address owner) view returns (uint256)"
			], signer);
			const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);

			const amountToDeposit = depositAmount !== undefined ? depositAmount : usdcBalance!;
			const amount = BigInt(Math.floor(amountToDeposit * 1e6));

			const allowance = await usdcERC20.allowance(address, VAULT_ADDRESS);
			if (allowance < amount) {
				const approvalSuccess = await handleApproval(usdcERC20, VAULT_ADDRESS, address, amount, countdownIntervalSetter);
				if (!approvalSuccess) return;
			} else {
				setDepositStatus('USDC allowance sufficient, proceeding to deposit...');
			}

			const depositSuccess = await executeDeposit(vault, usdcERC20, provider, address, amount, countdownIntervalSetter);
			if (!depositSuccess) return;

		} catch (err: any) {
			let errorMsg = 'Deposit failed';
			console.error('Deposit error:', err);
			if (err.message) errorMsg = err.message;
			else if (err.reason) errorMsg = err.reason;
			
			if (errorMsg.includes('insufficient funds')) {
				errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
			}
			setDepositError(errorMsg);
			setDepositStatus(errorMsg);
		} finally {
			if (countdownInterval) clearInterval(countdownInterval);
			setDepositLoading(false);
			setCountdown(0);
		}
	}

	// Wrapper function to ensure no errors escape to React's error boundary
	async function handleDeposit(depositAmount?: number) {
		try {
			await handleDepositInternal(depositAmount);
		} catch (error: any) {
			// This should never happen since handleDepositInternal handles all errors,
			// but this is a safety net to prevent unhandled runtime errors
			console.error('Unexpected error escaped from handleDepositInternal:', error);
			
			let errorMsg = 'An unexpected error occurred. Please try again.';
			if (error?.message?.includes('insufficient funds')) {
				errorMsg = 'Your wallet does not have enough ETH on Base to pay for gas. Please fund your wallet and try again.';
			}
			
			setDepositError(errorMsg);
			setDepositStatus(errorMsg);
			setDepositLoading(false);
			setApprovalLoading(false);
			setCountdown(0);
		}
	}


	return (
		<div className="vaultWidget">
			<div className={`${styles.balances} balances`}>
				<strong>You have...</strong>
				<div className={`${styles.tokenBalance} tokenBalance`}>{vaultBalance === null ? 'Loading...' : `$${vaultBalance.toFixed(2)}`} deposited</div>
				<div className={`${styles.tokenBalance} tokenBalance`}>{usdcBalance === null ? 'Loading...' : `$${usdcBalance.toFixed(2)}`} available</div>
			</div>

			<div className={`${styles.vaultButtons} vaultButtons`}>
				{usdcBalance !== null && usdcBalance > 0 && (
				<Button buttonText="Deposit $1" secondary={true} buttonFunction={() => handleDeposit(1)} enabled={!depositLoading && !approvalLoading} />
				)}
				<Withdraw 
					vaultBalance={vaultBalance} 
					setVaultBalance={setVaultBalance}
					usdcBalance={usdcBalance}
					setUsdcBalance={setUsdcBalance}
				/>
			</div>
		</div>
	)



	return (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			{/*<div>Your ETH balance on Base: {ethBalance === null ? 'Loading...' : ethBalance.toFixed(8)}</div>*/}
			
			<div>Your USDC balance on Base: {usdcBalance === null ? 'Loading...' : `$${usdcBalance.toFixed(2)}`}</div>
			{/* <div>Your Vault balance: {vaultBalance === null ? 'Loading...' : `$${vaultBalance.toFixed(2)}`}</div> */}
			
			{usdcBalance !== null && usdcBalance > 0 && ethBalance !== null && ethBalance > 0 && (
				<div style={{ display: 'flex', gap: '0.5em', margin: '1em 0', flexWrap: 'wrap' }}>
					{/* Always show $1 button if balance >= $1 */}
					{usdcBalance >= 1 && (
						<button 
							onClick={() => handleDeposit(1)} 
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
							{depositLoading ? (depositStatus || 'Depositing...') : <>
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
							onClick={() => handleDeposit(5)} 
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
							{depositLoading ? '' : <>
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
							onClick={() => handleDeposit(20)} 
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
							{depositLoading ? '' : <>
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
				<Withdraw 
					vaultBalance={vaultBalance} 
					setVaultBalance={setVaultBalance}
					usdcBalance={usdcBalance}
					setUsdcBalance={setUsdcBalance}
				/>
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
