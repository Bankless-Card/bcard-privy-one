import Portal from "../components/graphics/portal";
import { useLogin } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return { props: {} };

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    // Use this result to pass props to a page for server rendering or to drive redirects!
    // ref https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props
    console.log({ claims });

    return {
      props: {},
      redirect: { destination: "/dashboard", permanent: false },
    };
  } catch (error) {
    return { props: {} };
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/dashboard"),
  });

  return (
    <>
      <Head>
        <title>Login · BCard Black Flag</title>
      </Head>

      <main className="bf-theme flex min-h-screen min-w-full">
        <div className="flex flex-1 p-6 justify-center items-center">
          <div>
            <div className="flex justify-center">
              <div className="w-20 h-20 flex items-center justify-center mb-6">
                <span className="bf-flag text-5xl">🏴</span>
              </div>
            </div>
            <div>
              <Portal style={{ maxWidth: "100%", height: "auto" }} />
            </div>            <div className="mt-8 flex flex-col items-center justify-center text-center">
              <button
                className="bf-button text-lg py-3 px-8"
                onClick={login}
              >
                Log in
              </button>
              <div className="mt-6">
                <Link href="/" className="text-white underline hover:text-gray-300 text-sm">
                  Return to home page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
