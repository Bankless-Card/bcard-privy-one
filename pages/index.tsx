import LandingPage from "../components/landing-page";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Logo } from "../components/logo";
import { getRoute } from "../utils/routes";
import fs from 'fs';
import path from 'path';

// User welcome component for authenticated users
function UserWelcome() {
  const { user, logout } = usePrivy();
  
  return (
    <div className="bf-theme min-h-screen">
      <Head>
        <title>Welcome Back · BCard</title>
      </Head>
      
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
              <Link 
                href={getRoute("/dashboard")} 
                className="bf-button"
              >
                Go to Dashboard
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
        <div className="bf-panel">
          <div className="flex flex-col md:flex-row items-start md:items-center mb-6">
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <div className="h-20 w-20 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center text-white text-2xl">
                {user?.email?.address?.charAt(0).toUpperCase() || user?.wallet?.address?.substring(0, 2) || "U"}
              </div>
            </div>
            <div className="md:ml-6">
              <h2 className="text-3xl font-bold">
                Welcome back{user?.email ? `, ${user.email.address.split('@')[0]}` : ""}!
              </h2>
              <p className="text-gray-400 mt-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>              
              {user?.createdAt && (
                <p className="text-gray-400 text-sm mt-1">
                  Member since: {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              {user?.wallet?.address && (
                <p className="text-gray-400 text-xs mt-1 font-mono bf-mono truncate max-w-xs">
                  Wallet: {user.wallet.address}
                </p>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="bf-grid">
              <div className="bf-panel hover:border-white transition-all">
                <h3 className="text-xl font-medium">Your Business Cards</h3>
                <p className="mt-2 text-gray-400">View and manage your digital business cards</p>
                <Link 
                  href={getRoute("/dashboard")} 
                  className="mt-4 inline-flex items-center text-sm font-medium underline text-white hover:text-gray-300"
                >
                  Manage cards <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
              <div className="bf-panel hover:border-white transition-all">
                <h3 className="text-xl font-medium">Account Settings</h3>
                <p className="mt-2 text-gray-400">Update your profile information and preferences</p>
                <Link 
                  href={getRoute("/dashboard")} 
                  className="mt-4 inline-flex items-center text-sm font-medium underline text-white hover:text-gray-300"
                >
                  View settings <span aria-hidden="true" className="ml-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

//this runs at build time (`next build`) and on every request when using `next dev`
export async function getStaticProps() {
  const markdownPath = path.join(process.cwd(), 'public', 'content', 'black-flag-content.md');
  const markdownContent = fs.readFileSync(markdownPath, 'utf8');
  
  return {
    props: {
      markdownContent,
    },
  };
}

export default function HomePage({ markdownContent }: { markdownContent: string }) {
  const { ready, authenticated } = usePrivy();
  const [shouldShowUserWelcome, setShouldShowUserWelcome] = useState(false);
  
  useEffect(() => {
    if (ready) {
      setShouldShowUserWelcome(authenticated);
    }
  }, [ready, authenticated]);

  // Show nothing until Privy is ready to avoid flashing content
  if (!ready) {
    return (
      <div className="bf-theme min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return shouldShowUserWelcome ? <UserWelcome /> : <LandingPage markdownContent={markdownContent} />;
}