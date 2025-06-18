import snapshot from '@snapshot-labs/snapshot.js';
import { Web3Provider } from '@ethersproject/providers';
// import { useWallets } from "@privy-io/react-auth";


export async function CastVote(wallets) {
  // This function can be used to cast a vote using snapshot.js
  const hub = 'https://hub.snapshot.org'; // or https://testnet.hub.snapshot.org for testnet
  const client = new snapshot.Client712(hub);

  // const {wallets} = useWallets();
  if (!wallets || wallets.length === 0) {
    throw new Error('No wallets available. Please connect a wallet first.');
  }

  console.log('Available wallets:', wallets);

  const wallet = wallets[0]; // Replace this with your desired wallet
  // await wallet.switchChain(sepolia.id);

  // use privy Provider to handle rpc calls out
  // const web3 = new Web3Provider(window.ethereum);
  // const [account] = await web3.listAccounts();

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const provider = await wallet.getEthereumProvider();
  // const web3 = new Web3(provider);
  console.log('Using wallet:', wallet);
  const ethersProvider = new Web3Provider(provider); // Add
  console.log('Ethers provider:', ethersProvider);

  
  // const [account] = await web3.listAccounts();

  const receipt = await client.vote(ethersProvider, wallet.address, {
    space: 'yam.eth',
    proposal: '0x21ea31e896ec5b5a49a3653e51e787ee834aaf953263144ab936ed756f36609f',
    type: 'single-choice',
    choice: 1,
    reason: 'Choice 1 make lot of sense',
    app: 'my-app'
  });

  console.log('Vote cast successfully:', receipt);

  return receipt;
}