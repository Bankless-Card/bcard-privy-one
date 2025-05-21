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
        <link
          rel="preload"
          href={`${assetPrefix}/fonts/AdelleSans-Regular.woff`}
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href={`${assetPrefix}/fonts/AdelleSans-Regular.woff2`}
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href={`${assetPrefix}/fonts/AdelleSans-Semibold.woff`}
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href={`${assetPrefix}/fonts/AdelleSans-Semibold.woff2`}
          as="font"
          crossOrigin=""
        />

        <link rel="icon" href={`${assetPrefix}/favicons/favicon.ico`} sizes="any" />
        <link rel="icon" href={`${assetPrefix}/favicons/icon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${assetPrefix}/favicons/apple-touch-icon.png`} />
        <link rel="manifest" href={`${assetPrefix}/favicons/manifest.json`} />

        <title>BCard · Black Flag</title>
        <meta name="description" content="BCard integration with Black Flag" />
      </Head>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clot4yaxz06dll50fkodfgzh4"}
        clientId={process.env.NEXT_PUBLIC_PRIVY_APP_CLIENT_ID || "client-WY2eJ3TxteESv8AvCio41QqM6fEwNqQA7rF9xevtfyfr2"}
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
