import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PrivyProvider } from "@privy-io/react-auth";

function MyApp({ Component, pageProps }: AppProps) {
  // Determine base path for assets
  const assetPrefix = process.env.NODE_ENV === "production" ? "/bcard-privy-one" : "";

  return (
    <>
      <Head>

        <link rel="icon" href={`${assetPrefix}/favicons/favicon.ico`} sizes="any" />
        <link rel="icon" href={`${assetPrefix}/favicons/icon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${assetPrefix}/favicons/apple-touch-icon.png`} />
        <link rel="manifest" href={`${assetPrefix}/favicons/manifest.json`} />

        <title>We are the Black Flag</title>
        <meta name="description" content="Join the 🏴 - an IRL social network." />
        
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
        appId={"clot4yaxz06dll50fkodfgzh4"}
        clientId={"client-WY2eJ3TxteESv8AvCio41QqM6fEwNqQA7rF9xevtfyfr2"}
        config={{
          embeddedWallets: {
            createOnLogin: "all-users",
          },
        }}
      >
        <Component {...pageProps} />
      </PrivyProvider>
    </>
  );
}

export default MyApp;
