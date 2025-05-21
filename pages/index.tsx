import LandingPage from "../components/landing-page";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import React from "react";
import Head from "next/head";
import { Logo } from "../components/logo";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return { props: { isAuthenticated: false } };

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    await client.verifyAuthToken(cookieAuthToken);
    // Pass isAuthenticated flag to component instead of redirecting
    return {
      props: { isAuthenticated: true },
    };
  } catch (error) {
    return { props: { isAuthenticated: false } };
  }
};

// User welcome component for authenticated users
function UserWelcome() {
  const { user, logout } = usePrivy();
  
  return (
    <div className="min-h-screen bg-privy-light-blue">
      <Head>
        <title>Welcome Back · BCard</title>
      </Head>      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <Logo fontColor="black" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-violet-600 flex items-center justify-center text-white text-xl">
                {user?.email?.address?.charAt(0).toUpperCase() || user?.wallet?.address?.substring(0, 2) || "U"}
              </div>
            </div>            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back{user?.email ? `, ${user.email.address.split('@')[0]}` : ""}!
              </h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {user?.createdAt && (
                <p className="text-gray-600 text-sm mt-1">
                  Member since: {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              {user?.wallet?.address && (
                <p className="text-gray-600 text-xs mt-1 font-mono truncate max-w-xs">
                  Wallet: {user.wallet.address}
                </p>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-violet-400 hover:shadow transition-all">
                <h3 className="text-lg font-medium text-gray-900">Your Business Cards</h3>
                <p className="mt-1 text-gray-600">View and manage your digital business cards</p>
                <Link 
                  href="/dashboard" 
                  className="mt-3 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-500"
                >
                  Manage cards <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-violet-400 hover:shadow transition-all">
                <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                <p className="mt-1 text-gray-600">Update your profile information and preferences</p>
                <Link 
                  href="/dashboard" 
                  className="mt-3 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-500"
                >
                  View settings <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HomePage({ isAuthenticated }: { isAuthenticated?: boolean }) {
  return isAuthenticated ? <UserWelcome /> : <LandingPage />;
}
