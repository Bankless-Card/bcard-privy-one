import "../styles/globals.css";
import "../styles/mobile.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PrivyProvider } from "@privy-io/react-auth";

function MyApp({ Component, pageProps }: AppProps) {
  // Determine base path for assets

  return (
    <>
      <Head>

        <link rel="icon" href={`/favicons/favicon.ico`} sizes="any" />
        <link rel="icon" href={`/favicons/icon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`/favicons/apple-touch-icon.png`} />
        <link rel="manifest" href={`/favicons/manifest.json`} />

        <title>We are the Black Flag</title>
        <meta name="description" content="Join the 🏴 - an IRL social network." />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blackflagcollective.org/" />
        <meta property="og:title" content="We are the Black Flag" />
        <meta property="og:description" content="Join the 🏴 - an IRL social network." />
        <meta property="og:image" content="https://blackflagcollective.org/images/black-flag-social.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://blackflagcollective.org/" />
        <meta name="twitter:title" content="We are the Black Flag" />
        <meta name="twitter:description" content="Join the 🏴 - an IRL social network." />
        <meta name="twitter:image" content="https://blackflagcollective.org/images/black-flag-social.png" />
      </Head>
      {/* <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clot4yaxz06dll50fkodfgzh4"}
        clientId={process.env.NEXT_PUBLIC_PRIVY_APP_CLIENT_ID || "client-WY2eJ3TxteESv8AvCio41QqM6fEwNqQA7rF9xevtfyfr2"}
        config={{
          embeddedWallets: {
            createOnLogin: "all-users",
          },
        }}
      > */}
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
        clientId={process.env.NEXT_PUBLIC_PRIVY_APP_CLIENT_ID}
        config={{
          loginMethods: ['email'],
          embeddedWallets: {
            createOnLogin: "all-users",
            showWalletUIs: false
          },
        }}
      >
        <Component {...pageProps} />
      </PrivyProvider>
    </>
  );
}

export default MyApp;
