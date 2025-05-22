import Portal from "../components/graphics/portal";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getRoute } from "../utils/routes";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push(getRoute("/dashboard")),
  });
  const { ready, authenticated } = usePrivy();

  // Check authentication status and redirect if already logged in
  useEffect(() => {
    if (ready && authenticated) {
      router.push(getRoute("/dashboard"));
    }
  }, [ready, authenticated, router]);

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
            </div>
            <div className="mt-8 flex flex-col items-center justify-center text-center">
              <button
                className="bf-button text-lg py-3 px-8"
                onClick={login}
              >
                Log in
              </button>
              <div className="mt-6">
                <Link href={getRoute("/")} className="text-white underline hover:text-gray-300 text-sm">
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