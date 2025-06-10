import { useRouter } from "next/router";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import Link from "next/link";
import { Logo } from "../components/logo";
import { getRoute } from "../utils/routes";
import CardCreationForm from "../components/card-creation-form";

// import {useSignTransaction} from '@privy-io/react-auth';
import {useSignMessage} from '@privy-io/react-auth';




// async function verifyToken() {
//   const url = getRoute("/api/verify");
//   const accessToken = await getAccessToken();
//   const result = await fetch(url, {
//     headers: {
//       ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
//     },
//   });

//   return await result.json();
// }



export default function DashboardPage() {
  // const [verifyResult, setVerifyResult] = useState();
  const router = useRouter();
  const {signMessage} = useSignMessage();

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
        title: 'You are voting for foobar project'
      };

      try {
        // this will open the Privy UI to sign the message}
        const {signature} = await signMessage({message: 'I hereby vote for foobar'}, {uiOptions});      
        console.log('Signature:', signature);
      } catch (error) {
        console.error('Error signing message (probably canceled):', error);
      }
    }

  useEffect(() => {
    if (ready && !authenticated) {
      router.push(getRoute("/"));
    }

    // testing transactions 
    // const {signTransaction} = useSignTransaction();
    // signTransaction({
    //   to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
    //   value: 100000
    // });

    // testing signatures, when ready and authenticated
    signIt();

    

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
