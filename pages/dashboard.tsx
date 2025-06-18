import { useRouter } from "next/router";
import { useEffect } from "react";
import { usePrivy, useWallets, useSignMessage } from "@privy-io/react-auth";
import Head from "next/head";
import Link from "next/link";
import { Logo } from "../components/logo";
import { getRoute } from "../utils/routes";
import CardCreationForm from "../components/card-creation-form";

import snapshot from '@snapshot-labs/snapshot.js';
// import { Web3Provider } from '@ethersproject/providers';
// import Web3 from 'web3';
import { CastVote } from "../utils/functions";

type GetVotingPowerParams = {
  address: string;
  network: string;
  strategies: any[];
  snapshotBlock: number | 'latest';
  space: string;
  delegation?: boolean;
  options?: Record<string, any>;
};

const SNAPSHOT_KEY = "1f123784e8f1d779fe41b545f87c2a2ef6b2e92fcad2d720a5016d63cbae5035";

/**
 * Fetch voting power for a given address using snapshot.js
 */
export async function getVotingPower({
  address,
  network,
  strategies,
  snapshotBlock,
  space,
  delegation = false,
  options = { url: 'https://score.snapshot.org/?apiKey=' + SNAPSHOT_KEY },
}: GetVotingPowerParams): Promise<any> {
  try {

    console.log(options);
    // Ensure snapshot.js is initialized
    if (!snapshot.utils) {
      throw new Error('Snapshot.js is not initialized. Please ensure it is properly set up.');
    }

    // Validate parameters
    console.log('Fetching voting power with params:', address, network, strategies, snapshotBlock, space, delegation, options);

    const vp = await snapshot.utils.getVp(
      address,
      network,
      strategies,
      snapshotBlock,
      space,
      delegation,
      options
    );

    console.log('Voting Power:', vp);

    return vp;


  } catch (error) {
    console.error('Error fetching voting power:', error);
    throw error;
  }
}

// export async function castVote(client, wallets) {
//   // This function can be used to cast a vote using snapshot.js
//   // const hub = 'https://hub.snapshot.org'; // or https://testnet.hub.snapshot.org for testnet
//   // const client = new snapshot.Client712(hub);

//   // const {wallets} = useWallets();
//   if (!wallets || wallets.length === 0) {
//     throw new Error('No wallets available. Please connect a wallet first.');
//   }

//   console.log('Available wallets:', wallets);

//   const wallet = wallets[0]; // Replace this with your desired wallet
//   // await wallet.switchChain(sepolia.id);

//   // use privy Provider to handle rpc calls out
//   // const web3 = new Web3Provider(window.ethereum);
//   // const [account] = await web3.listAccounts();

//   if (!wallet) {
//     throw new Error('Wallet not connected');
//   }

//   const provider = await wallet.getEthereumProvider();
//   // const web3 = new Web3(provider);
//   console.log('Using wallet:', wallet);
//   const ethersProvider = new Web3Provider(provider); // Add

  
//   // const [account] = await web3.listAccounts();

//   const receipt = await client.vote(ethersProvider, wallet.address, {
//     space: 'yam.eth',
//     proposal: '0x21ea31e896ec5b5a49a3653e51e787ee834aaf953263144ab936ed756f36609f',
//     type: 'single-choice',
//     choice: 1,
//     reason: 'Choice 1 make lot of sense',
//     app: 'my-app'
//   });

//   console.log('Vote cast successfully:', receipt);

//   return receipt;
// }

export default function DashboardPage() {
  // const [verifyResult, setVerifyResult] = useState();
  const router = useRouter();
  const {signMessage} = useSignMessage({onSuccess: ({signature}) => {
    console.log("Can use this signature: " + signature);
    // Any logic you'd like to execute after a user successfully signs a message
  },
  onError: (error) => {
    console.log(error);
    // Any logic you'd like to execute after a user exits the message signing flow or there is an error
  }});

  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  // try to sign a TEST message with UI auth.
    async function signIt() {

      const uiOptions = {
        title: 'You are voting for foobar project',
        showWalletUIs: true, // this will show the wallet UIs
      };

      await signMessage({message: 'I hereby vote for foobar'}, {uiOptions});      

    }

    // async function getVP() {

    //   const address = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11';
    //   const network = '1';
    //   const strategies = [
    //     {
    //       name: 'erc20-balance-of',
    //       params: {
    //         address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    //         symbol: 'DAI',
    //         decimals: 18
    //       }
    //     }
    //   ];
    //   const snapshot = 11437846;
    //   const space = 'yam.eth';
    //   const delegation = false;
    //   const apiKey = 'your_api_key_here' // get an API Key for higher limits
    //   const options = { url: `https://score.snapshot.org/?apiKey=${apiKey}` }

    //   snapshot.utils.getVp(address, network, strategies, snapshot, space, delegation, options).then(vp => {
    //     console.log('Voting Power', vp);
    //   });
    // }

  // const hub = 'https://hub.snapshot.org'; // or https://testnet.hub.snapshot.org for testnet
  // const client = new snapshot.Client712(hub);
  const {wallets} = useWallets();

  // cast vote button component
  async function castVoteTrigger() {
    console.log('Wallets:', wallets);

    CastVote(wallets).then(receipt => {
      console.log('Vote cast successfully:', receipt);
    }).catch(error => {
      console.error('Error casting vote:', error);
    });
  }

  function CastVoteButton() {
    return (
      <button onClick={castVoteTrigger} className="bf-button">
        Cast Vote
      </button>
    );
  }

  useEffect(() => {
    if (ready && !authenticated) {
      router.push(getRoute("/"));
    }

    // need user address
    // need proposals (on which to get vp)


    init();
    async function init() {
      // this to get vp for a specific user
      const vp = await getVotingPower({
        address: '0x63497A09fE65F278c97C3569Db7e0c606DFf87a2', // replace with actual user address
        network: '8453', // Base mainnet
        strategies: [{
          name: 'erc20-balance-of',
          params: {
            address: '0x77aD6e07A68D25119b8891CC9d450a87CA35968B',
            symbol: 'FLAG',
            decimals: 18
          }
        }],
        snapshotBlock: 31728474, // latest block on Base mainnet
        space: 'black-flag.eth',
        options: {
          url: 'https://score.snapshot.org/?apiKey=' + SNAPSHOT_KEY
        }
      });
      console.log('Voting Power:', vp);

      

    }

    // testing transactions 
    // const {signTransaction} = useSignTransaction();
    // signTransaction({
    //   to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
    //   value: 100000
    // });

    // testing signatures, when ready and authenticated
    // signIt();

    

  }, [ready, authenticated, router]);

  // button to run the signIt function
  function TestButton() {
    return(
      <button onClick={signIt} className="bf-button">Sign Message</button>)
  }

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;
  return (
    <>
      <Head>
        <title>BCard Dashboard · Black Flag</title>
      </Head>

      <div className="bf-theme min-h-screen">
        {ready && authenticated ? (
          <>
            <nav className="bg-black py-4">
              <div className="bf-container">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Link href={getRoute("/")} className="flex items-center">
                      <span className="bf-flag text-xl mr-2">🏴</span>
                      <Logo fontColor="white" />
                    </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link href={getRoute("/")} className="bf-nav-item">
                      Home
                    </Link>
                    <button
                      onClick={logout}
                      className="bf-button"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            <main className="bf-container py-10">
              <div className="bf-panel mb-8">
                <h2 className="text-2xl font-bold mb-6">Account Management</h2>
                <div className="flex gap-4 flex-wrap">{googleSubject ? (
            
                  <button
                  onClick={() => {
                    unlinkGoogle(googleSubject);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink Google
                </button>
              ) : (
                <button
                  onClick={() => {
                    linkGoogle();
                  }}
                  className="bf-button"
                >
                  Link Google
                </button>
              )}

              {twitterSubject ? (
                <button
                  onClick={() => {
                    unlinkTwitter(twitterSubject);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink Twitter
                </button>
              ) : (
                <button
                  className="bf-button"
                  onClick={() => {
                    linkTwitter();
                  }}
                >
                  Link Twitter
                </button>
              )}              {discordSubject ? (
                <button
                  onClick={() => {
                    unlinkDiscord(discordSubject);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink Discord
                </button>
              ) : (
                <button
                  className="bf-button"
                  onClick={() => {
                    linkDiscord();
                  }}
                >
                  Link Discord
                </button>
              )}

              {email ? (
                <button
                  onClick={() => {
                    unlinkEmail(email.address);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink email
                </button>
              ) : (
                <button
                  onClick={linkEmail}
                  className="bf-button"
                >
                  Connect email
                </button>
              )}
              {wallet ? (
                <button
                  onClick={() => {
                    unlinkWallet(wallet.address);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink wallet
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="bf-button"
                >
                  Connect wallet
                </button>
              )}
              {phone ? (
                <button
                  onClick={() => {
                    unlinkPhone(phone.number);
                  }}
                  className="bf-button"
                  disabled={!canRemoveAccount}
                >
                  Unlink phone
                </button>
              ) : (
                <button
                  onClick={linkPhone}
                  className="bf-button"
                >
                  Connect phone
                </button>
              )}    
              <CastVoteButton />
              <TestButton />



              {/* DISABLED DUE TO STATIC SERVER
              <button
                onClick={() => verifyToken().then(setVerifyResult)}
                className="bf-button"
              >
                Verify Token
              </button>
              */}
                </div>
              </div>

              {/* false && Boolean(verifyResult) && (
                <div className="bf-panel mb-8">
                  <details className="w-full">
                    <summary className="font-bold uppercase text-sm cursor-pointer">
                      Server Verification Result
                    </summary>
                    <pre className="bg-gray-800 p-4 text-xs sm:text-sm rounded-md mt-2 overflow-auto bf-mono">
                      {JSON.stringify(verifyResult, null, 2)}
                    </pre>
                  </details>
                </div>
              ) */}

              <div className="bf-panel">
                <h3 className="text-xl font-bold mb-4">User Information</h3>
                <pre className="bg-gray-800 p-4 text-xs sm:text-sm rounded-md overflow-auto bf-mono">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6">Manage Your BCards</h2>
                <CardCreationForm />
              </div>
            </main>
          </>
        ) : null}
      </div>
    </>
  );
}
